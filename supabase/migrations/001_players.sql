-- Plantel Zipaquirá F.C. — tabla base
-- Ejecutar en Supabase → SQL Editor (una vez)

create table if not exists public.players (
  id              uuid primary key default gen_random_uuid(),
  full_name       text not null,
  jersey_number   smallint not null,
  position        text not null check (position in ('GK', 'DF', 'MF', 'FW')),
  position_detail text,
  photo_url       text,
  is_active       boolean not null default true,
  sort_order      smallint not null default 0,
  created_at      timestamptz not null default now(),
  unique (jersey_number)
);

create index if not exists players_position_idx on public.players (position);
create index if not exists players_active_idx on public.players (is_active) where is_active = true;

alter table public.players enable row level security;

-- Lectura pública del plantel
create policy "Plantel visible para todos"
  on public.players
  for select
  to anon, authenticated
  using (true);

-- Escritura solo vía service role (dashboard / API admin)
-- No policy de insert/update/delete para anon/authenticated

comment on table public.players is 'Plantel completo del club (36 jugadores).';
