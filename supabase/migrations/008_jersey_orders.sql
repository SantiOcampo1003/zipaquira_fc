-- Pedidos de la camiseta conmemorativa de hincha oficial (cierre por WhatsApp)

create table if not exists public.jersey_orders (
  id            uuid primary key default gen_random_uuid(),
  full_name     text not null,
  phone         text not null,
  email         text,
  size          text not null
    check (size in ('S', 'M', 'L', 'XL')),
  quantity      smallint not null default 1
    check (quantity between 1 and 10),
  unit_price    integer not null default 89900,
  status        text not null default 'pendiente'
    check (status in ('pendiente', 'contactado', 'pagado', 'entregado', 'cancelado')),
  created_at    timestamptz not null default now()
);

create index if not exists jersey_orders_created_idx on public.jersey_orders (created_at desc);

comment on table public.jersey_orders is
  'Pedido de camiseta conmemorativa. El pago y la entrega se coordinan por WhatsApp.';

alter table public.jersey_orders enable row level security;

-- Sin políticas para anon: el insert se hace solo desde la API con service role.
