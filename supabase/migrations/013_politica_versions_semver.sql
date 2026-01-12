ALTER TABLE politica_nao_retaliacao_versions ADD COLUMN version_code TEXT;

UPDATE politica_nao_retaliacao_versions
SET version_code = version_number::text || '.0.0'
WHERE version_code IS NULL;

ALTER TABLE politica_nao_retaliacao_versions ALTER COLUMN version_code SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_politica_versions_code ON politica_nao_retaliacao_versions(version_code);
