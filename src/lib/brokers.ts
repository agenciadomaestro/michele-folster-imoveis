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
  is_hidden: true, // Totalmente oculto de listagens públicas e da equipe da imobiliária
  permissions: {
    pode_cadastrar_imovel: true,
    pode_ver_ofertas_gerais: true,
    pode_ver_captacoes: true,
  },
  created_at: "2026-01-01T00:00:00.000Z",
};

export const INITIAL_BROKERS: Broker[] = [
  {
    id: "corretor-michele",
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
    id: "corretor-marcos",
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
      pode_ver_ofertas_gerais: false, // Apenas suas ofertas e leads por padrão
      pode_ver_captacoes: true,       // Pode ver captações
    },
    created_at: "2026-02-15T14:30:00.000Z",
  },
  {
    id: "corretor-patricia",
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

export function saveLocalBroker(broker: Broker): Broker {
  if (typeof window === "undefined") return broker;
  try {
    const current = getLocalBrokers(false);
    const index = current.findIndex((b) => b.id === broker.id || b.email.toLowerCase() === broker.email.toLowerCase());
    let updated: Broker[];
    if (index >= 0) {
      updated = [...current];
      updated[index] = { ...current[index], ...broker };
    } else {
      updated = [broker, ...current];
    }
    localStorage.setItem(LOCAL_STORAGE_BROKERS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn("Aviso ao salvar corretor localmente:", e);
  }
  return broker;
}

export function updateBrokerPermissions(
  brokerId: string,
  newPermissions: Partial<BrokerPermissions>
): void {
  if (typeof window === "undefined") return;
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

    // Sincroniza em segundo plano com Supabase se disponível
    Promise.resolve(
      supabase
        .from("broker_permissions" as any)
        .upsert({
          user_id: brokerId,
          ...newPermissions,
          updated_at: new Date().toISOString(),
        })
    ).catch(() => {});
  } catch (e) {
    console.warn("Erro ao atualizar permissões do corretor:", e);
  }
}

export function updateBrokerStatus(brokerId: string, active: boolean): void {
  if (typeof window === "undefined") return;
  try {
    const current = getLocalBrokers(false);
    const updated = current.map((b) => (b.id === brokerId ? { ...b, active } : b));
    localStorage.setItem(LOCAL_STORAGE_BROKERS_KEY, JSON.stringify(updated));

    Promise.resolve(
      supabase
        .from("profiles")
        .update({ active })
        .eq("id", brokerId)
    ).catch(() => {});
  } catch {}
}

export function deleteLocalBroker(brokerId: string): void {
  if (typeof window === "undefined") return;
  try {
    const current = getLocalBrokers(false);
    const filtered = current.filter((b) => b.id !== brokerId);
    localStorage.setItem(LOCAL_STORAGE_BROKERS_KEY, JSON.stringify(filtered));
  } catch {}
}

/**
 * Retorna o perfil completo do usuário autenticado no momento,
 * calculando sua role (super_admin, admin ou corretor) e permissões granulares.
 */
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

  // 1. Super Admin (Master Agência - Oculto/Privado)
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

  // 2. Admin Imobiliária (Michele Folster)
  if (
    email === "michele@michelefolster.com.br" ||
    email.includes("michele") ||
    (storedUser && storedUser.email?.includes("michele"))
  ) {
    return {
      id: authUser?.id || "corretor-michele",
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

  // 3. Corretor cadastrado
  const brokers = getLocalBrokers(false);
  const matched = brokers.find((b) => b.email.toLowerCase() === email || b.id === authUser?.id);

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

  // Padrão de fallback
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
