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
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
}

async function elephanFetch(path: string, apiKey: string) {
  const res = await fetch(`${ELEPHAN_BASE}${path}`, {
    headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Elephan ${res.status}: ${await res.text()}`);
  return res.json();
}

const STRUCTURED_PROMPT = `Você é um analista de inteligência comercial especializado no mercado imobiliário de studios urbanos para investimento (short stay / aluguel por temporada).

Analise TODAS as transcrições de reuniões e retorne um JSON válido (sem markdown, sem backticks) com esta estrutura EXATA:

{
  "buyerPersona": {
    "summary": "Descrição em 2-3 frases do perfil típico do comprador",
    "ageRange": "Faixa etária predominante",
    "professions": ["Profissão 1", "Profissão 2", "Profissão 3"],
    "motivations": ["Motivação 1", "Motivação 2", "Motivação 3"],
    "avgTicket": "Ticket médio que buscam (ex: R$ 300k - R$ 500k)"
  },
  "personalityProfiles": [
    {
      "type": "Nome do tipo de personalidade (ex: Analítico, Expressivo, Pragmático, Cauteloso)",
      "description": "Como esse perfil se comporta nas reuniões",
      "frequency": "alta/média/baixa",
      "approachStrategy": "Como o corretor deve adaptar o atendimento para esse perfil",
      "pitfalls": "O que NÃO fazer com esse perfil"
    }
  ],
  "topQuestions": [
    {
      "question": "Pergunta frequente feita pelos investidores",
      "frequency": "alta/média/baixa",
      "idealAnswer": "Resposta recomendada para o time comercial",
      "context": "Em que momento da conversa essa pergunta costuma surgir"
    }
  ],
  "objections": [
    {
      "objection": "Descrição curta da objeção",
      "frequency": "alta/média/baixa",
      "rebuttal": "Argumento sugerido para contornar esta objeção"
    }
  ],
  "hiddenObjections": [
    {
      "objection": "Objeção que o cliente não verbaliza diretamente mas demonstra através de comportamento ou perguntas indiretas",
      "signals": "Como identificar essa objeção oculta (sinais verbais e não-verbais)",
      "approach": "Estratégia para trazer à tona e resolver essa objeção antes que ela impeça o fechamento"
    }
  ],
  "closingArguments": [
    {
      "argument": "Argumento que funciona para fechar",
      "effectiveness": "alta/média",
      "context": "Em que situação usar este argumento"
    }
  ],
  "buyingSignals": [
    {
      "signal": "Comportamento que indica que o lead vai converter",
      "action": "O que o corretor deve fazer quando identificar este sinal"
    }
  ],
  "competitors": [
    {
      "name": "Nome do concorrente",
      "mentions": 0,
      "positioning": "Como se posiciona vs nós",
      "weakness": "Ponto fraco que podemos explorar"
    }
  ],
  "actionItems": [
    {
      "action": "Ação prática para o time comercial",
      "priority": "alta/média/baixa",
      "impact": "Impacto esperado desta ação"
    }
  ],
  "sentimentSummary": "Resumo de 1-2 frases sobre o sentimento geral nas reuniões"
}

REGRAS:
- Retorne APENAS o JSON, sem texto antes ou depois
- Use dados concretos das reuniões, nunca invente
- Mínimo 3 objeções, 3 argumentos de fechamento, 3 sinais de compra, 2 tipos de personalidade, 3 perguntas frequentes, 2 objeções ocultas
- Ordene por frequência/efetividade (mais importante primeiro)
- Para personalityProfiles: identifique padrões reais de comportamento dos compradores nas reuniões (analíticos que pedem muitos dados, expressivos que se empolgam rápido, cautelosos que demoram para decidir, etc)
- Para hiddenObjections: identifique resistências que aparecem de forma indireta (ex: "vou pensar", perguntas excessivas sobre garantias = medo de risco)
- Para topQuestions: foque nas perguntas que mais se repetem entre diferentes clientes
- Escreva em português do Brasil
- Seja direto e acionável`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const forceRefresh = url.searchParams.get("refresh") === "true";
    const sb = getSupabaseAdmin();

    if (!forceRefresh) {
      const { data: cached } = await sb.from("elephant_insights_cache").select("*").eq("cache_key", CACHE_KEY).single();
      if (cached) {
        const age = (Date.now() - new Date(cached.updated_at).getTime()) / 3600000;
        if (age < CACHE_TTL_HOURS) {
          return new Response(JSON.stringify({
            success: true, cached: true, cacheAge: Math.round(age * 60),
            insights: cached.insights, amandaName: cached.amanda_name,
            totalMeetings: cached.total_meetings, totalDurationMinutes: cached.total_duration_minutes,
            positiveSentimentPct: cached.positive_sentiment_pct, latestMeeting: cached.latest_meeting,
            chartsData: cached.charts_data,
          }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
      }
    }

    const apiKey = Deno.env.get("ASKELEPHANT_API_KEY");
    if (!apiKey) return new Response(JSON.stringify({ success: false, error: "ASKELEPHANT_API_KEY not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) return new Response(JSON.stringify({ success: false, error: "LOVABLE_API_KEY not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const usersResult = await elephanFetch("/users?limit=100", apiKey);
    const users = usersResult.data || [];
    const amanda = users.find((u: any) => (u.name || "").toLowerCase().includes("amanda") || (u.email || "").toLowerCase().includes("amanda"));
    if (!amanda) return new Response(JSON.stringify({ success: false, error: "Usuário 'Amanda' não encontrado." }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const amandaId = amanda.id;
    const amandaName = amanda.name || amanda.email || "Amanda";

    const allTranscribes: any[] = [];
    let page = 1, hasNext = true;
    while (hasNext) {
      const result = await elephanFetch(`/transcribes?userId=${amandaId}&limit=100&page=${page}`, apiKey);
      allTranscribes.push(...(result.data || []));
      hasNext = result.pagination?.hasNext === true;
      page++;
    }

    if (allTranscribes.length === 0) {
      return new Response(JSON.stringify({ success: true, insights: null, amandaName, totalMeetings: 0, chartsData: null }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Build concise summaries for AI
    const meetingSummaries = allTranscribes.map((t: any) => {
      const answers = (t.answers || []).map((a: any) => `${a.question}: ${a.yesNo !== undefined ? (a.yesNo ? "Sim" : "Não") : ""} (${a.score ?? "?"})`).join("; ");
      const competitors = (t.competitors || []).map((c: any) => `${c.word}(${c.count}x)`).join(", ");
      const reasons = (t.reasons || []).map((r: any) => `[${r.type}] ${r.description}`).join("; ");
      return `[${t.dateIncluded || "?"}] ${t.title || "?"} | ${Math.round((t.duration || 0) / 60)}min | Sent:${t.sentimentAnalysis?.totalSentiment || "?"}\nResumo: ${t.summary || "?"}\nRespostas: ${answers || "—"}\nConcorrentes: ${competitors || "—"}\nObjeções: ${reasons || "—"}`;
    }).join("\n---\n");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: STRUCTURED_PROMPT },
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
    let rawContent = aiData.choices?.[0]?.message?.content || "";
    
    // Strip markdown code fences if present
    rawContent = rawContent.replace(/^```json?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
    
    let dashboard;
    try {
      dashboard = JSON.parse(rawContent);
    } catch {
      console.error("Failed to parse AI JSON, raw:", rawContent.slice(0, 500));
      dashboard = null;
    }

    const totalDuration = allTranscribes.reduce((sum: number, t: any) => sum + (t.duration || 0), 0);
    const sentiments = allTranscribes.map((t: any) => t.sentimentAnalysis?.totalSentiment).filter(Boolean);
    const positivePct = sentiments.length ? Math.round((sentiments.filter((s: string) => s === "positive").length / sentiments.length) * 100) : null;
    const totalDurationMinutes = Math.round(totalDuration / 60);
    const latestMeeting = allTranscribes[0]?.dateIncluded || null;

    const responseData = {
      success: true, cached: false, insights: rawContent, amandaName,
      totalMeetings: allTranscribes.length, totalDurationMinutes,
      positiveSentimentPct: positivePct, latestMeeting,
      chartsData: dashboard,
    };

    await sb.from("elephant_insights_cache").upsert({
      cache_key: CACHE_KEY, insights: rawContent, amanda_name: amandaName,
      total_meetings: allTranscribes.length, total_duration_minutes: totalDurationMinutes,
      positive_sentiment_pct: positivePct, latest_meeting: latestMeeting,
      charts_data: dashboard, updated_at: new Date().toISOString(),
    }, { onConflict: "cache_key" });

    return new Response(JSON.stringify(responseData), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("elephant-insights error:", error);
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
