
-- Permitir leitura pública na tabela system_settings para que a Landing Page possa acessar o número do WhatsApp
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.system_settings;

CREATE POLICY "Enable read access for all users"
ON public.system_settings FOR SELECT
TO anon, authenticated
USING (true);
