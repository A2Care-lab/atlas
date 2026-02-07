DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'CRM N1 can view mapped companies' AND polrelid = 'public.companies'::regclass
  ) THEN
    EXECUTE $sql$
      CREATE POLICY "CRM N1 can view mapped companies" ON public.companies
        FOR SELECT TO authenticated
        USING (
          EXISTS (
            SELECT 1
            FROM public.crm_n1_company_access a
            WHERE a.user_id = auth.uid()
              AND a.company_id = companies.id
          )
          OR EXISTS (
            SELECT 1 FROM public.user_profiles up
            WHERE up.id = auth.uid() AND up.role = 'admin'
          )
        );
    $sql$;
  END IF;
END $$;

