/**
 * Node.js fallback variant of the Supabase reverse proxy.
 * Use this if you prefer Node over pure Nginx, or want custom logging.
 *
 * Run: SUPABASE_URL=https://xxx.supabase.co PORT=8787 node server.js
 */

const http = require("http");
const https = require("https");
const { URL } = require("url");

const SUPABASE_URL = process.env.SUPABASE_URL || "https://jvibhsjnspvucjwvhfht.supabase.co";
const PORT = parseInt(process.env.PORT || "8787", 10);
const target = new URL(SUPABASE_URL);

const ALLOWED_HEADERS = [
  "authorization",
  "x-client-info",
  "apikey",
  "content-type",
  "x-supabase-api-version",
  "prefer",
  "range",
  "x-supabase-client-platform",
  "x-supabase-client-platform-version",
  "x-supabase-client-runtime",
  "x-supabase-client-runtime-version",
].join(", ");

const setCors = (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", ALLOWED_HEADERS);
  res.setHeader("Access-Control-Expose-Headers", "content-range, x-supabase-api-version");
  res.setHeader("Access-Control-Max-Age", "86400");
};

const server = http.createServer((req, res) => {
  setCors(req, res);

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === "/__proxy_health") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("ok\n");
    return;
  }

  const headers = { ...req.headers, host: target.host };
  const upstream = https.request(
    {
      hostname: target.hostname,
      port: 443,
      path: req.url,
      method: req.method,
      headers,
    },
    (upRes) => {
      const safeHeaders = { ...upRes.headers };
      // Avoid duplicating CORS headers from upstream.
      delete safeHeaders["access-control-allow-origin"];
      res.writeHead(upRes.statusCode || 502, safeHeaders);
      upRes.pipe(res);
    },
  );

  upstream.on("error", (err) => {
    console.error("[proxy error]", req.method, req.url, err.message);
    if (!res.headersSent) {
      res.writeHead(502, { "Content-Type": "application/json" });
    }
    res.end(JSON.stringify({ error: "upstream_error", message: err.message }));
  });

  req.pipe(upstream);
});

server.listen(PORT, () => {
  console.log(`Supabase proxy listening on :${PORT} -> ${SUPABASE_URL}`);
});