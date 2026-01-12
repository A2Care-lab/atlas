-- Políticas de invitations baseadas em e-mail do JWT

DROP POLICY IF EXISTS "Invited user can accept own invitation" ON invitations;
DROP POLICY IF EXISTS "Invited user can read own invitations" ON invitations;

CREATE POLICY "Invited user can accept own invitation" ON invitations
  FOR UPDATE TO authenticated
  USING (email = (auth.jwt() ->> 'email'))
  WITH CHECK (email = (auth.jwt() ->> 'email'));

CREATE POLICY "Invited user can read own invitations" ON invitations
  FOR SELECT TO authenticated
  USING (email = (auth.jwt() ->> 'email'));

