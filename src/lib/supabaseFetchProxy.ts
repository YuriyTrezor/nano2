/**
 * Fetch fallback for regions where Supabase API (*.supabase.co) is blocked,
 * e.g. Russia, where many ISPs block Supabase domains and users see
 * "Failed to fetch" / "TypeError: Load failed" on auth and REST calls.
 *
 * Strategy: monkey-patch window.fetch. For requests that target the
 * Supabase URL, try the direct call first; if it fails with a network
 * error (no response received), retry through a public CORS proxy.
 *
 * Headers are preserved (Authorization, apikey, etc.), so RLS and auth
 * keep working transparently.
 */

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? "";

// Public CORS proxies that simply forward the request, including headers
// and method. We try them in order; the first one that returns a response
// wins. These are community-run mirrors — fine as a regional fallback.
const PROXIES = [
  // corsproxy.io passes through method, headers and body
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  // allorigins as a secondary fallback (raw passthrough)
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
];

let proxyMode = false; // once a proxy works, stick with it for the session

const isSupabaseUrl = (url: string) => {
  if (!SUPABASE_URL) return false;
  return url.startsWith(SUPABASE_URL);
};

const isNetworkError = (err: unknown) => {
  if (!(err instanceof TypeError)) return false;
  const msg = err.message || "";
  return /failed to fetch|load failed|networkerror|fetch failed/i.test(msg);
};

const tryProxies = async (input: string, init?: RequestInit) => {
  let lastErr: unknown = new Error("All proxies failed");
  for (const build of PROXIES) {
    try {
      const proxied = build(input);
      const res = await originalFetch(proxied, init);
      if (res.ok || (res.status >= 200 && res.status < 500)) {
        proxyMode = true;
        return res;
      }
      lastErr = new Error(`Proxy returned ${res.status}`);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
};

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

  // Merge init from Request object if needed
  let finalInit = init;
  if (input instanceof Request && !init) {
    finalInit = {
      method: input.method,
      headers: input.headers,
      body: input.method !== "GET" && input.method !== "HEAD" ? await input.clone().arrayBuffer() : undefined,
      credentials: input.credentials,
      mode: input.mode,
    };
  }

  // If we already know the direct route is blocked, go straight to proxy
  if (proxyMode) {
    try {
      return await tryProxies(url, finalInit);
    } catch {
      // fall through to direct as a last resort
    }
  }

  try {
    return await originalFetch(url, finalInit);
  } catch (err) {
    if (isNetworkError(err)) {
      // Likely blocked by ISP (RU). Try CORS proxies.
      return tryProxies(url, finalInit);
    }
    throw err;
  }
};

export {};
