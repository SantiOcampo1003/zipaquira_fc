-- Venta directa de boletas en línea (Wompi) + control de ingreso por QR.
-- Ejecutar en Supabase → SQL Editor.

-- ---------------------------------------------------------------------------
-- 1. Nuevo estado "awaiting_payment": la silla ya quedó bloqueada mientras el
--    comprador termina de pagar en Wompi. Si el pago no llega, se vence igual
--    que "pending_seats" (ver app/api/abonos/session/route.ts).
-- ---------------------------------------------------------------------------
alter table public.abono_purchases
  drop constraint if exists abono_purchases_status_check;

alter table public.abono_purchases
  add constraint abono_purchases_status_check
  check (status in ('pending_seats', 'awaiting_payment', 'completed', 'expired', 'cancelled'));

-- ---------------------------------------------------------------------------
-- 2. Código de boleta (va dentro del QR) + control de ingreso.
-- ---------------------------------------------------------------------------
alter table public.abono_registrations
  add column if not exists ticket_code text,
  add column if not exists checked_in_at timestamptz,
  add column if not exists checked_in_by text;

create unique index if not exists abono_registrations_ticket_code_idx
  on public.abono_registrations (ticket_code)
  where ticket_code is not null;

comment on column public.abono_registrations.ticket_code is
  'Código corto aleatorio embebido en el QR de la boleta — lo valida /api/tickets/checkin.';
comment on column public.abono_registrations.checked_in_at is
  'Momento en que logística escaneó el QR en la entrada. NULL = todavía no ha ingresado.';

-- ---------------------------------------------------------------------------
-- 3. Reservar sillas mientras se paga (venta directa en línea, sin token
--    previo). Usa la misma lógica de conflicto de confirm_abono_purchase,
--    pero además bloquea sillas de OTRAS compras que sigan en
--    "awaiting_payment" y no hayan vencido (nadie puede pagar una silla que
--    otro ya está pagando en este momento).
-- ---------------------------------------------------------------------------
create or replace function public.reserve_boleta_online(
  p_purchaser_email text,
  p_purchaser_phone text,
  p_match_id uuid,
  p_zone_id text,
  p_assignments jsonb,
  p_hold_minutes int default 20
)
returns table(purchase_id uuid, access_token text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_purchase_id uuid;
  v_token text;
  v_count int;
  v_item jsonb;
  v_seat smallint;
  v_zone text;
  v_seat_status text;
  v_conflict boolean;
  v_ticket_code text;
begin
  v_count := jsonb_array_length(p_assignments);
  if v_count < 1 or v_count > 10 then
    raise exception 'ABONO_COUNT_MISMATCH';
  end if;

  -- gen_random_uuid() es nativo de Postgres (no requiere pgcrypto); dos
  -- concatenados dan suficiente entropía para un token de acceso.
  v_token := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');

  insert into public.abono_purchases (
    purchaser_email, abono_count, zone_id, purchase_type, match_id,
    access_token, status, expires_at
  ) values (
    lower(trim(p_purchaser_email)), v_count, p_zone_id, 'boleta', p_match_id,
    v_token, 'awaiting_payment', now() + make_interval(mins => p_hold_minutes)
  )
  returning id into v_purchase_id;

  for v_item in select * from jsonb_array_elements(p_assignments)
  loop
    v_seat := (v_item->>'seat_number')::smallint;

    select zone_id, status into v_zone, v_seat_status
    from public.stadium_seats
    where seat_number = v_seat
    for update;

    if not found then
      raise exception 'SEAT_NOT_FOUND';
    end if;

    if v_zone <> p_zone_id then
      raise exception 'ZONE_MISMATCH';
    end if;

    if v_seat_status <> 'available' then
      raise exception 'SEAT_NOT_AVAILABLE';
    end if;

    select exists (
      select 1
      from public.abono_registrations r
      join public.abono_purchases p on p.id = r.purchase_id
      where r.seat_number = v_seat
        and (
          p.status = 'completed'
          or (p.status = 'awaiting_payment' and p.expires_at > now())
        )
        and (p.match_id is null or p.match_id = p_match_id)
    ) into v_conflict;

    if v_conflict then
      raise exception 'SEAT_NOT_AVAILABLE';
    end if;

    v_ticket_code := upper(left(replace(gen_random_uuid()::text, '-', ''), 12));

    insert into public.abono_registrations (
      purchase_id, abono_index, seat_number, match_id,
      holder_full_name, holder_document_id, holder_phone, ticket_code
    ) values (
      v_purchase_id,
      (v_item->>'abono_index')::smallint,
      v_seat,
      p_match_id,
      trim(v_item->>'holder_full_name'),
      trim(v_item->>'holder_document_id'),
      coalesce(trim(v_item->>'holder_phone'), p_purchaser_phone),
      v_ticket_code
    );
  end loop;

  return query select v_purchase_id, v_token;
exception
  when unique_violation then
    raise exception 'SEAT_NOT_AVAILABLE';
end;
$$;

comment on function public.reserve_boleta_online is
  'Bloquea sillas para venta directa en línea (Wompi) antes de que el pago se confirme.';

-- ---------------------------------------------------------------------------
-- 4. Confirmar/cancelar el pago (llamado desde el webhook de Wompi).
--    Idempotentes: un reintento del webhook no debe fallar ni duplicar nada.
-- ---------------------------------------------------------------------------
create or replace function public.confirm_boleta_payment(
  p_purchase_id uuid,
  p_wompi_transaction_id text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
begin
  select status into v_status from public.abono_purchases where id = p_purchase_id for update;

  if not found then
    raise exception 'PURCHASE_NOT_FOUND';
  end if;

  if v_status = 'completed' then
    return; -- ya procesado (reintento del webhook)
  end if;

  if v_status <> 'awaiting_payment' then
    raise exception 'PURCHASE_NOT_AWAITING_PAYMENT';
  end if;

  update public.abono_purchases
  set status = 'completed', completed_at = now(), external_order_id = p_wompi_transaction_id
  where id = p_purchase_id;
end;
$$;

create or replace function public.cancel_boleta_payment(
  p_purchase_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
begin
  select status into v_status from public.abono_purchases where id = p_purchase_id for update;

  if not found or v_status in ('completed', 'cancelled') then
    return;
  end if;

  delete from public.abono_registrations where purchase_id = p_purchase_id;

  update public.abono_purchases
  set status = 'cancelled'
  where id = p_purchase_id;
end;
$$;

comment on function public.confirm_boleta_payment is 'Marca una boleta como pagada (webhook Wompi, idempotente).';
comment on function public.cancel_boleta_payment is 'Libera las sillas de una boleta no pagada (DECLINED/VOIDED/ERROR o vencida).';
