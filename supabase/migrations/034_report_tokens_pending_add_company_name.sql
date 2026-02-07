-- Adiciona coluna company_name para facilitar exibição sem depender de RLS em companies
ALTER TABLE public.report_tokens_pending
ADD COLUMN IF NOT EXISTS company_name TEXT;

