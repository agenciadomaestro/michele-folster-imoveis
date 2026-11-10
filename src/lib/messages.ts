import { supabase } from "@/integrations/supabase/client";
import { type Lead } from "./leads";

export type MessageType = "imovel" | "captacao" | "geral";
export type MessageStatus = "pendente" | "em_atendimento" | "concluido";

export interface MessageLead {
  id: string;
  tipo: MessageType;
  nome_cliente: string;
  telefone_cliente: string;
  email_cliente?: string | null;
  interesse: string;
  mensagem: string;
  imovel_id?: string | null;
  codigo_imovel?: string | null;
  titulo_imovel?: string | null;
  corretor_atribuido_id?: string | null;
  corretor_nome?: string | null;
  status: MessageStatus;
  // Campos específicos de captação (Anuncie seu Imóvel)
  tipo_imovel?: string | null;
  cidade_bairro?: string | null;
  valor_pretendido?: number | string | null;
  foto_imovel_url?: string | null;
  dados_cliente?: Record<string, any>;
  data_envio: string;
  created_at: string;
}

export function isUuid(value: string | null | undefined): boolean {
  if (!value || typeof value !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export const INITIAL_MESSAGES: MessageLead[] = [];

const LOCAL_STORAGE_MESSAGES_KEY = "app_messages_leads";

export async function fetchMessages(): Promise<MessageLead[]> {
  try {
    const { data: dbLeads, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && dbLeads && dbLeads.length > 0) {
      return dbLeads.map((l: any) => {
        const isCaptacao =
          l.source === "Anuncie Seu Imóvel" ||
          l.interest?.toLowerCase().includes("anunciar");
        const isImovel = Boolean(l.property_code);
        const tipo: MessageType = isCaptacao ? "captacao" : isImovel ? "imovel" : "geral";

        const statusMap: Record<string, MessageStatus> = {
          novo: "pendente",
          em_contato: "em_atendimento",
          em_atendimento: "em_atendimento",
          visita_agendada: "em_atendimento",
          proposta: "em_atendimento",
          em_negociacao: "em_atendimento",
          fechado: "concluido",
          perdido: "concluido",
        };
        const status: MessageStatus = statusMap[l.status] || "pendente";

        return {
          id: l.id,
          tipo,
          nome_cliente: l.name,
          telefone_cliente: l.phone,
          email_cliente: l.email || null,
          interesse: l.interest || "Atendimento",
          mensagem: l.message || "Solicitação recebida pelo site.",
          imovel_id: l.property_id || null,
          codigo_imovel: l.property_code || null,
          titulo_imovel: l.property_title || null,
          corretor_atribuido_id: l.broker_id || null,
          corretor_nome: l.broker_name || null,
          status,
          tipo_imovel: null,
          cidade_bairro: null,
          valor_pretendido: null,
          foto_imovel_url: null,
          dados_cliente: {},
          data_envio: l.created_at || new Date().toISOString(),
          created_at: l.created_at || new Date().toISOString(),
        };
      });
    }
  } catch (err) {
    console.warn("Aviso ao buscar mensagens no Supabase:", err);
  }

  return [];
}

export function getLocalMessages(): MessageLead[] {
  return [];
}

function generateUuid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function saveMessageLead(payload: {
  tipo: MessageType;
  nome_cliente: string;
  telefone_cliente: string;
  email_cliente?: string | null;
  interesse: string;
  mensagem: string;
  imovel_id?: string | null;
  codigo_imovel?: string | null;
  titulo_imovel?: string | null;
  corretor_atribuido_id?: string | null;
  corretor_nome?: string | null;
  tipo_imovel?: string | null;
  cidade_bairro?: string | null;
  valor_pretendido?: number | string | null;
  foto_imovel_url?: string | null;
  dados_cliente?: Record<string, any>;
}): Promise<MessageLead> {
  const newId = generateUuid();

  const now = new Date().toISOString();

  const validPropertyId: string | null = (payload.imovel_id && isUuid(payload.imovel_id)) ? payload.imovel_id : null;
  const validBrokerId: string | null = (payload.corretor_atribuido_id && isUuid(payload.corretor_atribuido_id))
    ? payload.corretor_atribuido_id
    : payload.corretor_atribuido_id === "corretor-michele"
    ? "c011e701-0001-4000-8000-000000000001"
    : null;

  const newMessage: MessageLead = {
    id: newId,
    tipo: payload.tipo,
    nome_cliente: payload.nome_cliente,
    telefone_cliente: payload.telefone_cliente,
    email_cliente: payload.email_cliente ?? null,
    interesse: payload.interesse,
    mensagem: payload.mensagem,
    imovel_id: validPropertyId,
    codigo_imovel: payload.codigo_imovel ?? null,
    titulo_imovel: payload.titulo_imovel ?? null,
    corretor_atribuido_id: validBrokerId,
    corretor_nome: payload.corretor_nome ?? null,
    status: "pendente",
    tipo_imovel: payload.tipo_imovel ?? null,
    cidade_bairro: payload.cidade_bairro ?? null,
    valor_pretendido: payload.valor_pretendido ?? null,
    foto_imovel_url: payload.foto_imovel_url ?? null,
    dados_cliente: payload.dados_cliente ?? {},
    data_envio: now,
    created_at: now,
  };

  // 1. Salva localmente
  if (typeof window !== "undefined") {
    try {
      const current = getLocalMessages();
      localStorage.setItem(LOCAL_STORAGE_MESSAGES_KEY, JSON.stringify([newMessage, ...current]));
    } catch (e) {
      console.warn("Aviso ao salvar mensagem localmente:", e);
    }
  }

  // 2. Cria/Sincroniza simultaneamente no CRM Kanban de Leads
  const newLeadObj: Lead = {
    id: newId,
    name: payload.nome_cliente,
    phone: payload.telefone_cliente,
    email: payload.email_cliente ?? null,
    message: payload.mensagem,
    interest: payload.tipo === "captacao" ? "Anuncie Seu Imóvel" : payload.interesse,
    consent: true,
    property_id: validPropertyId,
    property_code: payload.codigo_imovel ?? null,
    property_title: payload.titulo_imovel ?? null,
    source: payload.tipo === "captacao" ? "Anuncie Seu Imóvel" : "Site",
    source_page: typeof window !== "undefined" ? window.location.pathname : null,
    status: "novo",
    temperature: "quente",
    transaction_type: payload.interesse === "locacao" ? "alugar" : "comprar",
    broker_id: validBrokerId,
    broker_name: payload.corretor_nome ?? null,
    timeline: [
      {
        id: `act-${Date.now()}`,
        created_at: now,
        author_name: "Sistema (Site)",
        type: "contact",
        content: `Contato recebido via ${payload.tipo === "captacao" ? "Anuncie Seu Imóvel" : "Página do Imóvel"}. Interesse: ${payload.interesse}.`,
      },
    ],
    created_at: now,
    updated_at: now,
  };

  // Persiste diretamente na tabela leads do Supabase
  const { error } = await supabase.from("leads").insert({
    id: newId,
    name: payload.nome_cliente,
    phone: payload.telefone_cliente,
    email: payload.email_cliente ?? null,
    message: payload.mensagem,
    interest: payload.interesse,
    consent: true,
    property_id: validPropertyId,
    property_code: payload.codigo_imovel ?? null,
    source: payload.tipo === "captacao" ? "Anuncie Seu Imóvel" : "Site",
    status: "novo",
    broker_id: validBrokerId,
  });

  if (error) {
    console.error("Erro ao salvar no Supabase:", error.message);
    throw new Error(`Falha ao salvar no Supabase: ${error.message}`);
  }

  return newMessage;
}

export async function updateMessageStatus(
  id: string,
  newStatus: MessageStatus
): Promise<{ success: boolean; error?: string }> {
  // Evita tentar atualizar IDs não-UUID no banco real
  if (!isUuid(id) || id.startsWith("msg-demo") || id.startsWith("demo-")) {
    return { success: true };
  }

  const statusMap: Record<MessageStatus, string> = {
    pendente: "novo",
    em_atendimento: "em_atendimento",
    concluido: "fechado",
  };
  try {
    const { error } = await supabase
      .from("leads")
      .update({ status: statusMap[newStatus] || "novo", updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      console.error("Erro ao salvar no Supabase:", error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.error("Erro ao atualizar status da mensagem no Supabase:", err);
    return { success: false, error: err?.message || String(err) };
  }
}

export async function assignMessageBroker(
  id: string,
  brokerId: string,
  brokerName: string
): Promise<{ success: boolean; error?: string }> {
  // Evita tentar atualizar IDs não-UUID no banco real
  if (!isUuid(id) || id.startsWith("msg-demo") || id.startsWith("demo-")) {
    return { success: true };
  }

  const validBrokerId = isUuid(brokerId)
    ? brokerId
    : brokerId === "corretor-michele"
    ? "c011e701-0001-4000-8000-000000000001"
    : null;

  try {
    const { error } = await supabase
      .from("leads")
      .update({ broker_id: validBrokerId, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      console.error("Erro ao salvar no Supabase:", error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.error("Erro ao atribuir corretor no Supabase:", err);
    return { success: false, error: err?.message || String(err) };
  }
}

export async function deleteLocalMessage(id: string): Promise<{ success: boolean; error?: string }> {
  // Evita tentar deletar IDs não-UUID no banco real
  if (!isUuid(id) || id.startsWith("msg-demo") || id.startsWith("demo-")) {
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
    console.error("Erro ao excluir mensagem no Supabase:", err);
    return { success: false, error: err?.message || String(err) };
  }
}

/**
 * Constrói URL direta para responder o cliente no WhatsApp com mensagem de cortesia
 */
export function buildClientWhatsappReplyUrl(msg: MessageLead): string {
  const cleanPhone = msg.telefone_cliente.replace(/\D/g, "");
  const fullPhone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;
  const firstName = msg.nome_cliente.split(" ")[0] || "Cliente";

  let context = "";
  if (msg.tipo === "captacao") {
    context = ` a respeito do anúncio do seu imóvel (${msg.tipo_imovel || "Imóvel"} em ${msg.cidade_bairro || "Caçapava"})`;
  } else if (msg.codigo_imovel) {
    context = ` a respeito do seu interesse no imóvel ${msg.codigo_imovel} (${msg.titulo_imovel || ""})`;
  }

  const text = `Olá, ${firstName}! Sou da Michele Folster Imóveis. Recebi sua mensagem enviada pelo site${context}. Como posso ajudar você hoje?`;
  return `https://wa.me/${fullPhone}?text=${encodeURIComponent(text)}`;
}
