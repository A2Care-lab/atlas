-- Create table to store user terms acceptance metadata
create table if not exists public.terms_acceptances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  full_name varchar not null,
  email varchar not null,
  accepted_at timestamptz not null default now(),
  privacy_version text,
  terms_version text,
  non_retaliation_version text
);

-- Helpful indexes
create index if not exists terms_acceptances_user_idx on public.terms_acceptances(user_id);
create index if not exists terms_acceptances_accepted_at_idx on public.terms_acceptances(accepted_at desc);

-- Enable Row Level Security and policies
alter table public.terms_acceptances enable row level security;

-- Allow the logged-in user to insert their own acceptance record
create policy terms_acceptances_user_insert
  on public.terms_acceptances
  for insert
  with check (auth.uid() = user_id);

-- Allow users to read only their own records
create policy terms_acceptances_user_select
  on public.terms_acceptances
  for select
  using (auth.uid() = user_id);

-- Allow admins to read all records via user_profiles role
create policy terms_acceptances_admin_select
  on public.terms_acceptances
  for select
  using (
    exists (
      select 1 from public.user_profiles up
      where up.id = auth.uid() and up.role = 'admin'
    )
  );
