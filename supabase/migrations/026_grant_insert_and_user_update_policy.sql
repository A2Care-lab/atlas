-- Completar privilégios e políticas para operações do usuário em user_profiles

-- Privilégios: incluir INSERT para authenticated
GRANT INSERT ON TABLE public.user_profiles TO authenticated;

-- Política: usuário pode atualizar seu próprio perfil (sem depender de role/company)
DROP POLICY IF EXISTS "User can update own profile" ON public.user_profiles;
CREATE POLICY "User can update own profile" ON public.user_profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

