-- Políticas para aceitar convite e aplicar empresa/perfil no onboarding

-- Permitir que o usuário convidado atualize seu próprio convite (accepted_at)
CREATE POLICY "Invited user can accept own invitation" ON invitations
  FOR UPDATE TO authenticated
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  WITH CHECK (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Permitir que o usuário atualize seu perfil com empresa/perfil do convite pendente
CREATE POLICY "User can set role/company from pending invitation" ON user_profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND (
      (SELECT role FROM invitations WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()) AND accepted_at IS NULL ORDER BY created_at DESC LIMIT 1)
      IS NULL
      OR role = (SELECT role FROM invitations WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()) AND accepted_at IS NULL ORDER BY created_at DESC LIMIT 1)
    )
    AND (
      (SELECT company_id FROM invitations WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()) AND accepted_at IS NULL ORDER BY created_at DESC LIMIT 1)
      IS NULL
      OR company_id = (SELECT company_id FROM invitations WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()) AND accepted_at IS NULL ORDER BY created_at DESC LIMIT 1)
    )
  );
