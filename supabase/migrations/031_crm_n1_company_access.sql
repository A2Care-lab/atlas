-- Tabela de vínculo de empresas adicionais para usuários CRM - N1
CREATE TABLE IF NOT EXISTS public.crm_n1_company_access (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, company_id)
);

ALTER TABLE public.crm_n1_company_access ENABLE ROW LEVEL SECURITY;

-- CRM - N1 pode ver seus próprios vínculos
CREATE POLICY "CRM N1 can view own access" ON public.crm_n1_company_access
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Admin pode ver todos vínculos
CREATE POLICY "Admin can view all crm_n1 access" ON public.crm_n1_company_access
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'admin'
    )
  );

-- Admin pode inserir vínculos
CREATE POLICY "Admin can insert crm_n1 access" ON public.crm_n1_company_access
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'admin'
    )
  );

-- Admin pode excluir vínculos
CREATE POLICY "Admin can delete crm_n1 access" ON public.crm_n1_company_access
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'admin'
    )
  );

-- Permitir que CRM - N1 acesse denúncias, anexos e comentários das empresas vinculadas
CREATE POLICY "CRM N1 can view mapped company reports" ON public.reports
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.crm_n1_company_access a
      WHERE a.user_id = auth.uid()
        AND a.company_id = reports.company_id
    ) OR EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
        AND up.role = 'crm_n1'
        AND up.company_id = reports.company_id
    )
  );

CREATE POLICY "CRM N1 can update mapped company reports" ON public.reports
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.crm_n1_company_access a
      WHERE a.user_id = auth.uid()
        AND a.company_id = reports.company_id
    ) OR EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
        AND up.role = 'crm_n1'
        AND up.company_id = reports.company_id
    )
  );

-- Inserir denúncias nas empresas mapeadas
CREATE POLICY "CRM N1 can insert mapped company reports" ON public.reports
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.crm_n1_company_access a
      WHERE a.user_id = auth.uid()
        AND a.company_id = reports.company_id
    ) OR EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
        AND up.role = 'crm_n1'
        AND up.company_id = reports.company_id
    )
  );

CREATE POLICY "CRM N1 can view mapped report attachments" ON public.attachments
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
              AND up.role = 'crm_n1'
              AND up.company_id = r.company_id
          )
        )
    )
  );

CREATE POLICY "CRM N1 can add mapped report attachments" ON public.attachments
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
              AND up.role = 'crm_n1'
              AND up.company_id = r.company_id
          )
        )
    )
  );

CREATE POLICY "CRM N1 can view mapped report comments" ON public.comments
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
              AND up.role = 'crm_n1'
              AND up.company_id = r.company_id
          )
        )
    )
  );

CREATE POLICY "CRM N1 can add mapped report comments" ON public.comments
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
              AND up.role = 'crm_n1'
              AND up.company_id = r.company_id
          )
        )
    )
  );
