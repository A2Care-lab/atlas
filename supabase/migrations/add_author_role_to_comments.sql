-- Add author_role column to comments and backfill from user_profiles
ALTER TABLE public.comments
  ADD COLUMN IF NOT EXISTS author_role text;

UPDATE public.comments c
SET author_role = up.role
FROM public.user_profiles up
WHERE c.author_role IS NULL AND c.user_id = up.id;

-- Optional constraint: limit values to known roles (skip if existing data varies)
-- ALTER TABLE public.comments
--   ADD CONSTRAINT comments_author_role_check CHECK (author_role IN ('admin','corporate_manager','approver_manager','user'));
