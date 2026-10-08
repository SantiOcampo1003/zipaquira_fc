-- Compras de boleta para un partido específico (además de abonos de temporada)
-- Un abono reserva la silla para siempre (todos los partidos).
-- Una boleta reserva la silla solo para ESE partido puntual.

-- ---------------------------------------------------------------------------
-- 1. Nombre legible del partido para "Tipo de compra" en el sheet
--    (ej. "Zipa FC vs La Guajira"). Se compara sin importar mayúsculas.
-- ---------------------------------------------------------------------------
alter table public.matches
  add column if not exists ticket_label text;

create unique index if not exists matches_ticket_label_idx
  on public.matches (lower(ticket_label))
  where ticket_label is not null;

-- ---------------------------------------------------------------------------
-- 2. Compras: distinguir abono (temporada) de boleta (un partido)
-- ---------------------------------------------------------------------------
alter table public.abono_purchases
  add column if not exists purchase_type text not null default 'abono'
    check (purchase_type in ('abono', 'boleta')),
  add column if not exists match_id uuid references public.matches (id);

alter table public.abono_purchases
  drop constraint if exists abono_purchases_type_match_check;

alter table public.abono_purchases
  add constraint abono_purchases_type_match_check
  check (
    (purchase_type = 'abono' and match_id is null) or
    (purchase_type = 'boleta' and match_id is not null)
  );

create index if not exists abono_purchases_match_idx on public.abono_purchases (match_id);

-- ---------------------------------------------------------------------------
-- 3. Registros: copiamos el match_id de la compra para poder limitar la
--    unicidad de la silla por partido (boleta) en vez de global (abono).
-- ---------------------------------------------------------------------------
alter table public.abono_registrations
  add column if not exists match_id uuid references public.matches (id);

alter table public.abono_registrations
  drop constraint if exists abono_registrations_seat_number_key;

create unique index if not exists abono_registrations_seat_season_idx
  on public.abono_registrations (seat_number)
  where match_id is null;

create unique index if not exists abono_registrations_seat_match_idx
  on public.abono_registrations (seat_number, match_id)
  where match_id is not null;

-- ---------------------------------------------------------------------------
-- 4. 7 partidos de prueba (mock) — edítalos luego con el calendario real:
--    update matches set opponent = '...', match_date = '...', ticket_label = '...'
--    where slug = 'mock-partido-1'; (y así con los demás)
-- ---------------------------------------------------------------------------
insert into public.matches (opponent, match_date, venue, competition, is_home, slug, ticket_label, status)
values
  ('Por confirmar', current_date + interval '7 days',  'Estadio El Campín', 'Liga El Dorado', false, 'mock-partido-1', 'Partido 1', 'scheduled'),
  ('Por confirmar', current_date + interval '14 days', 'Estadio El Campín', 'Liga El Dorado', false, 'mock-partido-2', 'Partido 2', 'scheduled'),
  ('Por confirmar', current_date + interval '21 days', 'Estadio El Campín', 'Liga El Dorado', false, 'mock-partido-3', 'Partido 3', 'scheduled'),
  ('Por confirmar', current_date + interval '28 days', 'Estadio El Campín', 'Liga El Dorado', false, 'mock-partido-4', 'Partido 4', 'scheduled'),
  ('Por confirmar', current_date + interval '35 days', 'Estadio El Campín', 'Liga El Dorado', false, 'mock-partido-5', 'Partido 5', 'scheduled'),
  ('Por confirmar', current_date + interval '42 days', 'Estadio El Campín', 'Liga El Dorado', false, 'mock-partido-6', 'Partido 6', 'scheduled'),
  ('Por confirmar', current_date + interval '49 days', 'Estadio El Campín', 'Liga El Dorado', false, 'mock-partido-7', 'Partido 7', 'scheduled')
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- 5. Función de confirmación: ahora valida conflictos según el alcance
--    (abono = bloquea la silla para siempre; boleta = solo para su partido)
-- ---------------------------------------------------------------------------
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
      -- Abono de temporada: ningún registro existente (de temporada o de un
      -- partido puntual) puede ocupar ya esta silla.
      select exists (
        select 1
        from public.abono_registrations r
        join public.abono_purchases p on p.id = r.purchase_id
        where r.seat_number = v_seat
          and p.status = 'completed'
          and p.id <> v_purchase.id
      ) into v_conflict;
    else
      -- Boleta de un partido: conflicto solo si hay un abono de temporada
      -- o una boleta ya vendida para ESE MISMO partido.
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
      jersey_size,
      confirmed_at
    ) values (
      v_purchase.id,
      (v_item->>'abono_index')::smallint,
      v_seat,
      v_purchase.match_id,
      trim(v_item->>'holder_full_name'),
      trim(v_item->>'holder_document_id'),
      v_item->>'jersey_size',
      now()
    );

    -- Solo un abono de temporada marca la silla como reservada para siempre.
    -- Una boleta de un partido puntual no toca stadium_seats: la silla sigue
    -- disponible para los demás partidos.
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
  'Confirma sillas + datos en una transacción. Abono bloquea la silla para siempre; boleta solo para su partido.';
