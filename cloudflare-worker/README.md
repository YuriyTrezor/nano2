# Cloudflare Worker — обход блокировки Supabase в РФ

## Зачем

`*.supabase.co` заблокирован Роскомнадзором. Этот Worker принимает
запросы на `api.neowork.nl` и форвардит их в Supabase из дата-центра
Cloudflare (CF не из РФ → блок не действует). Фронтенд автоматически
определяет блокировку и переключается на этот прокси.

## Развёртывание (5 минут)

1. Зайди в https://dash.cloudflare.com → **Workers & Pages** → **Create application** → **Create Worker**.
2. Назови, например, `supabase-proxy`. Нажми **Deploy** (с дефолтным «Hello World»).
3. Открой Worker → **Edit code**. Удали всё, вставь содержимое `worker.js` из этой папки. Нажми **Save and Deploy**.
4. В Worker → **Settings** → **Triggers** → **Custom Domains** → **Add Custom Domain** → введи `api.neowork.nl`. CF сам создаст DNS-запись (домен `neowork.nl` должен быть на Cloudflare-неймсерверах).
    - Если домен не на CF NS, используй **Routes** вместо Custom Domain: добавь route `api.neowork.nl/*` и в DNS своего регистратора создай CNAME `api` → `<имя-воркера>.workers.dev`.
5. Готово. Проверь:
    ```
    curl -i https://api.neowork.nl/auth/v1/health
    # должно вернуть JSON от Supabase, статус 200
    ```

## Как фронт использует прокси

`src/lib/supabaseProxy.ts` при загрузке делает HEAD на
`https://jvibhsjnspvucjwvhfht.supabase.co/auth/v1/health` с таймаутом
1.2с. Если запрос упал — патчит `window.fetch` и `window.WebSocket`
так, что любой URL `https://jvibhsjnspvucjwvhfht.supabase.co/*`
автоматически переписывается в `https://api.neowork.nl/*`. Решение
кешируется в `sessionStorage`, чтобы не пинговать каждый клик.

Если хочешь сменить адрес прокси — задай в Lovable env переменную
`VITE_SUPABASE_PROXY_URL`. Если не задана, используется
`https://api.neowork.nl`.