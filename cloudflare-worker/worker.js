// Cloudflare Worker — proxy for Supabase on api.neowork.nl
// Deploy at: https://dash.cloudflare.com → Workers & Pages → Create Worker
// Then bind to route: api.neowork.nl/*

const TARGET = "https://jvibhsjnspvucjwvhfht.supabase.co";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Expose-Headers": "*",
  "Access-Control-Max-Age": "86400",
};

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }

    const url = new URL(request.url);
    const upstream = TARGET + url.pathname + url.search;

    // Strip hop-by-hop / host headers so upstream sees a clean request.
    const headers = new Headers(request.headers);
    headers.delete("host");
    headers.delete("cf-connecting-ip");
    headers.delete("cf-ipcountry");
    headers.delete("cf-ray");
    headers.delete("cf-visitor");

    const init = {
      method: request.method,
      headers,
      body: ["GET", "HEAD"].includes(request.method) ? undefined : request.body,
      redirect: "manual",
    };

    let resp;
    try {
      resp = await fetch(upstream, init);
    } catch (e) {
      return new Response("upstream error: " + e.message, { status: 502, headers: CORS });
    }

    const outHeaders = new Headers(resp.headers);
    for (const [k, v] of Object.entries(CORS)) outHeaders.set(k, v);

    return new Response(resp.body, {
      status: resp.status,
      statusText: resp.statusText,
      headers: outHeaders,
    });
  },
};