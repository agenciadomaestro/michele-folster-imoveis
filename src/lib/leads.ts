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
    id: "corretor-michele",
    name: "Michele Folster",
    email: "michele@michelefolster.com.br",
    role: "broker",
    active: true,
  },
  {
    id: "corretor-marcos",
    name: "Marcos Vinicius",
    email: "marcos@michelefolster.com.br",
    role: "broker",
    active: true,
  },
  {
    id: "corretor-patricia",
    name: "Patrícia Lima",
    email: "patricia@michelefolster.com.br",
    role: "broker",
    active: true,
  },
];

const INITIAL_DEMO_LEADS: Lead[] = [
  {
    id: "lead-demo-1",
    name: "Carlos Eduardo Silveira",
    phone: "(12) 99765-4321",
    email: "carlos.silveira@gmail.com",
    message: "Gostei muito da casa no Jardim América. Aceita financiamento bancário pela Caixa?",
    interest: "Casa térrea com jardim e área gourmet",
    property_code: "CA0531",
    property_title: "Casa térrea com jardim e área gourmet",
    property_price: 1890000,
    source: "Site",
    source_page: "/imovel/CA0531",
    status: "novo",
    temperature: "quente",
    transaction_type: "comprar",
    broker_id: "abb75384-d851-45fe-b7dd-c870c48b55f3",
    broker_name: "Master Agbipe",
    next_action: "Ligar para agendar visita inicial",
    next_action_date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    notes: "Cliente com carta de crédito pré-aprovada de R$ 1.5M. Quer visitar aos fins de semana.",
    timeline: [
      {
        id: "act-1",
        created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        author_name: "Sistema",
        type: "contact",
        content: "Lead gerado através do formulário do site na página do imóvel CA0531.",
      },
    ],
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: "lead-demo-2",
    name: "Mariana Costa",
    phone: "(12) 98122-3344",
    email: "mariana.costa@hotmail.com",
    message: "Procuro apartamento com vista livre e pelo menos 2 vagas de garagem.",
    interest: "Apartamento com vista para o mar",
    property_code: "AP0214",
    property_title: "Apartamento com vista para o mar",
    property_price: 2350000,
    source: "Meta Ads",
    status: "em_contato",
    temperature: "quente",
    transaction_type: "comprar",
    broker_id: "corretor-michele",
    broker_name: "Michele Folster",
    next_action: "Enviar simulação de financiamento e tour virtual",
    next_action_date: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
    notes: "Conversamos no WhatsApp. Mariana mora em São Paulo e busca imóvel para moradia definitiva.",
    timeline: [
      {
        id: "act-2a",
        created_at: new Date(Date.now() - 86400000).toISOString(),
        author_name: "Michele Folster",
        type: "contact",
        content: "Primeiro contato via WhatsApp realizado. Enviado catálogo dos apartamentos disponíveis.",
      },
      {
        id: "act-2b",
        created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
        author_name: "Michele Folster",
        type: "note",
        content: "Mariana demonstrou alto interesse no AP0214. Solicitou simulação de fluxo com entrada de 30%.",
      },
    ],
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: "lead-demo-3",
    name: "Roberto & Juliana Mendes",
    phone: "(12) 99111-2233",
    email: "roberto.mendes@uol.com.br",
    message: "Queremos conhecer o sobrado no condomínio fechado neste sábado de manhã.",
    interest: "Sobrado moderno em condomínio",
    property_code: "SO0107",
    property_title: "Sobrado moderno em condomínio",
    property_price: 1450000,
    source: "Portal",
    status: "visita_agendada",
    temperature: "quente",
    transaction_type: "comprar",
    broker_id: "corretor-marcos",
    broker_name: "Marcos Vinicius",
    next_action: "Confirmar visita sábado às 10h",
    next_action_date: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10),
    notes: "Visita confirmada com o proprietário para sábado às 10:00. Chaves na portaria.",
    timeline: [
      {
        id: "act-3a",
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        author_name: "Marcos Vinicius",
        type: "appointment",
        content: "Visita presencial agendada para sábado às 10h00 no condomínio.",
      },
    ],
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "lead-demo-4",
    name: "Fernando Albuquerque",
    phone: "(12) 98877-6655",
    email: "fernando.alb@empresa.com.br",
    message: "Fizemos a proposta por escrito para o terreno plano.",
    interest: "Terreno plano em loteamento",
    property_code: "TE0042",
    property_title: "Terreno plano em loteamento",
    property_price: 420000,
    source: "Indicação",
    status: "proposta",
    temperature: "morno",
    transaction_type: "comprar",
    broker_id: "5839dc85-f229-47f9-927c-4a974705b15a",
    broker_name: "Everson Maestro",
    next_action: "Cobrar resposta do proprietário da contraproposta",
    next_action_date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    notes: "Proposta formal de R$ 390.000 à vista apresentada ao vendedor.",
    timeline: [
      {
        id: "act-4a",
        created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
        author_name: "Everson Maestro",
        type: "status_change",
        content: "Proposta de R$ 390.000 enviada ao vendedor para avaliação.",
      },
    ],
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "lead-demo-5",
    name: "Beatriz Vasconcelos",
    phone: "(12) 97401-9988",
    email: "beatriz.v@clinica.med.br",
    message: "Locação da sala comercial para consultório médico.",
    interest: "Sala comercial em edifício corporativo",
    property_code: "SA0019",
    property_title: "Sala comercial em edifício corporativo",
    property_price: 4500,
    source: "Site",
    status: "em_negociacao",
    temperature: "quente",
    transaction_type: "alugar",
    broker_id: "corretor-patricia",
    broker_name: "Patrícia Lima",
    next_action: "Emitir minuta de contrato de locação e seguro fiança",
    next_action_date: new Date().toISOString().slice(0, 10),
    notes: "Ficha cadastral aprovada pela Porto Seguro. Minuta em elaboração pelo jurídico.",
    timeline: [
      {
        id: "act-5a",
        created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
        author_name: "Patrícia Lima",
        type: "status_change",
        content: "Análise de crédito e seguro fiança aprovados com sucesso.",
      },
    ],
    created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "lead-demo-6",
    name: "Rodrigo Nogueira",
    phone: "(12) 99344-5566",
    email: "rodrigo.nog@tech.com",
    message: "Aluguel fechado para início no próximo mês.",
    interest: "Apartamento compacto mobiliado",
    property_code: "AP0388",
    property_title: "Apartamento compacto mobiliado",
    property_price: 3200,
    source: "WhatsApp",
    status: "fechado",
    temperature: "quente",
    transaction_type: "alugar",
    broker_id: "abb75384-d851-45fe-b7dd-c870c48b55f3",
    broker_name: "Master Agbipe",
    notes: "Contrato assinado digitalmente pelas partes e chaves entregues com sucesso.",
    timeline: [
      {
        id: "act-6a",
        created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
        author_name: "Master Agbipe",
        type: "status_change",
        content: "Contrato assinado! Negócio concretizado com sucesso.",
      },
    ],
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
  {
    id: "lead-demo-7",
    name: "Lucas Pinheiro",
    phone: "(12) 98233-4411",
    email: "lucas.p@gmail.com",
    message: "Estava procurando casa em condomínio fechado.",
    source: "Meta Ads",
    status: "perdido",
    temperature: "frio",
    transaction_type: "comprar",
    broker_id: "corretor-michele",
    broker_name: "Michele Folster",
    loss_reason: "Optou por comprar imóvel em outra cidade (São José dos Campos).",
    notes: "Cliente cordial, mas comprou próximo ao trabalho em SJC. Manter na base para futuro.",
    timeline: [
      {
        id: "act-7a",
        created_at: new Date(Date.now() - 86400000 * 8).toISOString(),
        author_name: "Michele Folster",
        type: "status_change",
        content: "Lead arquivado como Perdido. Motivo: Comprou em outra região.",
      },
    ],
    created_at: new Date(Date.now() - 86400000 * 12).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 8).toISOString(),
  },
];

const LOCAL_STORAGE_LEADS_KEY = "app_crm_leads";

export function getLocalLeads(): Lead[] {
  if (typeof window === "undefined") return INITIAL_DEMO_LEADS;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_LEADS_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_LEADS_KEY, JSON.stringify(INITIAL_DEMO_LEADS));
      return INITIAL_DEMO_LEADS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_DEMO_LEADS;
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

    if (!error && supabaseLeads && supabaseLeads.length > 0) {
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

    // Se estiver vazio no Supabase, semeia os leads iniciais diretamente no banco
    if (!error && supabaseLeads && supabaseLeads.length === 0) {
      for (const l of INITIAL_DEMO_LEADS) {
        const payload: {
          id?: string;
          name: string;
          phone: string;
          email: string | null;
          message: string | null;
          interest: string;
          consent: boolean;
          property_code: string | null;
          source: string;
          status: LeadStatus;
          broker_id: string | null;
          notes: string | null;
        } = {
          name: l.name,
          phone: l.phone,
          email: l.email || null,
          message: l.message || null,
          interest: l.interest || "Mais informações",
          consent: true,
          property_code: l.property_code || null,
          source: l.source || "Site",
          status: l.status,
          broker_id: l.broker_id === "c011e701-0001-4000-8000-000000000001" ? null : l.broker_id || null,
          notes: l.notes || null,
        };
        if (!l.id.startsWith("lead-demo")) {
          payload.id = l.id;
        }
        await supabase.from("leads").insert(payload);
      }
      return INITIAL_DEMO_LEADS;
    }
  } catch (err) {
    console.warn("Aviso ao buscar leads no Supabase:", err);
  }

  return INITIAL_DEMO_LEADS;
}

export async function updateLeadStatusInDb(id: string, newStatus: LeadStatus): Promise<void> {
  try {
    const { error } = await supabase
      .from("leads")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) {
      console.warn("Aviso ao atualizar status no Supabase:", error.message);
    }
  } catch (err) {
    console.warn("Erro ao atualizar status do lead no Supabase:", err);
  }
}

export async function deleteLeadInDb(id: string): Promise<void> {
  try {
    await supabase.from("leads").delete().eq("id", id);
  } catch (err) {
    console.warn("Erro ao excluir lead no Supabase:", err);
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
