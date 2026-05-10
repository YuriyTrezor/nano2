// Routes Supabase traffic through a Deno Deploy proxy
// (close-robin-93.yuriytrezor.deno.net) when the direct Supabase host is
// unreachable — e.g. for users in Russia where *.supabase.co is blocked by RKN.
//
// Strategy:
//   1) On boot, do a fast HEAD probe to the direct Supabase host (1.2s budget).
//   2) If it succeeds → route DIRECT (fastest path, no proxy).
//   3) If it fails (timeout / network / CORS-network) → route through PROXY
//      by monkey-patching window.fetch and window.WebSocket so that any URL
//      starting with the Supabase host is rewritten to the proxy host.
//   4) Decision is cached in sessionStorage so we probe at most once per tab.
//
// The proxy URL is taken from VITE_SUPABASE_PROXY_URL if set, otherwise
// defaults to https://close-robin-93.yuriytrezor.deno.net.

const DIRECT_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? "";
const PROXY_URL =
  (import.meta.env.VITE_SUPABASE_PROXY_URL as string | undefined) ??
  "https://close-robin-93.yuriytrezor.deno.net";

const CACHE_KEY = "sb_route_v1"; // "direct" | "proxy"
const PROBE_TIMEOUT_MS = 1200;

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

const installProxyPatch = () => {
  if (!directHttp || !proxyHttp) return;

  // ---- fetch ----
  const originalFetch = window.fetch.bind(window);
  window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    try {
      if (typeof input === "string") {
        return originalFetch(rewriteUrl(input), init);
      }
      if (input instanceof URL) {
        return originalFetch(rewriteUrl(input.toString()), init);
      }
      if (input instanceof Request) {
        const newUrl = rewriteUrl(input.url);
        if (newUrl !== input.url) {
          return originalFetch(new Request(newUrl, input), init);
        }
      }
    } catch {
      // fall through to original
    }
    return originalFetch(input as any, init);
  }) as typeof window.fetch;

  // ---- WebSocket (Supabase Realtime) ----
  const OriginalWS = window.WebSocket;
  function PatchedWS(this: any, url: string | URL, protocols?: string | string[]) {
    const finalUrl = rewriteUrl(typeof url === "string" ? url : url.toString());
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
  console.info("[supabase-proxy] routing via", proxyHttp);
};

const probeDirect = async (): Promise<boolean> => {
  if (!directHttp) return true;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
    // /auth/v1/health is public and very small. no-cors lets us detect
    // network reachability even if CORS would normally block reading.
    await fetch(`${directHttp}/auth/v1/health`, {
      method: "GET",
      mode: "no-cors",
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timer);
    return true;
  } catch {
    return false;
  }
};

export const initSupabaseProxy = async (): Promise<void> => {
  if (!directHttp) return;

  // Cached decision from previous page in this tab.
  let decision: "direct" | "proxy" | null = null;
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached === "direct" || cached === "proxy") decision = cached;
  } catch {
    // ignore
  }

  if (!decision) {
    const ok = await probeDirect();
    decision = ok ? "direct" : "proxy";
    try {
      sessionStorage.setItem(CACHE_KEY, decision);
    } catch {
      // ignore
    }
  }

  if (decision === "proxy") {
    installProxyPatch();
  }
};