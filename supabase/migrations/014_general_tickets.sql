-- Boletas de tribuna General (sin silla numerada, tribuna aparte de Catedral).
-- Ejecutar en Supabase → SQL Editor.

alter table public.abono_purchases
  drop constraint if exists abono_purchases_zone_id_check;

alter table public.abono_purchases
  add constraint abono_purchases_zone_id_check
  check (zone_id in ('verde', 'blanca', 'roja', 'general'));

-- abono_registrations.seat_number ya era nullable (sin "not null" en 007) —
-- las boletas General simplemente no tienen silla.

create or replace function public.reserve_general_tickets(
  p_purchaser_email text,
  p_purchaser_phone text,
  p_match_id uuid,
  p_holders jsonb,
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
  v_ticket_code text;
begin
  v_count := jsonb_array_length(p_holders);
  if v_count < 1 or v_count > 10 then
    raise exception 'ABONO_COUNT_MISMATCH';
  end if;

  v_token := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');

  insert into public.abono_purchases (
    purchaser_email, abono_count, zone_id, purchase_type, match_id,
    access_token, status, expires_at
  ) values (
    lower(trim(p_purchaser_email)), v_count, 'general', 'boleta', p_match_id,
    v_token, 'awaiting_payment', now() + make_interval(mins => p_hold_minutes)
  )
  returning id into v_purchase_id;

  for v_item in select * from jsonb_array_elements(p_holders)
  loop
    v_ticket_code := upper(left(replace(gen_random_uuid()::text, '-', ''), 12));

    insert into public.abono_registrations (
      purchase_id, abono_index, seat_number, match_id,
      holder_full_name, holder_document_id, holder_phone, ticket_code
    ) values (
      v_purchase_id,
      (v_item->>'abono_index')::smallint,
      null,
      p_match_id,
      trim(v_item->>'holder_full_name'),
      trim(v_item->>'holder_document_id'),
      coalesce(trim(v_item->>'holder_phone'), p_purchaser_phone),
      v_ticket_code
    );
  end loop;

  return query select v_purchase_id, v_token;
end;
$$;

comment on function public.reserve_general_tickets is
  'Reserva boletas de tribuna General (sin silla) mientras se paga en Wompi.';
