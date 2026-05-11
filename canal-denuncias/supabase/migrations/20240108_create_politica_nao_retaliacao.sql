-- create table for politica nao retaliacao
CREATE TABLE politica_nao_retaliacao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- create index
CREATE INDEX idx_politica_updated_at ON politica_nao_retaliacao(updated_at DESC);

-- grant permissions
GRANT SELECT ON politica_nao_retaliacao TO anon;
GRANT ALL PRIVILEGES ON politica_nao_retaliacao TO authenticated;

-- Row Level Security (RLS) policies
ALTER TABLE politica_nao_retaliacao ENABLE ROW LEVEL SECURITY;

-- Allow read access to all users
CREATE POLICY "Allow read access" ON politica_nao_retaliacao
    FOR SELECT USING (true);

-- Allow update only to authenticated users
CREATE POLICY "Allow update for authenticated" ON politica_nao_retaliacao
    FOR UPDATE USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');