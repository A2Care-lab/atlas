create table if not exists system_templates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  html text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  constraint system_templates_title_not_blank check (length(btrim(title)) > 0),
  constraint system_templates_html_not_blank check (length(btrim(html)) > 0)
);

create index if not exists system_templates_created_at_idx
  on system_templates (created_at desc);

alter table system_templates enable row level security;

create policy "Enable read access for admins only"
  on system_templates for select
  to authenticated
  using (
    exists (
      select 1 from user_profiles
      where user_profiles.id = auth.uid()
      and user_profiles.role = 'admin'
    )
  );

create policy "Enable insert access for admins only"
  on system_templates for insert
  to authenticated
  with check (
    exists (
      select 1 from user_profiles
      where user_profiles.id = auth.uid()
      and user_profiles.role = 'admin'
    )
  );

create policy "Enable update access for admins only"
  on system_templates for update
  to authenticated
  using (
    exists (
      select 1 from user_profiles
      where user_profiles.id = auth.uid()
      and user_profiles.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from user_profiles
      where user_profiles.id = auth.uid()
      and user_profiles.role = 'admin'
    )
  );

create policy "Enable delete access for admins only"
  on system_templates for delete
  to authenticated
  using (
    exists (
      select 1 from user_profiles
      where user_profiles.id = auth.uid()
      and user_profiles.role = 'admin'
    )
  );
