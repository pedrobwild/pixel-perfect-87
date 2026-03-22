import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ELEPHAN_BASE = "https://api.elephan.dev/v1";
const CACHE_KEY = "amanda_default";
const CACHE_TTL_HOURS = 6;

function getSupabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

async function elephanFetch(path: string, apiKey: string) {
  const res = await fetch(`${ELEPHAN_BASE}${path}`, {
    headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Elephan ${res.status}: ${text}`);
  }
  return res.json();
}

function buildChartsData(transcribes: any[]) {
  // 1. Sentiment over time
  const sentimentTimeline = transcribes
    .filter((t: any) => t.dateIncluded && t.sentimentAnalysis?.totalSentiment)
    .sort((a: any, b: any) => new Date(a.dateIncluded).getTime() - new Date(b.dateIncluded).getTime())
    .map((t: any) => ({
      date: t.dateIncluded,
      title: (t.title || "Sem título").slice(0, 40),
      sentiment: t.sentimentAnalysis.totalSentiment,
      score: t.sentimentAnalysis.totalSentiment === "positive" ? 1 : t.sentimentAnalysis.totalSentiment === "negative" ? -1 : 0,
      duration: Math.round((t.duration || 0) / 60),
    }));

  // 2. Sentiment distribution
  const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
  transcribes.forEach((t: any) => {
    const s = t.sentimentAnalysis?.totalSentiment;
    if (s && s in sentimentCounts) sentimentCounts[s as keyof typeof sentimentCounts]++;
  });
  const sentimentDistribution = [
    { name: "Positivo", value: sentimentCounts.positive, fill: "hsl(142, 71%, 45%)" },
    { name: "Neutro", value: sentimentCounts.neutral, fill: "hsl(45, 93%, 47%)" },
    { name: "Negativo", value: sentimentCounts.negative, fill: "hsl(0, 84%, 60%)" },
  ].filter(s => s.value > 0);

  // 3. Top competitors
  const competitorMap: Record<string, number> = {};
  transcribes.forEach((t: any) => {
    (t.competitors || []).forEach((c: any) => {
      const name = c.word || c.name || "";
      if (name) competitorMap[name] = (competitorMap[name] || 0) + (c.count || 1);
    });
  });
  const topCompetitors = Object.entries(competitorMap)
    .map(([name, mentions]) => ({ name, mentions }))
    .sort((a, b) => b.mentions - a.mentions)
    .slice(0, 8);

  // 4. Objections / reasons breakdown
  const reasonMap: Record<string, number> = {};
  transcribes.forEach((t: any) => {
    (t.reasons || []).forEach((r: any) => {
      const desc = r.description || r.type || "Outro";
      reasonMap[desc] = (reasonMap[desc] || 0) + 1;
    });
  });
  const objections = Object.entries(reasonMap)
    .map(([reason, count]) => ({ reason: reason.slice(0, 50), count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // 5. Keywords frequency
  const keywordMap: Record<string, number> = {};
  transcribes.forEach((t: any) => {
    (t.keywords || []).forEach((k: string) => {
      const kw = k.toLowerCase().trim();
      if (kw.length > 2) keywordMap[kw] = (keywordMap[kw] || 0) + 1;
    });
  });
  const topKeywords = Object.entries(keywordMap)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  // 6. Meeting duration distribution
  const durationBuckets = [
    { range: "0-15min", min: 0, max: 15, count: 0 },
    { range: "15-30min", min: 15, max: 30, count: 0 },
    { range: "30-60min", min: 30, max: 60, count: 0 },
    { range: "60min+", min: 60, max: Infinity, count: 0 },
  ];
  transcribes.forEach((t: any) => {
    const mins = Math.round((t.duration || 0) / 60);
    const bucket = durationBuckets.find(b => mins >= b.min && mins < b.max);
    if (bucket) bucket.count++;
  });

  // 7. Meetings per month
  const monthMap: Record<string, number> = {};
  transcribes.forEach((t: any) => {
    if (t.dateIncluded) {
      const d = new Date(t.dateIncluded);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthMap[key] = (monthMap[key] || 0) + 1;
    }
  });
  const meetingsPerMonth = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => {
      const [y, m] = month.split("-");
      const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      return { month: `${monthNames[parseInt(m) - 1]}/${y.slice(2)}`, count };
    });

  // 8. Form answers scores
  const answerScores: Record<string, { total: number; count: number }> = {};
  transcribes.forEach((t: any) => {
    (t.answers || []).forEach((a: any) => {
      if (a.question && a.score !== undefined && a.score !== null) {
        const q = a.question.slice(0, 45);
        if (!answerScores[q]) answerScores[q] = { total: 0, count: 0 };
        answerScores[q].total += a.score;
        answerScores[q].count++;
      }
    });
  });
  const formScores = Object.entries(answerScores)
    .map(([question, { total, count }]) => ({ question, avgScore: Math.round((total / count) * 10) / 10 }))
    .sort((a, b) => b.avgScore - a.avgScore)
    .slice(0, 8);

  return {
    sentimentTimeline,
    sentimentDistribution,
    topCompetitors,
    objections,
    topKeywords,
    durationBuckets: durationBuckets.map(({ range, count }) => ({ range, count })),
    meetingsPerMonth,
    formScores,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const forceRefresh = url.searchParams.get("refresh") === "true";
    const sb = getSupabaseAdmin();

    // Check cache
    if (!forceRefresh) {
      const { data: cached } = await sb
        .from("elephant_insights_cache")
        .select("*")
        .eq("cache_key", CACHE_KEY)
        .single();

      if (cached) {
        const age = (Date.now() - new Date(cached.updated_at).getTime()) / 3600000;
        if (age < CACHE_TTL_HOURS) {
          console.log(`Serving cached insights (${Math.round(age * 60)}min old)`);
          return new Response(
            JSON.stringify({
              success: true, cached: true, cacheAge: Math.round(age * 60),
              insights: cached.insights, amandaName: cached.amanda_name,
              totalMeetings: cached.total_meetings,
              totalDurationMinutes: cached.total_duration_minutes,
              positiveSentimentPct: cached.positive_sentiment_pct,
              latestMeeting: cached.latest_meeting,
              chartsData: cached.charts_data,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    const apiKey = Deno.env.get("ASKELEPHANT_API_KEY");
    if (!apiKey) return new Response(JSON.stringify({ success: false, error: "ASKELEPHANT_API_KEY not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) return new Response(JSON.stringify({ success: false, error: "LOVABLE_API_KEY not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    console.log("Fetching users from Elephan...");
    const usersResult = await elephanFetch("/users?limit=100", apiKey);
    const users = usersResult.data || [];
    const amanda = users.find((u: any) => (u.name || "").toLowerCase().includes("amanda") || (u.email || "").toLowerCase().includes("amanda"));

    if (!amanda) {
      return new Response(JSON.stringify({ success: false, error: `Usuário 'Amanda' não encontrado.` }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const amandaId = amanda.id;
    const amandaName = amanda.name || amanda.email || "Amanda";

    const allTranscribes: any[] = [];
    let page = 1;
    let hasNext = true;
    while (hasNext) {
      const result = await elephanFetch(`/transcribes?userId=${amandaId}&limit=100&page=${page}`, apiKey);
      allTranscribes.push(...(result.data || []));
      hasNext = result.pagination?.hasNext === true;
      page++;
    }
    console.log(`Found ${allTranscribes.length} transcriptions`);

    if (allTranscribes.length === 0) {
      return new Response(JSON.stringify({ success: true, insights: null, amandaName, totalMeetings: 0, chartsData: null }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Build chart data
    const chartsData = buildChartsData(allTranscribes);

    // Build AI summaries
    const meetingSummaries = allTranscribes.map((t: any) => {
      const answers = (t.answers || []).map((a: any) => `- ${a.question}: ${a.yesNo !== undefined ? (a.yesNo ? "Sim" : "Não") : ""} (score: ${a.score ?? "?"})`).join("\n") || "Sem respostas";
      const competitors = (t.competitors || []).map((c: any) => `- ${c.word} (${c.count}x)`).join("\n") || "Nenhum";
      const reasons = (t.reasons || []).map((r: any) => `- [${r.type}] ${r.description}`).join("\n") || "Sem objeções";
      return `## ${t.title || "Reunião"}\nData: ${t.dateIncluded || "?"}\nDuração: ${t.duration ? Math.round(t.duration / 60) + "min" : "?"}\nSentimento: ${t.sentimentAnalysis?.totalSentiment || "?"}\n\nResumo: ${t.summary || "?"}\n\nRespostas:\n${answers}\n\nConcorrentes:\n${competitors}\n\nObjeções:\n${reasons}\n---`;
    }).join("\n\n");

    console.log("Consolidating with AI...");
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Você é um analista de inteligência comercial especializado no mercado imobiliário de studios urbanos para investimento (short stay / aluguel por temporada). Analise as transcrições de reuniões da consultora Amanda e extraia:\n\n1. **Perfil dos Compradores**\n2. **Objeções Recorrentes**\n3. **Fatores de Decisão**\n4. **Sinais de Compra**\n5. **Concorrência**\n6. **Oportunidades para o Time Comercial**\n7. **Sentimento Geral**\n\nResponda em português do Brasil. Use dados concretos. Formate com markdown claro. Seja direto e acionável.`,
          },
          { role: "user", content: `${allTranscribes.length} transcrições da Amanda:\n\n${meetingSummaries}` },
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) return new Response(JSON.stringify({ success: false, error: "Rate limit. Tente novamente." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (aiResponse.status === 402) return new Response(JSON.stringify({ success: false, error: "Créditos insuficientes." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const insights = aiData.choices?.[0]?.message?.content || "";

    const totalDuration = allTranscribes.reduce((sum: number, t: any) => sum + (t.duration || 0), 0);
    const sentiments = allTranscribes.map((t: any) => t.sentimentAnalysis?.totalSentiment).filter(Boolean);
    const positivePct = sentiments.length ? Math.round((sentiments.filter((s: string) => s === "positive").length / sentiments.length) * 100) : null;
    const totalDurationMinutes = Math.round(totalDuration / 60);
    const latestMeeting = allTranscribes[0]?.dateIncluded || null;

    // Save to cache with charts data
    await sb.from("elephant_insights_cache").upsert({
      cache_key: CACHE_KEY, insights, amanda_name: amandaName,
      total_meetings: allTranscribes.length, total_duration_minutes: totalDurationMinutes,
      positive_sentiment_pct: positivePct, latest_meeting: latestMeeting,
      charts_data: chartsData, updated_at: new Date().toISOString(),
    }, { onConflict: "cache_key" });

    console.log("Insights + charts cached");

    return new Response(
      JSON.stringify({
        success: true, cached: false, insights, amandaName,
        totalMeetings: allTranscribes.length, totalDurationMinutes,
        positiveSentimentPct: positivePct, latestMeeting, chartsData,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("elephant-insights error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
