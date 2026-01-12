DROP POLICY IF EXISTS "Invited user can accept own invitation" ON invitations;
CREATE POLICY "Invited user can accept own invitation" ON invitations
  FOR UPDATE TO authenticated
  USING (email = (SELECT email FROM public.user_profiles WHERE id = auth.uid()))
  WITH CHECK (email = (SELECT email FROM public.user_profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Invited user can read own invitations" ON invitations;
CREATE POLICY "Invited user can read own invitations" ON invitations
  FOR SELECT TO authenticated
  USING (email = (SELECT email FROM public.user_profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "User can set role/company from pending invitation" ON user_profiles;
CREATE POLICY "User can set role/company from pending invitation" ON user_profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND (
      (SELECT role FROM invitations WHERE email = (SELECT email FROM public.user_profiles WHERE id = auth.uid()) AND accepted_at IS NULL ORDER BY created_at DESC LIMIT 1) IS NULL
      OR role = (SELECT role FROM invitations WHERE email = (SELECT email FROM public.user_profiles WHERE id = auth.uid()) AND accepted_at IS NULL ORDER BY created_at DESC LIMIT 1)
    )
    AND (
      (SELECT company_id FROM invitations WHERE email = (SELECT email FROM public.user_profiles WHERE id = auth.uid()) AND accepted_at IS NULL ORDER BY created_at DESC LIMIT 1) IS NULL
      OR company_id = (SELECT company_id FROM invitations WHERE email = (SELECT email FROM public.user_profiles WHERE id = auth.uid()) AND accepted_at IS NULL ORDER BY created_at DESC LIMIT 1)
    )
  );

