-- Registros "Betsson patrocina tu partido": entrada gratis para quien se registra en
-- Betsson con el link del club y sube un pantallazo de su perfil. Un agente de visión
-- revisa el pantallazo; lo dudoso queda 'pending' para aprobación manual en /admin/betsson.
-- Ejecutar en Supabase → SQL Editor.
create table if not exists public.betsson_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  match_id uuid not null references public.matches(id) on delete cascade,
  purchaser_email text not null,
  purchaser_phone text not null,
  holder_document_id text not null,
  zone_id text not null,
  -- [{seatNumber, holderFullName, holderDocumentId, holderPhone, isMinor}]
  seats jsonb not null,
  -- Lo que el agente leyó del pantallazo
  betsson_email text,
  betsson_name text,
  ai_result jsonb,
  image_path text,
  image_hash text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reason text,
  purchase_id uuid references public.abono_purchases(id) on delete set null,
  reviewed_by text,
  reviewed_at timestamptz
);

-- Un mismo pantallazo, correo de Betsson, cuenta o cédula no se repite en el partido
-- (las solicitudes rechazadas no cuentan, para poder reintentar).
create unique index if not exists betsson_submissions_hash_uq
  on public.betsson_submissions (match_id, image_hash) where status <> 'rejected';
create unique index if not exists betsson_submissions_betsson_email_uq
  on public.betsson_submissions (match_id, betsson_email) where status <> 'rejected' and betsson_email is not null;
create unique index if not exists betsson_submissions_purchaser_uq
  on public.betsson_submissions (match_id, purchaser_email) where status <> 'rejected';
create unique index if not exists betsson_submissions_document_uq
  on public.betsson_submissions (match_id, holder_document_id) where status <> 'rejected';

alter table public.betsson_submissions enable row level security;
-- Sin políticas: solo se accede con la service role desde el servidor.
