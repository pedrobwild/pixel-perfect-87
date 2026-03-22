import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ELEPHANT_BASE = "https://api.askelephant.ai/api/v2";

async function elephantFetch(path: string, apiKey: string) {
  const res = await fetch(`${ELEPHANT_BASE}${path}`, {
    headers: { Authorization: apiKey },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AskElephant ${res.status}: ${text}`);
  }
  return res.json();
}

async function fetchAllPages(path: string, apiKey: string) {
  const allData: any[] = [];
  let cursor: string | null = null;
  let hasMore = true;

  while (hasMore) {
    const sep = path.includes("?") ? "&" : "?";
    const url = cursor ? `${path}${sep}cursor=${cursor}&limit=100` : `${path}${sep}limit=100`;
    const result = await elephantFetch(url, apiKey);
    allData.push(...(result.data || []));
    hasMore = result.has_more === true;
    cursor = result.next_cursor || null;
  }

  return allData;
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

    // Step 1: Find Amanda's user ID
    console.log("Searching for Amanda...");
    const usersData = await elephantFetch("/users?search=Amanda&limit=10", apiKey);
    const users = usersData.data || [];
    
    if (users.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Usuário 'Amanda' não encontrado no AskElephant." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Pick the first Amanda match
    const amanda = users[0];
    const amandaId = amanda.id;
    const amandaName = amanda.full_name || amanda.first_name || "Amanda";
    console.log(`Found Amanda: ${amandaName} (${amandaId})`);

    // Step 2: Fetch Amanda's engagements with signals, action items, and contacts
    console.log("Fetching Amanda's engagements...");
    const engagements = await fetchAllPages(
      `/engagements?filter[owner_ids][eq]=${amandaId}&expand=signals,action_items,contacts,tags`,
      apiKey
    );

    console.log(`Found ${engagements.length} engagements for Amanda`);

    if (engagements.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          insights: null, 
          message: "Nenhuma reunião encontrada para Amanda.",
          amandaName,
          totalMeetings: 0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 3: Prepare engagement summaries for AI consolidation
    const meetingSummaries = engagements.map((eng: any) => {
      const signals = eng.signals?.map((s: any) => `- [${s.type || "signal"}] ${s.title || s.description || s.content || JSON.stringify(s)}`).join("\n") || "Sem sinais";
      const actionItems = eng.action_items?.map((a: any) => `- ${a.title || a.description || a.content || JSON.stringify(a)}`).join("\n") || "Sem itens de ação";
      const contacts = eng.contacts?.map((c: any) => `${c.full_name || c.first_name || "?"} (${c.email || c.company_name || ""})`).join(", ") || "Sem contatos";
      const tags = eng.tags?.map((t: any) => t.name || t).join(", ") || "";

      return `## Reunião: ${eng.title || "Sem título"}
Data: ${eng.start_at || eng.created_at || "?"}
Participantes: ${contacts}
Tags: ${tags}
Tipo: ${eng.engagement_type || "?"}
Status: ${eng.processing_status || "?"}

### Sinais detectados:
${signals}

### Itens de ação:
${actionItems}

${eng.summary ? `### Resumo:\n${eng.summary}` : ""}
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
            content: `Você é um analista de inteligência comercial especializado no mercado imobiliário de studios urbanos para investimento (short stay). Sua tarefa é consolidar insights de reuniões comerciais para ajudar times de vendas.

Analise as reuniões da corretora/consultora Amanda e extraia:

1. **Perfil dos Compradores** — Quem são as pessoas buscando studios para investimento? Faixa etária, profissão, motivação, ticket médio que buscam.

2. **Objeções Recorrentes** — Quais são as principais dúvidas e resistências dos potenciais investidores?

3. **Fatores de Decisão** — O que leva o investidor a fechar? Quais argumentos funcionam?

4. **Sinais de Compra** — Quais comportamentos indicam que um lead está pronto para converter?

5. **Oportunidades para o Time Comercial** — Ações práticas que o time pode tomar baseado nesses padrões.

6. **Tendências Observadas** — Padrões emergentes no comportamento dos investidores.

Responda SEMPRE em português do Brasil. Use dados concretos das reuniões. Formate com markdown claro. Seja direto e acionável.`,
          },
          {
            role: "user",
            content: `Aqui estão as ${engagements.length} reuniões da Amanda. Consolide os insights para o time comercial:\n\n${meetingSummaries}`,
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
          JSON.stringify({ success: false, error: "Créditos insuficientes no Lovable AI." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      throw new Error(`AI error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const insights = aiData.choices?.[0]?.message?.content || "";

    return new Response(
      JSON.stringify({
        success: true,
        insights,
        amandaName,
        totalMeetings: engagements.length,
        latestMeeting: engagements[0]?.start_at || engagements[0]?.created_at || null,
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
