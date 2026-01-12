-- Permite que usuários vejam a própria empresa

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view own company" ON companies
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.company_id = companies.id
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'admin'
    )
  );

