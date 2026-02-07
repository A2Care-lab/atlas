DO $$
BEGIN
  EXECUTE 'ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY';
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polname = 'Admin can view all profiles stable'
      AND polrelid = 'public.user_profiles'::regclass
  ) THEN
    EXECUTE $sql$
      CREATE POLICY "Admin can view all profiles stable" ON public.user_profiles
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

