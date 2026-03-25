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

// ─── DATA EXTRACTION (real metrics from API) ────────────────────────────

interface SentimentEntry { sentimental: string; perc: number; total: number; }

function extractDominantSentiment(sentimentData: unknown): string {
  if (typeof sentimentData === "string") return sentimentData;
  if (!Array.isArray(sentimentData)) return "unknown";
  const sorted = [...sentimentData].sort((a: SentimentEntry, b: SentimentEntry) => b.perc - a.perc);
  return sorted[0]?.sentimental?.toLowerCase() || "unknown";
}

function extractSentimentBreakdown(sentimentData: unknown): Record<string, number> {
  if (!Array.isArray(sentimentData)) return {};
  const result: Record<string, number> = {};
  for (const entry of sentimentData) {
    if (entry.sentimental && typeof entry.perc === "number") {
      result[entry.sentimental.toLowerCase()] = entry.perc;
    }
  }
  return result;
}

function extractReasonsByType(reasons: any[]): Record<string, any[]> {
  const grouped: Record<string, any[]> = {};
  for (const r of reasons || []) {
    const type = r.type || "other";
    if (!grouped[type]) grouped[type] = [];
    grouped[type].push({
      description: r.description || "",
      details: r.details || null,
    });
  }
  return grouped;
}

function extractAnswerMetrics(answers: any[]): { scoreQuestions: any[]; yesNoQuestions: any[]; openQuestions: any[]; avgScore: number | null } {
  const scoreQuestions: any[] = [];
  const yesNoQuestions: any[] = [];
  const openQuestions: any[] = [];
  const scores: number[] = [];

  for (const a of answers || []) {
    if (typeof a.score === "number") {
      scoreQuestions.push({ question: a.question, score: a.score });
      scores.push(a.score);
    } else if (a.yesNo !== undefined) {
      yesNoQuestions.push({ question: a.question, yesNo: a.yesNo === "yes" || a.yesNo === true });
    } else {
      openQuestions.push({ question: a.question });
    }
  }

  return {
    scoreQuestions,
    yesNoQuestions,
    openQuestions,
    avgScore: scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : null,
  };
}

function computeLeadScore(t: any): number {
  let score = 50;
  const dominant = extractDominantSentiment(t.sentimentAnalysis?.totalSentiment);
  if (dominant === "positive") score += 20;
  else if (dominant === "negative") score -= 15;
  else if (dominant === "neutral") score += 5;

  const durationMin = Math.round((t.duration || 0) / 60);
  if (durationMin >= 30) score += 10;
  else if (durationMin >= 15) score += 5;
  else if (durationMin < 5) score -= 10;

  const reasons = t.reasons || [];
  const objections = reasons.filter((r: any) => r.type === "objection").length;
  const positivePoints = reasons.filter((r: any) => r.type === "positive_point").length;
  const potentialLoss = reasons.filter((r: any) => r.type === "potential_loss").length;
  score -= objections * 5;
  score += positivePoints * 4;
  score -= potentialLoss * 8;

  const competitors = (t.competitors || []).reduce((s: number, c: any) => s + (c.count || 1), 0);
  score -= competitors * 3;

  const answers = extractAnswerMetrics(t.answers);
  const yesCount = answers.yesNoQuestions.filter((q: any) => q.yesNo).length;
  const noCount = answers.yesNoQuestions.filter((q: any) => !q.yesNo).length;
  score += yesCount * 4;
  score -= noCount * 3;
  if (answers.avgScore !== null) score += Math.round((answers.avgScore - 5) * 2);

  return Math.max(0, Math.min(100, score));
}

function processMeetings(transcribes: any[]) {
  // Aggregate sentiment across all meetings
  const sentimentTotals: Record<string, number> = {};
  let totalDuration = 0;
  const allReasons: Record<string, any[]> = {};
  const allCompetitors: Record<string, number> = {};
  const scoreDistribution = { high: [] as any[], medium: [] as any[], low: [] as any[] };
  const allAnswerScores: { question: string; scores: number[] }[] = [];
  const questionScoreMap: Record<string, number[]> = {};

  const leads = transcribes.map((t: any) => {
    totalDuration += t.duration || 0;

    // Sentiment
    const breakdown = extractSentimentBreakdown(t.sentimentAnalysis?.totalSentiment);
    for (const [key, val] of Object.entries(breakdown)) {
      sentimentTotals[key] = (sentimentTotals[key] || 0) + val;
    }

    // Reasons grouped by type
    const grouped = extractReasonsByType(t.reasons);
    for (const [type, items] of Object.entries(grouped)) {
      if (!allReasons[type]) allReasons[type] = [];
      allReasons[type].push(...items);
    }

    // Competitors
    for (const c of t.competitors || []) {
      const name = c.word || c.name || "unknown";
      allCompetitors[name] = (allCompetitors[name] || 0) + (c.count || 1);
    }

    // Answer scores
    const answers = extractAnswerMetrics(t.answers);
    for (const sq of answers.scoreQuestions) {
      if (!questionScoreMap[sq.question]) questionScoreMap[sq.question] = [];
      questionScoreMap[sq.question].push(sq.score);
    }

    const score = computeLeadScore(t);
    const dominant = extractDominantSentiment(t.sentimentAnalysis?.totalSentiment);
    const durationMin = Math.round((t.duration || 0) / 60);

    const lead = {
      title: t.title || "Reunião sem título",
      date: t.dateIncluded || null,
      durationMinutes: durationMin,
      sentiment: dominant,
      sentimentBreakdown: breakdown,
      score,
      objectionCount: (t.reasons || []).filter((r: any) => r.type === "objection").length,
      positivePoints: (t.reasons || []).filter((r: any) => r.type === "positive_point").length,
      competitorMentions: (t.competitors || []).reduce((s: number, c: any) => s + (c.count || 1), 0),
      summary: t.summary ? t.summary.replace(/<[^>]*>/g, "").substring(0, 300) : null,
      dealUrl: t.deal?.crmUrl && t.deal.id !== "null" ? t.deal.crmUrl : null,
      avgAnswerScore: answers.avgScore,
      yesCount: answers.yesNoQuestions.filter((q: any) => q.yesNo).length,
      noCount: answers.yesNoQuestions.filter((q: any) => !q.yesNo).length,
    };

    if (score >= 75) scoreDistribution.high.push(lead);
    else if (score >= 50) scoreDistribution.medium.push(lead);
    else scoreDistribution.low.push(lead);

    return lead;
  }).sort((a: any, b: any) => b.score - a.score);

  // Normalize sentiment across meetings
  const meetingCount = transcribes.length;
  const avgSentiment: Record<string, number> = {};
  for (const [key, val] of Object.entries(sentimentTotals)) {
    avgSentiment[key] = Math.round(val / meetingCount);
  }

  // Build aggregated answer scores
  for (const [question, scores] of Object.entries(questionScoreMap)) {
    allAnswerScores.push({
      question,
      scores,
    });
  }

  return {
    leads,
    totalDurationMinutes: Math.round(totalDuration / 60),
    latestMeeting: transcribes[0]?.dateIncluded || null,
    avgSentiment,
    reasonsByType: Object.fromEntries(
      Object.entries(allReasons).map(([type, items]) => [type, { count: items.length, examples: items.slice(0, 3) }])
    ),
    competitors: Object.entries(allCompetitors)
      .map(([name, count]) => ({ name, mentions: count }))
      .sort((a, b) => b.mentions - a.mentions),
    scoreDistribution: {
      hot: scoreDistribution.high.length,
      warm: scoreDistribution.medium.length,
      cold: scoreDistribution.low.length,
    },
    answerScores: allAnswerScores.map(({ question, scores }) => ({
      question: question.length > 80 ? question.substring(0, 77) + "…" : question,
      avg: Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10,
      count: scores.length,
    })).sort((a, b) => b.count - a.count).slice(0, 10),
  };
}

// ─── AI ANALYSIS PROMPT ─────────────────────────────────────────────────

const STRUCTURED_PROMPT = `Você é um analista de inteligência comercial da BWild, empresa de reformas de studios para investimento (Airbnb/short stay).

Analise as transcrições e retorne um JSON com esta estrutura. RETORNE APENAS O JSON, sem markdown.

{
  "buyerPersona": {
    "summary": "2-3 frases sobre o perfil típico",
    "ageRange": "Faixa etária",
    "professions": ["Prof1", "Prof2"],
    "motivations": ["Mot1", "Mot2"],
    "avgTicket": "Ex: R$ 60k - R$ 80k"
  },
  "personalityProfiles": [
    {"type": "Nome", "description": "Como se comporta", "frequency": "alta/média/baixa", "approachStrategy": "Como atender", "pitfalls": "O que evitar"}
  ],
  "topQuestions": [
    {"question": "Pergunta", "frequency": "alta/média/baixa", "idealAnswer": "Resposta", "context": "Quando surge"}
  ],
  "objections": [
    {"objection": "Objeção", "frequency": "alta/média/baixa", "rebuttal": "Argumento"}
  ],
  "hiddenObjections": [
    {"objection": "Objeção oculta", "signals": "Como identificar", "approach": "Como resolver"}
  ],
  "closingArguments": [
    {"argument": "Argumento", "effectiveness": "alta/média", "context": "Quando usar"}
  ],
  "buyingSignals": [
    {"signal": "Sinal", "action": "O que fazer"}
  ],
  "actionItems": [
    {"action": "Ação", "priority": "alta/média/baixa", "impact": "Impacto"}
  ],
  "sentimentSummary": "Resumo de 1-2 frases sobre sentimento geral"
}

REGRAS:
- APENAS JSON, sem texto antes/depois, sem backticks
- Dados concretos das reuniões, nunca invente
- Mínimo 3 objeções, 3 argumentos, 3 sinais, 2 perfis, 3 perguntas, 2 ocultas
- Português do Brasil, direto e acionável`;

// ─── MAIN HANDLER ───────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const forceRefresh = url.searchParams.get("refresh") === "true";
    const sb = getSupabaseAdmin();

    // Check cache
    if (!forceRefresh) {
      const { data: cached } = await sb.from("elephant_insights_cache").select("*").eq("cache_key", CACHE_KEY).single();
      if (cached) {
        const ageHours = (Date.now() - new Date(cached.updated_at).getTime()) / 3600000;
        if (ageHours < CACHE_TTL_HOURS) {
          return new Response(JSON.stringify({
            success: true, cached: true, cacheAge: Math.round(ageHours * 60),
            amandaName: cached.amanda_name,
            totalMeetings: cached.total_meetings,
            totalDurationMinutes: cached.total_duration_minutes,
            positiveSentimentPct: cached.positive_sentiment_pct,
            latestMeeting: cached.latest_meeting,
            chartsData: cached.charts_data,
          }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
      }
    }

    const apiKey = Deno.env.get("ASKELEPHANT_API_KEY");
    if (!apiKey) return new Response(JSON.stringify({ success: false, error: "ASKELEPHANT_API_KEY not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) return new Response(JSON.stringify({ success: false, error: "LOVABLE_API_KEY not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Find Amanda
    const usersResult = await elephanFetch("/users?limit=100", apiKey);
    const users = usersResult.data || [];
    const amanda = users.find((u: any) => (u.name || "").toLowerCase().includes("amanda") || (u.email || "").toLowerCase().includes("amanda"));
    if (!amanda) return new Response(JSON.stringify({ success: false, error: "Usuário 'Amanda' não encontrado." }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const amandaId = amanda.id;
    const amandaName = amanda.name || "Amanda";

    // Fetch all transcribes
    const allTranscribes: any[] = [];
    let page = 1, hasNext = true;
    while (hasNext) {
      const result = await elephanFetch(`/transcribes?userId=${amandaId}&limit=100&page=${page}`, apiKey);
      allTranscribes.push(...(result.data || []));
      hasNext = result.pagination?.hasNext === true;
      page++;
    }

    if (allTranscribes.length === 0) {
      return new Response(JSON.stringify({ success: true, amandaName, totalMeetings: 0, chartsData: null }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ─── EXTRACT REAL METRICS ─────────────────────────────────────────
    const metrics = processMeetings(allTranscribes);

    // ─── AI ANALYSIS (qualitative layer) ──────────────────────────────
    const meetingSummaries = allTranscribes.slice(0, 50).map((t: any) => {
      const reasons = (t.reasons || []).map((r: any) => `[${r.type}] ${r.description}`).join("; ");
      const dominant = extractDominantSentiment(t.sentimentAnalysis?.totalSentiment);
      return `[${t.dateIncluded || "?"}] ${t.title || "?"} | ${Math.round((t.duration || 0) / 60)}min | Sent:${dominant}\nResumo: ${(t.summary || "").replace(/<[^>]*>/g, "").substring(0, 400)}\nObjeções/Pontos: ${reasons || "—"}`;
    }).join("\n---\n");

    let aiDashboard = null;
    try {
      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: STRUCTURED_PROMPT },
            { role: "user", content: `${allTranscribes.length} transcrições da ${amandaName}:\n\n${meetingSummaries}` },
          ],
        }),
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        let rawContent = aiData.choices?.[0]?.message?.content || "";
        rawContent = rawContent.replace(/^```json?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
        try { aiDashboard = JSON.parse(rawContent); } catch { console.error("AI JSON parse failed"); }
      } else if (aiResponse.status === 429) {
        console.warn("AI rate limited, returning metrics-only dashboard");
      } else if (aiResponse.status === 402) {
        console.warn("AI credits insufficient, returning metrics-only dashboard");
      }
    } catch (err) {
      console.error("AI analysis failed, continuing with metrics:", err);
    }

    // ─── BUILD COMBINED DASHBOARD ─────────────────────────────────────
    const dashboard = {
      // Real data from Elephan API
      metrics: {
        avgSentiment: metrics.avgSentiment,
        reasonsByType: metrics.reasonsByType,
        competitors: metrics.competitors,
        scoreDistribution: metrics.scoreDistribution,
        answerScores: metrics.answerScores,
      },
      leadScores: metrics.leads,
      // AI-generated qualitative analysis (may be null if AI failed)
      ...(aiDashboard || {}),
    };

    const positivePct = metrics.avgSentiment.positive || null;

    const responseData = {
      success: true, cached: false,
      amandaName,
      totalMeetings: allTranscribes.length,
      totalDurationMinutes: metrics.totalDurationMinutes,
      positiveSentimentPct: positivePct,
      latestMeeting: metrics.latestMeeting,
      chartsData: dashboard,
    };

    // Cache
    await sb.from("elephant_insights_cache").upsert({
      cache_key: CACHE_KEY,
      insights: JSON.stringify(aiDashboard),
      amanda_name: amandaName,
      total_meetings: allTranscribes.length,
      total_duration_minutes: metrics.totalDurationMinutes,
      positive_sentiment_pct: positivePct,
      latest_meeting: metrics.latestMeeting,
      charts_data: dashboard,
      updated_at: new Date().toISOString(),
    }, { onConflict: "cache_key" });

    return new Response(JSON.stringify(responseData), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("elephant-insights error:", error);
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
