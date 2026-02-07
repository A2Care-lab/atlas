-- Atualiza constraints de roles para incluir 'crm_n1'
DO $$
DECLARE
  up_check_name text;
  inv_check_name text;
BEGIN
  -- Descobrir nome do CHECK em user_profiles.role
  SELECT conname INTO up_check_name
  FROM pg_constraint
  WHERE conrelid = 'public.user_profiles'::regclass
    AND contype = 'c'
    AND conname ILIKE '%role%';

  IF up_check_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.user_profiles DROP CONSTRAINT %I', up_check_name);
  END IF;

  EXECUTE $sql$
    ALTER TABLE public.user_profiles
    ADD CONSTRAINT user_profiles_role_check
    CHECK (role IN ('admin', 'corporate_manager', 'approver_manager', 'crm_n1', 'user'))
  $sql$;

  -- Descobrir nome do CHECK em invitations.role
  SELECT conname INTO inv_check_name
  FROM pg_constraint
  WHERE conrelid = 'public.invitations'::regclass
    AND contype = 'c'
    AND conname ILIKE '%role%';

  IF inv_check_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.invitations DROP CONSTRAINT %I', inv_check_name);
  END IF;

  EXECUTE $sql$
    ALTER TABLE public.invitations
    ADD CONSTRAINT invitations_role_check
    CHECK (role IN ('corporate_manager', 'approver_manager', 'crm_n1', 'user'))
  $sql$;
END $$;

