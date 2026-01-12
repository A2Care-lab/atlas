-- Policies for invitations table to allow admin and company managers to manage invites
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- View invitations: admin sees all; company managers see their company
CREATE POLICY "Admin can view all invitations" ON invitations
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Managers can view company invitations" ON invitations
  FOR SELECT TO authenticated
  USING (
    company_id = (SELECT company_id FROM public.user_profiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role IN ('admin','corporate_manager','approver_manager')
    )
  );

-- Insert invitations: admin or managers of the company
CREATE POLICY "Managers can insert invitations in their company" ON invitations
  FOR INSERT TO authenticated
  WITH CHECK (
    company_id = (SELECT company_id FROM public.user_profiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role IN ('admin','corporate_manager','approver_manager')
    )
  );

-- Update/Delete invitations: admin or company managers
CREATE POLICY "Managers can update invitations" ON invitations
  FOR UPDATE TO authenticated
  USING (
    company_id = (SELECT company_id FROM public.user_profiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role IN ('admin','corporate_manager','approver_manager')
    )
  );

CREATE POLICY "Managers can delete invitations" ON invitations
  FOR DELETE TO authenticated
  USING (
    company_id = (SELECT company_id FROM public.user_profiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role IN ('admin','corporate_manager','approver_manager')
    )
  );

