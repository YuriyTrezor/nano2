// Cloudflare Worker — full site + backend reverse proxy for users in РФ.
//
// What it does:
//   - Serves the whole frontend from SITE_TARGET on your own domain
//   - Proxies backend calls from /__supabase/* to API_TARGET
//   - Keeps the browser on one accessible domain, which is much more reliable
//     than exposing *.supabase.co directly to Russian ISPs.
//
// Recommended deployment:
//   app.your-new-domain.com   -> this Worker
//   or blocked-domain.com     -> this Worker if the domain itself is not blocked
//
// Frontend code in this repo already knows how to use /__supabase automatically.

const SITE_TARGET = "https://nano2.lovable.app";
const API_TARGET = "https://jvibhsjnspvucjwvhfht.supabase.co";
const API_PREFIX = "/__supabase";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Expose-Headers": "*",
  "Access-Control-Max-Age": "86400",
};

const stripProxyHeaders = (headers) => {
  const cleaned = new Headers(headers);
  cleaned.delete("host");
  cleaned.delete("cf-connecting-ip");
  cleaned.delete("cf-ipcountry");
  cleaned.delete("cf-ray");
  cleaned.delete("cf-visitor");
  return cleaned;
};

const withCors = (response) => {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(CORS)) headers.set(key, value);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};

const proxy = async (request, upstreamBase, upstreamPath, addCors = false) => {
  const url = new URL(request.url);
  const upstreamUrl = `${upstreamBase}${upstreamPath}${url.search}`;

  const response = await fetch(upstreamUrl, {
    method: request.method,
    headers: stripProxyHeaders(request.headers),
    body: ["GET", "HEAD"].includes(request.method) ? undefined : request.body,
    redirect: "manual",
  });

  return addCors ? withCors(response) : response;
};

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }

    const url = new URL(request.url);
    const isApiRequest =
      url.pathname === API_PREFIX || url.pathname.startsWith(`${API_PREFIX}/`);

    try {
      if (isApiRequest) {
        const upstreamPath = url.pathname.slice(API_PREFIX.length) || "/";
        return await proxy(request, API_TARGET, upstreamPath, true);
      }

      return await proxy(request, SITE_TARGET, url.pathname, false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown upstream error";
      return new Response(`Proxy error: ${message}`, {
        status: 502,
        headers: isApiRequest ? CORS : undefined,
      });
    }
  },
};