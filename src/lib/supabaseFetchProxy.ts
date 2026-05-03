/**
 * Опциональный proxy для Supabase.
 *
 * По умолчанию ВЫКЛЮЧЕН — все запросы идут напрямую в *.supabase.co.
 * Это нужно, потому что наш VPS-прокси может быть недоступен (падение,
 * рестарт, истёкший SSL и т.п.), и в таком режиме принудительный
 * редирект полностью ломает сайт во ВСЕХ регионах, включая те, где
 * Supabase прекрасно работает напрямую.
 *
 * Включить proxy можно ТОЛЬКО явно, одним из способов:
 *   1) localStorage.setItem("use_supabase_proxy", "1")
 *   2) ?proxy=1 в URL (запоминается в localStorage)
 *
 * Выключить:
 *   localStorage.removeItem("use_supabase_proxy")  или  ?proxy=0
 */

import { classifyError, logNetError } from "./networkLogger";

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? "";
const VPS_PROXY_ORIGIN = "https://neowork.nl/api";

const SUPABASE_HOST = (() => {
  try { return new URL(SUPABASE_URL).host; } catch { return ""; }
})();
const PROXY_URL = (() => {
  try { return new URL(VPS_PROXY_ORIGIN); } catch { return null; }
})();
const PROXY_HOST = PROXY_URL?.host ?? "";
const PROXY_PATH = (PROXY_URL?.pathname ?? "").replace(/\/$/, "");

// ── Включение/выключение через URL-параметр ─────────────────────────────────
try {
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    const flag = params.get("proxy");
    if (flag === "1") localStorage.setItem("use_supabase_proxy", "1");
    if (flag === "0") localStorage.removeItem("use_supabase_proxy");
  }
} catch { /* ignore */ }

const PROXY_ENABLED = (() => {
  try {
    if (typeof window === "undefined") return false;
    // Явное отключение через ?proxy=0 или localStorage = "0"
    if (window.localStorage.getItem("use_supabase_proxy") === "0") return false;
    return true;
  } catch { return true; }
})();

const isSupabaseUrl = (url: string): boolean =>
  !!SUPABASE_HOST && url.includes(`//${SUPABASE_HOST}`);

const rewriteUrl = (url: string): string => {
  if (!SUPABASE_HOST || !PROXY_HOST) return url;
  if (url.includes(`//${SUPABASE_HOST}`)) {
    return url.replace(`//${SUPABASE_HOST}`, `//${PROXY_HOST}${PROXY_PATH}`);
  }
  return url;
};

if (PROXY_ENABLED) {
  console.info(
    "[fetchProxy] PROXY ON. supabase.co →", VPS_PROXY_ORIGIN,
  );
} else {
  console.info("[fetchProxy] direct mode (no proxy). Включить: ?proxy=1");
}

// ── fetch override (только если proxy включён) ──────────────────────────────
if (PROXY_ENABLED) {
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

    const mergedHeaders = new Headers();
    if (input instanceof Request) {
      input.headers.forEach((v, k) => mergedHeaders.set(k, v));
    }
    if (init?.headers) {
      new Headers(init.headers).forEach((v, k) => mergedHeaders.set(k, v));
    }

    let body: BodyInit | null | undefined = init?.body;
    if (body === undefined && input instanceof Request && method !== "GET" && method !== "HEAD") {
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
        url, method, route: "vps_proxy",
        errorType: c.type,
        message: `proxy failed: ${c.message}`,
      });
      // Fallback на прямой запрос — лучше показать сайт, чем белый экран.
      return originalFetch(input as any, init);
    }
  };

  // WebSocket override — тоже только при включённом proxy.
  const OriginalWebSocket = window.WebSocket;
  class ProxiedWebSocket extends OriginalWebSocket {
    constructor(url: string | URL, protocols?: string | string[]) {
      const u = typeof url === "string" ? url : url.toString();
      const rewritten = isSupabaseUrl(u) ? rewriteUrl(u) : u;
      super(rewritten, protocols);
    }
  }
  window.WebSocket = ProxiedWebSocket as any;

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
}

export {};
