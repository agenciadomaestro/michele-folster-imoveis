create type public.app_role as enum ('owner','admin','broker');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  creci text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;
create or replace function public.is_staff_manager(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role in ('owner','admin'))
$$;
create or replace function public.is_staff(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id)
$$;

create policy "own profile read" on public.profiles for select to authenticated using (id = auth.uid() or public.is_staff(auth.uid()));
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid() or public.is_staff_manager(auth.uid()));
create policy "own profile insert" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "read own roles" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.is_staff_manager(auth.uid()));

-- First user becomes owner; others get broker
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name) values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email));
  if not exists (select 1 from public.user_roles where role = 'owner') then
    insert into public.user_roles (user_id, role) values (new.id, 'owner');
  else
    insert into public.user_roles (user_id, role) values (new.id, 'broker');
  end if;
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  slug text not null,
  title text not null,
  description text,
  purpose text not null default 'venda' check (purpose in ('venda','locacao','ambos')),
  type text not null,
  state text not null default 'SC',
  city text not null,
  neighborhood text,
  address text,
  show_address boolean not null default false,
  sale_price numeric,
  rent_price numeric,
  condo_fee numeric,
  iptu numeric,
  bedrooms int,
  suites int,
  bathrooms int,
  parking int,
  area_land numeric,
  area_built numeric,
  area_useful numeric,
  features text[] not null default '{}',
  status text not null default 'rascunho' check (status in ('rascunho','publicado','vendido','alugado','arquivado')),
  featured boolean not null default false,
  broker_id uuid,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.properties to anon;
grant select, insert, update, delete on public.properties to authenticated;
grant all on public.properties to service_role;
alter table public.properties enable row level security;
create policy "public read published" on public.properties for select to anon, authenticated using (status = 'publicado' or public.is_staff(auth.uid()));
create policy "staff insert" on public.properties for insert to authenticated with check (public.is_staff(auth.uid()));
create policy "staff update" on public.properties for update to authenticated using (public.is_staff_manager(auth.uid()) or broker_id = auth.uid() or created_by = auth.uid());
create policy "manager delete" on public.properties for delete to authenticated using (public.is_staff_manager(auth.uid()));

create table public.property_photos (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  url text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.property_photos to anon;
grant select, insert, update, delete on public.property_photos to authenticated;
grant all on public.property_photos to service_role;
alter table public.property_photos enable row level security;
create policy "read photos" on public.property_photos for select to anon, authenticated using (
  exists (select 1 from public.properties p where p.id = property_id and (p.status = 'publicado' or public.is_staff(auth.uid()))));
create policy "staff write photos" on public.property_photos for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  phone text not null check (char_length(phone) between 8 and 30),
  email text check (email is null or char_length(email) <= 200),
  message text check (message is null or char_length(message) <= 2000),
  interest text not null default 'informacoes',
  consent boolean not null default false,
  property_id uuid references public.properties(id) on delete set null,
  property_code text,
  source text not null default 'site',
  source_page text,
  status text not null default 'novo' check (status in ('novo','em_atendimento','visita_agendada','proposta','fechado','perdido')),
  broker_id uuid,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant insert on public.leads to anon;
grant select, insert, update, delete on public.leads to authenticated;
grant all on public.leads to service_role;
alter table public.leads enable row level security;
create policy "anyone submits" on public.leads for insert to anon, authenticated with check (consent = true and status = 'novo');
create policy "staff read leads" on public.leads for select to authenticated using (public.is_staff_manager(auth.uid()) or broker_id = auth.uid());
create policy "staff update leads" on public.leads for update to authenticated using (public.is_staff_manager(auth.uid()) or broker_id = auth.uid());
create policy "manager delete leads" on public.leads for delete to authenticated using (public.is_staff_manager(auth.uid()));

-- assign broker from property + block duplicate in 10 min
create or replace function public.lead_before_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.property_id is not null then
    select broker_id, code into new.broker_id, new.property_code from public.properties where id = new.property_id;
  end if;
  if exists (select 1 from public.leads where phone = new.phone and coalesce(property_id::text,'') = coalesce(new.property_id::text,'') and created_at > now() - interval '10 minutes') then
    raise exception 'duplicate_lead';
  end if;
  return new;
end; $$;
create trigger leads_before_insert before insert on public.leads for each row execute function public.lead_before_insert();

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;
create trigger t_prop before update on public.properties for each row execute function public.touch_updated_at();
create trigger t_lead before update on public.leads for each row execute function public.touch_updated_at();

insert into public.properties (code, slug, title, description, purpose, type, city, neighborhood, sale_price, rent_price, bedrooms, suites, bathrooms, parking, area_land, area_built, features, status, featured) values
('CA0531','casa-jardim-america','Casa térrea com jardim e área gourmet','Casa ampla e iluminada, com living integrado, cozinha planejada e área gourmet voltada para o jardim. Localizada em rua tranquila e arborizada.','venda','Casa','Florianópolis','Jurerê',1890000,null,3,1,3,2,450,220,array['Área gourmet','Jardim','Cozinha planejada','Energia solar'],'publicado',true),
('AP0214','apartamento-vista-mar','Apartamento com vista para o mar','Apartamento alto padrão com sacada envidraçada, vista definitiva para o mar e acabamento refinado.','venda','Apartamento','Balneário Camboriú','Centro',2350000,null,3,3,4,2,null,148,array['Vista mar','Sacada com churrasqueira','Piscina','Academia'],'publicado',true),
('AP0388','apartamento-compacto-centro','Apartamento compacto mobiliado','Apartamento mobiliado, próximo a comércios e transporte, ideal para quem busca praticidade.','locacao','Apartamento','Florianópolis','Centro',null,3200,1,0,1,1,null,48,array['Mobiliado','Portaria 24h'],'publicado',true),
('SO0107','sobrado-moderno','Sobrado moderno em condomínio','Sobrado contemporâneo em condomínio fechado com segurança, piscina privativa e pé-direito duplo.','ambos','Sobrado','São José','Pedra Branca',1450000,7800,4,2,4,3,360,280,array['Condomínio fechado','Piscina','Pé-direito duplo'],'publicado',true),
('TE0042','terreno-plano','Terreno plano em loteamento','Terreno plano pronto para construir, em loteamento com infraestrutura completa.','venda','Terreno','Palhoça','Pedra Branca',420000,null,null,null,null,null,420,null,array['Plano','Infraestrutura completa'],'publicado',false),
('SA0019','sala-comercial','Sala comercial em edifício corporativo','Sala comercial com recepção, duas salas e copa, em edifício corporativo com estacionamento.','locacao','Sala comercial','Florianópolis','Trindade',null,4500,null,null,2,2,null,72,array['Recepção','Ar-condicionado','Estacionamento'],'publicado',false);

insert into public.property_photos (property_id, url, position)
select id, '/images/' || lower(code) || '.jpg', 0 from public.properties;
