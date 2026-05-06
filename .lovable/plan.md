# Починка «Нет операций» в кабинете

## Что подтверждено диагностикой

- В БД у `olegkarygow4@gmail.com` (user_id `71a44c06…`) **9 транзакций**, последняя сегодня в 09:44 МСК.
- RLS-политики на `transactions` корректные: `auth.uid() = user_id`.
- В коде нет фильтра, который бы скрывал транзакции при `document_requested = true`.
- Auth-логи показывают успешный логин клиента (status 200) с IP `5.45.94.85` (РФ, через `neoplace.nl`).

Вывод: запрос `select * from transactions` уходит **до того, как Supabase JS клиент успел подставить JWT в заголовок**. PostgREST + RLS отдаёт пустой массив (без ошибки!), фронт ставит `transactions = []` и больше никогда не перезапрашивает. На быстром канале это незаметно, на медленном русском — стабильно ломается.

То же самое уже описано в нашей базе знаний (см. `useAuthReady` паттерн).

## Что меняется

### 1. `src/lib/fetchAllUserTransactions.ts` — добавить guard и retry

Перед запросом:
- если переданный `userId` пустой — вернуть `[]` без вызова сети;
- если первый запрос вернул `0` строк, но сессии **ещё не было** в момент вызова, подождать `supabase.auth.getSession()` и сделать **один повтор**.

### 2. `OverviewTab.tsx` и `TransfersTab.tsx` — ждать готовности сессии

Сейчас оба `useEffect` стартуют по `user` из `useAuth()`. Но `user` приходит из `applySession`, а сам Supabase-клиент в момент монтирования ещё может не иметь живого `access_token` в `localStorage` (особенно сразу после логина / refresh). Делаем:

- Добавить в `AuthContext` флаг `sessionReady: boolean` — становится `true` только после первого успешного `getSession()` *с* непустым `access_token` (или подтверждённого «гостя»).
- В `OverviewTab` и `TransfersTab` `useEffect` зависит от `[user, sessionReady]` и не дёргает запрос пока `sessionReady === false`.

### 3. Realtime-подписка на `transactions` (опционально, но добавлю)

Сейчас, если админ создаёт операцию, клиент видит её только после ручного refresh. Подписываем Overview/Transfers на изменения своей строки в `transactions` через `postgres_changes`. Это бесплатный бонус и заодно автоматически закрывает кейс «зашёл, увидел пусто из-за гонки» — подписка перезапросит данные.

Для этого нужно одной миграцией включить realtime-публикацию:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
ALTER TABLE public.transactions REPLICA IDENTITY FULL;
```

### 4. Диагностический лог (временно)

В `fetchAllUserTransactions` логировать в `network_logs` случай «сессия есть, запрос успешен, но 0 строк при ожидаемых >0». Так через сутки увидим, остались ли затронутые клиенты.

## Чего НЕ делаю

- Не трогаю RLS — они корректные.
- Не трогаю VPS / DNS / Timeweb — это не сетевая проблема, а гонка в JS.
- Не меняю `supabase/client.ts` (запрещено).

## Технические детали

```text
AuthProvider
  ├─ getSession() ──► applySession(session)
  │                    ├─ setUser(session.user)
  │                    └─ setSessionReady(true)   ← новое
  │
OverviewTab.useEffect([user, sessionReady])
  └─ if (!user || !sessionReady) return;
     fetchAllUserTransactions(user.id) ──► 9 строк ✓
```

После одобрения внесу правки в 4 файла + 1 миграция.
