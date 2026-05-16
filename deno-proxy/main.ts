// Deno Deploy — full site + Supabase reverse proxy.
//
// Один воркер обслуживает и фронт, и бэк. Клиент из РФ ходит только
// на *.deno.dev (или CNAME на него) — никаких прямых обращений к
// supabase.co и никакого VPS в Казахстане.
//
// Deploy:
//   1) https://dash.deno.com → New Project → Playground.
//   2) Вставить этот файл целиком → Save & Deploy.
//   3) Получишь адрес https://<имя>.deno.dev — он и есть точка входа.

const SITE_TARGET = "https://nano2.lovable.app";
const API_TARGET = "https://jvibhsjnspvucjwvhfht.supabase.co";
const API_PREFIX = "/__supabase";

const CORS: Record<string, string> = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  "access-control-allow-headers": "*",
  "access-control-expose-headers": "*",
  "access-control-max-age": "86400",
};

const HOP_BY_HOP = new Set([
  "host",
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "content-length",
]);

function cleanHeaders(src: Headers, upstreamHost: string): Headers {
  const out = new Headers();
  for (const [k, v] of src) {
    if (HOP_BY_HOP.has(k.toLowerCase())) continue;
    out.set(k, v);
  }
  out.set("host", upstreamHost);
  return out;
}

function withCors(resp: Response): Response {
  const headers = new Headers(resp.headers);
  for (const [k, v] of Object.entries(CORS)) headers.set(k, v);
  return new Response(resp.body, {
    status: resp.status,
    statusText: resp.statusText,
    headers,
  });
}

async function proxy(req: Request, upstreamBase: string, path: string, addCors: boolean): Promise<Response> {
  const upstreamUrl = new URL(path + new URL(req.url).search, upstreamBase);
  const upstreamReq = new Request(upstreamUrl.toString(), {
    method: req.method,
    headers: cleanHeaders(req.headers, upstreamUrl.host),
    body: ["GET", "HEAD"].includes(req.method) ? undefined : req.body,
    redirect: "manual",
  });
  const resp = await fetch(upstreamReq);
  return addCors ? withCors(resp) : resp;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }

  const url = new URL(req.url);
  const isApi = url.pathname === API_PREFIX || url.pathname.startsWith(`${API_PREFIX}/`);

  try {
    if (isApi) {
      const path = url.pathname.slice(API_PREFIX.length) || "/";
      return await proxy(req, API_TARGET, path, true);
    }
    return await proxy(req, SITE_TARGET, url.pathname, false);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "upstream error";
    return new Response(`Proxy error: ${msg}`, {
      status: 502,
      headers: isApi ? CORS : undefined,
    });
  }
});