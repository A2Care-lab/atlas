-- Inserir empresa exemplo
INSERT INTO companies (id, name, cnpj, email_domain, primary_color, secondary_color) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Empresa Exemplo LTDA', '12345678000195', 'empresa.com.br', '#1e40af', '#f8fafc');

-- Inserir motivos e submotivos padrão
INSERT INTO report_reasons (company_id, main_reason, sub_reason) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Assédio', 'Assédio Sexual'),
('550e8400-e29b-41d4-a716-446655440001', 'Assédio', 'Assédio Moral'),
('550e8400-e29b-41d4-a716-446655440001', 'Discriminação', 'Discriminação por gênero'),
('550e8400-e29b-41d4-a716-446655440001', 'Discriminação', 'Discriminação por orientação sexual'),
('550e8400-e29b-41d4-a716-446655440001', 'Discriminação', 'Discriminação racial'),
('550e8400-e29b-41d4-a716-446655440001', 'Fraude', 'Corrupção'),
('550e8400-e29b-41d4-a716-446655440001', 'Fraude', 'Desvio de recursos'),
('550e8400-e29b-41d4-a716-446655440001', 'Fraude', 'Fraude em licitações'),
('550e8400-e29b-41d4-a716-446655440001', 'Violência', 'Ameaça'),
('550e8400-e29b-41d4-a716-446655440001', 'Violência', 'Agressão física'),
('550e8400-e29b-41d4-a716-446655440001', 'Conflito', 'Desentendimento entre colegas'),
('550e8400-e29b-41d4-a716-446655440001', 'Conflito', 'Problemas de comunicação'),
('550e8400-e29b-41d4-a716-446655440001', 'Outro', 'Outro tipo de violação');

-- Criar função para gerar protocolo único
CREATE OR REPLACE FUNCTION generate_protocol()
RETURNS TEXT AS $$
BEGIN
    RETURN 'DEN' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;