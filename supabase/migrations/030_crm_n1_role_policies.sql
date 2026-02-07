-- Adiciona políticas RLS e trigger para o perfil CRM - N1
-- Permissões: visualizar e atualizar denúncias (sem alterar status), anexos e comentários da própria empresa
-- Bloqueio: impedir alteração de status em reports quando o usuário for CRM - N1

-- Visualizar denúncias da empresa
CREATE POLICY "CRM N1 can view company reports" ON public.reports
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
        AND up.role = 'crm_n1'
        AND up.company_id = reports.company_id
    )
  );

-- Atualizar denúncias da empresa (sem alterar status - ver trigger abaixo)
CREATE POLICY "CRM N1 can update company reports" ON public.reports
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
        AND up.role = 'crm_n1'
        AND up.company_id = reports.company_id
    )
  );

-- Visualizar anexos
CREATE POLICY "CRM N1 can view report attachments" ON public.attachments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.reports r
      WHERE r.id = attachments.report_id
        AND EXISTS (
          SELECT 1 FROM public.user_profiles up
          WHERE up.id = auth.uid()
            AND up.role = 'crm_n1'
            AND up.company_id = r.company_id
        )
    )
  );

-- Adicionar anexos
CREATE POLICY "CRM N1 can add report attachments" ON public.attachments
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.reports r
      WHERE r.id = attachments.report_id
        AND EXISTS (
          SELECT 1 FROM public.user_profiles up
          WHERE up.id = auth.uid()
            AND up.role = 'crm_n1'
            AND up.company_id = r.company_id
        )
    )
  );

-- Visualizar comentários
CREATE POLICY "CRM N1 can view report comments" ON public.comments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.reports r
      WHERE r.id = comments.report_id
        AND EXISTS (
          SELECT 1 FROM public.user_profiles up
          WHERE up.id = auth.uid()
            AND up.role = 'crm_n1'
            AND up.company_id = r.company_id
        )
    )
  );

-- Adicionar comentários
CREATE POLICY "CRM N1 can add report comments" ON public.comments
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.reports r
      WHERE r.id = comments.report_id
        AND EXISTS (
          SELECT 1 FROM public.user_profiles up
          WHERE up.id = auth.uid()
            AND up.role = 'crm_n1'
            AND up.company_id = r.company_id
        )
    )
  );

-- Trigger para impedir alteração de status por CRM - N1
CREATE OR REPLACE FUNCTION public.prevent_crm_n1_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.current_user_role() = 'crm_n1' THEN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'not-allowed: CRM - N1 não pode alterar status da denúncia';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_crm_n1_status_change ON public.reports;
CREATE TRIGGER trg_prevent_crm_n1_status_change
BEFORE UPDATE ON public.reports
FOR EACH ROW
EXECUTE FUNCTION public.prevent_crm_n1_status_change();

