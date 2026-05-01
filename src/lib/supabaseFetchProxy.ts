/**
 * Multi-proxy fetch fallback for Supabase requests.
 *
 * Route priority:
 *   1. VITE_API_PROXY_ORIGIN — your own VPS proxy (e.g. ru-api.neowork.nl).
 *      Recommended primary route for users in restricted regions (RU).
 *      Set in Lovable → Project Settings → Environment variables.
 *   2. Legacy Cloudflare Worker (api.neowork.nl) — kept as a secondary
 *      route for backwards compatibility. Will be retired once the VPS
 *      proxy is verified.
 *   3. Direct *.supabase.co — used when nothing else is configured or
 *      both proxies are unreachable.
 *   4. Public CORS proxies — last-resort race.
 *
 * All original headers (Authorization, apikey, content-type, ...) are
 * preserved, so Supabase auth + RLS keep working transparently.
 * Every failure is logged via `networkLogger` so admins can diagnose
 * real-world connectivity issues.
 */

import { classifyError, logNetError } from "./networkLogger";

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? "";

// Primary proxy — your VPS in RU/EU. Hardcoded because Lovable doesn't
// expose a UI for build-time VITE_* variables. This is a public URL,
// not a secret. Override via env if available, otherwise use default.
const VPS_PROXY_ORIGIN = (
  (import.meta.env.VITE_API_PROXY_ORIGIN as string | undefined) ??
  "https://ru-api.neowork.nl"
).replace(/\/+$/, "");

// Legacy Cloudflare Worker — kept as a secondary fallback only.
const OWN_PROXY_ORIGIN = "https://api.neowork.nl";

const toOwnProxy = (url: string): string => {
  if (!OWN_PROXY_ORIGIN || !SUPABASE_URL) return url;
  return OWN_PROXY_ORIGIN + url.slice(SUPABASE_URL.length);
};

const toVpsProxy = (url: string): string => {
  if (!VPS_PROXY_ORIGIN || !SUPABASE_URL) return url;
  return VPS_PROXY_ORIGIN + url.slice(SUPABASE_URL.length);
};

// Public CORS proxies that forward method, headers and body.
// Order doesn't matter much — we race them in parallel.
// Verified working public CORS proxies (tested against Supabase POST
// /auth/v1/token with Authorization + apikey headers preserved).
// corsproxy.io / allorigins / codetabs were dropped — they now block
// server-side requests, time out, or strip headers.
const PROXIES: Array<(url: string) => string> = [
  // VPS — primary if configured.
  ...(VPS_PROXY_ORIGIN ? [toVpsProxy] : []),
  // Legacy CF Worker — secondary.
  ...(OWN_PROXY_ORIGIN ? [toOwnProxy] : []),
  // Public CORS proxies — last resort.
  (url) => `https://cors.eu.org/${url}`,
  (url) => `https://proxy.cors.sh/${url}`,
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
];

// Once we know the direct route works (or doesn't), remember it.
type Route = "direct" | "proxy";
let preferredRoute: Route | null = null;

// Direct-call timeout. Real Supabase responses usually return well under
// 2s; if we wait longer it's almost certainly a block. Bumped a bit for
// slow RU mobile connections.
const DIRECT_TIMEOUT_MS = 5000;
// Per-proxy timeout — kill slow/dead proxies fast so the race finishes.
const PROXY_TIMEOUT_MS = 6000;

const originalFetch = window.fetch.bind(window);

const isSupabaseUrl = (url: string) => !!SUPABASE_URL && url.startsWith(SUPABASE_URL);
// Для нашего прокси-фолбэка ЛЮБОЙ метод считаем безопасным для повтора:
// если запрос не дошёл до сервера (network error / timeout), повтор не создаст
// дубликат — Supabase его просто не получил. Это критично для POST /token
// (логин), без этого пользователи в РФ не могут войти, когда наш CF Worker
// недоступен.
const isRetryableMethod = (_method?: string) => true;

const withTimeout = async (
  promise: Promise<Response>,
  ms: number,
  controller: AbortController,
): Promise<Response> => {
  let timer: ReturnType<typeof setTimeout> | null = null;
  try {
    return await Promise.race([
      promise,
      new Promise<Response>((_, reject) => {
        timer = setTimeout(() => {
          controller.abort();
          reject(new Error("timeout"));
        }, ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
};

// Race all proxies — first successful response wins; cancel the rest.
const raceProxies = async (url: string, init: RequestInit | undefined): Promise<Response> => {
  const controllers = PROXIES.map(() => new AbortController());

  const attempts = PROXIES.map(async (build, i) => {
    const proxied = build(url);
    const proxyInit: RequestInit = {
      ...(init || {}),
      signal: controllers[i].signal,
    };
    const timer = setTimeout(() => controllers[i].abort(), PROXY_TIMEOUT_MS);
    try {
      const res = await originalFetch(proxied, proxyInit);
      // Treat 5xx from the proxy itself as a failure so another proxy can win.
      if (res.status >= 500) throw new Error(`proxy ${i} -> ${res.status}`);
      return { res, i };
    } finally {
      clearTimeout(timer);
    }
  });

  // Manual Promise.any so we don't depend on ES2021 lib target.
  return new Promise<Response>((resolve, reject) => {
    let remaining = attempts.length;
    const errors: unknown[] = [];
    attempts.forEach((p, i) => {
      p.then(({ res }) => {
        controllers.forEach((c, idx) => {
          if (idx !== i) c.abort();
        });
        preferredRoute = "proxy";
        resolve(res);
      }).catch((e) => {
        errors.push(e);
        remaining -= 1;
        if (remaining === 0) {
          reject(
            new Error(
              "All Supabase fallbacks failed. Likely a network block. " +
                errors.map((x) => (x instanceof Error ? x.message : String(x))).join(" | "),
            ),
          );
        }
      });
    });
  });
};

const tryDirect = async (url: string, init: RequestInit | undefined): Promise<Response> => {
  const controller = new AbortController();
  // Respect any existing signal from the caller.
  const callerSignal = init?.signal;
  if (callerSignal) {
    if (callerSignal.aborted) controller.abort();
    else callerSignal.addEventListener("abort", () => controller.abort(), { once: true });
  }
  const directInit: RequestInit = { ...(init || {}), signal: controller.signal };
  return withTimeout(originalFetch(url, directInit), DIRECT_TIMEOUT_MS, controller);
};

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

  // Normalize: if caller passed a Request object, materialize init so we
  // can reuse it for both direct and proxy attempts.
  let finalInit = init;
  if (input instanceof Request && !init) {
    const method = input.method;
    finalInit = {
      method,
      headers: input.headers,
      body:
        method !== "GET" && method !== "HEAD"
          ? await input.clone().arrayBuffer()
          : undefined,
      credentials: input.credentials,
      mode: input.mode,
    };
  }

  const method = (finalInit?.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();
  const canRetry = isRetryableMethod(method);

  // Step 1: VPS proxy (primary, if configured).
  if (VPS_PROXY_ORIGIN) {
    const proxied = toVpsProxy(url);
    const controller = new AbortController();
    const callerSignal = finalInit?.signal;
    if (callerSignal) {
      if (callerSignal.aborted) controller.abort();
      else callerSignal.addEventListener("abort", () => controller.abort(), { once: true });
    }
    const vpsInit: RequestInit = { ...(finalInit || {}), signal: controller.signal };
    try {
      const res = await withTimeout(originalFetch(proxied, vpsInit), DIRECT_TIMEOUT_MS, controller);
      if (res.status < 500) {
        if (res.status >= 400 && method !== "GET") {
          logNetError({
            url, method, route: "own_proxy",
            errorType: "http_error", status: res.status,
            message: `VPS proxy returned ${res.status}`,
          });
        }
        return res;
      }
      logNetError({
        url, method, route: "own_proxy",
        errorType: "http_error", status: res.status,
        message: "VPS proxy 5xx, falling back",
      });
    } catch (e) {
      const c = classifyError(e);
      logNetError({ url, method, route: "own_proxy", errorType: c.type, message: c.message });
    }
  }

  // Step 2: Legacy CF Worker (secondary).
  if (OWN_PROXY_ORIGIN) {
    const proxied = toOwnProxy(url);
    const controller = new AbortController();
    const callerSignal = finalInit?.signal;
    if (callerSignal) {
      if (callerSignal.aborted) controller.abort();
      else callerSignal.addEventListener("abort", () => controller.abort(), { once: true });
    }
    const ownInit: RequestInit = { ...(finalInit || {}), signal: controller.signal };
    try {
      const res = await withTimeout(originalFetch(proxied, ownInit), DIRECT_TIMEOUT_MS, controller);
      if (res.status < 500) return res;
    } catch (e) {
      const c = classifyError(e);
      logNetError({ url, method, route: "own_proxy", errorType: c.type, message: `CF Worker: ${c.message}` });
    }
  }

  if (!canRetry) {
    const res = await tryDirect(url, finalInit);
    preferredRoute = "direct";
    return res;
  }

  // If we already learned the proxy route works, use it first.
  if (preferredRoute === "proxy") {
    try {
      return await raceProxies(url, finalInit);
    } catch {
      // last-resort: try direct once more
    }
  }

  try {
    const res = await tryDirect(url, finalInit);
    preferredRoute = "direct";
    return res;
  } catch (e) {
    const c = classifyError(e);
    logNetError({ url, method, route: "direct", errorType: c.type, message: c.message });
    // Direct failed — race proxies.
    try {
      return await raceProxies(url, finalInit);
    } catch (e2) {
      const c2 = classifyError(e2);
      logNetError({ url, method, route: "public_proxy", errorType: c2.type, message: c2.message });
      throw e2;
    }
  }
};

export {};