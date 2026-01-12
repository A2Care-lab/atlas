-- Garantir privilégios para papel 'authenticated' na tabela user_profiles

GRANT SELECT ON TABLE public.user_profiles TO authenticated;
GRANT UPDATE ON TABLE public.user_profiles TO authenticated;
GRANT DELETE ON TABLE public.user_profiles TO authenticated;

