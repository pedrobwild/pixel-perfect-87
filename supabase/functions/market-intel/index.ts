import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { propertyName, neighborhood, city } = await req.json();

    const apiKey = Deno.env.get("PERPLEXITY_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: "PERPLEXITY_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const query = `Dados atualizados do mercado de short stay e aluguel por temporada na região de ${neighborhood}, ${city}, Brasil.
Inclua:
1. Diária média de studios/apartamentos compactos na região (Airbnb/Booking)
2. Taxa de ocupação média na região
3. Crescimento da demanda por short stay nos últimos 12 meses
4. Vantagens competitivas da localização ${neighborhood} para short stay (proximidade a hospitais, empresas, metrô, pontos turísticos)
5. Comparação com bairros concorrentes próximos em termos de rentabilidade
6. Tendências do mercado imobiliário de studios em ${city} para 2025-2026

Foque em dados que reforcem a tese de investimento em studios para short stay nesta região. Seja objetivo e use números quando possível.`;

    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          {
            role: "system",
            content: `Você é um analista de mercado imobiliário especializado em short stay e investimentos em studios urbanos no Brasil. Sempre responda em português do Brasil. Seja objetivo, use dados e números reais quando disponíveis. Formate a resposta em seções claras com títulos. O objetivo é fornecer dados que ajudem um investidor a tomar a decisão de comprar um studio no empreendimento "${propertyName}" localizado em ${neighborhood}, ${city}.`,
          },
          { role: "user", content: query },
        ],
        search_recency_filter: "month",
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: "Rate limit exceeded. Tente novamente em alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: "Créditos insuficientes no Perplexity." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("Perplexity API error:", response.status, errorText);
      return new Response(
        JSON.stringify({ success: false, error: `API error: ${response.status}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const citations = data.citations || [];

    return new Response(
      JSON.stringify({ success: true, content, citations, model: data.model }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("market-intel error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
