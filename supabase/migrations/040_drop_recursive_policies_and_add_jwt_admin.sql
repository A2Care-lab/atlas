-- Remover policies recursivas que podem causar 500 no PostgREST
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polname = 'Admin can view all profiles stable'
      AND polrelid = 'public.user_profiles'::regclass
  ) THEN
    EXECUTE 'DROP POLICY "Admin can view all profiles stable" ON public.user_profiles';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polname = 'Admin can view all companies stable'
      AND polrelid = 'public.companies'::regclass
  ) THEN
    EXECUTE 'DROP POLICY "Admin can view all companies stable" ON public.companies';
  END IF;

  -- Garantir políticas de admin baseadas em JWT (sem subqueries)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polname = 'Admin can view all profiles (jwt)'
      AND polrelid = 'public.user_profiles'::regclass
  ) THEN
    EXECUTE $sql$
      CREATE POLICY "Admin can view all profiles (jwt)" ON public.user_profiles
        FOR SELECT TO authenticated
        USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');
    $sql$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polname = 'Admin can view all companies (jwt)'
      AND polrelid = 'public.companies'::regclass
  ) THEN
    EXECUTE $sql$
      CREATE POLICY "Admin can view all companies (jwt)" ON public.companies
        FOR SELECT TO authenticated
        USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');
    $sql$;
  END IF;

  -- Complemento: evitar dependência de user_profiles em companies para admin
  -- Se existir a policy "CRM N1 can view mapped companies" com cláusula admin via subquery,
  -- adicionamos uma alternativa via JWT que também autoriza admin.
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polname = 'CRM N1 admin via jwt can view companies'
      AND polrelid = 'public.companies'::regclass
  ) THEN
    EXECUTE $sql$
      CREATE POLICY "CRM N1 admin via jwt can view companies" ON public.companies
        FOR SELECT TO authenticated
        USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');
    $sql$;
  END IF;
END $$;

