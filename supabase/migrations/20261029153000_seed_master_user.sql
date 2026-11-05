-- Migration: Seed Master User (Everson Maestro / contato@agenciabipe.com)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Ensure master user exists in auth.users with confirmed email and encrypted password
DO $$
DECLARE
  _user_id uuid;
BEGIN
  SELECT id INTO _user_id FROM auth.users WHERE email = 'contato@agenciabipe.com';
  
  IF _user_id IS NOT NULL THEN
    UPDATE auth.users
    SET 
      encrypted_password = crypt('tato@agen29', gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"full_name":"Everson Maestro"}'::jsonb,
      updated_at = now()
    WHERE id = _user_id;
  ELSE
    _user_id := gen_random_uuid();
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
      'contato@agenciabipe.com',
      crypt('tato@agen29', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Everson Maestro"}'::jsonb,
      now(),
      now(),
      ''
    );
  END IF;

  -- 2. Ensure auth.identities record exists
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
    json_build_object('sub', _user_id::text, 'email', 'contato@agenciabipe.com')::jsonb,
    'email',
    _user_id::text,
    now(),
    now(),
    now()
  ) ON CONFLICT (provider, provider_id) DO NOTHING;

  -- 3. Ensure profile in public.profiles
  INSERT INTO public.profiles (id, full_name, active)
  VALUES (_user_id, 'Everson Maestro', true)
  ON CONFLICT (id) DO UPDATE
  SET full_name = 'Everson Maestro', active = true;

  -- 4. Ensure roles in public.user_roles ('admin' and 'owner')
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'admin'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'owner'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
END $$;

-- 5. Update handle_new_user trigger function to guarantee master permissions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, active)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'full_name', new.email), true)
  ON CONFLICT (id) DO UPDATE
  SET full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
      active = true;

  IF new.email = 'contato@agenciabipe.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (new.id, 'owner') ON CONFLICT DO NOTHING;
    INSERT INTO public.user_roles (user_id, role) VALUES (new.id, 'admin') ON CONFLICT DO NOTHING;
  ELSIF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'owner') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (new.id, 'owner') ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (new.id, 'broker') ON CONFLICT DO NOTHING;
  END IF;
  RETURN new;
END; $$;

-- 6. RPC function to allow on-demand initialization/verification
CREATE OR REPLACE FUNCTION public.ensure_master_user()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  _user_id uuid;
BEGIN
  SELECT id INTO _user_id FROM auth.users WHERE email = 'contato@agenciabipe.com';
  
  IF _user_id IS NOT NULL THEN
    UPDATE auth.users
    SET 
      encrypted_password = crypt('tato@agen29', gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"full_name":"Everson Maestro"}'::jsonb,
      updated_at = now()
    WHERE id = _user_id;
  ELSE
    _user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token
    ) VALUES (
      _user_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'contato@agenciabipe.com',
      crypt('tato@agen29', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Everson Maestro"}'::jsonb,
      now(),
      now(),
      ''
    );
  END IF;

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  ) VALUES (
    _user_id, _user_id, json_build_object('sub', _user_id::text, 'email', 'contato@agenciabipe.com')::jsonb,
    'email', _user_id::text, now(), now(), now()
  ) ON CONFLICT (provider, provider_id) DO NOTHING;

  INSERT INTO public.profiles (id, full_name, active)
  VALUES (_user_id, 'Everson Maestro', true)
  ON CONFLICT (id) DO UPDATE SET full_name = 'Everson Maestro', active = true;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'owner')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN jsonb_build_object('success', true, 'user_id', _user_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_master_user() TO anon, authenticated, service_role;

