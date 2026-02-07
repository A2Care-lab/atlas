DO $$
BEGIN
  EXECUTE 'ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY';
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polname = 'Admin can view all companies stable'
      AND polrelid = 'public.companies'::regclass
  ) THEN
    EXECUTE $sql$
      CREATE POLICY "Admin can view all companies stable" ON public.companies
        FOR SELECT TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM public.user_profiles up
            WHERE up.id = auth.uid() AND up.role = 'admin'
          )
        );
    $sql$;
  END IF;
END $$;

