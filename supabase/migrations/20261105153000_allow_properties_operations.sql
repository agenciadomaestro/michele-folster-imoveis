-- Migration: Permitir operações em properties e property_photos e confirmar e-mail dos administradores

-- 1. Confirmação imediata dos e-mails dos usuários master
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, now())
WHERE email IN ('agbipe@agenciabipe.com', 'contato@agenciabipe.com');

-- 2. Conceder permissões para a role anon e authenticated
GRANT SELECT, INSERT, UPDATE, DELETE ON public.properties TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_photos TO anon, authenticated;

-- 3. Atualizar políticas de Row Level Security (RLS) para permitir cadastro e edição
DO $$
BEGIN
  -- Remove políticas antigas caso existam
  DROP POLICY IF EXISTS "anon_insert_properties" ON public.properties;
  DROP POLICY IF EXISTS "anon_update_properties" ON public.properties;
  DROP POLICY IF EXISTS "anon_delete_properties" ON public.properties;
  DROP POLICY IF EXISTS "anon_manage_property_photos" ON public.property_photos;

  -- Permite inserção, atualização e deleção para operações do sistema
  CREATE POLICY "anon_insert_properties" ON public.properties
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

  CREATE POLICY "anon_update_properties" ON public.properties
    FOR UPDATE TO anon, authenticated
    USING (true)
    WITH CHECK (true);

  CREATE POLICY "anon_delete_properties" ON public.properties
    FOR DELETE TO anon, authenticated
    USING (true);

  CREATE POLICY "anon_manage_property_photos" ON public.property_photos
    FOR ALL TO anon, authenticated
    USING (true)
    WITH CHECK (true);
END $$;
