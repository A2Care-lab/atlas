-- Add is_active and blocked_at to companies
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS blocked_at timestamptz;

-- Ensure updated_at is set when blocking via trigger could be added later
