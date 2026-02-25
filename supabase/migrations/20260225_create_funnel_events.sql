-- Funil de Denúncia: eventos por token
-- Cria enum, tabela de eventos, índices, RLS e visões de agregação

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'funnel_event_type') THEN
    CREATE TYPE funnel_event_type AS ENUM ('link_generated','link_clicked','report_submitted');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS report_funnel_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  link_token uuid NOT NULL,
  event_type funnel_event_type NOT NULL,
  company_id uuid NULL REFERENCES companies(id) ON DELETE SET NULL,
  generated_by_user_id uuid NULL REFERENCES user_profiles(id) ON DELETE SET NULL,
  actor_ip text NULL,
  user_agent text NULL
);

CREATE INDEX IF NOT EXISTS idx_report_funnel_events_link ON report_funnel_events(link_token);
CREATE INDEX IF NOT EXISTS idx_report_funnel_events_event ON report_funnel_events(event_type);
CREATE INDEX IF NOT EXISTS idx_report_funnel_events_company ON report_funnel_events(company_id);

-- RLS
ALTER TABLE report_funnel_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'insert_events_anyone' AND tablename = 'report_funnel_events'
  ) THEN
    CREATE POLICY insert_events_anyone ON report_funnel_events
      FOR INSERT TO anon, authenticated
      WITH CHECK (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'select_events_authenticated' AND tablename = 'report_funnel_events'
  ) THEN
    CREATE POLICY select_events_authenticated ON report_funnel_events
      FOR SELECT TO authenticated
      USING (true);
  END IF;
END $$;

-- Visão por empresa
CREATE OR REPLACE VIEW company_funnel_stats AS
WITH per_token AS (
  SELECT
    COALESCE(e.company_id, r.company_id) AS company_id,
    t.link_token,
    MAX(CASE WHEN e.event_type = 'link_generated' THEN 1 ELSE 0 END) AS generated,
    MAX(CASE WHEN e.event_type = 'link_clicked' THEN 1 ELSE 0 END) AS clicked,
    CASE WHEN MAX(CASE WHEN r.token IS NOT NULL THEN 1 ELSE 0 END) = 1 THEN 1 ELSE 0 END AS submitted
  FROM (
    SELECT DISTINCT link_token FROM report_funnel_events
    UNION
    SELECT DISTINCT token::uuid AS link_token FROM reports
  ) t
  LEFT JOIN report_funnel_events e ON e.link_token = t.link_token
  LEFT JOIN reports r ON r.token::uuid = t.link_token
  GROUP BY COALESCE(e.company_id, r.company_id), t.link_token
)
SELECT
  company_id,
  SUM(CASE WHEN generated = 1 THEN 1 ELSE 0 END) AS links_gerados,
  SUM(CASE WHEN clicked = 1 THEN 1 ELSE 0 END) AS links_clicados,
  SUM(submitted) AS denuncias_submetidas,
  SUM(CASE WHEN clicked = 1 AND submitted = 0 THEN 1 ELSE 0 END) AS nao_concluidas,
  CASE WHEN SUM(CASE WHEN clicked = 1 THEN 1 ELSE 0 END) > 0
       THEN ROUND(100.0 * SUM(CASE WHEN clicked = 1 AND submitted = 0 THEN 1 ELSE 0 END)
                  / NULLIF(SUM(CASE WHEN clicked = 1 THEN 1 ELSE 0 END), 0), 2)
       ELSE 0
  END AS perc_nao_concluidas
FROM per_token
GROUP BY company_id;

-- Visão por usuário que gerou o link (atribuição pelo evento 'link_generated')
CREATE OR REPLACE VIEW user_funnel_stats AS
WITH gen AS (
  SELECT DISTINCT ON (link_token)
    link_token,
    company_id,
    generated_by_user_id
  FROM report_funnel_events
  WHERE event_type = 'link_generated'
  ORDER BY link_token, created_at ASC
), per AS (
  SELECT
    g.generated_by_user_id,
    g.company_id,
    g.link_token,
    1 AS generated,
    CASE WHEN EXISTS (
      SELECT 1 FROM report_funnel_events e
      WHERE e.link_token = g.link_token AND e.event_type = 'link_clicked'
    ) THEN 1 ELSE 0 END AS clicked,
    CASE WHEN EXISTS (
      SELECT 1 FROM reports r
      WHERE r.token::uuid = g.link_token
    ) THEN 1 ELSE 0 END AS submitted
  FROM gen g
)
SELECT
  generated_by_user_id,
  company_id,
  SUM(generated) AS links_gerados,
  SUM(clicked) AS links_clicados,
  SUM(submitted) AS denuncias_submetidas,
  SUM(CASE WHEN clicked = 1 AND submitted = 0 THEN 1 ELSE 0 END) AS nao_concluidas,
  CASE WHEN SUM(clicked) > 0
       THEN ROUND(100.0 * SUM(CASE WHEN clicked = 1 AND submitted = 0 THEN 1 ELSE 0 END) / NULLIF(SUM(clicked), 0), 2)
       ELSE 0
  END AS perc_nao_concluidas
FROM per
GROUP BY generated_by_user_id, company_id;
