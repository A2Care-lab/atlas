create table if not exists system_settings (
  key text primary key,
  value text,
  description text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_by uuid references auth.users(id)
);

alter table system_settings enable row level security;

create policy "Enable read access for authenticated users"
  on system_settings for select
  to authenticated
  using (true);

create policy "Enable update access for admins only"
  on system_settings for update
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

create policy "Enable insert access for admins only"
  on system_settings for insert
  to authenticated
  with check (
    exists (
      select 1 from user_profiles
      where user_profiles.id = auth.uid()
      and user_profiles.role = 'admin'
    )
  );

insert into system_settings (key, value, description)
values ('whatsapp_number', '', 'Número do WhatsApp padrão do sistema')
on conflict (key) do nothing;
