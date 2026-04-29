/**
 * Cloudflare Worker — прозрачный прокси перед Supabase.
 *
 * Назначение: обойти блокировку *.supabase.co у российских провайдеров.
 * Ваш домен (например api.neowork.nl) → этот Worker → Supabase.
 *
 * Поддерживает:
 *   - REST / Auth / Storage / Functions (HTTP)
 *   - Realtime (WebSocket upgrade)
 *   - CORS preflight
 *   - Все методы и заголовки (Authorization, apikey, etc.)
 *
 * ──────────────────────────────────────────────────────────────────────
 * УСТАНОВКА
 * ──────────────────────────────────────────────────────────────────────
 * 1. Зайдите на https://dash.cloudflare.com → Workers & Pages → Create → Worker.
 * 2. Назовите его, например, `supabase-proxy`. Нажмите Deploy.
 * 3. Откройте Worker → Edit code. Удалите шаблон, вставьте этот файл целиком.
 *    Save and Deploy.
 * 4. Worker → Settings → Triggers → Custom Domains → Add Custom Domain →
 *    введите `api.neowork.nl` (домен neowork.nl должен быть на Cloudflare).
 *    CF сам создаст DNS-запись и SSL.
 * 5. Откройте https://api.neowork.nl/auth/v1/health — должен вернуться JSON
 *    `{ "date":"...", "description":"GoTrue is a ..." }`. Готово.
 * 6. В проекте Lovable откройте `src/lib/supabaseFetchProxy.ts` —
 *    переменная `OWN_PROXY_ORIGIN` уже указывает на api.neowork.nl.
 *    Если хотите другой домен — поменяйте там же.
 *
 * ВАЖНО: ничего, кроме как сменить SUPABASE_HOST ниже, менять не нужно.
 */

const SUPABASE_HOST = "jvibhsjnspvucjwvhfht.supabase.co";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, apikey, content-type, x-client-info, x-supabase-api-version, prefer, range, accept-profile, content-profile",
  "Access-Control-Expose-Headers":
    "content-range, content-length, x-total-count",
  "Access-Control-Max-Age": "86400",
};

export default {
  async fetch(request) {
    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    // WebSocket (Realtime) — проксируем upgrade.
    const upgrade = request.headers.get("Upgrade");
    if (upgrade && upgrade.toLowerCase() === "websocket") {
      const wsTarget = `wss://${SUPABASE_HOST}${url.pathname}${url.search}`;
      return fetch(wsTarget, request);
    }

    // HTTP-проксирование.
    const target = `https://${SUPABASE_HOST}${url.pathname}${url.search}`;

    // Копируем заголовки, заменяем Host.
    const headers = new Headers(request.headers);
    headers.set("Host", SUPABASE_HOST);
    headers.delete("cf-connecting-ip");
    headers.delete("cf-ipcountry");
    headers.delete("cf-ray");
    headers.delete("cf-visitor");
    headers.delete("x-forwarded-proto");
    headers.delete("x-forwarded-for");

    const init = {
      method: request.method,
      headers,
      body:
        request.method === "GET" || request.method === "HEAD"
          ? undefined
          : request.body,
      redirect: "manual",
    };

    const upstream = await fetch(target, init);

    // Возвращаем ответ с CORS-заголовками поверх.
    const respHeaders = new Headers(upstream.headers);
    for (const [k, v] of Object.entries(CORS_HEADERS)) {
      respHeaders.set(k, v);
    }

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: respHeaders,
    });
  },
};