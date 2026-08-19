-- Admin panel: usuarios admin + partido destacado en el front
-- Ejecutar en Supabase → SQL Editor

alter table public.matches
  add column if not exists is_featured boolean not null default false;

create index if not exists matches_featured_idx
  on public.matches (is_featured)
  where is_featured = true;

create table if not exists public.admin_users (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  user_id    uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
-- Sin policies públicas: solo service role / API admin

insert into public.admin_users (email)
values ('santi.720001@gmail.com')
on conflict (email) do nothing;

comment on table public.admin_users is 'Correos autorizados para /admin';
comment on column public.matches.is_featured is 'Partido que se muestra primero en la sección Partidos';
