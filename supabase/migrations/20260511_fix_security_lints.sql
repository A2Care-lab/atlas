BEGIN;

ALTER TABLE IF EXISTS public.corporate_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.crm_n1_company_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.report_tokens_pending ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ai_usage ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF to_regclass('public.companies') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Admin can insert companies (jwt)" ON public.companies;
    CREATE POLICY "Admin can insert companies (jwt)" ON public.companies
      FOR INSERT TO authenticated
      WITH CHECK (public.current_user_role() = 'admin');

    DROP POLICY IF EXISTS "Admin can update companies (jwt)" ON public.companies;
    CREATE POLICY "Admin can update companies (jwt)" ON public.companies
      FOR UPDATE TO authenticated
      USING (public.current_user_role() = 'admin')
      WITH CHECK (public.current_user_role() = 'admin');
  END IF;

  IF to_regclass('public.invitations') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Admin can select all invitations (jwt)" ON public.invitations;
    CREATE POLICY "Admin can select all invitations (jwt)" ON public.invitations
      FOR SELECT TO authenticated
      USING (public.current_user_role() = 'admin');

    DROP POLICY IF EXISTS "Admin can insert invitations (jwt)" ON public.invitations;
    CREATE POLICY "Admin can insert invitations (jwt)" ON public.invitations
      FOR INSERT TO authenticated
      WITH CHECK (public.current_user_role() = 'admin');

    DROP POLICY IF EXISTS "Admin can update invitations (jwt)" ON public.invitations;
    CREATE POLICY "Admin can update invitations (jwt)" ON public.invitations
      FOR UPDATE TO authenticated
      USING (public.current_user_role() = 'admin')
      WITH CHECK (public.current_user_role() = 'admin');

    DROP POLICY IF EXISTS "Admin can delete invitations (jwt)" ON public.invitations;
    CREATE POLICY "Admin can delete invitations (jwt)" ON public.invitations
      FOR DELETE TO authenticated
      USING (public.current_user_role() = 'admin');
  END IF;

  IF to_regclass('public.report_tokens_pending') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Roles (jwt) can view pending tokens" ON public.report_tokens_pending;
    CREATE POLICY "Roles (jwt) can view pending tokens" ON public.report_tokens_pending
      FOR SELECT TO authenticated
      USING (
        public.current_user_role() IN (
          'admin',
          'corporate_manager',
          'approver_manager',
          'crm_n1',
          'user'
        )
      );
  END IF;

  IF to_regclass('public.reports') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Admin can delete reports (jwt)" ON public.reports;
    CREATE POLICY "Admin can delete reports (jwt)" ON public.reports
      FOR DELETE TO authenticated
      USING (public.current_user_role() = 'admin');
  END IF;

  IF to_regclass('public.ai_usage') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Admin can view ai_usage" ON public.ai_usage;
    CREATE POLICY "Admin can view ai_usage" ON public.ai_usage
      FOR SELECT TO authenticated
      USING (public.current_user_role() = 'admin');

    DROP POLICY IF EXISTS "Managers can view company ai_usage" ON public.ai_usage;
    CREATE POLICY "Managers can view company ai_usage" ON public.ai_usage
      FOR SELECT TO authenticated
      USING (
        public.current_user_role() IN ('corporate_manager', 'approver_manager')
        AND company_id = public.current_user_company_id()
      );
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Admin can delete report files (jwt)'
  ) THEN
    DROP POLICY "Admin can delete report files (jwt)" ON storage.objects;
  END IF;

  CREATE POLICY "Admin can delete report files (jwt)" ON storage.objects
    FOR DELETE TO authenticated
    USING (
      bucket_id = 'reports'
      AND public.current_user_role() = 'admin'
    );
END $$;

ALTER VIEW IF EXISTS public.monthly_silent_intent_stats SET (security_invoker = true);
ALTER VIEW IF EXISTS public.user_funnel_stats SET (security_invoker = true);
ALTER VIEW IF EXISTS public.company_funnel_stats SET (security_invoker = true);
ALTER VIEW IF EXISTS public.assinaturas_consumo SET (security_invoker = true);
ALTER VIEW IF EXISTS public.assinaturas_ai_consumo SET (security_invoker = true);

COMMIT;
