import { supabase } from "@/integrations/supabase/client";

export type LeadStatus =
  | "novo"
  | "em_contato"
  | "visita_agendada"
  | "proposta"
  | "em_negociacao"
  | "fechado"
  | "perdido";

export type LeadTemperature = "quente" | "morno" | "frio";
export type TransactionType = "comprar" | "alugar" | "ambos";

export interface LeadActivity {
  id: string;
  created_at: string;
  author_name: string;
  type: "note" | "status_change" | "appointment" | "contact" | "broker_assigned";
  content: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string | null | undefined;
  message?: string | null | undefined;
  interest?: string | undefined;
  consent?: boolean | undefined;
  property_id?: string | null | undefined;
  property_code?: string | null | undefined;
  property_title?: string | null | undefined;
  property_price?: number | null | undefined;
  source: string; // "site" | "meta_ads" | "portal" | "indicacao" | "whatsapp"
  source_page?: string | null | undefined;
  status: LeadStatus;
  temperature: LeadTemperature;
  transaction_type: TransactionType;
  broker_id?: string | null | undefined;
  broker_name?: string | null | undefined;
  notes?: string | null | undefined;
  loss_reason?: string | null | undefined;
  next_action?: string | null | undefined;
  next_action_date?: string | null | undefined;
  timeline: LeadActivity[];
  created_at: string;
  updated_at: string;
}

export interface BrokerProfile {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "broker";
  active: boolean;
}

export const KANBAN_COLUMNS: {
  id: LeadStatus;
  title: string;
  subtitle: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
}[] = [
  {
    id: "novo",
    title: "Novo / Não Atendido",
    subtitle: "Leads recém-chegados",
    badgeBg: "bg-blue-100 dark:bg-blue-950/60",
    badgeText: "text-blue-700 dark:text-blue-300",
    borderColor: "border-blue-500",
  },
  {
    id: "em_contato",
    title: "Em Contato",
    subtitle: "Primeira conversa iniciada",
    badgeBg: "bg-amber-100 dark:bg-amber-950/60",
    badgeText: "text-amber-800 dark:text-amber-300",
    borderColor: "border-amber-500",
  },
  {
    id: "visita_agendada",
    title: "Visita Agendada",
    subtitle: "Visita marcada ao imóvel",
    badgeBg: "bg-purple-100 dark:bg-purple-950/60",
    badgeText: "text-purple-700 dark:text-purple-300",
    borderColor: "border-purple-500",
  },
  {
    id: "proposta",
    title: "Proposta Feita",
    subtitle: "Proposta em andamento",
    badgeBg: "bg-indigo-100 dark:bg-indigo-950/60",
    badgeText: "text-indigo-700 dark:text-indigo-300",
    borderColor: "border-indigo-500",
  },
  {
    id: "em_negociacao",
    title: "Em Negociação",
    subtitle: "Contrato e crédito",
    badgeBg: "bg-orange-100 dark:bg-orange-950/60",
    badgeText: "text-orange-800 dark:text-orange-300",
    borderColor: "border-orange-500",
  },
  {
    id: "fechado",
    title: "Fechado / Ganho",
    subtitle: "Contrato concretizado",
    badgeBg: "bg-emerald-100 dark:bg-emerald-950/60",
    badgeText: "text-emerald-700 dark:text-emerald-300",
    borderColor: "border-emerald-500",
  },
  {
    id: "perdido",
    title: "Arquivado / Perdido",
    subtitle: "Desistências com motivo",
    badgeBg: "bg-slate-100 dark:bg-slate-800/80",
    badgeText: "text-slate-600 dark:text-slate-400",
    borderColor: "border-slate-400",
  },
];

export const TEMPERATURE_CONFIG: Record<
  LeadTemperature,
  { label: string; badgeClass: string; icon: string }
> = {
  quente: {
    label: "Quente",
    badgeClass: "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800",
    icon: "🔥",
  },
  morno: {
    label: "Morno",
    badgeClass: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    icon: "☀️",
  },
  frio: {
    label: "Frio",
    badgeClass: "bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200 dark:border-sky-800",
    icon: "❄️",
  },
};

export const DEFAULT_BROKERS: BrokerProfile[] = [
  {
    id: "abb75384-d851-45fe-b7dd-c870c48b55f3",
    name: "Master Agbipe",
    email: "agbipe@agenciabipe.com",
    role: "owner",
    active: true,
  },
  {
    id: "5839dc85-f229-47f9-927c-4a974705b15a",
    name: "Everson Maestro",
    email: "contato@agenciabipe.com",
    role: "admin",
    active: true,
  },
  {
    id: "c011e701-0001-4000-8000-000000000001",
    name: "Michele Folster",
    email: "michele@michelefolster.com.br",
    role: "broker",
    active: true,
  },
  {
    id: "c011e701-0002-4000-8000-000000000002",
    name: "Marcos Vinicius",
    email: "marcos@michelefolster.com.br",
    role: "broker",
    active: true,
  },
  {
    id: "c011e701-0003-4000-8000-000000000003",
    name: "Patrícia Lima",
    email: "patricia@michelefolster.com.br",
    role: "broker",
    active: true,
  },
];

export function isUuid(value: string | null | undefined): boolean {
  if (!value || typeof value !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export const INITIAL_DEMO_LEADS: Lead[] = [];

const LOCAL_STORAGE_LEADS_KEY = "app_crm_leads";

export function getLocalLeads(): Lead[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_LEADS_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    if (Array.isArray(list)) {
      // Purga qualquer registro mock legado sem UUID válido
      const clean = list.filter((l) => isUuid(l.id));
      if (clean.length !== list.length) {
        localStorage.setItem(LOCAL_STORAGE_LEADS_KEY, JSON.stringify(clean));
      }
      return clean;
    }
    return [];
  } catch {
    return [];
  }
}

export function saveLocalLead(lead: Lead): Lead {
  if (typeof window === "undefined") return lead;
  try {
    const current = getLocalLeads();
    const index = current.findIndex((l) => l.id === lead.id);
    let updated: Lead[];
    if (index >= 0) {
      updated = [...current];
      updated[index] = { ...current[index], ...lead, updated_at: new Date().toISOString() };
    } else {
      updated = [lead, ...current];
    }
    localStorage.setItem(LOCAL_STORAGE_LEADS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn("Aviso ao salvar lead localmente:", e);
  }
  return lead;
}

export async function fetchLeads(): Promise<Lead[]> {
  try {
    const { data: supabaseLeads, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && supabaseLeads) {
      return supabaseLeads.map((sl: any) => ({
        id: sl.id,
        name: sl.name,
        phone: sl.phone,
        email: sl.email || null,
        message: sl.message || null,
        interest: sl.interest || "Atendimento",
        consent: sl.consent ?? true,
        property_id: sl.property_id || null,
        property_code: sl.property_code || null,
        property_title: sl.property_title || null,
        source: sl.source || "Site",
        source_page: sl.source_page || null,
        status: (sl.status as LeadStatus) || "novo",
        temperature: (sl.temperature as LeadTemperature) || "quente",
        transaction_type: (sl.transaction_type as any) || "comprar",
        broker_id: sl.broker_id || null,
        broker_name: sl.broker_name || null,
        loss_reason: sl.loss_reason || null,
        next_action: sl.next_action || null,
        next_action_date: sl.next_action_date || null,
        notes: sl.notes || null,
        timeline: sl.timeline || [],
        created_at: sl.created_at || new Date().toISOString(),
        updated_at: sl.updated_at || new Date().toISOString(),
      }));
    }
  } catch (err) {
    console.warn("Aviso ao buscar leads no Supabase:", err);
  }

  return [];
}

export async function updateLeadStatusInDb(
  id: string,
  newStatus: LeadStatus
): Promise<{ success: boolean; error?: string }> {
  // Evita tentar atualizar IDs não-UUID no banco real
  if (!isUuid(id) || id.startsWith("lead-demo") || id.startsWith("demo-")) {
    deleteLocalLead(id);
    return { success: true };
  }

  try {
    const { error } = await supabase
      .from("leads")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      console.error("Erro ao salvar no Supabase:", error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.error("Erro ao atualizar status do lead no Supabase:", err);
    return { success: false, error: err?.message || String(err) };
  }
}

export async function deleteLeadInDb(id: string): Promise<{ success: boolean; error?: string }> {
  deleteLocalLead(id);

  // Evita tentar deletar registros fictícios de demo no banco real
  if (!isUuid(id) || id.startsWith("lead-demo") || id.startsWith("demo-")) {
    return { success: true };
  }

  try {
    const { error } = await supabase.from("leads").delete().eq("id", id);
    if (error) {
      console.error("Erro ao excluir no Supabase:", error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.error("Erro ao excluir lead no Supabase:", err);
    return { success: false, error: err?.message || String(err) };
  }
}

export function deleteLocalLead(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const current = getLocalLeads();
    const filtered = current.filter((l) => l.id !== id);
    localStorage.setItem(LOCAL_STORAGE_LEADS_KEY, JSON.stringify(filtered));
  } catch {}
}

export function mergeWithLocalLeads(supabaseLeads: any[] = []): Lead[] {
  const localList = getLocalLeads();
  if (!supabaseLeads || supabaseLeads.length === 0) return localList;

  const localMap = new Map<string, Lead>();
  for (const l of localList) {
    localMap.set(l.id, l);
    if (l.phone) localMap.set(l.phone, l);
  }

  const result: Lead[] = [];
  const usedIds = new Set<string>();

  for (const sl of supabaseLeads) {
    const local = localMap.get(sl.id) || (sl.phone ? localMap.get(sl.phone) : undefined);
    if (local) {
      // Mescla priorizando atualizações do CRM local
      const mergedLead: Lead = {
        ...sl,
        ...local,
        status: (local.status || sl.status || "novo") as LeadStatus,
        temperature: (local.temperature || "quente") as LeadTemperature,
        transaction_type: (local.transaction_type || (sl.interest === "locacao" ? "alugar" : "comprar")) as TransactionType,
        timeline: local.timeline || [],
      };
      result.push(mergedLead);
      usedIds.add(local.id);
      usedIds.add(sl.id);
    } else {
      const newLead: Lead = {
        id: sl.id,
        name: sl.name,
        phone: sl.phone,
        email: sl.email,
        message: sl.message,
        interest: sl.interest,
        consent: sl.consent,
        property_id: sl.property_id,
        property_code: sl.property_code,
        source: sl.source || "Site",
        source_page: sl.source_page,
        status: (sl.status === "em_atendimento" ? "em_contato" : sl.status || "novo") as LeadStatus,
        temperature: "quente",
        transaction_type: sl.interest === "locacao" ? "alugar" : "comprar",
        broker_id: sl.broker_id,
        notes: sl.notes,
        timeline: [
          {
            id: `init-${sl.id}`,
            created_at: sl.created_at || new Date().toISOString(),
            author_name: "Sistema",
            type: "contact",
            content: `Lead recebido através de ${sl.source || "Site"}.`,
          },
        ],
        created_at: sl.created_at || new Date().toISOString(),
        updated_at: sl.updated_at || new Date().toISOString(),
      };
      result.push(newLead);
      usedIds.add(sl.id);
    }
  }

  // Adiciona os demais leads locais que não estão no Supabase
  for (const l of localList) {
    if (!usedIds.has(l.id)) {
      result.push(l);
      usedIds.add(l.id);
    }
  }

  return result;
}

export function buildWhatsappChatUrl(phone: string, clientName: string, propCode?: string | null): string {
  const cleanPhone = phone.replace(/\D/g, "");
  const fullPhone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;
  const firstName = clientName.split(" ")[0] || "Cliente";
  const propText = propCode ? ` a respeito do imóvel de código ${propCode}` : "";
  const message = `Olá, ${firstName}! Tudo bem? Sou da Michele Folster Imóveis e estou entrando em contato${propText}. Como posso te ajudar hoje?`;
  return `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`;
}
