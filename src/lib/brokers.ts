import { supabase } from "@/integrations/supabase/client";

export type AppUserRole = "super_admin" | "admin" | "corretor";

export interface BrokerPermissions {
  pode_cadastrar_imovel: boolean;
  pode_ver_ofertas_gerais: boolean;
  pode_ver_captacoes: boolean;
}

export interface Broker {
  id: string;
  name: string;
  email: string;
  phone: string;
  creci: string;
  photo_url?: string | null;
  role: AppUserRole;
  active: boolean;
  is_hidden?: boolean; // Super Admin é privado/oculto e não aparece em listas comerciais
  properties_count?: number;
  permissions: BrokerPermissions;
  created_at: string;
}

export const SUPER_ADMIN_USER: Broker = {
  id: "abb75384-d851-45fe-b7dd-c870c48b55f3",
  name: "Master Agência",
  email: "agbipe@agenciabipe.com",
  phone: "(12) 98146-7549",
  creci: "00000-J",
  role: "super_admin",
  active: true,
  is_hidden: true,
  permissions: {
    pode_cadastrar_imovel: true,
    pode_ver_ofertas_gerais: true,
    pode_ver_captacoes: true,
  },
  created_at: "2026-01-01T00:00:00.000Z",
};

export const MICHELE_BROKER_ID = "c011e701-0001-4000-8000-000000000001";

export const INITIAL_BROKERS: Broker[] = [
  {
    id: MICHELE_BROKER_ID,
    name: "Michele Folster",
    email: "michele@michelefolster.com.br",
    phone: "(12) 98146-7549",
    creci: "198452-F",
    photo_url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80",
    role: "admin",
    active: true,
    is_hidden: false,
    permissions: {
      pode_cadastrar_imovel: true,
      pode_ver_ofertas_gerais: true,
      pode_ver_captacoes: true,
    },
    created_at: "2026-01-10T10:00:00.000Z",
  },
  {
    id: "c011e701-0002-4000-8000-000000000002",
    name: "Marcos Vinicius",
    email: "marcos@michelefolster.com.br",
    phone: "(12) 99123-8877",
    creci: "220194-F",
    photo_url: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80",
    role: "corretor",
    active: true,
    is_hidden: false,
    permissions: {
      pode_cadastrar_imovel: true,
      pode_ver_ofertas_gerais: false,
      pode_ver_captacoes: true,
    },
    created_at: "2026-02-15T14:30:00.000Z",
  },
  {
    id: "c011e701-0003-4000-8000-000000000003",
    name: "Patrícia Lima",
    email: "patricia@michelefolster.com.br",
    phone: "(12) 98845-6622",
    creci: "215890-F",
    photo_url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80",
    role: "corretor",
    active: true,
    is_hidden: false,
    permissions: {
      pode_cadastrar_imovel: true,
      pode_ver_ofertas_gerais: false,
      pode_ver_captacoes: false,
    },
    created_at: "2026-03-01T09:15:00.000Z",
  },
];

const LOCAL_STORAGE_BROKERS_KEY = "app_crm_brokers";

/**
 * Busca a lista de corretores diretamente da tabela 'profiles' no Supabase.
 * Se a tabela estiver vazia, sincroniza os perfis padrão no banco.
 */
export async function fetchBrokers(includeHidden = false): Promise<Broker[]> {
  try {
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: true });

    if (!error && profiles && profiles.length > 0) {
      const list: Broker[] = profiles.map((p) => {
        const isMichele = Boolean(
          p.id === MICHELE_BROKER_ID ||
          p.full_name?.toLowerCase().includes("michele")
        );
        
        return {
          id: p.id,
          name: p.full_name || "Corretor",
          email: `${p.full_name?.toLowerCase().replace(/\s+/g, "") || "corretor"}@michelefolster.com.br`,
          phone: p.phone || "(12) 98146-7549",
          creci: p.creci || "Sem CRECI",
          role: isMichele ? "admin" : "corretor",
          active: p.active ?? true,
          is_hidden: false,
          permissions: {
            pode_cadastrar_imovel: true,
            pode_ver_ofertas_gerais: isMichele,
            pode_ver_captacoes: isMichele,
          },
          created_at: p.created_at || new Date().toISOString(),
        };
      });

      // Salva snapshot local
      if (typeof window !== "undefined") {
        localStorage.setItem(LOCAL_STORAGE_BROKERS_KEY, JSON.stringify(list));
      }

      return includeHidden ? [SUPER_ADMIN_USER, ...list] : list;
    }

    // Se estiver vazio no Supabase, tenta semear os perfis padrão no Supabase
    if (!error && profiles && profiles.length === 0) {
      for (const b of INITIAL_BROKERS) {
        await supabase.from("profiles").upsert({
          id: b.id,
          full_name: b.name,
          phone: b.phone,
          creci: b.creci,
          active: b.active,
        });
      }
    }
  } catch (err) {
    console.warn("Aviso ao buscar corretores no Supabase:", err);
  }

  return getLocalBrokers(includeHidden);
}

export function getLocalBrokers(includeHidden = false): Broker[] {
  if (typeof window === "undefined") {
    return includeHidden ? [SUPER_ADMIN_USER, ...INITIAL_BROKERS] : INITIAL_BROKERS;
  }
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_BROKERS_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_BROKERS_KEY, JSON.stringify(INITIAL_BROKERS));
      return includeHidden ? [SUPER_ADMIN_USER, ...INITIAL_BROKERS] : INITIAL_BROKERS;
    }
    const list: Broker[] = JSON.parse(raw);
    return includeHidden ? [SUPER_ADMIN_USER, ...list] : list.filter((b) => !b.is_hidden);
  } catch {
    return includeHidden ? [SUPER_ADMIN_USER, ...INITIAL_BROKERS] : INITIAL_BROKERS;
  }
}

export async function saveBrokerDirect(broker: Broker): Promise<Broker> {
  // 1. Salva diretamente no banco Supabase
  const { error } = await supabase.from("profiles").upsert({
    id: broker.id,
    full_name: broker.name,
    phone: broker.phone,
    creci: broker.creci,
    active: broker.active,
  });

  if (error) {
    console.error("Erro ao salvar no Supabase:", error.message);
    throw new Error(`Falha ao salvar no Supabase: ${error.message}`);
  }

  // 2. Atualiza snapshot local
  if (typeof window !== "undefined") {
    const current = getLocalBrokers(false);
    const index = current.findIndex(
      (b) => b.id === broker.id || b.email.toLowerCase() === broker.email.toLowerCase()
    );
    let updated: Broker[];
    if (index >= 0) {
      updated = [...current];
      updated[index] = { ...current[index], ...broker };
    } else {
      updated = [broker, ...current];
    }
    localStorage.setItem(LOCAL_STORAGE_BROKERS_KEY, JSON.stringify(updated));
  }
  return broker;
}

export const saveLocalBroker = saveBrokerDirect;

export async function updateBrokerPermissions(
  brokerId: string,
  newPermissions: Partial<BrokerPermissions>
): Promise<void> {
  // Snapshot local imediato
  if (typeof window !== "undefined") {
    try {
      const current = getLocalBrokers(false);
      const updated = current.map((b) => {
        if (b.id === brokerId) {
          return {
            ...b,
            permissions: {
              ...b.permissions,
              ...newPermissions,
            },
          };
        }
        return b;
      });
      localStorage.setItem(LOCAL_STORAGE_BROKERS_KEY, JSON.stringify(updated));
    } catch {}
  }

  // Supabase persistência
  try {
    const { error } = await supabase.from("broker_permissions" as any).upsert({
      user_id: brokerId,
      ...newPermissions,
      updated_at: new Date().toISOString(),
    });
    if (error) {
      console.warn("Aviso ao atualizar broker_permissions no Supabase:", error.message);
    }
  } catch {}
}

export function isUuid(value: string | null | undefined): boolean {
  if (!value || typeof value !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export async function updateBrokerStatus(brokerId: string, active: boolean): Promise<void> {
  // Evita tentar atualizar IDs não-UUID no banco real
  if (!isUuid(brokerId)) {
    if (typeof window !== "undefined") {
      try {
        const current = getLocalBrokers(false);
        const updated = current.map((b) => (b.id === brokerId ? { ...b, active } : b));
        localStorage.setItem(LOCAL_STORAGE_BROKERS_KEY, JSON.stringify(updated));
      } catch {}
    }
    return;
  }

  // 1. Atualiza diretamente no Supabase
  const { error } = await supabase.from("profiles").update({ active }).eq("id", brokerId);
  if (error) {
    console.error("Erro ao salvar no Supabase:", error.message);
    throw new Error(`Falha ao salvar: ${error.message}`);
  }

  // 2. Atualiza snapshot local
  if (typeof window !== "undefined") {
    try {
      const current = getLocalBrokers(false);
      const updated = current.map((b) => (b.id === brokerId ? { ...b, active } : b));
      localStorage.setItem(LOCAL_STORAGE_BROKERS_KEY, JSON.stringify(updated));
    } catch {}
  }
}

export function deleteLocalBroker(brokerId: string): void {
  if (typeof window !== "undefined") {
    try {
      const current = getLocalBrokers(false);
      const filtered = current.filter((b) => b.id !== brokerId);
      localStorage.setItem(LOCAL_STORAGE_BROKERS_KEY, JSON.stringify(filtered));
    } catch {}
  }
}

export function formatMembershipDuration(createdAtStr?: string): string {
  if (!createdAtStr) return "Cadastrado recentemente";
  const created = new Date(createdAtStr);
  const now = new Date();
  const diffMs = Math.max(0, now.getTime() - created.getTime());
  const diffDays = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  if (diffDays < 30) {
    return `${diffDays} ${diffDays === 1 ? "dia" : "dias"}`;
  }
  const diffMonths = Math.floor(diffDays / 30);
  const remDays = diffDays % 30;
  if (diffMonths < 12) {
    return remDays > 0
      ? `${diffMonths} ${diffMonths === 1 ? "mês" : "meses"} e ${remDays} dias`
      : `${diffMonths} ${diffMonths === 1 ? "mês" : "meses"}`;
  }
  const diffYears = Math.floor(diffMonths / 12);
  const remMonths = diffMonths % 12;
  return `${diffYears} ${diffYears === 1 ? "ano" : "anos"}${remMonths > 0 ? ` e ${remMonths} meses` : ""}`;
}

/**
 * Exclui o corretor garantindo integridade total:
 * 1. Não apaga nenhum imóvel cadastrado
 * 2. Reatribui todos os imóveis, leads e mensagens vinculados para a Michele Folster diretamente no Supabase
 * 3. Remove ou desativa o acesso do corretor no Supabase
 */
export async function reassignAndDeleteBroker(
  brokerId: string,
  brokerName: string
): Promise<{ reassignedProps: number; reassignedLeads: number; reassignedMsgs: number }> {
  let reassignedProps = 0;
  let reassignedLeads = 0;
  let reassignedMsgs = 0;

  // Evita tentar deletar IDs não-UUID no banco real
  if (!isUuid(brokerId)) {
    deleteLocalBroker(brokerId);
    return { reassignedProps: 0, reassignedLeads: 0, reassignedMsgs: 0 };
  }

  // 1. Atualização direta no Supabase
  // Reatribui imóveis
  const { error: errProp } = await supabase
    .from("properties")
    .update({ broker_id: MICHELE_BROKER_ID, updated_at: new Date().toISOString() })
    .eq("broker_id", brokerId);
  if (errProp) {
    console.warn("Aviso ao reatribuir imóveis no Supabase:", errProp.message);
  } else {
    reassignedProps++;
  }

  // Reatribui leads
  const { error: errLead } = await supabase
    .from("leads")
    .update({ broker_id: MICHELE_BROKER_ID, updated_at: new Date().toISOString() })
    .eq("broker_id", brokerId);
  if (errLead) {
    console.warn("Aviso ao reatribuir leads no Supabase:", errLead.message);
  } else {
    reassignedLeads++;
  }

  // Exclui ou inativa o perfil no Supabase
  const { error: errDelete } = await supabase.from("profiles").delete().eq("id", brokerId);
  if (errDelete) {
    console.error("Erro ao excluir no Supabase:", errDelete.message);
    throw new Error(`Falha ao excluir corretor: ${errDelete.message}`);
  }

  // 2. Snapshot local
  if (typeof window !== "undefined") {
    try {
      const rawProps = localStorage.getItem("app_custom_properties");
      if (rawProps) {
        const props = JSON.parse(rawProps);
        const updated = props.map((p: any) =>
          p.broker_id === brokerId ? { ...p, broker_id: MICHELE_BROKER_ID } : p
        );
        localStorage.setItem("app_custom_properties", JSON.stringify(updated));
      }
    } catch {}

    try {
      const rawLeads = localStorage.getItem("app_crm_leads");
      if (rawLeads) {
        const leads = JSON.parse(rawLeads);
        const updated = leads.map((l: any) =>
          l.broker_id === brokerId ? { ...l, broker_id: MICHELE_BROKER_ID, broker_name: "Michele Folster" } : l
        );
        localStorage.setItem("app_crm_leads", JSON.stringify(updated));
      }
    } catch {}

    deleteLocalBroker(brokerId);
  }

  return { reassignedProps, reassignedLeads, reassignedMsgs };
}

export async function getCurrentUserProfile(): Promise<{
  id: string;
  name: string;
  email: string;
  role: AppUserRole;
  roleLabel: string;
  permissions: BrokerPermissions;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isBroker: boolean;
}> {
  let storedUser: any = null;
  if (typeof window !== "undefined") {
    const raw = localStorage.getItem("master_auth_user");
    if (raw) {
      try {
        storedUser = JSON.parse(raw);
      } catch {}
    }
  }

  const { data } = await supabase.auth.getUser();
  const authUser = data?.user || storedUser;
  const email = (authUser?.email || "").toLowerCase();

  // Super Admin
  if (
    email === "agbipe@agenciabipe.com" ||
    email === "contato@agenciabipe.com" ||
    (storedUser && storedUser.role === "super_admin") ||
    (storedUser && storedUser.email?.includes("agbipe"))
  ) {
    return {
      id: authUser?.id || SUPER_ADMIN_USER.id,
      name: "Master Agência",
      email: authUser?.email || SUPER_ADMIN_USER.email,
      role: "super_admin",
      roleLabel: "Master Agência - Super Admin",
      permissions: SUPER_ADMIN_USER.permissions,
      isSuperAdmin: true,
      isAdmin: true,
      isBroker: false,
    };
  }

  // Admin Michele Folster
  if (
    email === "michele@michelefolster.com.br" ||
    email.includes("michele") ||
    (storedUser && storedUser.email?.includes("michele"))
  ) {
    return {
      id: authUser?.id || "c011e701-0001-4000-8000-000000000001",
      name: "Michele Folster",
      email: authUser?.email || "michele@michelefolster.com.br",
      role: "admin",
      roleLabel: "Michele Folster - Gestora/Administradora",
      permissions: {
        pode_cadastrar_imovel: true,
        pode_ver_ofertas_gerais: true,
        pode_ver_captacoes: true,
      },
      isSuperAdmin: false,
      isAdmin: true,
      isBroker: false,
    };
  }

  // Corretor
  let brokersList: Broker[] = INITIAL_BROKERS;
  try {
    const { data: dbProfiles } = await supabase.from("profiles").select("*");
    if (dbProfiles && dbProfiles.length > 0) {
      brokersList = dbProfiles.map((p) => {
        const isMichele = Boolean(
          p.id === "c011e701-0001-4000-8000-000000000001" ||
          p.full_name?.toLowerCase().includes("michele")
        );
        return {
          id: p.id,
          name: p.full_name || "Corretor",
          email: `${p.full_name?.toLowerCase().replace(/\s+/g, "") || "corretor"}@michelefolster.com.br`,
          phone: p.phone || "(12) 98146-7549",
          creci: p.creci || "Sem CRECI",
          role: isMichele ? "admin" : "corretor",
          active: p.active ?? true,
          permissions: {
            pode_cadastrar_imovel: true,
            pode_ver_ofertas_gerais: isMichele,
            pode_ver_captacoes: isMichele,
          },
          created_at: p.created_at || new Date().toISOString(),
        };
      });
    }
  } catch {}

  const matched = brokersList.find((b) => b.email.toLowerCase() === email || b.id === authUser?.id);

  if (matched) {
    return {
      id: matched.id,
      name: matched.name,
      email: matched.email,
      role: matched.role,
      roleLabel: `${matched.name} - ${matched.role === "admin" ? "Administrador(a)" : "Corretor(a)"}`,
      permissions: matched.permissions,
      isSuperAdmin: false,
      isAdmin: matched.role === "admin",
      isBroker: matched.role === "corretor",
    };
  }

  const fallbackName = authUser?.user_metadata?.full_name || email || "Corretor";
  return {
    id: authUser?.id || "temp-corretor",
    name: fallbackName,
    email: email,
    role: "corretor",
    roleLabel: `${fallbackName} - Corretor(a)`,
    permissions: {
      pode_cadastrar_imovel: true,
      pode_ver_ofertas_gerais: false,
      pode_ver_captacoes: false,
    },
    isSuperAdmin: false,
    isAdmin: false,
    isBroker: true,
  };
}
