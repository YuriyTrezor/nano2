/**
 * Multi-proxy fetch fallback for Supabase requests.
 *
 * Why: in some regions (notably RU) ISPs block *.supabase.co directly,
 * and even some popular CORS proxies are blocked too. So we:
 *   1. Race the direct request against a short timeout.
 *   2. If it fails / times out, race ALL known CORS proxies in parallel
 *      — whichever responds first wins.
 *   3. Remember the winning route for the rest of the session to avoid
 *      paying the timeout penalty on every call.
 *
 * All original headers (Authorization, apikey, content-type, ...) are
 * preserved, so Supabase auth + RLS keep working transparently.
 */

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? "";

// Public CORS proxies that forward method, headers and body.
// Order doesn't matter much — we race them in parallel.
const PROXIES: Array<(url: string) => string> = [
  (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(url)}`,
  (url) => `https://cors.eu.org/${url}`,
  (url) => `https://proxy.cors.sh/${url}`,
];

// Once we know the direct route works (or doesn't), remember it.
type Route = "direct" | "proxy";
let preferredRoute: Route | null = null;

// Direct-call timeout. Real Supabase responses usually return well under
// 2s; if we wait longer it's almost certainly a block.
const DIRECT_TIMEOUT_MS = 3500;

const originalFetch = window.fetch.bind(window);

const isSupabaseUrl = (url: string) => !!SUPABASE_URL && url.startsWith(SUPABASE_URL);

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
    const res = await originalFetch(proxied, proxyInit);
    // Treat 5xx from the proxy itself as a failure so another proxy can win.
    if (res.status >= 500) throw new Error(`proxy ${i} -> ${res.status}`);
    return { res, i };
  });

  try {
    const winner = await Promise.any(attempts);
    // Cancel losers
    controllers.forEach((c, idx) => {
      if (idx !== winner.i) c.abort();
    });
    preferredRoute = "proxy";
    return winner.res;
  } catch (err) {
    // AggregateError -> all proxies failed
    throw new Error(
      "All Supabase fallbacks failed. Likely a network block. " +
        (err instanceof Error ? err.message : String(err)),
    );
  }
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
  } catch {
    // Direct failed (timeout, DNS block, TLS, CORS, anything) — race proxies.
    return raceProxies(url, finalInit);
  }
};

export {};