-- Políticas de user_profiles usando claims em user_metadata (JWT)

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
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "Managers can view company profiles" ON public.user_profiles
  FOR SELECT TO authenticated
  USING (((auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin','corporate_manager','approver_manager'))
         AND (company_id::text = (auth.jwt() -> 'user_metadata' ->> 'company_id')));

CREATE POLICY "Admin can update profiles" ON public.user_profiles
  FOR UPDATE TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "Managers can update company profiles" ON public.user_profiles
  FOR UPDATE TO authenticated
  USING (((auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin','corporate_manager','approver_manager'))
         AND (company_id::text = (auth.jwt() -> 'user_metadata' ->> 'company_id')))
  WITH CHECK (((auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin','corporate_manager','approver_manager'))
         AND (company_id::text = (auth.jwt() -> 'user_metadata' ->> 'company_id')));

CREATE POLICY "Admin can delete profiles" ON public.user_profiles
  FOR DELETE TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

