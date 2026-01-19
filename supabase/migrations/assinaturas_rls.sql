alter table public.assinaturas
  add column if not exists company_id uuid not null,
  add constraint assinaturas_company_id_fkey foreign key (company_id) references public.companies(id);

create unique index if not exists idx_assinaturas_company_unique on public.assinaturas(company_id);

alter table public.assinaturas enable row level security;

drop policy if exists assinaturas_select_admin on public.assinaturas;
create policy assinaturas_select_admin
  on public.assinaturas for select
  using (exists (select 1 from public.user_profiles up where up.id = auth.uid() and up.role = 'admin'));

drop policy if exists assinaturas_select_managers_same_company on public.assinaturas;
create policy assinaturas_select_managers_same_company
  on public.assinaturas for select
  using (exists (select 1 from public.user_profiles up where up.id = auth.uid() and up.role in ('corporate_manager','approver_manager') and up.company_id = public.assinaturas.company_id));

drop policy if exists assinaturas_insert_admin on public.assinaturas;
create policy assinaturas_insert_admin
  on public.assinaturas for insert
  with check (exists (select 1 from public.user_profiles up where up.id = auth.uid() and up.role = 'admin'));

drop policy if exists assinaturas_update_admin on public.assinaturas;
create policy assinaturas_update_admin
  on public.assinaturas for update
  using (exists (select 1 from public.user_profiles up where up.id = auth.uid() and up.role = 'admin'))
  with check (exists (select 1 from public.user_profiles up where up.id = auth.uid() and up.role = 'admin'));

drop policy if exists assinaturas_delete_admin on public.assinaturas;
create policy assinaturas_delete_admin
  on public.assinaturas for delete
  using (exists (select 1 from public.user_profiles up where up.id = auth.uid() and up.role = 'admin'));

create or replace view public.assinaturas_consumo as
select a.company_id,
       co.name as empresa,
       a.valor,
       a.status,
       a.usuarios as usuarios_limite,
       a.denuncias as denuncias_limite,
       (select count(*) from public.user_profiles up where up.company_id = a.company_id) as usuarios_consumidos,
       (select count(*) from public.reports r where r.company_id = a.company_id) as denuncias_consumidas,
       a.created_at
from public.assinaturas a
join public.companies co on co.id = a.company_id;
