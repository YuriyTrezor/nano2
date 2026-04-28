// Edge Function used as a regional fallback proxy for Supabase API calls.
// Frontend monkey-patched fetch routes here when the direct route to
// *.supabase.co is blocked (e.g. some RU ISPs).
//
// Path convention: /functions/v1/api-proxy/<rest-of-supabase-path>
// e.g. /functions/v1/api-proxy/auth/v1/token?grant_type=password
//
// We forward method, headers (incl. Authorization + apikey) and body
// to the upstream Supabase URL and stream the response back.

import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const incoming = new URL(req.url);
    // Strip the function prefix to get the upstream path.
    // Supabase routes the function as /functions/v1/api-proxy/...
    const marker = "/api-proxy";
    const idx = incoming.pathname.indexOf(marker);
    if (idx === -1) {
      return new Response(JSON.stringify({ error: "bad proxy path" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const upstreamPath = incoming.pathname.slice(idx + marker.length) || "/";
    const upstreamUrl = `${SUPABASE_URL}${upstreamPath}${incoming.search}`;

    // Clone headers, drop hop-by-hop ones.
    const headers = new Headers(req.headers);
    ["host", "connection", "content-length"].forEach((h) => headers.delete(h));

    const init: RequestInit = {
      method: req.method,
      headers,
      body:
        req.method === "GET" || req.method === "HEAD"
          ? undefined
          : await req.arrayBuffer(),
      redirect: "manual",
    };

    const upstream = await fetch(upstreamUrl, init);
    const respHeaders = new Headers(upstream.headers);
    Object.entries(corsHeaders).forEach(([k, v]) => respHeaders.set(k, v));

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: respHeaders,
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});