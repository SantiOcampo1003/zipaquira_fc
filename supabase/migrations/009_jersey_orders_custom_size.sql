-- Permite tallas personalizadas (niño, XXXL, etc.) además de S/M/L/XL.

alter table public.jersey_orders
  drop constraint if exists jersey_orders_size_check;

alter table public.jersey_orders
  add constraint jersey_orders_size_check
  check (char_length(trim(size)) between 1 and 30);
