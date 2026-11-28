-- Una misma cuenta de Google ahora puede inscribir varias personas (cada una con su propio
-- registro de Betsson y pantallazo). Se quita la unicidad por correo de la cuenta; siguen
-- siendo únicos el pantallazo, el correo de Betsson y la cédula de cada persona registrada.
-- Ejecutar en Supabase → SQL Editor.
drop index if exists public.betsson_submissions_purchaser_uq;
