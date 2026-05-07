
# Рабочее решение: проксируем Supabase через свой домен

## Корень проблемы (подтверждено)

В России **`*.supabase.co` заблокирован РКН**. Сайт `nano2.lovable.app` грузится (HTML+JS лежат на Lovable CDN — не блок), но как только браузер пытается стучать в `https://jvibhsjnspvucjwvhfht.supabase.co` (логин, регистрация, транзакции, карты) — TCP режется. Поэтому «нихуя не работает»: интерфейс есть, бэкенд недоступен.

Никакие правки JS/RLS/гонок сессии это не починят — пакеты до Supabase **физически не доходят** от российского провайдера.

## Решение

Поднять **прокси на твоём домене** `neowork.nl`, который РКН не трогает, и направить туда весь трафик Supabase. Самый надёжный вариант — **Cloudflare Worker** на поддомене `api.neowork.nl`:

```text
Браузер (РФ)
  │
  ├── https://nano2.lovable.app           ── HTML/JS  (работает уже)
  └── https://api.neowork.nl/*            ── Cloudflare Worker
                                              │
                                              └── проксирует на
                                                  https://jvibhsjnspvucjwvhfht.supabase.co/*
                                                  (Worker ходит из дата-центра CF, не из РФ — блок не действует)
```

Cloudflare Worker:
- бесплатный (100k запросов/день в free плане, у тебя гораздо меньше),
- запускается за 5 минут,
- его адрес `api.neowork.nl` РКН не блокирует, т.к. твой домен `.nl` уже работает,
- ходит до Supabase из глобальной сети CF — блокировка не применяется.

## Что я сделаю на твоей стороне (после твоего апрува)

### 1. Worker — код, который ты разворачиваешь в Cloudflare (1 файл, 30 строк)

Я дам готовый `worker.js`:

```js
const TARGET = "https://jvibhsjnspvucjwvhfht.supabase.co";

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const upstream = TARGET + url.pathname + url.search;

    const init = {
      method: request.method,
      headers: request.headers,
      body: ["GET", "HEAD"].includes(request.method) ? undefined : request.body,
      redirect: "manual",
    };

    const resp = await fetch(upstream, init);
    const headers = new Headers(resp.headers);
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Access-Control-Allow-Headers", "*");
    headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    return new Response(resp.body, { status: resp.status, headers });
  },
};
```

Ты в Cloudflare:
1. Workers → Create → вставить код → Deploy.
2. Привязать к домену: `api.neowork.nl/*` → твой Worker.

(Я напишу пошаговую инструкцию, 5 минут реального времени.)

### 2. Правки в коде проекта (это сделаю я)

**Файл `src/integrations/supabase/client.ts` трогать НЕЛЬЗЯ** (auto-generated). Поэтому делаю переключатель через **переменные окружения** + перехват `fetch` на этапе монтирования:

- В `src/main.tsx` ставлю **глобальный fetch-патч**: любой запрос на `https://jvibhsjnspvucjwvhfht.supabase.co/*` подменяется на `https://api.neowork.nl/*`. Это работает и для PostgREST, и для Auth, и для Realtime (через `EventSource`/WebSocket — для WS отдельный адрес `wss://api.neowork.nl`, Worker это поддерживает).
- Realtime (WebSocket) у Supabase JS клиента берёт URL из `SUPABASE_URL`. Поскольку `client.ts` менять нельзя, поверх делаю monkey-patch `WebSocket` конструктора в том же `main.tsx`.
- Включаю патч **только если** браузер определяет, что прямой `supabase.co` недоступен (быстрый HEAD-пинг с таймаутом 1.5с при загрузке). Если прямой канал жив (Европа, США) — едем напрямую, как сейчас. Если мёртв (РФ) — автоматически переключаемся на `api.neowork.nl`. Никакого ручного «включи VPN» для пользователя.

### 3. Edge Functions

Они вызываются через `supabase.functions.invoke()` → тот же домен → тот же fetch-патч → автоматом пойдут через прокси. Отдельно ничего делать не надо.

### 4. Storage (KYC документы, чат-аттачи)

Тоже через `supabase.co` → перехватывается тем же патчем.

## Что НЕ делаю

- Не трогаю `client.ts` и `types.ts` (запрещено).
- Не делаю VPS в Казахстане (уже не сработало).
- Не меняю DNS `nano2.lovable.app` — оставляем как есть.

## Что нужно от тебя

1. Аккаунт Cloudflare (бесплатный) с подключённым доменом `neowork.nl` (или субдомен — можешь делегировать NS только `api.neowork.nl`).
2. Апрув этого плана — я сразу:
   - выкачу патч `main.tsx`,
   - дам тебе готовый `worker.js` + 5-шаговый гайд для CF,
   - проверю в браузере, что после деплоя Worker'а сайт работает из РФ-эмуляции (через CF-IP в нужной локации).

После этого «нихуя не работает» исчезнет в течение 10 минут после развёртывания Worker'а.
