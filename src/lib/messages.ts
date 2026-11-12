import { supabase } from "@/integrations/supabase/client";


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

export async function fetchMessages(): Promise<MessageLead[]> {
  try {
    const { data: dbLeads, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && dbLeads && dbLeads.length > 0) {
      return Promise.all(dbLeads.map(async (l: any) => {
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

        let capturePhoto = l.capture_data?.foto_imovel_url ?? null;
        if (capturePhoto && !capturePhoto.startsWith('http') && !capturePhoto.startsWith('data:')) {
          const { data, error } = await supabase.storage.from('captacoes').createSignedUrl(capturePhoto,3600);
          if (error) throw new Error(error.message);
          capturePhoto = data.signedUrl;
        }
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
          tipo_imovel: l.capture_data?.tipo_imovel ?? null,
          cidade_bairro: l.capture_data?.cidade_bairro ?? null,
          valor_pretendido: l.capture_data?.valor_pretendido ?? null,
          foto_imovel_url: capturePhoto,
          dados_cliente: {},
          data_envio: l.created_at || new Date().toISOString(),
          created_at: l.created_at || new Date().toISOString(),
        };
      }));
    }
    if (error) throw new Error(error.message);
  } catch (err) { throw err; }
  return [];
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
  const newId = crypto.randomUUID();
  const now = new Date().toISOString();
  const validPropertyId = payload.imovel_id ?? null;
  const validBrokerId = null;
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
    source_page: window.location.pathname,
    capture_data: { tipo_imovel: payload.tipo_imovel, cidade_bairro: payload.cidade_bairro, valor_pretendido: payload.valor_pretendido, foto_imovel_url: payload.foto_imovel_url, ...payload.dados_cliente },
  });

  if (error) {
    console.error("Erro ao salvar no Supabase:", error.message);
    throw new Error(error.message);
  }

  return newMessage;
}

export async function updateMessageStatus(
  id: string,
  newStatus: MessageStatus
): Promise<{ success: boolean; error?: string }> {
  // Evita tentar atualizar IDs não-UUID no banco real
  if (!isUuid(id)) {
    return { success: false, error: "Identificador inválido" };
  }

  const statusMap: Record<MessageStatus, string> = {
    pendente: "novo",
    em_atendimento: "em_contato",
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
  if (!isUuid(id)) {
    return { success: false, error: "Identificador inválido" };
  }

  if (!isUuid(brokerId)) return { success: false, error: 'Corretor inválido' };
  const validBrokerId = brokerId;

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
  if (!isUuid(id)) {
    return { success: false, error: "Identificador inválido" };
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
