-- Allow anonymous users to insert attachments for anonymous reports (public form)
drop policy if exists "Anon can add attachments for anonymous reports" on attachments;
create policy "Anon can add attachments for anonymous reports"
on attachments for insert
to anon
with check (
  exists (
    select 1 from reports r
    where r.id = attachments.report_id
      and r.is_anonymous = true
  )
);
