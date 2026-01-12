-- Promove o usuário contato@a2care.com.br a administrador
-- Atualiza perfil se existir; insere se ainda não houver perfil mas o usuário do auth existe

DO $$
DECLARE
  uid uuid;
BEGIN
  -- Busca o id do usuário no auth
  SELECT id INTO uid FROM auth.users WHERE email = 'contato@a2care.com.br' LIMIT 1;

  IF uid IS NOT NULL THEN
    -- Upsert no user_profiles
    INSERT INTO user_profiles (id, email, role, is_active)
    VALUES (uid, 'contato@a2care.com.br', 'admin', true)
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      role = 'admin',
      is_active = true,
      updated_at = NOW();
  ELSE
    RAISE NOTICE 'Usuário contato@a2care.com.br não existe em auth.users';
  END IF;
END $$;

