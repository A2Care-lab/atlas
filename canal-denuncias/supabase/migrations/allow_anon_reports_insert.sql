-- Allow anonymous users to INSERT reports created via public form
drop policy if exists "Anon can create anonymous reports" on reports;
create policy "Anon can create anonymous reports"
on reports for insert
to anon
with check (
  is_anonymous = true
);
