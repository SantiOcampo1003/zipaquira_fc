-- Calificaciones de hinchas (1 voto por usuario / jugador / partido)
-- Ejecutar después de 003_match_squad.sql
-- Requiere Supabase Auth activo para que exista auth.users

create table if not exists public.player_ratings (
  id          uuid primary key default gen_random_uuid(),
  match_id    uuid not null references public.matches(id) on delete cascade,
  player_id   uuid not null references public.players(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  rating      smallint not null check (rating between 1 and 10),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, match_id, player_id)
);

create index if not exists player_ratings_match_idx on public.player_ratings (match_id);
create index if not exists player_ratings_player_idx on public.player_ratings (player_id);

-- Solo se califica a jugadores convocados
create or replace function public.enforce_squad_rating()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1
    from public.match_squad ms
    where ms.match_id = new.match_id
      and ms.player_id = new.player_id
  ) then
    raise exception 'Este jugador no está convocado para este partido.';
  end if;
  return new;
end;
$$;

create trigger player_ratings_squad_check
  before insert or update on public.player_ratings
  for each row execute function public.enforce_squad_rating();

create or replace function public.set_player_ratings_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger player_ratings_updated_at
  before update on public.player_ratings
  for each row execute function public.set_player_ratings_updated_at();

-- Promedios para el front
create or replace view public.player_match_rating_stats as
select
  match_id,
  player_id,
  round(avg(rating)::numeric, 1) as avg_rating,
  count(*)::int as vote_count
from public.player_ratings
group by match_id, player_id;

alter table public.player_ratings enable row level security;

create policy "Calificaciones visibles para todos"
  on public.player_ratings
  for select
  to anon, authenticated
  using (true);

create policy "Usuario autenticado puede votar"
  on public.player_ratings
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Usuario puede editar su voto"
  on public.player_ratings
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

comment on table public.player_ratings is 'Voto del hincha por jugador en un partido (1–10).';
