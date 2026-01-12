-- Create Storage bucket 'avatars' and policies
insert into storage.buckets (id, name, public)
select 'avatars', 'avatars', true
where not exists (select 1 from storage.buckets where id = 'avatars');

drop policy if exists "authenticated can upload to avatars" on storage.objects;
drop policy if exists "anon can read avatars" on storage.objects;
drop policy if exists "authenticated can read avatars" on storage.objects;

create policy "authenticated can upload to avatars"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and split_part(name, '/', 1) = auth.uid()::text
);

create policy "anon can read avatars"
on storage.objects for select
to anon
using (bucket_id = 'avatars');

create policy "authenticated can read avatars"
on storage.objects for select
to authenticated
using (bucket_id = 'avatars');
