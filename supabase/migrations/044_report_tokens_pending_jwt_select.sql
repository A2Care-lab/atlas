DO $$
BEGIN
  EXECUTE 'ALTER TABLE public.report_tokens_pending ENABLE ROW LEVEL SECURITY';
  IF EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polname = 'Managers/Admin/CRM can view pending tokens'
      AND polrelid = 'public.report_tokens_pending'::regclass
  ) THEN
    EXECUTE 'DROP POLICY "Managers/Admin/CRM can view pending tokens" ON public.report_tokens_pending';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polname = 'Roles (jwt) can view pending tokens'
      AND polrelid = 'public.report_tokens_pending'::regclass
  ) THEN
    EXECUTE $sql$
      CREATE POLICY "Roles (jwt) can view pending tokens" ON public.report_tokens_pending
        FOR SELECT TO authenticated
        USING (
          (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin','corporate_manager','approver_manager','crm_n1','user')
        );
    $sql$;
  END IF;
END $$;

