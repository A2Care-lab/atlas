-- Fix RLS for companies writes by admin using JWT claims.
-- This avoids INSERT/UPDATE failures when legacy policies depend on user_profiles lookups.
DO $$
BEGIN
  EXECUTE 'ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY';

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policy
    WHERE polname = 'Admin can insert companies (jwt)'
      AND polrelid = 'public.companies'::regclass
  ) THEN
    EXECUTE $sql$
      CREATE POLICY "Admin can insert companies (jwt)" ON public.companies
        FOR INSERT TO authenticated
        WITH CHECK (
          COALESCE(
            auth.jwt() -> 'user_metadata' ->> 'role',
            auth.jwt() ->> 'role'
          ) = 'admin'
        );
    $sql$;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policy
    WHERE polname = 'Admin can update companies (jwt)'
      AND polrelid = 'public.companies'::regclass
  ) THEN
    EXECUTE $sql$
      CREATE POLICY "Admin can update companies (jwt)" ON public.companies
        FOR UPDATE TO authenticated
        USING (
          COALESCE(
            auth.jwt() -> 'user_metadata' ->> 'role',
            auth.jwt() ->> 'role'
          ) = 'admin'
        )
        WITH CHECK (
          COALESCE(
            auth.jwt() -> 'user_metadata' ->> 'role',
            auth.jwt() ->> 'role'
          ) = 'admin'
        );
    $sql$;
  END IF;
END $$;

GRANT INSERT, UPDATE ON TABLE public.companies TO authenticated;
