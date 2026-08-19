-- Convocatoria por partido (18 jugadores: 11 titulares + 7 suplentes)
-- Ejecutar después de 002_matches.sql

create table if not exists public.match_squad (
  id            uuid primary key default gen_random_uuid(),
  match_id      uuid not null references public.matches(id) on delete cascade,
  player_id     uuid not null references public.players(id) on delete restrict,
  is_starter    boolean not null default false,
  pitch_slot    text,       -- GK, LB, LCB, RCB, RB, LCM, CM, RCM, LW, ST, RW (solo titulares)
  bench_order   smallint,   -- 1–7 para suplentes
  minutes_played smallint check (minutes_played is null or minutes_played between 0 and 120),
  unique (match_id, player_id),
  check (
    (is_starter = true and pitch_slot is not null and bench_order is null)
    or (is_starter = false and bench_order is not null and pitch_slot is null)
  ),
  check (bench_order is null or bench_order between 1 and 7)
);

create index if not exists match_squad_match_idx on public.match_squad (match_id);
create index if not exists match_squad_player_idx on public.match_squad (player_id);

alter table public.match_squad enable row level security;

create policy "Convocatoria visible para todos"
  on public.match_squad
  for select
  to anon, authenticated
  using (true);

comment on table public.match_squad is '18 convocados por partido. Solo estos jugadores reciben calificaciones.';
