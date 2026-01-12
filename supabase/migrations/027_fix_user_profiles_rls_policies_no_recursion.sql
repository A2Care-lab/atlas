-- Corrigir RLS de public.user_profiles evitando recursão nas políticas

-- Garantir que RLS esteja habilitado
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Remover TODAS as políticas existentes na tabela (independente do nome)
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_profiles'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END$$;

-- Políticas baseadas em claims do JWT (user_metadata) para evitar consultas recursivas

-- SELECT: usuário vê seu próprio perfil
CREATE POLICY "User can view own profile" ON public.user_profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

-- SELECT: admin vê todos os perfis
CREATE POLICY "Admin can view all profiles" ON public.user_profiles
  FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- SELECT: gestores visualizam perfis da própria empresa
CREATE POLICY "Managers can view company profiles" ON public.user_profiles
  FOR SELECT TO authenticated
  USING (((auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin','corporate_manager','approver_manager'))
         AND (company_id::text = (auth.jwt() -> 'user_metadata' ->> 'company_id')));

-- INSERT: usuário pode criar o próprio perfil
CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- UPDATE: usuário pode atualizar o próprio perfil
CREATE POLICY "User can update own profile" ON public.user_profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- UPDATE: admin pode atualizar qualquer perfil
CREATE POLICY "Admin can update profiles" ON public.user_profiles
  FOR UPDATE TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- UPDATE: gestores podem atualizar perfis da própria empresa
CREATE POLICY "Managers can update company profiles" ON public.user_profiles
  FOR UPDATE TO authenticated
  USING (((auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin','corporate_manager','approver_manager'))
         AND (company_id::text = (auth.jwt() -> 'user_metadata' ->> 'company_id')))
  WITH CHECK (((auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin','corporate_manager','approver_manager'))
         AND (company_id::text = (auth.jwt() -> 'user_metadata' ->> 'company_id')));

-- DELETE: admin pode excluir perfis
CREATE POLICY "Admin can delete profiles" ON public.user_profiles
  FOR DELETE TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

