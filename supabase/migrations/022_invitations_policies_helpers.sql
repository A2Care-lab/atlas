-- Atualizar políticas de invitations para usar funções auxiliares

DROP POLICY IF EXISTS "Invited user can accept own invitation" ON invitations;
DROP POLICY IF EXISTS "Invited user can read own invitations" ON invitations;

CREATE POLICY "Invited user can accept own invitation" ON invitations
  FOR UPDATE TO authenticated
  USING (email = current_user_email())
  WITH CHECK (email = current_user_email());

CREATE POLICY "Invited user can read own invitations" ON invitations
  FOR SELECT TO authenticated
  USING (email = current_user_email());

