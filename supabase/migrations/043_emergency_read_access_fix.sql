DO $$
DECLARE r RECORD;
BEGIN
  EXECUTE 'ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY';
  FOR r IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_profiles' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_profiles', r.policyname);
  END LOOP;
  EXECUTE 'CREATE POLICY "Emergency read user_profiles" ON public.user_profiles FOR SELECT TO authenticated USING (TRUE)';

  EXECUTE 'ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY';
  FOR r IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'companies' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.companies', r.policyname);
  END LOOP;
  EXECUTE 'CREATE POLICY "Emergency read companies" ON public.companies FOR SELECT TO authenticated USING (TRUE)';

  EXECUTE 'ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY';
  FOR r IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'reports' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.reports', r.policyname);
  END LOOP;
  EXECUTE 'CREATE POLICY "Emergency read reports" ON public.reports FOR SELECT TO authenticated USING (TRUE)';

  EXECUTE 'ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY';
  FOR r IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'attachments' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.attachments', r.policyname);
  END LOOP;
  EXECUTE 'CREATE POLICY "Emergency read attachments" ON public.attachments FOR SELECT TO authenticated USING (TRUE)';

  EXECUTE 'ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY';
  FOR r IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'comments' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.comments', r.policyname);
  END LOOP;
  EXECUTE 'CREATE POLICY "Emergency read comments" ON public.comments FOR SELECT TO authenticated USING (TRUE)';

  EXECUTE 'ALTER TABLE public.status_history ENABLE ROW LEVEL SECURITY';
  FOR r IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'status_history' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.status_history', r.policyname);
  END LOOP;
  EXECUTE 'CREATE POLICY "Emergency read status_history" ON public.status_history FOR SELECT TO authenticated USING (TRUE)';

  EXECUTE 'ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY';
  FOR r IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'invitations' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.invitations', r.policyname);
  END LOOP;
  EXECUTE 'CREATE POLICY "Emergency read invitations" ON public.invitations FOR SELECT TO authenticated USING (TRUE)';

  EXECUTE 'ALTER TABLE public.crm_n1_company_access ENABLE ROW LEVEL SECURITY';
  FOR r IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'crm_n1_company_access' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.crm_n1_company_access', r.policyname);
  END LOOP;
  EXECUTE 'CREATE POLICY "Emergency read crm_n1_company_access" ON public.crm_n1_company_access FOR SELECT TO authenticated USING (TRUE)';

  EXECUTE 'ALTER TABLE public.report_tokens_pending ENABLE ROW LEVEL SECURITY';
  FOR r IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'report_tokens_pending' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.report_tokens_pending', r.policyname);
  END LOOP;
  EXECUTE 'CREATE POLICY "Emergency read report_tokens_pending" ON public.report_tokens_pending FOR SELECT TO authenticated USING (TRUE)';
END $$;

