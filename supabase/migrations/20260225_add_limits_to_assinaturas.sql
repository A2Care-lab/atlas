
ALTER TABLE public.assinaturas
ADD COLUMN IF NOT EXISTS whatsapp_monthly_limit INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_monthly_limit INTEGER DEFAULT 0;
