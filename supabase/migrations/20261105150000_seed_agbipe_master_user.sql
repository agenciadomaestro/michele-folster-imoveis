-- Migration: Seed Master User (agbipe / agb0511)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  _user_id uuid;
BEGIN
  SELECT id INTO _user_id FROM auth.users WHERE email = 'agbipe@agenciabipe.com';
  
  IF _user_id IS NOT NULL THEN
    UPDATE auth.users
    SET 
      encrypted_password = crypt('agb0511', gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"full_name":"Master Agbipe"}'::jsonb,
      updated_at = now()
    WHERE id = _user_id;
  ELSE
    _user_id := 'abb75384-d851-45fe-b7dd-c870c48b55f3'::uuid;
    INSERT INTO auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token
    ) VALUES (
      _user_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'agbipe@agenciabipe.com',
      crypt('agb0511', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Master Agbipe"}'::jsonb,
      now(),
      now(),
      ''
    ) ON CONFLICT (id) DO UPDATE
    SET encrypted_password = crypt('agb0511', gen_salt('bf')),
        email = 'agbipe@agenciabipe.com',
        email_confirmed_at = now(),
        updated_at = now();
  END IF;

  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    _user_id,
    _user_id,
    json_build_object('sub', _user_id::text, 'email', 'agbipe@agenciabipe.com')::jsonb,
    'email',
    _user_id::text,
    now(),
    now(),
    now()
  ) ON CONFLICT (provider, provider_id) DO NOTHING;

  INSERT INTO public.profiles (id, full_name, active)
  VALUES (_user_id, 'Master Agbipe', true)
  ON CONFLICT (id) DO UPDATE
  SET full_name = 'Master Agbipe', active = true;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'admin'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'owner'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
END $$;

