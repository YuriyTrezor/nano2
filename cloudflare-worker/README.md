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

---

## Полное решение для РФ: проксировать не только API, но и весь сайт

Если у клиентов из РФ не открывается **сам сайт**, а не только вход, одного
API-прокси недостаточно. В этом случае используй файл
`full-site-worker.js` из этой папки.

### Что он делает

- весь фронтенд проксирует на `https://nano2.lovable.app`
- backend проксирует через путь `https://<ваш-домен>/__supabase/*`
- браузер пользователя работает через **один доступный домен**, без прямых
  запросов к `*.supabase.co`

### Как развернуть

1. В Cloudflare Workers создай новый Worker.
2. Вставь код из `full-site-worker.js`.
3. Привяжи к **новому чистому домену или поддомену**, например:
   - `app.<ваш-домен>.com`
   - `bank.<ваш-домен>.com`
   - `cabinet.<ваш-домен>.app`
4. Открой этот домен — сайт должен открываться уже через Worker.
5. Вход и кабинет будут использовать путь `/__supabase` автоматически.

### Когда это лучший вариант

- `neowork.nl` открывается не у всех или нестабилен в РФ
- меняли домены, а проблема остаётся
- нужен один рабочий адрес и для сайта, и для личного кабинета

### Важно

Если **сам домен** уже блокируется у провайдеров РФ, Worker на этом же домене
не спасёт. Тогда нужен **новый домен/поддомен**, который будет указывать на
этот Worker.