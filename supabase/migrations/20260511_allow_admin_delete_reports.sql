-- Allow admins to delete reports and report files using JWT role claims.
DO $$
BEGIN
  EXECUTE 'ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY';

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policy
    WHERE polname = 'Admin can delete reports (jwt)'
      AND polrelid = 'public.reports'::regclass
  ) THEN
    EXECUTE $sql$
      CREATE POLICY "Admin can delete reports (jwt)" ON public.reports
        FOR DELETE TO authenticated
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
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Admin can delete report files (jwt)'
  ) THEN
    EXECUTE $sql$
      CREATE POLICY "Admin can delete report files (jwt)" ON storage.objects
        FOR DELETE TO authenticated
        USING (
          bucket_id = 'reports'
          AND COALESCE(
            auth.jwt() -> 'user_metadata' ->> 'role',
            auth.jwt() ->> 'role'
          ) = 'admin'
        );
    $sql$;
  END IF;
END $$;

GRANT DELETE ON TABLE public.reports TO authenticated;
