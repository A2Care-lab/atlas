-- Add avatar_url column to user_profiles if not exists
alter table if exists public.user_profiles
add column if not exists avatar_url text;

comment on column public.user_profiles.avatar_url is 'Public URL for user avatar image stored in avatars bucket';
