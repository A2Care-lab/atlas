-- Permitir que o usuário convidado leia seus próprios convites (necessário para onboarding)

ALTER TABLE IF EXISTS invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Invited user can read own invitations" ON invitations
  FOR SELECT TO authenticated
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

