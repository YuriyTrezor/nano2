create table if not exists public.network_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid,
  email text,
  url text not null,
  method text not null default 'GET',
  route text,
  error_type text not null,
  status int,
  message text,
  user_agent text,
  region_hint text
);

create index if not exists network_logs_created_at_idx on public.network_logs (created_at desc);
create index if not exists network_logs_user_id_idx on public.network_logs (user_id);

alter table public.network_logs enable row level security;

drop policy if exists "Anyone can insert network logs" on public.network_logs;
create policy "Anyone can insert network logs"
  on public.network_logs
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Admins can view network logs" on public.network_logs;
create policy "Admins can view network logs"
  on public.network_logs
  for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role));

drop policy if exists "Admins can delete network logs" on public.network_logs;
create policy "Admins can delete network logs"
  on public.network_logs
  for delete
  to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role));