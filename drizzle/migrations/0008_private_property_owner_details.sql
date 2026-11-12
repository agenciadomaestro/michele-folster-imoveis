CREATE TABLE public.property_owners (
  property_id uuid PRIMARY KEY REFERENCES public.properties(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT ''
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_owners TO authenticated;
GRANT ALL ON public.property_owners TO service_role;
ALTER TABLE public.property_owners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "assigned staff read owner details" ON public.property_owners FOR SELECT TO authenticated USING (
  public.is_staff(auth.uid()) AND EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND (p.broker_id = auth.uid() OR public.can_view_all(auth.uid())))
);
CREATE POLICY "authorized staff insert owner details" ON public.property_owners FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND public.can_write_property(auth.uid(), p.broker_id))
);
CREATE POLICY "authorized staff update owner details" ON public.property_owners FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND public.can_write_property(auth.uid(), p.broker_id))
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND public.can_write_property(auth.uid(), p.broker_id))
);
CREATE POLICY "authorized staff delete owner details" ON public.property_owners FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND public.can_write_property(auth.uid(), p.broker_id))
);
COMMENT ON TABLE public.property_owners IS 'Private property owner contacts. Never expose in public catalog queries or responses.';