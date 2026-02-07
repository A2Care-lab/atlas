-- Permite que CRM - N1 visualize empresas mapeadas em crm_n1_company_access
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

