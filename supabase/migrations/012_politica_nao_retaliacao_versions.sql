-- Tabela de versões da Política de Não Retaliação
CREATE TABLE IF NOT EXISTS politica_nao_retaliacao_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version_number INTEGER NOT NULL,
    content TEXT NOT NULL,
    justification TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID DEFAULT auth.uid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_politica_versions_updated_at ON politica_nao_retaliacao_versions(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_politica_versions_version ON politica_nao_retaliacao_versions(version_number);

ALTER TABLE politica_nao_retaliacao_versions ENABLE ROW LEVEL SECURITY;

-- Leitura para todos
CREATE POLICY "Allow read" ON politica_nao_retaliacao_versions
  FOR SELECT USING (true);

-- Inserção apenas por usuários autenticados
CREATE POLICY "Allow insert for authenticated" ON politica_nao_retaliacao_versions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

