-- Mapeamento entre token de link (UUID) e Token de Acesso derivado
CREATE TABLE IF NOT EXISTS public.report_tokens_pending (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  link_token UUID UNIQUE NOT NULL,
  access_token TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.report_tokens_pending ENABLE ROW LEVEL SECURITY;

-- Quem pode inserir (usuário autenticado)
CREATE POLICY "Users can insert pending tokens" ON public.report_tokens_pending
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Quem pode consultar (admin, gestores e CRM - N1)
CREATE POLICY "Managers/Admin/CRM can view pending tokens" ON public.report_tokens_pending
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
        AND up.role IN ('admin','corporate_manager','approver_manager','crm_n1')
    )
  );

-- Opcional: exclusão por admin
CREATE POLICY "Admin can delete pending tokens" ON public.report_tokens_pending
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'admin'
    )
  );

CREATE INDEX IF NOT EXISTS idx_report_tokens_pending_access ON public.report_tokens_pending(access_token);
CREATE INDEX IF NOT EXISTS idx_report_tokens_pending_link ON public.report_tokens_pending(link_token);

