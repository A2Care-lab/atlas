-- Add SLA (days) to companies table
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS sla_days integer DEFAULT 0 CHECK (sla_days >= 0);
