-- Create Storage bucket 'reports' and basic RLS policies
insert into storage.buckets (id, name, public)
select 'reports', 'reports', true
where not exists (select 1 from storage.buckets where id = 'reports');

drop policy if exists "anon can upload to reports" on storage.objects;
drop policy if exists "authenticated can upload to reports" on storage.objects;
drop policy if exists "anon can read reports" on storage.objects;
drop policy if exists "authenticated can read reports" on storage.objects;

create policy "anon can upload to reports"
on storage.objects for insert
to anon
with check (
  bucket_id = 'reports'
  and exists (
    select 1 from public.reports r
    where r.id::text = split_part(name, '/', 1)
  )
);

create policy "authenticated can upload to reports"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'reports'
  and exists (
    select 1 from public.reports r
    where r.id::text = split_part(name, '/', 1)
  )
);

create policy "anon can read reports"
on storage.objects for select
to anon
using (bucket_id = 'reports');

create policy "authenticated can read reports"
on storage.objects for select
to authenticated
using (bucket_id = 'reports');
