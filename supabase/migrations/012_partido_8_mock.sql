-- Completa la lista de partidos de temporada en el panel admin (/tribuna/admin)
-- a 8 en total: Zipa FC vs León OP10 (ya sembrado como mock-partido-1) + 7 más.
-- Edítalo luego con el rival/fecha real:
--   update matches set opponent = '...', match_date = '...' where slug = 'mock-partido-8';

insert into public.matches (opponent, match_date, venue, competition, is_home, slug, ticket_label, status)
values
  ('Por confirmar', current_date + interval '56 days', 'Estadio El Campín', 'Liga El Dorado', false, 'mock-partido-8', 'Partido 8', 'scheduled')
on conflict (slug) do nothing;
