-- Partidos — Zipaquirá F.C.
-- Ejecutar en Supabase → SQL Editor (después de 001_players.sql)

create table if not exists public.matches (
  id              uuid primary key default gen_random_uuid(),
  opponent        text not null,
  match_date      date not null,
  kickoff_time    time,
  venue           text not null,
  competition     text not null,
  is_home         boolean not null default false,
  goals_for       smallint check (goals_for is null or goals_for >= 0),
  goals_against   smallint check (goals_against is null or goals_against >= 0),
  formation       text not null default '4-3-3',
  status          text not null default 'scheduled'
    check (status in ('scheduled', 'played', 'cancelled')),
  slug            text not null unique,
  created_at      timestamptz not null default now()
);

create index if not exists matches_date_idx on public.matches (match_date desc);
create index if not exists matches_status_idx on public.matches (status);

alter table public.matches enable row level security;

create policy "Partidos visibles para todos"
  on public.matches
  for select
  to anon, authenticated
  using (true);

comment on table public.matches is 'Calendario y resultados del club.';
