// Routes backend traffic around regional blocks.
//
// Key fixes:
//   1) The direct health probe now includes the publishable key, so a healthy
//      backend is no longer misclassified as "blocked" because of 401.
//   2) We no longer default to the dead Deno Deploy proxy.
//   3) We can fail over to multiple proxy targets: explicit env, same-origin
//      Cloudflare Worker path (/__supabase), api.<domain>, or api.neowork.nl.

const DIRECT_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? "";
const PUBLISHABLE_KEY =
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ?? "";
const ENV_PROXY_URL =
  (import.meta.env.VITE_SUPABASE_PROXY_URL as string | undefined) ?? "";

const CACHE_KEY = "sb_route_v3";
const PROBE_TIMEOUT_MS = 1800;

const directHttp = DIRECT_URL.replace(/\/$/, "");
const directWs = directHttp.replace(/^https:/, "wss:").replace(/^http:/, "ws:");

let proxyInstalled = false;
let activeProxyBase: string | null = null;

const toWsBase = (base: string) =>
  base.replace(/^https:/, "wss:").replace(/^http:/, "ws:").replace(/\/$/, "");

const normalizeBase = (base: string | null | undefined) =>
  (base ?? "").trim().replace(/\/$/, "");

const isSupabaseUrl = (url: string): boolean =>
  !!url && (url.startsWith(directHttp) || url.startsWith(directWs));

const getUrlString = (input: RequestInfo | URL): string => {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  if (input instanceof Request) return input.url;
  return "";
};

const rewriteUrlWithBase = (url: string, proxyBase: string): string => {
  const httpBase = normalizeBase(proxyBase);
  const wsBase = toWsBase(httpBase);

  if (!url) return url;
  if (url.startsWith(directHttp)) return httpBase + url.slice(directHttp.length);
  if (url.startsWith(directWs)) return wsBase + url.slice(directWs.length);
  return url;
};

const buildProxyRequest = (
  proxyBase: string,
  input: RequestInfo | URL,
  init?: RequestInit
): { input: RequestInfo | URL; init?: RequestInit } => {
  if (typeof input === "string") {
    return { input: rewriteUrlWithBase(input, proxyBase), init };
  }
  if (input instanceof URL) {
    return { input: rewriteUrlWithBase(input.toString(), proxyBase), init };
  }
  if (input instanceof Request) {
    const rewrittenUrl = rewriteUrlWithBase(input.url, proxyBase);
    if (rewrittenUrl !== input.url) {
      return { input: new Request(rewrittenUrl, input), init };
    }
  }
  return { input, init };
};

const rememberDecision = (value: string) => {
  try {
    sessionStorage.setItem(CACHE_KEY, value);
  } catch {
    // ignore
  }
};

const rememberDirect = () => rememberDecision("direct");

const rememberProxy = (base: string) => {
  rememberDecision(`proxy:${normalizeBase(base)}`);
};

const getProxyCandidates = (): string[] => {
  const candidates = new Set<string>();
  const addCandidate = (value?: string | null) => {
    const normalized = normalizeBase(value);
    if (!normalized || normalized === directHttp) return;
    candidates.add(normalized);
  };

  addCandidate(ENV_PROXY_URL);

  // Cloudflare Worker (full-site + /__supabase backend) — основной прокси для РФ.
  addCandidate("https://black-glitter-a2e2.andreyromanov20265.workers.dev/__supabase");

  if (typeof window !== "undefined") {
    const origin = normalizeBase(window.location.origin);
    const hostname = window.location.hostname;
    const apexHost = hostname.replace(/^www\./, "");

    if (origin && origin !== directHttp) {
      addCandidate(`${origin}/__supabase`);
    }

    if (apexHost && !/lovable\.app$/i.test(apexHost) && !/supabase\.co$/i.test(apexHost)) {
      addCandidate(`https://api.${apexHost}`);
    }
  }

  addCandidate("https://api.neowork.nl");

  return Array.from(candidates);
};

const probeEndpoint = async (base: string): Promise<boolean> => {
  const target = normalizeBase(base);
  if (!target) return false;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
    const resp = await fetch(`${target}/auth/v1/health`, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
      headers: PUBLISHABLE_KEY ? { apikey: PUBLISHABLE_KEY } : undefined,
    });
    clearTimeout(timer);

    const contentType = (resp.headers.get("content-type") || "").toLowerCase();
    const text = await resp.text();

    if (resp.status >= 500) return false;
    if (!contentType.includes("json") && !/^\s*[\[{]/.test(text)) return false;
    return true;
  } catch {
    return false;
  }
};

const resolveWorkingProxy = async (): Promise<string | null> => {
  for (const candidate of getProxyCandidates()) {
    const ok = await probeEndpoint(candidate);
    if (ok) {
      return candidate;
    }
  }

  return null;
};

const setActiveProxy = (proxyBase: string | null) => {
  activeProxyBase = proxyBase ? normalizeBase(proxyBase) : null;
  if (activeProxyBase) {
    rememberProxy(activeProxyBase);
    // eslint-disable-next-line no-console
    console.info(`[supabase-proxy] active proxy → ${activeProxyBase}`);
  }
};

const ensureActiveProxy = async (): Promise<string | null> => {
  if (activeProxyBase) return activeProxyBase;
  const resolved = await resolveWorkingProxy();
  if (resolved) {
    setActiveProxy(resolved);
  }
  return resolved;
};

const installProxyPatch = () => {
  if (proxyInstalled || !directHttp) return;
  proxyInstalled = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = getUrlString(input);
    const targetsSupabase = isSupabaseUrl(url);

    if (targetsSupabase && activeProxyBase) {
      const proxied = buildProxyRequest(activeProxyBase, input, init);
      return originalFetch(proxied.input as RequestInfo | URL, proxied.init);
    }

    try {
      return await originalFetch(input as RequestInfo | URL, init);
    } catch (err) {
      if (!targetsSupabase) throw err;

      const proxyBase = await ensureActiveProxy();
      if (!proxyBase) throw err;

      const proxied = buildProxyRequest(proxyBase, input, init);
      // eslint-disable-next-line no-console
      console.warn("[supabase-proxy] direct fetch failed, falling back to proxy:", url, "→", proxyBase);
      return originalFetch(proxied.input as RequestInfo | URL, proxied.init);
    }
  }) as typeof window.fetch;

  const OriginalWS = window.WebSocket;
  function PatchedWS(this: WebSocket, url: string | URL, protocols?: string | string[]) {
    const rawUrl = typeof url === "string" ? url : url.toString();
    const finalUrl = activeProxyBase && isSupabaseUrl(rawUrl)
      ? rewriteUrlWithBase(rawUrl, activeProxyBase)
      : rawUrl;
    return new OriginalWS(finalUrl, protocols as string | string[] | undefined);
  }

  PatchedWS.prototype = OriginalWS.prototype;
  const PatchedWSAny = PatchedWS as any;
  PatchedWSAny.CONNECTING = OriginalWS.CONNECTING;
  PatchedWSAny.OPEN = OriginalWS.OPEN;
  PatchedWSAny.CLOSING = OriginalWS.CLOSING;
  PatchedWSAny.CLOSED = OriginalWS.CLOSED;
  window.WebSocket = PatchedWSAny as typeof WebSocket;
};

export const initSupabaseProxy = async (): Promise<void> => {
  if (!directHttp) return;

  let cachedDecision: string | null = null;
  try {
    cachedDecision = sessionStorage.getItem(CACHE_KEY);
  } catch {
    // ignore
  }

  if (cachedDecision?.startsWith("proxy:")) {
    setActiveProxy(cachedDecision.slice("proxy:".length));
    installProxyPatch();
    return;
  }

  installProxyPatch();

  if (cachedDecision === "direct") {
    return;
  }

  const directOk = await probeEndpoint(directHttp);
  if (directOk) {
    rememberDirect();
    return;
  }

  const proxyBase = await resolveWorkingProxy();
  if (proxyBase) {
    setActiveProxy(proxyBase);
    return;
  }

  rememberDirect();
};