/**
 * FORCE-PROXY mode (v5).
 *
 * Все запросы к *.supabase.co (включая Realtime WebSocket) переписываются
 * на наш VPS https://ru-api.neowork.nl. Прямые обращения к supabase.co
 * запрещены — это критично для пользователей в РФ, где supabase.co
 * заблокирован провайдерами.
 *
 * Никаких "direct"/"public CORS" фолбэков больше нет: прокси стабильно
 * работает по HTTPS, лишние пути только маскируют реальные ошибки.
 */

import { classifyError, logNetError } from "./networkLogger";

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? "";

// Жёстко зашитый VPS-прокси. Public URL, не секрет.
const VPS_PROXY_ORIGIN = "https://ru-api.neowork.nl";

// Убираем хост Supabase из URL и подставляем хост прокси.
// Работает и для https://, и для wss:// (Realtime).
const SUPABASE_HOST = (() => {
  try {
    return new URL(SUPABASE_URL).host;
  } catch {
    return "";
  }
})();
const PROXY_HOST = (() => {
  try {
    return new URL(VPS_PROXY_ORIGIN).host;
  } catch {
    return "";
  }
})();

const rewriteUrl = (url: string): string => {
  if (!SUPABASE_HOST || !PROXY_HOST) return url;
  // https://xxx.supabase.co/...  →  https://ru-api.neowork.nl/...
  // wss://xxx.supabase.co/...    →  wss://ru-api.neowork.nl/...
  if (url.includes(`//${SUPABASE_HOST}`)) {
    return url.replace(`//${SUPABASE_HOST}`, `//${PROXY_HOST}`);
  }
  return url;
};

const isSupabaseUrl = (url: string): boolean =>
  !!SUPABASE_HOST && url.includes(`//${SUPABASE_HOST}`);

console.info(
  "[fetchProxy] v6 FORCE-PROXY active. supabase.co →",
  VPS_PROXY_ORIGIN,
  "(host:", SUPABASE_HOST, "→", PROXY_HOST + ")",
);

// ─── fetch override ──────────────────────────────────────────────────────────

const originalFetch = window.fetch.bind(window);

window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const url =
    typeof input === "string"
      ? input
      : input instanceof URL
      ? input.toString()
      : input.url;

  if (!isSupabaseUrl(url)) {
    return originalFetch(input as any, init);
  }

  const proxied = rewriteUrl(url);
  const method = (
    init?.method ?? (input instanceof Request ? input.method : "GET")
  ).toUpperCase();

  // Собираем заголовки: сначала из Request (если был), потом перекрываем init.headers.
  const mergedHeaders = new Headers();
  if (input instanceof Request) {
    input.headers.forEach((v, k) => mergedHeaders.set(k, v));
  }
  if (init?.headers) {
    new Headers(init.headers).forEach((v, k) => mergedHeaders.set(k, v));
  }

  // Тело: из init, иначе из Request.
  let body: BodyInit | null | undefined = init?.body;
  if (
    body === undefined &&
    input instanceof Request &&
    method !== "GET" &&
    method !== "HEAD"
  ) {
    body = await input.clone().arrayBuffer();
  }

  const finalInit: RequestInit = {
    method,
    headers: mergedHeaders,
    body,
    credentials: init?.credentials ?? (input instanceof Request ? input.credentials : undefined),
    mode: init?.mode ?? (input instanceof Request ? input.mode : undefined),
    cache: init?.cache,
    redirect: init?.redirect,
    referrer: init?.referrer,
    integrity: init?.integrity,
    signal: init?.signal ?? (input instanceof Request ? input.signal : undefined),
  };

  try {
    return await originalFetch(proxied, finalInit);
  } catch (e) {
    const c = classifyError(e);
    logNetError({
      url,
      method,
      route: "vps_proxy",
      errorType: c.type,
      message: `force-proxy failed: ${c.message}`,
    });
    throw e;
  }
};

// ─── WebSocket override (для Supabase Realtime) ──────────────────────────────

const OriginalWebSocket = window.WebSocket;
class ProxiedWebSocket extends OriginalWebSocket {
  constructor(url: string | URL, protocols?: string | string[]) {
    const u = typeof url === "string" ? url : url.toString();
    const rewritten = isSupabaseUrl(u) ? rewriteUrl(u) : u;
    super(rewritten, protocols);
  }
}
// Сохраняем статические свойства (CONNECTING, OPEN, CLOSING, CLOSED).
Object.setPrototypeOf(ProxiedWebSocket, OriginalWebSocket);
Object.defineProperty(ProxiedWebSocket, "prototype", {
  value: OriginalWebSocket.prototype,
});
window.WebSocket = ProxiedWebSocket as any;

// ─── XMLHttpRequest override (на случай, если что-то использует XHR) ─────────

const OriginalXHROpen = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function (
  method: string,
  url: string | URL,
  ...rest: any[]
) {
  const u = typeof url === "string" ? url : url.toString();
  const final = isSupabaseUrl(u) ? rewriteUrl(u) : u;
  return OriginalXHROpen.call(this, method, final, ...(rest as []));
};

export {};
