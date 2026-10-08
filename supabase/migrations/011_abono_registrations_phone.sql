-- Agrega el celular de cada abonado/boleta al confirmar silla + talla.

alter table public.abono_registrations
  add column if not exists holder_phone text;

comment on column public.abono_registrations.holder_phone is
  'Celular de contacto de este abonado/boleta en particular (puede diferir del comprador).';

-- La función de confirmación ahora también guarda holder_phone.
create or replace function public.confirm_abono_purchase(
  p_token text,
  p_purchaser_email text,
  p_assignments jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_purchase public.abono_purchases%rowtype;
  v_item jsonb;
  v_seat smallint;
  v_zone text;
  v_seat_status text;
  v_count int;
  v_conflict boolean;
begin
  select * into v_purchase
  from public.abono_purchases
  where access_token = p_token
  for update;

  if not found then
    raise exception 'TOKEN_INVALID';
  end if;

  if v_purchase.status <> 'pending_seats' then
    raise exception 'PURCHASE_NOT_PENDING';
  end if;

  if v_purchase.expires_at is not null and v_purchase.expires_at < now() then
    update public.abono_purchases set status = 'expired' where id = v_purchase.id;
    raise exception 'TOKEN_EXPIRED';
  end if;

  if lower(trim(p_purchaser_email)) <> lower(trim(v_purchase.purchaser_email)) then
    raise exception 'EMAIL_MISMATCH';
  end if;

  v_count := jsonb_array_length(p_assignments);
  if v_count <> v_purchase.abono_count then
    raise exception 'ABONO_COUNT_MISMATCH';
  end if;

  delete from public.abono_registrations where purchase_id = v_purchase.id;

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

    if v_zone <> v_purchase.zone_id then
      raise exception 'ZONE_MISMATCH';
    end if;

    if v_seat_status <> 'available' then
      raise exception 'SEAT_NOT_AVAILABLE';
    end if;

    if v_purchase.match_id is null then
      select exists (
        select 1
        from public.abono_registrations r
        join public.abono_purchases p on p.id = r.purchase_id
        where r.seat_number = v_seat
          and p.status = 'completed'
          and p.id <> v_purchase.id
      ) into v_conflict;
    else
      select exists (
        select 1
        from public.abono_registrations r
        join public.abono_purchases p on p.id = r.purchase_id
        where r.seat_number = v_seat
          and p.status = 'completed'
          and p.id <> v_purchase.id
          and (p.match_id is null or p.match_id = v_purchase.match_id)
      ) into v_conflict;
    end if;

    if v_conflict then
      raise exception 'SEAT_NOT_AVAILABLE';
    end if;

    insert into public.abono_registrations (
      purchase_id,
      abono_index,
      seat_number,
      match_id,
      holder_full_name,
      holder_document_id,
      holder_phone,
      jersey_size,
      confirmed_at
    ) values (
      v_purchase.id,
      (v_item->>'abono_index')::smallint,
      v_seat,
      v_purchase.match_id,
      trim(v_item->>'holder_full_name'),
      trim(v_item->>'holder_document_id'),
      trim(v_item->>'holder_phone'),
      v_item->>'jersey_size',
      now()
    );

    if v_purchase.match_id is null then
      update public.stadium_seats
      set status = 'reserved', updated_at = now()
      where seat_number = v_seat;
    end if;
  end loop;

  update public.abono_purchases
  set status = 'completed', completed_at = now()
  where id = v_purchase.id;

  return v_purchase.id;
exception
  when unique_violation then
    raise exception 'SEAT_NOT_AVAILABLE';
end;
$$;

comment on function public.confirm_abono_purchase is
  'Confirma sillas + datos (incl. celular) en una transacción. Abono bloquea la silla para siempre; boleta solo para su partido.';
