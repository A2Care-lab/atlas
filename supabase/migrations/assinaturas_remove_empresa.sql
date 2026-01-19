-- Drop index on empresa if it exists
drop index if exists public.idx_assinaturas_empresa;

-- Drop column empresa from assinaturas
alter table public.assinaturas
  drop column if exists empresa;

