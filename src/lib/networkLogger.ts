/**
 * Logs network failures (timeout / CORS / failed POST / non-2xx) both to
 * the browser console (with a clear category) and to the `network_logs`
 * table in Lovable Cloud, so the admin can see real-world issues from
 * users in restricted regions.
 *
 * Best-effort only — never throws, never blocks the actual request.
 */

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? "";
const SUPABASE_KEY =
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ?? "";

export type NetErrorType =
  | "timeout"
  | "network"
  | "cors"
  | "http_error"
  | "other";

export interface NetLogPayload {
  url: string;
  method: string;
  route: "own_proxy" | "direct" | "public_proxy" | "unknown";
  errorType: NetErrorType;
  status?: number;
  message?: string;
}

const regionHint = () => {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const lang = navigator.language;
    return `${tz} | ${lang}`;
  } catch {
    return "";
  }
};

let lastSentAt = 0;
const MIN_INTERVAL_MS = 1500; // crude rate-limit

export const logNetError = (p: NetLogPayload) => {
  // 1) console — always
  // eslint-disable-next-line no-console
  console.error(`[net:${p.errorType}]`, p.method, p.url, {
    route: p.route,
    status: p.status,
    message: p.message,
  });

  // 2) DB — best-effort, fire-and-forget
  if (!SUPABASE_URL || !SUPABASE_KEY) return;
  const now = Date.now();
  if (now - lastSentAt < MIN_INTERVAL_MS) return;
  lastSentAt = now;

  const body = [
    {
      url: p.url.slice(0, 500),
      method: p.method,
      route: p.route,
      error_type: p.errorType,
      status: p.status ?? null,
      message: (p.message ?? "").slice(0, 500),
      user_agent: navigator.userAgent.slice(0, 300),
      region_hint: regionHint().slice(0, 100),
    },
  ];

  try {
    // Use the bare global fetch to avoid recursion through our proxy.
    void fetch(`${SUPABASE_URL}/rest/v1/network_logs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify(body),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // ignore
  }
};

export const classifyError = (err: unknown): { type: NetErrorType; message: string } => {
  const msg = err instanceof Error ? err.message : String(err);
  if (/abort|timeout/i.test(msg)) return { type: "timeout", message: msg };
  if (/cors/i.test(msg)) return { type: "cors", message: msg };
  if (/failed to fetch|networkerror|load failed/i.test(msg))
    return { type: "network", message: msg };
  return { type: "other", message: msg };
};