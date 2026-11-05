-- Migration: CRM Leads Enhancements & Kanban Status Support

-- 1. Alter check constraint on status to support all real estate CRM pipeline stages
ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_status_check;
ALTER TABLE public.leads ADD CONSTRAINT leads_status_check CHECK (
  status IN (
    'novo',
    'em_contato',
    'em_atendimento',
    'visita_agendada',
    'proposta',
    'em_negociacao',
    'fechado',
    'perdido'
  )
);

-- 2. Add extra CRM columns to public.leads safely
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'temperature') THEN
    ALTER TABLE public.leads ADD COLUMN temperature text DEFAULT 'quente';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'loss_reason') THEN
    ALTER TABLE public.leads ADD COLUMN loss_reason text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'next_action') THEN
    ALTER TABLE public.leads ADD COLUMN next_action text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'next_action_date') THEN
    ALTER TABLE public.leads ADD COLUMN next_action_date text;
  END IF;
END $$;

-- 3. Grants and permissions for leads
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO anon, authenticated;

-- 4. Permissive policies for CRM operations
DO $$
BEGIN
  DROP POLICY IF EXISTS "anon_manage_leads" ON public.leads;
  DROP POLICY IF EXISTS "staff_manage_leads" ON public.leads;

  CREATE POLICY "anon_manage_leads" ON public.leads
    FOR ALL TO anon, authenticated
    USING (true)
    WITH CHECK (true);
END $$;

