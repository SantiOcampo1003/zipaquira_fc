-- MVP de la hinchada por partido (publicado desde /admin)
-- Ejecutar después de 005_admin.sql

alter table public.matches
  add column if not exists mvp_player_id uuid references public.players(id) on delete set null,
  add column if not exists mvp_avg_rating numeric(4, 1),
  add column if not exists mvp_vote_count int,
  add column if not exists mvp_published_at timestamptz;

comment on column public.matches.mvp_player_id is 'Jugador MVP publicado en la web';
comment on column public.matches.mvp_avg_rating is 'Promedio de calificación al publicar MVP';
comment on column public.matches.mvp_vote_count is 'Votos recibidos al publicar MVP';
