-- EMERGENCY READ ACCESS (DEV RECOVERY)
-- Objetivo: restaurar leitura básica e eliminar erros 500 no PostgREST rapidamente.
-- Escopo: libera SELECT para usuários autenticados nas tabelas principais, sem recursão.
DO $$
BEGIN
  -- Lista de tabelas alvo para leitura emergencial
  PERFORM 1;

  -- Função auxiliar para dropar todas as policies de uma tabela
  -- e criar uma policy simples baseada em TRUE (apenas SELECT, authenticated)
  -- Observação: isso é para recuperação; refine policies depois.
  -- user_profiles
  EXECUTE 'ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY';
  FOR policy_name IN
    SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_profiles'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_profiles', policy_name);
  END LOOP;
  EXECUTE 'CREATE POLICY "Emergency read user_profiles" ON public.user_profiles FOR SELECT TO authenticated USING (TRUE)';

  -- companies
  EXECUTE 'ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY';
  FOR policy_name IN
    SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'companies'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.companies', policy_name);
  END LOOP;
  EXECUTE 'CREATE POLICY "Emergency read companies" ON public.companies FOR SELECT TO authenticated USING (TRUE)';

  -- reports
  EXECUTE 'ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY';
  FOR policy_name IN
    SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'reports'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.reports', policy_name);
  END LOOP;
  EXECUTE 'CREATE POLICY "Emergency read reports" ON public.reports FOR SELECT TO authenticated USING (TRUE)';

  -- attachments
  EXECUTE 'ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY';
  FOR policy_name IN
    SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'attachments'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.attachments', policy_name);
  END LOOP;
  EXECUTE 'CREATE POLICY "Emergency read attachments" ON public.attachments FOR SELECT TO authenticated USING (TRUE)';

  -- comments
  EXECUTE 'ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY';
  FOR policy_name IN
    SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'comments'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.comments', policy_name);
  END LOOP;
  EXECUTE 'CREATE POLICY "Emergency read comments" ON public.comments FOR SELECT TO authenticated USING (TRUE)';

  -- status_history
  EXECUTE 'ALTER TABLE public.status_history ENABLE ROW LEVEL SECURITY';
  FOR policy_name IN
    SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'status_history'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.status_history', policy_name);
  END LOOP;
  EXECUTE 'CREATE POLICY "Emergency read status_history" ON public.status_history FOR SELECT TO authenticated USING (TRUE)';

  -- invitations
  EXECUTE 'ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY';
  FOR policy_name IN
    SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'invitations'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.invitations', policy_name);
  END LOOP;
  EXECUTE 'CREATE POLICY "Emergency read invitations" ON public.invitations FOR SELECT TO authenticated USING (TRUE)';

  -- crm_n1_company_access
  EXECUTE 'ALTER TABLE public.crm_n1_company_access ENABLE ROW LEVEL SECURITY';
  FOR policy_name IN
    SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'crm_n1_company_access'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.crm_n1_company_access', policy_name);
  END LOOP;
  EXECUTE 'CREATE POLICY "Emergency read crm_n1_company_access" ON public.crm_n1_company_access FOR SELECT TO authenticated USING (TRUE)';

  -- report_tokens_pending
  EXECUTE 'ALTER TABLE public.report_tokens_pending ENABLE ROW LEVEL SECURITY';
  FOR policy_name IN
    SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'report_tokens_pending'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.report_tokens_pending', policy_name);
  END LOOP;
  EXECUTE 'CREATE POLICY "Emergency read report_tokens_pending" ON public.report_tokens_pending FOR SELECT TO authenticated USING (TRUE)';
END $$;

