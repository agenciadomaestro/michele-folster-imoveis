-- Migration: Reassign and Delete Broker (Michele Folster Imóveis)

CREATE OR REPLACE FUNCTION public.reassign_and_delete_broker(
  _broker_id text,
  _target_admin_email text DEFAULT 'michele@michelefolster.com.br'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _target_uuid uuid;
  _michele_id uuid;
  _reassigned_props int := 0;
  _reassigned_leads int := 0;
  _reassigned_msgs int := 0;
BEGIN
  -- Converte _broker_id para UUID se formato for válido
  BEGIN
    _target_uuid := _broker_id::uuid;
  EXCEPTION WHEN OTHERS THEN
    _target_uuid := NULL;
  END;

  -- Localiza UUID oficial da Michele Folster
  SELECT id INTO _michele_id FROM auth.users WHERE email = _target_admin_email LIMIT 1;
  IF _michele_id IS NULL THEN
    SELECT id INTO _michele_id FROM public.profiles WHERE full_name ILIKE '%Michele Folster%' LIMIT 1;
  END IF;

  -- 1. Reatribui Imóveis para a Michele Folster (NÃO apaga nenhum imóvel)
  IF _target_uuid IS NOT NULL THEN
    UPDATE public.properties
    SET broker_id = COALESCE(_michele_id::text, 'corretor-michele')
    WHERE broker_id = _target_uuid::text OR broker_id = _broker_id;
    GET DIAGNOSTICS _reassigned_props = ROW_COUNT;
  ELSE
    UPDATE public.properties
    SET broker_id = COALESCE(_michele_id::text, 'corretor-michele')
    WHERE broker_id = _broker_id;
    GET DIAGNOSTICS _reassigned_props = ROW_COUNT;
  END IF;

  -- 2. Reatribui Leads para a Michele Folster
  IF _target_uuid IS NOT NULL THEN
    UPDATE public.leads
    SET broker_id = COALESCE(_michele_id::text, 'corretor-michele')
    WHERE broker_id = _target_uuid::text OR broker_id = _broker_id;
    GET DIAGNOSTICS _reassigned_leads = ROW_COUNT;
  ELSE
    UPDATE public.leads
    SET broker_id = COALESCE(_michele_id::text, 'corretor-michele')
    WHERE broker_id = _broker_id;
    GET DIAGNOSTICS _reassigned_leads = ROW_COUNT;
  END IF;

  -- 3. Reatribui Mensagens da Central de Contatos
  IF _target_uuid IS NOT NULL THEN
    UPDATE public.messages_leads
    SET corretor_atribuido_id = _michele_id
    WHERE corretor_atribuido_id = _target_uuid;
    GET DIAGNOSTICS _reassigned_msgs = ROW_COUNT;
  END IF;

  -- 4. Remove Permissões e Desativa Perfil do Corretor
  IF _target_uuid IS NOT NULL THEN
    DELETE FROM public.broker_permissions WHERE user_id = _target_uuid;
    UPDATE public.profiles SET active = false WHERE id = _target_uuid;
    
    -- Inativa ou bloqueia login no auth.users
    BEGIN
      UPDATE auth.users 
      SET banned_until = '2999-01-01 00:00:00'::timestamptz 
      WHERE id = _target_uuid;
    EXCEPTION WHEN OTHERS THEN
      -- Se banned_until não estiver disponível, apenas ignora
    END;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'reassigned_properties', _reassigned_props,
    'reassigned_leads', _reassigned_leads,
    'reassigned_messages', _reassigned_msgs
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.reassign_and_delete_broker(text, text) TO anon, authenticated;
