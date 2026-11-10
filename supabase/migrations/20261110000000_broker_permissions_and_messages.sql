-- Migration: Broker Permissions & Messages Leads (Michele Folster Imóveis)

-- 1. Table for Messages & Leads received via site
CREATE TABLE IF NOT EXISTS public.messages_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL DEFAULT 'imovel', -- 'imovel' | 'captacao' | 'geral'
  nome_cliente text NOT NULL,
  telefone_cliente text NOT NULL,
  email_cliente text,
  interesse text NOT NULL,
  mensagem text,
  imovel_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  codigo_imovel text,
  titulo_imovel text,
  corretor_atribuido_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pendente', -- 'pendente' | 'em_atendimento' | 'concluido'
  tipo_imovel text,
  cidade_bairro text,
  valor_pretendido numeric,
  foto_imovel_url text,
  dados_cliente jsonb DEFAULT '{}'::jsonb,
  data_envio timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- 2. Table for Granular Broker Permissions
CREATE TABLE IF NOT EXISTS public.broker_permissions (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  pode_cadastrar_imovel boolean DEFAULT true,
  pode_ver_ofertas_gerais boolean DEFAULT false,
  pode_ver_captacoes boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Setup Storage Bucket for Captações
INSERT INTO storage.buckets (id, name, public)
VALUES ('captacoes', 'captacoes', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 4. Storage Policies for captacoes bucket
DO $$
BEGIN
  DROP POLICY IF EXISTS "Public can upload property photos" ON storage.objects;
  DROP POLICY IF EXISTS "Public can view captacoes photos" ON storage.objects;

  CREATE POLICY "Public can upload property photos"
    ON storage.objects FOR INSERT
    TO anon, authenticated
    WITH CHECK (bucket_id = 'captacoes');

  CREATE POLICY "Public can view captacoes photos"
    ON storage.objects FOR SELECT
    TO anon, authenticated
    USING (bucket_id = 'captacoes');
END $$;

-- 5. RLS Policies and Grants for messages_leads
ALTER TABLE public.messages_leads ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages_leads TO anon, authenticated;

DO $$
BEGIN
  DROP POLICY IF EXISTS "allow_all_messages_leads" ON public.messages_leads;
  CREATE POLICY "allow_all_messages_leads" ON public.messages_leads
    FOR ALL TO anon, authenticated
    USING (true)
    WITH CHECK (true);
END $$;

-- 6. RLS Policies and Grants for broker_permissions
ALTER TABLE public.broker_permissions ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.broker_permissions TO anon, authenticated;

DO $$
BEGIN
  DROP POLICY IF EXISTS "allow_all_broker_permissions" ON public.broker_permissions;
  CREATE POLICY "allow_all_broker_permissions" ON public.broker_permissions
    FOR ALL TO anon, authenticated
    USING (true)
    WITH CHECK (true);
END $$;
