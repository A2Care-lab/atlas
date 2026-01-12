-- Garantir privilégios para papel 'authenticated' (aplicação) na tabela invitations
-- As políticas RLS limitarão o acesso por perfil/empresa; sem GRANT, a política não é aplicada

GRANT SELECT ON TABLE public.invitations TO authenticated;
GRANT INSERT ON TABLE public.invitations TO authenticated;
GRANT UPDATE ON TABLE public.invitations TO authenticated;
GRANT DELETE ON TABLE public.invitations TO authenticated;

