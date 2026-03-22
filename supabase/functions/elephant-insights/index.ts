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
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Elephan ${res.status}: ${text}`);
  }
  return res.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const forceRefresh = url.searchParams.get("refresh") === "true";
    const sb = getSupabaseAdmin();

    // Check cache unless force refresh
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
              success: true,
              cached: true,
              cacheAge: Math.round(age * 60),
              insights: cached.insights,
              amandaName: cached.amanda_name,
              totalMeetings: cached.total_meetings,
              totalDurationMinutes: cached.total_duration_minutes,
              positiveSentimentPct: cached.positive_sentiment_pct,
              latestMeeting: cached.latest_meeting,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    const apiKey = Deno.env.get("ASKELEPHANT_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: "ASKELEPHANT_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) {
      return new Response(
        JSON.stringify({ success: false, error: "LOVABLE_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch users to find Amanda
    console.log("Fetching users from Elephan...");
    const usersResult = await elephanFetch("/users?limit=100", apiKey);
    const users = usersResult.data || [];

    const amanda = users.find((u: any) =>
      (u.name || "").toLowerCase().includes("amanda") ||
      (u.email || "").toLowerCase().includes("amanda")
    );

    if (!amanda) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Usuário 'Amanda' não encontrado. Disponíveis: ${users.map((u: any) => u.name || u.email).join(", ")}`,
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const amandaId = amanda.id;
    const amandaName = amanda.name || amanda.email || "Amanda";

    // Fetch all transcriptions
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
      return new Response(
        JSON.stringify({ success: true, insights: null, message: "Nenhuma transcrição encontrada.", amandaName, totalMeetings: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build summaries for AI
    const meetingSummaries = allTranscribes.map((t: any) => {
      const answers = (t.answers || []).map((a: any) => `- ${a.question}: ${a.yesNo !== undefined ? (a.yesNo ? "Sim" : "Não") : ""} (score: ${a.score ?? "?"})${a.subtopics?.length ? ` | Subtópicos: ${a.subtopics.join(", ")}` : ""}`).join("\n") || "Sem respostas";
      const competitors = (t.competitors || []).map((c: any) => `- ${c.word} (${c.count}x, posição: ${c.position})`).join("\n") || "Nenhum";
      const reasons = (t.reasons || []).map((r: any) => `- [${r.type}] ${r.description}${r.details ? `: ${r.details}` : ""}`).join("\n") || "Sem objeções";
      const importantPoints = (t.importantPoints || []).join("\n- ") || "Nenhum";
      return `## ${t.title || "Reunião sem título"}\nData: ${t.dateIncluded || "?"}\nDuração: ${t.duration ? Math.round(t.duration / 60) + " min" : "?"}\nSentimento: ${t.sentimentAnalysis?.totalSentiment || "?"}\nPalavras-chave: ${(t.keywords || []).join(", ") || "Nenhuma"}\n\n### Resumo:\n${t.summary || "Sem resumo"}\n\n### Pontos importantes:\n- ${importantPoints}\n\n### Respostas:\n${answers}\n\n### Concorrentes:\n${competitors}\n\n### Objeções:\n${reasons}\n---`;
    }).join("\n\n");

    // Consolidate with AI
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

    // Save to cache
    await sb.from("elephant_insights_cache").upsert({
      cache_key: CACHE_KEY,
      insights,
      amanda_name: amandaName,
      total_meetings: allTranscribes.length,
      total_duration_minutes: totalDurationMinutes,
      positive_sentiment_pct: positivePct,
      latest_meeting: latestMeeting,
      updated_at: new Date().toISOString(),
    }, { onConflict: "cache_key" });

    console.log("Insights cached successfully");

    return new Response(
      JSON.stringify({
        success: true,
        cached: false,
        insights,
        amandaName,
        totalMeetings: allTranscribes.length,
        totalDurationMinutes: totalDurationMinutes,
        positiveSentimentPct: positivePct,
        latestMeeting,
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
