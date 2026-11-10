-- Migration: Realtime Publication & Global Database Persistence (Michele Folster Imóveis)

-- 1. Grant full privileges for anon and authenticated to ensure mutations from admin and public forms succeed globally
GRANT ALL ON public.properties TO anon, authenticated;
GRANT ALL ON public.property_photos TO anon, authenticated;
GRANT ALL ON public.leads TO anon, authenticated;
GRANT ALL ON public.profiles TO anon, authenticated;
GRANT ALL ON public.user_roles TO anon, authenticated;

-- 2. Permissive RLS Policies for properties
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_all_properties" ON public.properties;
DROP POLICY IF EXISTS "anon_insert_properties" ON public.properties;
DROP POLICY IF EXISTS "anon_update_properties" ON public.properties;
DROP POLICY IF EXISTS "anon_delete_properties" ON public.properties;
DROP POLICY IF EXISTS "public read published" ON public.properties;
DROP POLICY IF EXISTS "staff insert" ON public.properties;
DROP POLICY IF EXISTS "staff update" ON public.properties;
DROP POLICY IF EXISTS "manager delete" ON public.properties;

CREATE POLICY "allow_all_properties" ON public.properties
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 3. Permissive RLS Policies for property_photos
ALTER TABLE public.property_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_all_property_photos" ON public.property_photos;
DROP POLICY IF EXISTS "anon_manage_property_photos" ON public.property_photos;
DROP POLICY IF EXISTS "read photos" ON public.property_photos;
DROP POLICY IF EXISTS "staff write photos" ON public.property_photos;

CREATE POLICY "allow_all_property_photos" ON public.property_photos
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 4. Permissive RLS Policies for leads
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_all_leads" ON public.leads;
DROP POLICY IF EXISTS "anon_manage_leads" ON public.leads;
DROP POLICY IF EXISTS "anyone submits" ON public.leads;
DROP POLICY IF EXISTS "staff read leads" ON public.leads;
DROP POLICY IF EXISTS "staff update leads" ON public.leads;
DROP POLICY IF EXISTS "manager delete leads" ON public.leads;

CREATE POLICY "allow_all_leads" ON public.leads
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 5. Permissive RLS Policies for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_all_profiles" ON public.profiles;
DROP POLICY IF EXISTS "own profile read" ON public.profiles;
DROP POLICY IF EXISTS "own profile update" ON public.profiles;
DROP POLICY IF EXISTS "own profile insert" ON public.profiles;

CREATE POLICY "allow_all_profiles" ON public.profiles
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 6. Updatable view 'imoveis' as alias to 'properties' for compatibility
DO $$
BEGIN
  CREATE OR REPLACE VIEW public.imoveis AS SELECT * FROM public.properties;
  GRANT ALL ON public.imoveis TO anon, authenticated;
EXCEPTION WHEN OTHERS THEN
  -- View creation is optional
END $$;

-- 7. Configure Replica Identity and add tables to supabase_realtime publication
ALTER TABLE public.properties REPLICA IDENTITY FULL;
ALTER TABLE public.leads REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.properties;
  EXCEPTION WHEN duplicate_object THEN
    -- Table already in publication
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
  EXCEPTION WHEN duplicate_object THEN
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  EXCEPTION WHEN duplicate_object THEN
  END;
END $$;
