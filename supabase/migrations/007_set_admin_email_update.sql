-- Atualiza perfil existente para admin por email

UPDATE user_profiles
SET role = 'admin', updated_at = NOW()
WHERE email = 'contato@a2care.com.br';

