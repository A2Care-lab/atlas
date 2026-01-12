-- Recriar políticas de user_profiles utilizando funções auxiliares para evitar recursão

DROP POLICY IF EXISTS "User can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admin can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Managers can view company profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admin can update profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Managers can update company profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admin can delete profiles" ON public.user_profiles;

CREATE POLICY "User can view own profile" ON public.user_profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admin can view all profiles" ON public.user_profiles
  FOR SELECT TO authenticated
  USING (current_user_role() = 'admin');

CREATE POLICY "Managers can view company profiles" ON public.user_profiles
  FOR SELECT TO authenticated
  USING (
    current_user_role() IN ('admin','corporate_manager','approver_manager')
    AND company_id = current_user_company_id()
  );

CREATE POLICY "Admin can update profiles" ON public.user_profiles
  FOR UPDATE TO authenticated
  USING (current_user_role() = 'admin')
  WITH CHECK (current_user_role() = 'admin');

CREATE POLICY "Managers can update company profiles" ON public.user_profiles
  FOR UPDATE TO authenticated
  USING (
    current_user_role() IN ('admin','corporate_manager','approver_manager')
    AND company_id = current_user_company_id()
  )
  WITH CHECK (
    current_user_role() IN ('admin','corporate_manager','approver_manager')
    AND company_id = current_user_company_id()
  );

CREATE POLICY "Admin can delete profiles" ON public.user_profiles
  FOR DELETE TO authenticated
  USING (current_user_role() = 'admin');

