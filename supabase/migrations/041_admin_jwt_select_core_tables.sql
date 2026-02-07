-- Policies baseadas em JWT para ADMIN evitando recursão e 500 no PostgREST
DO $$
BEGIN
  -- reports
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polname = 'Admin can view all reports (jwt)'
      AND polrelid = 'public.reports'::regclass
  ) THEN
    EXECUTE $sql$
      CREATE POLICY "Admin can view all reports (jwt)" ON public.reports
        FOR SELECT TO authenticated
        USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');
    $sql$;
  END IF;

  -- attachments
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polname = 'Admin can view all attachments (jwt)'
      AND polrelid = 'public.attachments'::regclass
  ) THEN
    EXECUTE $sql$
      CREATE POLICY "Admin can view all attachments (jwt)" ON public.attachments
        FOR SELECT TO authenticated
        USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');
    $sql$;
  END IF;

  -- comments
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polname = 'Admin can view all comments (jwt)'
      AND polrelid = 'public.comments'::regclass
  ) THEN
    EXECUTE $sql$
      CREATE POLICY "Admin can view all comments (jwt)" ON public.comments
        FOR SELECT TO authenticated
        USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');
    $sql$;
  END IF;

  -- status_history
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polname = 'Admin can view all status history (jwt)'
      AND polrelid = 'public.status_history'::regclass
  ) THEN
    EXECUTE $sql$
      CREATE POLICY "Admin can view all status history (jwt)" ON public.status_history
        FOR SELECT TO authenticated
        USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');
    $sql$;
  END IF;

  -- invitations
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polname = 'Admin can view all invitations (jwt)'
      AND polrelid = 'public.invitations'::regclass
  ) THEN
    EXECUTE $sql$
      CREATE POLICY "Admin can view all invitations (jwt)" ON public.invitations
        FOR SELECT TO authenticated
        USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');
    $sql$;
  END IF;
END $$;

