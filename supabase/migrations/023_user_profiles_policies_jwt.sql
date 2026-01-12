-- Reescrever políticas de user_profiles para usar claims JWT (evita recursão)

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
  USING ((auth.jwt() ->> 'role') = 'admin');

CREATE POLICY "Managers can view company profiles" ON public.user_profiles
  FOR SELECT TO authenticated
  USING (((auth.jwt() ->> 'role') IN ('admin','corporate_manager','approver_manager'))
         AND (company_id::text = (auth.jwt() ->> 'company_id')));

CREATE POLICY "Admin can update profiles" ON public.user_profiles
  FOR UPDATE TO authenticated
  USING ((auth.jwt() ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() ->> 'role') = 'admin');

CREATE POLICY "Managers can update company profiles" ON public.user_profiles
  FOR UPDATE TO authenticated
  USING (((auth.jwt() ->> 'role') IN ('admin','corporate_manager','approver_manager'))
         AND (company_id::text = (auth.jwt() ->> 'company_id')))
  WITH CHECK (((auth.jwt() ->> 'role') IN ('admin','corporate_manager','approver_manager'))
         AND (company_id::text = (auth.jwt() ->> 'company_id')));

CREATE POLICY "Admin can delete profiles" ON public.user_profiles
  FOR DELETE TO authenticated
  USING ((auth.jwt() ->> 'role') = 'admin');

