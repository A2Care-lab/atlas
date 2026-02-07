-- Permite que CRM - N1 visualize perfis de usuários das empresas mapeadas
CREATE POLICY "CRM N1 can view mapped users" ON public.user_profiles
  FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.crm_n1_company_access a
      WHERE a.user_id = auth.uid()
        AND a.company_id = user_profiles.company_id
    )
    OR EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'admin'
    )
  );

