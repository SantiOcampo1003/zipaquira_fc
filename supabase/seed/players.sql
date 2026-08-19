-- 36 jugadores de ejemplo — Zipaquirá F.C.
-- Ejecutar DESPUÉS de 001_players.sql en Supabase → SQL Editor
-- Puedes editar nombres, dorsales y posiciones desde Table Editor cuando quieras.

insert into public.players (full_name, jersey_number, position, position_detail, sort_order) values
  -- Porteros (3)
  ('Andrés Mejía',           1,  'GK', 'Portero',               1),
  ('Kevin Londoño',         12,  'GK', 'Portero',              12),
  ('Tomás Vargas',          25,  'GK', 'Portero',              25),

  -- Defensas (11)
  ('Santiago Rojas',         2,  'DF', 'Lateral derecho',       2),
  ('Camilo Herrera',         3,  'DF', 'Central',               3),
  ('Jorge Villamil',         4,  'DF', 'Central',               4),
  ('Felipe Ardila',          5,  'DF', 'Lateral izquierdo',     5),
  ('Óscar Peña',            13,  'DF', 'Central',              13),
  ('Diego Morales',         15,  'DF', 'Lateral derecho',      15),
  ('Mauricio Bernal',       19,  'DF', 'Central',              19),
  ('Brayan Ortiz',          22,  'DF', 'Lateral izquierdo',    22),
  ('Sebastián Muñoz',       26,  'DF', 'Central',              26),
  ('Luis Hernández',        30,  'DF', 'Lateral izquierdo',    30),
  ('Oscar Jiménez',         33,  'DF', 'Central',              33),

  -- Mediocampistas (12)
  ('David Castañeda',        6,  'MF', 'Mediocentro',           6),
  ('Nicolás Prieto',         7,  'MF', 'Volante mixto',         7),
  ('Mateo Gómez',            8,  'MF', 'Interior derecho',      8),
  ('Cristian Salazar',      14,  'MF', 'Mediocentro defensivo', 14),
  ('Iván Cárdenas',         16,  'MF', 'Interior izquierdo',   16),
  ('Felipe Gutiérrez',      18,  'MF', 'Volante ofensivo',     18),
  ('Daniel Morales',        20,  'MF', 'Mediocampista',        20),
  ('Carlos Enrique Ávila',  23,  'MF', 'Volante mixto',        23),
  ('Jhonatan Sierra',       27,  'MF', 'Mediocentro',          27),
  ('Ricardo Torres',        31,  'MF', 'Interior derecho',     31),
  ('Andrés Felipe Duque',   34,  'MF', 'Volante ofensivo',     34),
  ('Luis Fernando Gil',     35,  'MF', 'Mediocentro defensivo',35),

  -- Delanteros (10)
  ('Juan Pablo Restrepo',    9,  'FW', 'Extremo derecho',       9),
  ('Diego Armando Soto',    10,  'FW', 'Delantero centro',     10),
  ('Esteban Quintero',      11,  'FW', 'Extremo izquierdo',    11),
  ('Harold Mosquera',       17,  'FW', 'Segundo delantero',    17),
  ('Yerson Córdoba',        21,  'FW', 'Delantero centro',     21),
  ('Stiven Palacios',       24,  'FW', 'Extremo derecho',      24),
  ('Julián Rincón',         28,  'FW', 'Extremo izquierdo',    28),
  ('Michael Santos',        29,  'FW', 'Delantero centro',     29),
  ('Wilmer García',         32,  'FW', 'Segundo delantero',    32),
  ('Brandon Castillo',      36,  'FW', 'Extremo derecho',      36);
