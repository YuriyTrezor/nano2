# Deno Deploy — единственный прокси для РФ (без VPS Казахстан)

## Зачем

Уходим от схемы `neowork.nl → 38.180.37.25 (KZ VPS) → Lovable`.
Один Deno-воркер раздаёт и фронт, и Supabase через один домен
`*.deno.dev`, который в РФ не блокируется и не зависит от чужого VPS.

## Развёртывание (3 минуты)

1. Открой https://dash.deno.com → **New Project** → **Playground**.
2. Удали дефолтный код, вставь полностью `main.ts` из этой папки.
3. Нажми **Save & Deploy**. Получишь адрес вида
   `https://<project>.deno.dev`.
4. Открой `https://<project>.deno.dev` — должен открыться сайт.
5. Проверь бэк:
   ```
   curl -i https://<project>.deno.dev/__supabase/auth/v1/health
   ```
   Должен прийти JSON, статус 200.

## Подключение к фронту

В Lovable env переменных задай:

```
VITE_SUPABASE_PROXY_URL = https://<project>.deno.dev/__supabase
```

После публикации фронт автоматически начнёт переключаться на этот
прокси, если прямой `supabase.co` недоступен (РФ).

## (Опц.) свой домен

В DNS `neowork.nl`:
- удали A-запись `185.158.133.1 / 38.180.37.25`,
- поставь CNAME на `<project>.deno.dev`.

Тогда клиенты ходят на `neowork.nl`, но трафик идёт через Deno, без
казахстанского VPS вообще.