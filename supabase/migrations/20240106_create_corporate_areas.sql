-- Migration para criar tabela de áreas corporativas
-- Data: 2024-01-06

-- criar tabela
CREATE TABLE corporate_areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused')),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- criar índices
CREATE INDEX idx_corporate_areas_status ON corporate_areas(status);
CREATE INDEX idx_corporate_areas_name ON corporate_areas(name);

-- permissões básicas
GRANT SELECT ON corporate_areas TO anon;
GRANT ALL PRIVILEGES ON corporate_areas TO authenticated;

-- políticas de segurança - apenas admin pode gerenciar
CREATE POLICY "Admin pode gerenciar áreas" ON corporate_areas
    FOR ALL TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- política para usuários autenticados visualizarem áreas ativas
CREATE POLICY "Usuários podem visualizar áreas ativas" ON corporate_areas
    FOR SELECT TO authenticated
    USING (status = 'active');

-- política para anônimos visualizarem áreas ativas (para formulário de denúncia)
CREATE POLICY "Anônimos podem visualizar áreas ativas" ON corporate_areas
    FOR SELECT TO anon
    USING (status = 'active');

-- criar trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_corporate_areas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_corporate_areas_updated_at_trigger
    BEFORE UPDATE ON corporate_areas
    FOR EACH ROW
    EXECUTE FUNCTION update_corporate_areas_updated_at();

-- dados iniciais - Áreas do primeiro print
INSERT INTO corporate_areas (name, status) VALUES
('Logística', 'active'),
('Inovação / Produtos Digitais', 'active'),
('Saúde Ocupacional / SST', 'active'),
('Engenharia', 'active'),
('Auditoria', 'active'),
('Planejamento Estratégico', 'active'),
('Comercial', 'active'),
('Recursos Humanos', 'active'),
('Patrimônio', 'active'),
('Sustentabilidade', 'active'),
('Jurídico', 'active'),
('Atendimento / SAC', 'active'),
('Produção', 'active'),
('Controladoria', 'active'),
('Contabilidade', 'active'),
('Treinamento & Desenvolvimento', 'active'),
('Saúde Corporativa', 'active'),
('Manutenção', 'active'),
('Suprimentos', 'active'),
('Comunicação', 'active');

-- dados iniciais - Áreas do segundo print
INSERT INTO corporate_areas (name, status) VALUES
('Vendas', 'active'),
('Marketing', 'active'),
('Facilities', 'active'),
('Operações', 'active'),
('Melhoria Contínua', 'active'),
('Financeiro', 'active'),
('Qualidade', 'active'),
('Compras/Logística', 'active'),
('Compliance', 'active'),
('Pós-Vendas / Customer Success', 'active'),
('PMO / Projetos', 'active'),
('Administrativo', 'active'),
('Serviços Gerais', 'active'),
('Pesquisa & Desenvolvimento (P&D)', 'active'),
('Diretoria Executiva', 'active'),
('Departamento Pessoal', 'active'),
('Tecnologia da Informação (TI)', 'active');