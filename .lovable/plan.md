## Цель

Вернуть проект к простой схеме: `Пользователь → neoplace.nl → Lovable → Supabase` напрямую, без посредников.

## Что удаляю из кода

1. **`src/lib/supabaseFetchProxy.ts`** — удалить файл полностью. Это monkey-patch для `window.fetch`, `WebSocket` и `XMLHttpRequest`, который перенаправлял запросы на VPS `92.53.96.132:3001`. Сейчас он по умолчанию выключен, но сам факт его наличия + код переопределения глобалов — лишний риск.

2. **`src/main.tsx`** — убрать строку:
   ```ts
   import "./lib/supabaseFetchProxy";
   ```
   Остальную логику (очистка service worker / caches / legacy auth keys) оставляю — она полезна, чтобы у пользователей со старым кэшем всё корректно сбросилось при следующем заходе.

3. **`vps-proxy/`** — удалить папку целиком (`README.md`, `nginx.conf`, `package.json`, `server.js`, `systemd.service`).

4. **`cloudflare-worker/`** — удалить папку целиком (`worker.js`).

## Что НЕ трогаю

- **`src/integrations/supabase/client.ts`** — уже использует прямое подключение через `VITE_SUPABASE_URL`. Менять нечего.
- **`public/sw.js`** — оставляю как есть. Это «kill-switch» service worker, который сам себя удаляет и чистит кэши у пользователей, у которых висит старая версия. Полезен ещё какое-то время.
- **`src/lib/networkLogger.ts`** — общая утилита логирования сетевых ошибок, не связана только с прокси.
- **`src/main.tsx`** в части SW/cache cleanup — оставляю.

## Итоговая схема после правок

```text
Пользователь → neoplace.nl (Squarespace DNS)
            → Lovable (185.158.133.1)
            → Supabase (jvibhsjnspvucjwvhfht.supabase.co) напрямую
```

Никакого VPS, никакого Cloudflare Worker, никакого `?proxy=1`.

## Что нужно сделать тебе вручную (вне кода)

Эти шаги я выполнить не могу — они в твоих внешних кабинетах:

1. **Cloudflare**: удалить Worker `supabase-proxy` и custom domain `api.neowork.nl` (или просто отключить домен от Cloudflare целиком, если он больше не нужен).
2. **Lovable → Domains**: убедиться, что подключён только `neoplace.nl` (и `www.neoplace.nl`). Если висит `neowork.nl` — отключить.
3. **Timeweb VPS (92.53.96.132)**: можно гасить — он в схеме больше не участвует.
4. **Squarespace DNS для neoplace.nl**: ничего менять не нужно — он уже корректно указывает на Lovable.

## Проверка после деплоя

1. Открыть https://neoplace.nl — должен загрузиться сайт.
2. Войти в кабинет — авторизация должна работать.
3. В DevTools → Network: запросы должны идти на `jvibhsjnspvucjwvhfht.supabase.co` напрямую, без `92.53.96.132` и без `api.neowork.nl`.
4. В Console не должно быть строки `[fetchProxy] PROXY ON` или `[fetchProxy] direct mode`.
5. Сделать любую правку через Lovable — проверить, что обновление прилетает в реальном времени на neoplace.nl.
6. Отдельно (когда будут реальные жалобы): проверить, заходит ли сайт из РФ без VPN. Если массовых жалоб нет — VPS-прокси и не нужен.

После твоего «да» переключусь в рабочий режим и сделаю все четыре правки одним заходом.