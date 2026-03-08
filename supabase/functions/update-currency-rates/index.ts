import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch from CBR
    const res = await fetch("https://www.cbr-xml-daily.ru/daily_json.js");
    const data = await res.json();

    const currencies = ["USD", "EUR", "CNY", "GBP"];
    const symbols: Record<string, string> = { USD: "$", EUR: "€", CNY: "¥", GBP: "£" };

    const rows = currencies.map((code) => {
      const v = data.Valute[code];
      return {
        code,
        symbol: symbols[code],
        value: v.Value / v.Nominal,
        previous: v.Previous / v.Nominal,
        change: (v.Value - v.Previous) / v.Nominal,
        nominal: v.Nominal,
        updated_at: new Date().toISOString(),
      };
    });

    // Upsert
    const { error } = await supabase
      .from("currency_rates")
      .upsert(rows, { onConflict: "code" });

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, rates: rows }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
