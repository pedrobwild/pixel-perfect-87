import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const apiKey = Deno.env.get("ASKELEPHANT_API_KEY");
  if (!apiKey) return new Response(JSON.stringify({ error: "No API key" }), { status: 500, headers: corsHeaders });

  const BASE = "https://api.elephan.dev/v1";
  const h = { Authorization: `Bearer ${apiKey}`, Accept: "application/json" };

  try {
    // 1. Users
    const usersRes = await fetch(`${BASE}/users?limit=10`, { headers: h });
    const users = await usersRes.json();

    // 2. First 2 transcribes (list view)
    const transRes = await fetch(`${BASE}/transcribes?limit=2`, { headers: h });
    const transcribes = await transRes.json();

    // 3. Full detail of first transcribe
    let detail = null;
    const firstId = transcribes?.data?.[0]?.id;
    if (firstId) {
      const detailRes = await fetch(`${BASE}/transcribes/${firstId}`, { headers: h });
      detail = await detailRes.json();
    }

    // 4. Try other endpoints
    let meetings = null;
    try {
      const meetRes = await fetch(`${BASE}/meetings?limit=2`, { headers: h });
      meetings = await meetRes.json();
    } catch { meetings = "endpoint not available"; }

    let analytics = null;
    try {
      const anaRes = await fetch(`${BASE}/analytics`, { headers: h });
      analytics = await anaRes.json();
    } catch { analytics = "endpoint not available"; }

    return new Response(JSON.stringify({
      users_sample: users,
      transcribes_list_sample: transcribes,
      transcribe_detail: detail,
      meetings_endpoint: meetings,
      analytics_endpoint: analytics,
    }, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
