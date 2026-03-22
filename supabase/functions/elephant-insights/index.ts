import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ELEPHAN_BASE = "https://api.elephan.dev/v1";

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

    // Step 1: List users to find Amanda
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
          error: `Usuário 'Amanda' não encontrado. Usuários disponíveis: ${users.map((u: any) => u.name || u.email).join(", ")}`,
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const amandaId = amanda.id;
    const amandaName = amanda.name || amanda.email || "Amanda";
    console.log(`Found Amanda: ${amandaName} (${amandaId})`);

    // Step 2: Fetch Amanda's transcriptions (all pages)
    console.log("Fetching Amanda's transcriptions...");
    const allTranscribes: any[] = [];
    let page = 1;
    let hasNext = true;

    while (hasNext) {
      const result = await elephanFetch(
        `/transcribes?userId=${amandaId}&limit=100&page=${page}`,
        apiKey
      );
      allTranscribes.push(...(result.data || []));
      hasNext = result.pagination?.hasNext === true;
      page++;
    }

    console.log(`Found ${allTranscribes.length} transcriptions for Amanda`);

    if (allTranscribes.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          insights: null,
          message: "Nenhuma transcrição encontrada para Amanda.",
          amandaName,
          totalMeetings: 0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 3: Prepare transcription summaries for AI consolidation
    const meetingSummaries = allTranscribes.map((t: any) => {
      const answers = (t.answers || [])
        .map((a: any) => `- ${a.question}: ${a.yesNo !== undefined ? (a.yesNo ? "Sim" : "Não") : ""} (score: ${a.score ?? "?"})${a.subtopics?.length ? ` | Subtópicos: ${a.subtopics.join(", ")}` : ""}`)
        .join("\n") || "Sem respostas";

      const competitors = (t.competitors || [])
        .map((c: any) => `- ${c.word} (mencionado ${c.count}x, posição: ${c.position})`)
        .join("\n") || "Nenhum concorrente mencionado";

      const reasons = (t.reasons || [])
        .map((r: any) => `- [${r.type}] ${r.description}${r.details ? `: ${r.details}` : ""}`)
        .join("\n") || "Sem objeções/razões";

      const importantPoints = (t.importantPoints || []).join("\n- ") || "Nenhum";
      const keywords = (t.keywords || []).join(", ") || "Nenhuma";
      const sentiment = t.sentimentAnalysis?.totalSentiment || "?";

      return `## ${t.title || "Reunião sem título"}
Data: ${t.dateIncluded || "?"}
Duração: ${t.duration ? Math.round(t.duration / 60) + " min" : "?"}
Sentimento geral: ${sentiment}
Palavras-chave: ${keywords}
Tags: ${(t.tags || []).join(", ") || "Nenhuma"}

### Resumo:
${t.summary || "Sem resumo"}

### Pontos importantes:
- ${importantPoints}

### Respostas do formulário:
${answers}

### Concorrentes mencionados:
${competitors}

### Objeções / Razões:
${reasons}
---`;
    }).join("\n\n");

    // Step 4: Consolidate with Lovable AI
    console.log("Consolidating insights with AI...");
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Você é um analista de inteligência comercial especializado no mercado imobiliário de studios urbanos para investimento (short stay / aluguel por temporada). Sua tarefa é consolidar insights de reuniões comerciais para ajudar times de vendas.

Analise as transcrições de reuniões da consultora Amanda e extraia:

1. **Perfil dos Compradores** — Quem são as pessoas buscando studios para investimento? Faixa etária, profissão, motivação, ticket médio que buscam. Use dados reais das reuniões.

2. **Objeções Recorrentes** — Quais são as principais dúvidas e resistências dos potenciais investidores? Liste com frequência.

3. **Fatores de Decisão** — O que leva o investidor a fechar? Quais argumentos funcionam?

4. **Sinais de Compra** — Quais comportamentos indicam que um lead está pronto para converter?

5. **Concorrência** — Quais concorrentes são mencionados? Como se posicionam?

6. **Oportunidades para o Time Comercial** — Ações práticas que o time pode tomar baseado nesses padrões.

7. **Sentimento Geral** — Tendência de sentimento nas reuniões (positivo, neutro, negativo).

Responda SEMPRE em português do Brasil. Use dados concretos das reuniões. Formate com markdown claro. Seja direto e acionável. Cite reuniões específicas quando relevante.`,
          },
          {
            role: "user",
            content: `Aqui estão as ${allTranscribes.length} transcrições de reuniões da Amanda. Consolide os principais insights para o time comercial:\n\n${meetingSummaries}`,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: "Rate limit excedido. Tente novamente em alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: "Créditos insuficientes." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      throw new Error(`AI error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const insights = aiData.choices?.[0]?.message?.content || "";

    // Collect aggregate stats
    const totalDuration = allTranscribes.reduce((sum: number, t: any) => sum + (t.duration || 0), 0);
    const sentiments = allTranscribes.map((t: any) => t.sentimentAnalysis?.totalSentiment).filter(Boolean);
    const positivePct = sentiments.length
      ? Math.round((sentiments.filter((s: string) => s === "positive").length / sentiments.length) * 100)
      : null;

    return new Response(
      JSON.stringify({
        success: true,
        insights,
        amandaName,
        totalMeetings: allTranscribes.length,
        totalDurationMinutes: Math.round(totalDuration / 60),
        positiveSentimentPct: positivePct,
        latestMeeting: allTranscribes[0]?.dateIncluded || null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("elephant-insights error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
