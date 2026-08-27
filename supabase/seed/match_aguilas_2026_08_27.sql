-- Partido de hoy: Zipaquirá F.C. vs Águilas FC
-- Convocatoria oficial · Jueves 27 agosto 2026 · 19:00
-- Estadio Héctor "El Zipa" González (local)
-- Ejecutar en Supabase → SQL Editor

-- Permitir hasta 12 suplentes (hoy hay 19 convocados = 11 + 8)
alter table public.match_squad drop constraint if exists match_squad_bench_order_check;
alter table public.match_squad
  add constraint match_squad_bench_order_check
  check (bench_order is null or bench_order between 1 and 12);

-- Actualizar / insertar plantel de la convocatoria (dorsales 1–19)
insert into public.players (full_name, jersey_number, position, position_detail, is_active, sort_order)
values
  ('Carlos Pérez',        1,  'GK', 'Portero',               true, 1),
  ('Mateo Anaya',         2,  'GK', 'Portero',               true, 2),
  ('Sebastián Puentes',   3,  'DF', 'Defensa',               true, 3),
  ('Omar Micolta',        4,  'DF', 'Defensa',               true, 4),
  ('Kevin Cárdenas',      5,  'DF', 'Defensa',               true, 5),
  ('Diego Rivas',         6,  'DF', 'Defensa',               true, 6),
  ('Gustavo Mosquera',    7,  'DF', 'Defensa',               true, 7),
  ('Steven Rocha',        8,  'MF', 'Volante',               true, 8),
  ('Juan Lozano',         9,  'MF', 'Volante',               true, 9),
  ('Steven Gómez',       10,  'MF', 'Volante',              true, 10),
  ('Simón Vargas',       11,  'MF', 'Volante',              true, 11),
  ('Nicolás Montalvo',   12,  'MF', 'Volante',              true, 12),
  ('Nicolás Herrera',    13,  'MF', 'Volante',              true, 13),
  ('Jesús Gómez',        14,  'MF', 'Volante',              true, 14),
  ('David Zabaleta',     15,  'FW', 'Atacante',             true, 15),
  ('Yesid Robledo',      16,  'FW', 'Atacante',             true, 16),
  ('Santiago Ocampo',    17,  'FW', 'Atacante',             true, 17),
  ('Jhonier Córdoba',    18,  'FW', 'Atacante',             true, 18),
  ('Luis Carabalí',      19,  'FW', 'Atacante',             true, 19)
on conflict (jersey_number) do update set
  full_name = excluded.full_name,
  position = excluded.position,
  position_detail = excluded.position_detail,
  is_active = true,
  sort_order = excluded.sort_order;

-- Resto del plantel antiguo: fuera de convocatoria (siguen en DB)
update public.players
set is_active = false
where jersey_number > 19;

-- Quitar destacado de otros partidos
update public.matches set is_featured = false where is_featured = true;

-- Crear / actualizar partido vs Águilas FC
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
  slug,
  is_featured
) values (
  'Águilas FC',
  '2026-08-27',
  '19:00',
  'Estadio Héctor "El Zipa" González',
  'Amistoso',
  true,
  null,
  null,
  '4-3-3',
  'scheduled',
  'aguilas-fc-2026-08-27',
  true
)
on conflict (slug) do update set
  opponent = excluded.opponent,
  match_date = excluded.match_date,
  kickoff_time = excluded.kickoff_time,
  venue = excluded.venue,
  competition = excluded.competition,
  is_home = excluded.is_home,
  formation = excluded.formation,
  status = excluded.status,
  is_featured = true;

-- Limpiar convocatoria previa de este partido
delete from public.match_squad
where match_id = (select id from public.matches where slug = 'aguilas-fc-2026-08-27');

-- Titulares (4-3-3)
insert into public.match_squad (match_id, player_id, is_starter, pitch_slot)
select m.id, p.id, true, v.slot
from public.matches m
cross join (values
  ('GK',  1),
  ('LB',  3),
  ('LCB', 4),
  ('RCB', 5),
  ('RB',  6),
  ('LCM', 8),
  ('CM',  9),
  ('RCM', 10),
  ('LW',  15),
  ('ST',  16),
  ('RW',  17)
) as v(slot, jersey)
join public.players p on p.jersey_number = v.jersey
where m.slug = 'aguilas-fc-2026-08-27';

-- Suplentes (8)
insert into public.match_squad (match_id, player_id, is_starter, bench_order)
select m.id, p.id, false, v.bench
from public.matches m
cross join (values
  (1, 2),
  (2, 7),
  (3, 11),
  (4, 12),
  (5, 13),
  (6, 14),
  (7, 18),
  (8, 19)
) as v(bench, jersey)
join public.players p on p.jersey_number = v.jersey
where m.slug = 'aguilas-fc-2026-08-27';
