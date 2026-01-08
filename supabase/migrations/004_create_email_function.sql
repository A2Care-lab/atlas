-- Criar função para envio de emails usando Resend
CREATE OR REPLACE FUNCTION send_email(
  p_to TEXT,
  p_subject TEXT,
  p_html TEXT,
  p_text TEXT DEFAULT ''
)
RETURNS JSON AS $$
DECLARE
  v_api_key TEXT;
  v_response JSON;
  v_status_code INTEGER;
BEGIN
  -- Obter a chave API do Resend das configurações (armazenada de forma segura)
  -- Em produção, isso deve vir de uma variável de ambiente ou secret manager
  v_api_key := COALESCE(current_setting('app.resend_api_key', true), 'your-resend-api-key');

  -- Fazer a requisição para a API do Resend
  SELECT 
    status,
    content::JSON INTO v_status_code, v_response
  FROM http(('
    POST',
    'https://api.resend.com/emails',
    ARRAY[
      ('Authorization', 'Bearer ' || v_api_key),
      ('Content-Type', 'application/json')
    ]::http_header[],
    ('{
      "from": "noreply@seu-dominio.com",
      "to": "' || p_to || '",
      "subject": "' || p_subject || '",
      "html": "' || REPLACE(p_html, '"', '\"') || '",
      "text": "' || REPLACE(p_text, '"', '\"') || '"
    }')::JSONB
  )::http_request);

  IF v_status_code >= 200 AND v_status_code < 300 THEN
    RETURN json_build_object('success', true, 'data', v_response);
  ELSE
    RETURN json_build_object('success', false, 'error', v_response);
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Conceder permissão para a função
GRANT EXECUTE ON FUNCTION send_email TO anon, authenticated;