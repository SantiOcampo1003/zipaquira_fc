-- Amistoso de ejemplo (ajusta fecha, rival y convocatoria)
-- Ejecutar con players ya cargados

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
  'Equipo Amistoso',
  '2026-08-20',
  '16:00',
  'Estadio Municipal de Zipaquirá',
  'Amistoso',
  true,
  null,
  null,
  '4-3-3',
  'scheduled',
  'amistoso-2026-08-20'
);

-- Titulares
insert into public.match_squad (match_id, player_id, is_starter, pitch_slot)
select m.id, p.id, true, v.slot
from public.matches m
cross join (values
  ('GK',  1),
  ('RB',  2),
  ('LCB', 3),
  ('RCB', 4),
  ('LB',  5),
  ('LCM', 8),
  ('CM',  6),
  ('RCM', 7),
  ('RW',  9),
  ('ST',  10),
  ('LW',  11)
) as v(slot, jersey)
join public.players p on p.jersey_number = v.jersey
where m.slug = 'amistoso-2026-08-20';

-- Suplentes
insert into public.match_squad (match_id, player_id, is_starter, bench_order)
select m.id, p.id, false, v.bench
from public.matches m
cross join (values
  (1, 12),
  (2, 14),
  (3, 17),
  (4, 18),
  (5, 21),
  (6, 24),
  (7, 28)
) as v(bench, jersey)
join public.players p on p.jersey_number = v.jersey
where m.slug = 'amistoso-2026-08-20';
