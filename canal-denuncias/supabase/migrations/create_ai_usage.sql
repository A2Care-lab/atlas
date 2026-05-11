CREATE TABLE IF NOT EXISTS ai_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  model TEXT NOT NULL,
  tokens_in INTEGER DEFAULT 0,
  tokens_out INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ai_usage_company_created_at_idx ON ai_usage(company_id, created_at);

ALTER TABLE IF EXISTS assinaturas ADD COLUMN IF NOT EXISTS ai_monthly_limit INTEGER DEFAULT 0;

CREATE OR REPLACE VIEW assinaturas_ai_consumo AS
SELECT 
  a.company_id,
  COALESCE(a.ai_monthly_limit, 0) AS ai_limite,
  COALESCE((
    SELECT COUNT(*)
    FROM ai_usage u
    WHERE u.company_id = a.company_id
      AND date_trunc('month', u.created_at) = date_trunc('month', NOW())
  ), 0) AS ai_consumidas
FROM assinaturas a;

CREATE OR REPLACE FUNCTION _ai_usage_count_month(p_company_id UUID)
RETURNS INTEGER
LANGUAGE sql
AS $$
  SELECT COUNT(*)::INTEGER
  FROM ai_usage u
  WHERE u.company_id = p_company_id
    AND date_trunc('month', u.created_at) = date_trunc('month', NOW());
$$;

