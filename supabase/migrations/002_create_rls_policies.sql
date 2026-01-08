-- Habilitar RLS nas tabelas
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_reasons ENABLE ROW LEVEL SECURITY;

-- Políticas para companies (apenas admin pode tudo)
CREATE POLICY "Admin can view all companies" ON companies
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY "Admin can insert companies" ON companies
    FOR INSERT TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY "Admin can update companies" ON companies
    FOR UPDATE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() AND role = 'admin'
    ));

-- Políticas para user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT TO authenticated
    USING (id = auth.uid());

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE TO authenticated
    USING (id = auth.uid());

CREATE POLICY "Admin can view all profiles" ON user_profiles
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY "Corporate managers can view company profiles" ON user_profiles
    FOR SELECT TO authenticated
    USING (
        company_id = (SELECT company_id FROM user_profiles WHERE id = auth.uid())
        AND EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'corporate_manager', 'approver_manager')
        )
    );

-- Políticas para reports
CREATE POLICY "Users can view own reports" ON reports
    FOR SELECT TO authenticated
    USING (
        user_id = auth.uid() 
        OR EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'corporate_manager', 'approver_manager')
            AND company_id = reports.company_id
        )
    );

CREATE POLICY "Users can create reports" ON reports
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND company_id = reports.company_id
        )
    );

CREATE POLICY "Corporate managers can update reports" ON reports
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'corporate_manager', 'approver_manager')
            AND company_id = reports.company_id
        )
    );

-- Políticas para attachments
CREATE POLICY "Users can view report attachments" ON attachments
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM reports 
            WHERE id = attachments.report_id 
            AND (
                reports.user_id = auth.uid() 
                OR EXISTS (
                    SELECT 1 FROM user_profiles 
                    WHERE id = auth.uid() AND role IN ('admin', 'corporate_manager', 'approver_manager')
                    AND company_id = reports.company_id
                )
            )
        )
    );

CREATE POLICY "Users can add attachments" ON attachments
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM reports 
            WHERE id = attachments.report_id 
            AND (
                reports.user_id = auth.uid() 
                OR EXISTS (
                    SELECT 1 FROM user_profiles 
                    WHERE id = auth.uid() AND role IN ('admin', 'corporate_manager', 'approver_manager')
                    AND company_id = reports.company_id
                )
            )
        )
    );

-- Políticas para comments
CREATE POLICY "Users can view report comments" ON comments
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM reports 
            WHERE id = comments.report_id 
            AND (
                reports.user_id = auth.uid() 
                OR EXISTS (
                    SELECT 1 FROM user_profiles 
                    WHERE id = auth.uid() AND role IN ('admin', 'corporate_manager', 'approver_manager')
                    AND company_id = reports.company_id
                )
            )
        )
    );

CREATE POLICY "Users can add comments" ON comments
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM reports 
            WHERE id = comments.report_id 
            AND (
                reports.user_id = auth.uid() 
                OR EXISTS (
                    SELECT 1 FROM user_profiles 
                    WHERE id = auth.uid() AND role IN ('admin', 'corporate_manager', 'approver_manager')
                    AND company_id = reports.company_id
                )
            )
        )
    );

-- Políticas para status_history
CREATE POLICY "Users can view status history" ON status_history
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM reports 
            WHERE id = status_history.report_id 
            AND (
                reports.user_id = auth.uid() 
                OR EXISTS (
                    SELECT 1 FROM user_profiles 
                    WHERE id = auth.uid() AND role IN ('admin', 'corporate_manager', 'approver_manager')
                    AND company_id = reports.company_id
                )
            )
        )
    );

CREATE POLICY "Corporate managers can update status" ON status_history
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'corporate_manager', 'approver_manager')
            AND EXISTS (
                SELECT 1 FROM reports 
                WHERE id = status_history.report_id 
                AND company_id = user_profiles.company_id
            )
        )
    );

-- Conceder permissões básicas
GRANT SELECT ON companies TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON user_profiles TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON invitations TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON reports TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON attachments TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON comments TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON status_history TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON report_reasons TO anon, authenticated;