-- Make bucket 'reports' private and adjust policies
update storage.buckets
set public = false
where id = 'reports';

drop policy if exists "anon can read reports" on storage.objects;

-- Ensure authenticated users can read
drop policy if exists "authenticated can read reports" on storage.objects;
create policy "authenticated can read reports"
on storage.objects for select
to authenticated
using (bucket_id = 'reports');

