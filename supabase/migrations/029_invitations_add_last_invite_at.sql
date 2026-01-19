-- Adiciona coluna para registrar data/hora do último envio de convite
ALTER TABLE public.invitations
  ADD COLUMN IF NOT EXISTS last_invite_at timestamptz NULL;

