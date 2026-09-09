-- Silletería tribuna occidental — 568 sillas + compras de abono (Tu Boleta)
-- Ejecutar en Supabase → SQL Editor (después de migraciones anteriores)

-- ---------------------------------------------------------------------------
-- 1. Catálogo de sillas (fuente de verdad de disponibilidad)
-- ---------------------------------------------------------------------------
create table if not exists public.stadium_seats (
  seat_number   smallint primary key
    check (seat_number between 1 and 568),
  zone_id       text not null
    check (zone_id in ('verde', 'blanca', 'roja')),
  row_number    smallint not null
    check (row_number between 1 and 4),
  status        text not null default 'available'
    check (status in ('available', 'reserved', 'courtesy', 'blocked')),
  updated_at    timestamptz not null default now()
);

create index if not exists stadium_seats_zone_idx on public.stadium_seats (zone_id);
create index if not exists stadium_seats_status_idx on public.stadium_seats (status);
create index if not exists stadium_seats_row_idx on public.stadium_seats (row_number);

comment on table public.stadium_seats is
  'Mapa oficial 001–568. status reserved = ya asignada a un abonado.';

-- ---------------------------------------------------------------------------
-- 2. Compra de abonos (1 fila por transacción en Tu Boleta, 1–10 abonos)
-- ---------------------------------------------------------------------------
create table if not exists public.abono_purchases (
  id                  uuid primary key default gen_random_uuid(),
  purchaser_email     text not null,
  abono_count         smallint not null
    check (abono_count between 1 and 10),
  zone_id             text not null
    check (zone_id in ('verde', 'blanca', 'roja')),
  external_order_id   text unique,
  access_token        text not null unique,
  status              text not null default 'pending_seats'
    check (status in ('pending_seats', 'completed', 'expired', 'cancelled')),
  expires_at          timestamptz,
  completed_at        timestamptz,
  created_at          timestamptz not null default now()
);

create index if not exists abono_purchases_email_idx
  on public.abono_purchases (lower(purchaser_email));
create index if not exists abono_purchases_token_idx
  on public.abono_purchases (access_token);

comment on table public.abono_purchases is
  'Compra en Tu Boleta. El hincha entra con access_token en el link del correo.';

-- ---------------------------------------------------------------------------
-- 3. Registro por abonado (silla + datos + camiseta)
-- ---------------------------------------------------------------------------
create table if not exists public.abono_registrations (
  id                  uuid primary key default gen_random_uuid(),
  purchase_id         uuid not null references public.abono_purchases (id) on delete cascade,
  abono_index         smallint not null
    check (abono_index between 1 and 10),
  seat_number         smallint references public.stadium_seats (seat_number),
  holder_full_name    text,
  holder_document_id  text,
  jersey_size         text
    check (jersey_size is null or jersey_size in ('XS', 'S', 'M', 'L', 'XL', 'XXL')),
  confirmed_at        timestamptz,
  created_at          timestamptz not null default now(),
  unique (purchase_id, abono_index),
  unique (seat_number)
);

create index if not exists abono_registrations_purchase_idx
  on public.abono_registrations (purchase_id);

comment on table public.abono_registrations is
  'Un registro por abono de la compra. seat_number único en toda la tribuna.';

-- ---------------------------------------------------------------------------
-- 4. Poblar las 568 sillas (numeración oficial)
-- ---------------------------------------------------------------------------
insert into public.stadium_seats (seat_number, zone_id, row_number, status)
select n, 'verde', 1, 'available' from generate_series(1, 52) as n
union all select n, 'blanca', 1, 'available' from generate_series(53, 100) as n
union all select n, 'roja', 1, 'available' from generate_series(101, 142) as n
union all select n, 'verde', 2, 'available' from generate_series(143, 194) as n
union all select n, 'blanca', 2, 'available' from generate_series(195, 242) as n
union all select n, 'roja', 2, 'available' from generate_series(243, 284) as n
union all select n, 'verde', 3, 'available' from generate_series(285, 336) as n
union all select n, 'blanca', 3, 'available' from generate_series(337, 384) as n
union all select n, 'roja', 3, 'available' from generate_series(385, 426) as n
union all select n, 'verde', 4, 'available' from generate_series(427, 478) as n
union all select n, 'blanca', 4, 'available' from generate_series(479, 526) as n
union all select n, 'roja', 4, 'available' from generate_series(527, 568) as n
on conflict (seat_number) do nothing;

-- Cortesías zona blanca fila 4 (#479 – #504)
update public.stadium_seats
set status = 'courtesy', updated_at = now()
where seat_number between 479 and 504;

-- ---------------------------------------------------------------------------
-- 5. RLS — lectura pública del mapa; escritura solo vía service role (API)
-- ---------------------------------------------------------------------------
alter table public.stadium_seats enable row level security;
alter table public.abono_purchases enable row level security;
alter table public.abono_registrations enable row level security;

create policy "Mapa de sillas visible para todos"
  on public.stadium_seats
  for select
  to anon, authenticated
  using (true);

-- Sin políticas INSERT/UPDATE para anon: las rutas API usan service role.

-- ---------------------------------------------------------------------------
-- 6. Función atómica al confirmar (evita doble reserva de la misma silla)
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

    insert into public.abono_registrations (
      purchase_id,
      abono_index,
      seat_number,
      holder_full_name,
      holder_document_id,
      jersey_size,
      confirmed_at
    ) values (
      v_purchase.id,
      (v_item->>'abono_index')::smallint,
      v_seat,
      trim(v_item->>'holder_full_name'),
      trim(v_item->>'holder_document_id'),
      v_item->>'jersey_size',
      now()
    );

    update public.stadium_seats
    set status = 'reserved', updated_at = now()
    where seat_number = v_seat;
  end loop;

  update public.abono_purchases
  set status = 'completed', completed_at = now()
  where id = v_purchase.id;

  return v_purchase.id;
end;
$$;

comment on function public.confirm_abono_purchase is
  'Confirma sillas + datos en una transacción. Llamar solo desde API con service role.';
