create extension if not exists "pgcrypto";

do $$
begin
  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'assinatura_status' and n.nspname = 'public'
  ) then
    create type public.assinatura_status as enum ('Ativa', 'Suspensão Temporária', 'Cancelada');
  end if;
end$$;

create table if not exists public.assinaturas (
  id uuid primary key default gen_random_uuid(),
  empresa text not null,
  valor numeric(12,2) not null default 0,
  usuarios integer not null default 0,
  denuncias integer not null default 0,
  status public.assinatura_status not null default 'Ativa',
  created_at timestamptz not null default now()
);

create index if not exists idx_assinaturas_empresa on public.assinaturas (empresa);

