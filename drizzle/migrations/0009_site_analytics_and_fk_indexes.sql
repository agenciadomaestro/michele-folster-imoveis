CREATE TABLE IF NOT EXISTS public.site_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL CHECK (length(session_id) <= 64),
  event_type text NOT NULL CHECK (event_type IN ('page_view','property_view','photo_swipe','whatsapp_click')),
  page_path text NOT NULL CHECK (length(page_path) <= 300),
  property_id uuid,
  traffic_source text NOT NULL DEFAULT 'Acesso Direto' CHECK (length(traffic_source) <= 40),
  duration_seconds integer NOT NULL DEFAULT 0 CHECK (duration_seconds BETWEEN 0 AND 86400),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.site_analytics TO anon, authenticated;
GRANT SELECT ON public.site_analytics TO authenticated;
GRANT ALL ON public.site_analytics TO service_role;
ALTER TABLE public.site_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "analytics public insert" ON public.site_analytics FOR INSERT TO anon, authenticated
  WITH CHECK (duration_seconds = 0 AND page_path NOT LIKE '/admin%');
CREATE POLICY "analytics staff read" ON public.site_analytics FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));
CREATE INDEX IF NOT EXISTS site_analytics_created_at_idx ON public.site_analytics(created_at);
CREATE INDEX IF NOT EXISTS site_analytics_property_id_idx ON public.site_analytics(property_id);

CREATE OR REPLACE FUNCTION public.update_analytics_duration(_id uuid, _seconds integer)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$
  UPDATE public.site_analytics SET duration_seconds = LEAST(GREATEST(_seconds,0),86400)
  WHERE id=_id AND event_type='page_view' AND created_at > now() - interval '1 day'
    AND _seconds > duration_seconds AND _seconds <= extract(epoch FROM now()-created_at)::int + 5;
$$;
REVOKE ALL ON FUNCTION public.update_analytics_duration(uuid,integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_analytics_duration(uuid,integer) TO anon, authenticated;

CREATE INDEX IF NOT EXISTS leads_property_id_idx ON public.leads(property_id);
CREATE INDEX IF NOT EXISTS property_photos_property_id_idx ON public.property_photos(property_id);