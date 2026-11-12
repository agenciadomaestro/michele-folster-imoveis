ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_status_check;
ALTER TABLE public.leads ADD CONSTRAINT leads_status_check CHECK (status IN (
  'novo', 'em_contato', 'visita_agendada', 'proposta_feita', 'em_negociacao', 'fechado', 'perdido',
  'em_atendimento', 'proposta',
  'Novo', 'Novo / Não Atendido', 'Em Contato', 'Visita Agendada', 'Proposta Feita', 'Em Negociação', 'Fechado', 'Fechado / Ganho', 'Perdido', 'Arquivado / Perdido',
  'novo / não atendido', 'em contato', 'visita agendada', 'proposta feita', 'em negociação', 'fechado / ganho', 'arquivado / perdido'
)) NOT VALID;
ALTER TABLE public.leads VALIDATE CONSTRAINT leads_status_check;
GRANT DELETE ON public.leads TO authenticated;
DROP POLICY IF EXISTS "lead manager delete" ON public.leads;
CREATE POLICY "lead manager delete" ON public.leads FOR DELETE TO authenticated USING (public.is_staff_manager(auth.uid()));
-- History is stored in leads.timeline and is deleted with its parent row.
-- Preserve cascade deletion if a separate activities table is installed later or exists in another environment.
DO $$
DECLARE fk record;
BEGIN
  IF to_regclass('public.lead_activities') IS NOT NULL THEN
    FOR fk IN
      SELECT c.conname, pg_get_constraintdef(c.oid) AS definition
      FROM pg_constraint c
      JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
      WHERE c.conrelid = 'public.lead_activities'::regclass
        AND c.contype = 'f' AND c.confrelid = 'public.leads'::regclass
        AND a.attname = 'lead_id' AND c.confdeltype <> 'c'
    LOOP
      EXECUTE format('ALTER TABLE public.lead_activities DROP CONSTRAINT %I', fk.conname);
      EXECUTE format('ALTER TABLE public.lead_activities ADD CONSTRAINT %I %s', fk.conname,
        regexp_replace(fk.definition, ' ON DELETE (NO ACTION|RESTRICT|SET NULL|SET DEFAULT)', '') || ' ON DELETE CASCADE');
    END LOOP;
  END IF;
END $$;