-- Função RPC para validar token de acesso do CRM - N1 sem depender de RLS nas tabelas
CREATE OR REPLACE FUNCTION public.crm_validate_token(p_access TEXT)
RETURNS TABLE(link_token UUID, company_id UUID, company_name TEXT) 
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT link_token, company_id, COALESCE(company_name, NULL) AS company_name
  FROM public.report_tokens_pending
  WHERE lower(access_token) = lower(trim(p_access))
  ORDER BY created_at DESC
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.crm_validate_token(TEXT) TO authenticated;
ALTER FUNCTION public.crm_validate_token(TEXT) OWNER TO postgres;
ALTER FUNCTION public.crm_validate_token(TEXT) SET row_security = off;
