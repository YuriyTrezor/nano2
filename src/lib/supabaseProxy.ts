// Routes Supabase traffic through a Deno Deploy proxy
// (close-robin-93.yuriytrezor.deno.net) when the direct Supabase host is
// unreachable — e.g. for users in Russia where *.supabase.co is blocked by RKN.
//
// Strategy:
//   1) On boot, do a fast CORS probe to /auth/v1/health (1.5s budget) that
//      we can actually READ — RKN stubs / DNS poisoning fail this check
//      because they don't return valid CORS headers + JSON.
//   2) If probe succeeds → route DIRECT.
//   3) If probe fails OR ANY runtime fetch/WebSocket to supabase.co fails →
//      automatically install the proxy patch, remember the decision in
//      sessionStorage, and (for fetch) retry the failed request via the
//      proxy so the user doesn't see the error.
//
// The proxy URL is taken from VITE_SUPABASE_PROXY_URL if set, otherwise
// defaults to https://close-robin-93.yuriytrezor.deno.net.

const DIRECT_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? "";
const PROXY_URL =
  (import.meta.env.VITE_SUPABASE_PROXY_URL as string | undefined) ??
  "https://close-robin-93.yuriytrezor.deno.net";

const CACHE_KEY = "sb_route_v2"; // "direct" | "proxy"
const PROBE_TIMEOUT_MS = 1500;

const directHttp = DIRECT_URL.replace(/\/$/, "");
const directWs = directHttp.replace(/^https:/, "wss:").replace(/^http:/, "ws:");
const proxyHttp = PROXY_URL.replace(/\/$/, "");
const proxyWs = proxyHttp.replace(/^https:/, "wss:").replace(/^http:/, "ws:");

const rewriteUrl = (url: string): string => {
  if (!url) return url;
  if (url.startsWith(directHttp)) return proxyHttp + url.slice(directHttp.length);
  if (url.startsWith(directWs)) return proxyWs + url.slice(directWs.length);
  return url;
};

const isSupabaseUrl = (url: string): boolean =>
  !!url && (url.startsWith(directHttp) || url.startsWith(directWs));

let proxyInstalled = false;

const rememberProxy = () => {
  try {
    sessionStorage.setItem(CACHE_KEY, "proxy");
  } catch {
    // ignore
  }
};

const installProxyPatch = (mode: "rewrite" | "failover") => {
  if (proxyInstalled || !directHttp || !proxyHttp) return;
  proxyInstalled = true;

  const originalFetch = window.fetch.bind(window);

  const buildProxyRequest = (
    input: RequestInfo | URL,
    init?: RequestInit
  ): { input: RequestInfo | URL; init?: RequestInit } => {
    if (typeof input === "string") {
      return { input: rewriteUrl(input), init };
    }
    if (input instanceof URL) {
      return { input: rewriteUrl(input.toString()), init };
    }
    if (input instanceof Request) {
      const newUrl = rewriteUrl(input.url);
      if (newUrl !== input.url) {
        return { input: new Request(newUrl, input), init };
      }
    }
    return { input, init };
  };

  const getUrlString = (input: RequestInfo | URL): string => {
    if (typeof input === "string") return input;
    if (input instanceof URL) return input.toString();
    if (input instanceof Request) return input.url;
    return "";
  };

  window.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = getUrlString(input);
    const targetsSupabase = isSupabaseUrl(url);

    if (mode === "rewrite" && targetsSupabase) {
      const proxied = buildProxyRequest(input, init);
      return originalFetch(proxied.input as any, proxied.init);
    }

    // failover mode: try direct first, fall back on network error
    try {
      return await originalFetch(input as any, init);
    } catch (err) {
      if (!targetsSupabase) throw err;
      // network failure to supabase.co → permanently switch to proxy
      rememberProxy();
      const proxied = buildProxyRequest(input, init);
      // eslint-disable-next-line no-console
      console.warn("[supabase-proxy] direct fetch failed, falling back to proxy:", url);
      return originalFetch(proxied.input as any, proxied.init);
    }
  }) as typeof window.fetch;

  // ---- WebSocket (Supabase Realtime) ----
  // We always rewrite WS to the proxy once installed, since WS doesn't have
  // a clean "try then fallback" model — and if HTTP is blocked, WS will be too.
  const OriginalWS = window.WebSocket;
  function PatchedWS(this: any, url: string | URL, protocols?: string | string[]) {
    const u = typeof url === "string" ? url : url.toString();
    const finalUrl = isSupabaseUrl(u) ? rewriteUrl(u) : u;
    return new OriginalWS(finalUrl, protocols as any);
  }
  PatchedWS.prototype = OriginalWS.prototype;
  (PatchedWS as any).CONNECTING = OriginalWS.CONNECTING;
  (PatchedWS as any).OPEN = OriginalWS.OPEN;
  (PatchedWS as any).CLOSING = OriginalWS.CLOSING;
  (PatchedWS as any).CLOSED = OriginalWS.CLOSED;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  window.WebSocket = PatchedWS as any;

  // eslint-disable-next-line no-console
  console.info(`[supabase-proxy] installed (${mode}) → ${proxyHttp}`);
};

// Real CORS probe: must succeed AND return readable JSON/text.
// Anything less (timeout, TCP RST, RKN HTML stub, missing CORS) → proxy.
const probeDirect = async (): Promise<boolean> => {
  if (!directHttp) return true;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
    const resp = await fetch(`${directHttp}/auth/v1/health`, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!resp.ok) return false;
    // /auth/v1/health returns small JSON. RKN stub would be HTML or fail CORS.
    const ct = resp.headers.get("content-type") || "";
    if (!ct.includes("json")) return false;
    return true;
  } catch {
    return false;
  }
};

export const initSupabaseProxy = async (): Promise<void> => {
  if (!directHttp) return;

  let decision: "direct" | "proxy" | null = null;
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached === "direct" || cached === "proxy") decision = cached;
  } catch {
    // ignore
  }

  if (decision === "proxy") {
    installProxyPatch("rewrite");
    return;
  }

  if (decision === "direct") {
    // Trust cached "direct" but still install runtime failover, so a single
    // failed request flips us to proxy without the user reloading.
    installProxyPatch("failover");
    return;
  }

  const ok = await probeDirect();
  if (ok) {
    try {
      sessionStorage.setItem(CACHE_KEY, "direct");
    } catch {
      // ignore
    }
    installProxyPatch("failover");
  } else {
    rememberProxy();
    installProxyPatch("rewrite");
  }
};