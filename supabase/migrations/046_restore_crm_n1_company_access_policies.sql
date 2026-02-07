DO $$
BEGIN
  EXECUTE 'ALTER TABLE public.crm_n1_company_access ENABLE ROW LEVEL SECURITY';

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'crm_n1_company_access'
      AND policyname = 'Emergency read crm_n1_company_access'
  ) THEN
    EXECUTE 'DROP POLICY "Emergency read crm_n1_company_access" ON public.crm_n1_company_access';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'crm_n1_company_access'
      AND policyname = 'CRM N1 can view own access'
  ) THEN
    EXECUTE 'CREATE POLICY "CRM N1 can view own access" ON public.crm_n1_company_access FOR SELECT TO authenticated USING (user_id = auth.uid())';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'crm_n1_company_access'
      AND policyname = 'Admin can view all crm_n1 access'
  ) THEN
    EXECUTE $pol$CREATE POLICY "Admin can view all crm_n1 access" ON public.crm_n1_company_access
      FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.user_profiles up
          WHERE up.id = auth.uid() AND up.role = ''admin''
        )
      )$pol$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'crm_n1_company_access'
      AND policyname = 'Admin can insert crm_n1 access'
  ) THEN
    EXECUTE $pol$CREATE POLICY "Admin can insert crm_n1 access" ON public.crm_n1_company_access
      FOR INSERT TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.user_profiles up
          WHERE up.id = auth.uid() AND up.role = ''admin''
        )
      )$pol$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'crm_n1_company_access'
      AND policyname = 'Admin can delete crm_n1 access'
  ) THEN
    EXECUTE $pol$CREATE POLICY "Admin can delete crm_n1 access" ON public.crm_n1_company_access
      FOR DELETE TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.user_profiles up
          WHERE up.id = auth.uid() AND up.role = ''admin''
        )
      )$pol$;
  END IF;

  EXECUTE 'ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY';
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname=''public'' AND tablename=''reports'' AND policyname=''Emergency read reports'') THEN
    EXECUTE 'DROP POLICY "Emergency read reports" ON public.reports';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname=''public'' AND tablename=''reports'' AND policyname=''CRM N1 can view mapped company reports'') THEN
    EXECUTE $pol$CREATE POLICY "CRM N1 can view mapped company reports" ON public.reports
      FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.crm_n1_company_access a
          WHERE a.user_id = auth.uid()
            AND a.company_id = reports.company_id
        ) OR EXISTS (
          SELECT 1 FROM public.user_profiles up
          WHERE up.id = auth.uid()
            AND up.role = ''crm_n1''
            AND up.company_id = reports.company_id
        )
      )$pol$;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname=''public'' AND tablename=''reports'' AND policyname=''CRM N1 can update mapped company reports'') THEN
    EXECUTE $pol$CREATE POLICY "CRM N1 can update mapped company reports" ON public.reports
      FOR UPDATE TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.crm_n1_company_access a
          WHERE a.user_id = auth.uid()
            AND a.company_id = reports.company_id
        ) OR EXISTS (
          SELECT 1 FROM public.user_profiles up
          WHERE up.id = auth.uid()
            AND up.role = ''crm_n1''
            AND up.company_id = reports.company_id
        )
      )$pol$;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname=''public'' AND tablename=''reports'' AND policyname=''CRM N1 can insert mapped company reports'') THEN
    EXECUTE $pol$CREATE POLICY "CRM N1 can insert mapped company reports" ON public.reports
      FOR INSERT TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.crm_n1_company_access a
          WHERE a.user_id = auth.uid()
            AND a.company_id = reports.company_id
        ) OR EXISTS (
          SELECT 1 FROM public.user_profiles up
          WHERE up.id = auth.uid()
            AND up.role = ''crm_n1''
            AND up.company_id = reports.company_id
        )
      )$pol$;
  END IF;

  EXECUTE 'ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY';
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname=''public'' AND tablename=''attachments'' AND policyname=''Emergency read attachments'') THEN
    EXECUTE 'DROP POLICY "Emergency read attachments" ON public.attachments';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname=''public'' AND tablename=''attachments'' AND policyname=''CRM N1 can view mapped report attachments'') THEN
    EXECUTE $pol$CREATE POLICY "CRM N1 can view mapped report attachments" ON public.attachments
      FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.reports r
          WHERE r.id = attachments.report_id
            AND (
              EXISTS (
                SELECT 1 FROM public.crm_n1_company_access a
                WHERE a.user_id = auth.uid()
                  AND a.company_id = r.company_id
              ) OR EXISTS (
                SELECT 1 FROM public.user_profiles up
                WHERE up.id = auth.uid()
                  AND up.role = ''crm_n1''
                  AND up.company_id = r.company_id
              )
            )
        )
      )$pol$;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname=''public'' AND tablename=''attachments'' AND policyname=''CRM N1 can add mapped report attachments'') THEN
    EXECUTE $pol$CREATE POLICY "CRM N1 can add mapped report attachments" ON public.attachments
      FOR INSERT TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.reports r
          WHERE r.id = attachments.report_id
            AND (
              EXISTS (
                SELECT 1 FROM public.crm_n1_company_access a
                WHERE a.user_id = auth.uid()
                  AND a.company_id = r.company_id
              ) OR EXISTS (
                SELECT 1 FROM public.user_profiles up
                WHERE up.id = auth.uid()
                  AND up.role = ''crm_n1''
                  AND up.company_id = r.company_id
              )
            )
        )
      )$pol$;
  END IF;

  EXECUTE 'ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY';
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname=''public'' AND tablename=''comments'' AND policyname=''Emergency read comments'') THEN
    EXECUTE 'DROP POLICY "Emergency read comments" ON public.comments';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname=''public'' AND tablename=''comments'' AND policyname=''CRM N1 can view mapped report comments'') THEN
    EXECUTE $pol$CREATE POLICY "CRM N1 can view mapped report comments" ON public.comments
      FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.reports r
          WHERE r.id = comments.report_id
            AND (
              EXISTS (
                SELECT 1 FROM public.crm_n1_company_access a
                WHERE a.user_id = auth.uid()
                  AND a.company_id = r.company_id
              ) OR EXISTS (
                SELECT 1 FROM public.user_profiles up
                WHERE up.id = auth.uid()
                  AND up.role = ''crm_n1''
                  AND up.company_id = r.company_id
              )
            )
        )
      )$pol$;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname=''public'' AND tablename=''comments'' AND policyname=''CRM N1 can add mapped report comments'') THEN
    EXECUTE $pol$CREATE POLICY "CRM N1 can add mapped report comments" ON public.comments
      FOR INSERT TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.reports r
          WHERE r.id = comments.report_id
            AND (
              EXISTS (
                SELECT 1 FROM public.crm_n1_company_access a
                WHERE a.user_id = auth.uid()
                  AND a.company_id = r.company_id
              ) OR EXISTS (
                SELECT 1 FROM public.user_profiles up
                WHERE up.id = auth.uid()
                  AND up.role = ''crm_n1''
                  AND up.company_id = r.company_id
              )
            )
        )
      )$pol$;
  END IF;
END $$;

GRANT SELECT, INSERT, DELETE ON TABLE public.crm_n1_company_access TO authenticated;
