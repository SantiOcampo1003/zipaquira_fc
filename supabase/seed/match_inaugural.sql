-- Partido inaugural de ejemplo + convocatoria de 18 (4-3-3)
-- Ejecutar DESPUÉS de migrations 002, 003 y con players ya cargados

insert into public.matches (
  opponent,
  match_date,
  kickoff_time,
  venue,
  competition,
  is_home,
  goals_for,
  goals_against,
  formation,
  status,
  slug
) values (
  'Sabana F.C.',
  '2025-08-24',
  '18:00',
  'Estadio El Campín',
  'Liga El Dorado',
  false,
  null,
  null,
  '4-3-3',
  'scheduled',
  'inaugural-sabana-2025'
);

-- Titulares (11) — pitch_slot para render en cancha
insert into public.match_squad (match_id, player_id, is_starter, pitch_slot)
select m.id, p.id, true, v.slot
from public.matches m
cross join (values
  ('GK',  1),
  ('RB',  2),
  ('LCB', 3),
  ('RCB', 4),
  ('LB',  5),
  ('LCM', 6),
  ('CM',  7),
  ('RCM', 16),
  ('RW',  9),
  ('ST',  10),
  ('LW',  11)
) as v(slot, jersey)
join public.players p on p.jersey_number = v.jersey
where m.slug = 'inaugural-sabana-2025';

-- Suplentes (7)
insert into public.match_squad (match_id, player_id, is_starter, bench_order)
select m.id, p.id, false, v.bench
from public.matches m
cross join (values
  (1, 12),
  (2, 13),
  (3, 14),
  (4, 17),
  (5, 18),
  (6, 21),
  (7, 24)
) as v(bench, jersey)
join public.players p on p.jersey_number = v.jersey
where m.slug = 'inaugural-sabana-2025';
