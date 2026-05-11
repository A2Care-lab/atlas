-- Fix RLS for invitations management by admin using JWT claims.
-- Covers create/edit/delete/relist invite flows in UsersTable.
DO $$
BEGIN
  EXECUTE 'ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY';

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policy
    WHERE polname = 'Admin can select all invitations (jwt)'
      AND polrelid = 'public.invitations'::regclass
  ) THEN
    EXECUTE $sql$
      CREATE POLICY "Admin can select all invitations (jwt)" ON public.invitations
        FOR SELECT TO authenticated
        USING (
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
    WHERE polname = 'Admin can insert invitations (jwt)'
      AND polrelid = 'public.invitations'::regclass
  ) THEN
    EXECUTE $sql$
      CREATE POLICY "Admin can insert invitations (jwt)" ON public.invitations
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
    WHERE polname = 'Admin can update invitations (jwt)'
      AND polrelid = 'public.invitations'::regclass
  ) THEN
    EXECUTE $sql$
      CREATE POLICY "Admin can update invitations (jwt)" ON public.invitations
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

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policy
    WHERE polname = 'Admin can delete invitations (jwt)'
      AND polrelid = 'public.invitations'::regclass
  ) THEN
    EXECUTE $sql$
      CREATE POLICY "Admin can delete invitations (jwt)" ON public.invitations
        FOR DELETE TO authenticated
        USING (
          COALESCE(
            auth.jwt() -> 'user_metadata' ->> 'role',
            auth.jwt() ->> 'role'
          ) = 'admin'
        );
    $sql$;
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.invitations TO authenticated;
