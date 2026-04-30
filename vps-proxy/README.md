# Stable Supabase proxy for users in restricted regions (RU)

This folder contains a **production-ready** reverse-proxy you deploy on
any cheap Linux VPS (Selectel, Timeweb, Beget, reg.ru, ...). It forwards
`https://<your-domain>/...` straight to your Supabase project, preserving
all headers (Authorization, apikey, etc.) and CORS — so the frontend
keeps working even when `*.supabase.co` is blocked by the user's ISP.

You get **two equivalent options** — pick the one you're comfortable with.

## Option A — Pure Nginx (recommended, fastest, zero deps)

1. Rent any small VPS in Russia/EU. Minimum specs: 1 vCPU, 1 GB RAM.
2. Point an A-record `ru-api.neowork.nl` at the VPS IP.
3. SSH in and run:

```bash
sudo apt update && sudo apt install -y nginx certbot python3-certbot-nginx
sudo cp nginx.conf /etc/nginx/sites-available/supabase-proxy
sudo ln -s /etc/nginx/sites-available/supabase-proxy /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d ru-api.neowork.nl --non-interactive --agree-tos -m you@example.com
```

Done. Test:

```bash
curl -i https://ru-api.neowork.nl/auth/v1/health
```

You should get `200 OK` with Supabase JSON.

## Option B — Node.js + Express (use if you want custom logging)

```bash
sudo apt update && sudo apt install -y nodejs npm nginx certbot python3-certbot-nginx
cd /opt && sudo git clone <your-repo> app && cd app/vps-proxy
sudo npm i --omit=dev
sudo cp systemd.service /etc/systemd/system/supabase-proxy.service
sudo systemctl daemon-reload
sudo systemctl enable --now supabase-proxy
# Then put nginx in front for SSL (use the same nginx.conf but
# proxy_pass http://127.0.0.1:8787 instead of the Supabase URL).
```

## Wire it up to the frontend

Once the proxy responds at `https://ru-api.neowork.nl/auth/v1/health`,
set the build-time variable in Lovable:

```
VITE_API_PROXY_ORIGIN = https://ru-api.neowork.nl
```

(Project Settings → Environment variables.) Republish — the frontend
will route every Supabase call through your VPS first, with automatic
fallback to direct Supabase if the VPS is ever down.

## What the frontend does, in order

1. `VITE_API_PROXY_ORIGIN` (your VPS) — 5s timeout.
2. Direct `*.supabase.co` — fallback.
3. Public CORS proxies — last resort.

Every failure is logged to the `network_logs` table — visible in the
admin panel under "Сетевые ошибки".