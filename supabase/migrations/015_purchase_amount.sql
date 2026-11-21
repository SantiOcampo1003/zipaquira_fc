-- Monto realmente cobrado por compra (COP). Lo guarda el webhook de Wompi con el
-- monto de la transacción. Las cortesías/invitados no pagan: se reportan en $0.
-- Ejecutar en Supabase → SQL Editor.
alter table public.abono_purchases
  add column if not exists amount_cop integer;

comment on column public.abono_purchases.amount_cop is
  'Total pagado en esta compra (COP), tomado de amount_in_cents de Wompi / 100. NULL = no registrado.';
