-- Visão mensal do Índice de Intenção Silenciosa (cliques sem submissão / cliques)

CREATE OR REPLACE VIEW monthly_silent_intent_stats AS
WITH clicks AS (
  SELECT
    date_trunc('month', e.created_at)::date AS month_start,
    e.link_token,
    e.company_id,
    e.generated_by_user_id
  FROM report_funnel_events e
  WHERE e.event_type = 'link_clicked'
  GROUP BY 1, e.link_token, e.company_id, e.generated_by_user_id
), submits AS (
  SELECT DISTINCT token::uuid AS link_token FROM reports
), per_group AS (
  SELECT
    c.month_start,
    c.company_id,
    c.generated_by_user_id,
    COUNT(DISTINCT c.link_token) AS clicked,
    COUNT(DISTINCT c.link_token) FILTER (WHERE s.link_token IS NULL) AS not_submitted
  FROM clicks c
  LEFT JOIN submits s ON s.link_token = c.link_token
  GROUP BY 1,2,3
)
SELECT
  month_start,
  company_id,
  generated_by_user_id,
  clicked,
  not_submitted,
  CASE WHEN clicked > 0 THEN ROUND(100.0 * not_submitted / clicked, 2) ELSE 0 END AS percent
FROM per_group;

