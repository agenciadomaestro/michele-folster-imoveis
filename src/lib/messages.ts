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

export const INITIAL_MESSAGES: MessageLead[] = [
  {
    id: "msg-demo-1",
    tipo: "imovel",
    nome_cliente: "Carlos Eduardo Silveira",
    telefone_cliente: "(12) 99765-4321",
    email_cliente: "carlos.silveira@gmail.com",
    interesse: "Agendar visita",
    mensagem: "Gostaria de agendar uma visita para sábado pela manhã na casa do Jardim América. Tenho aprovação de financiamento.",
    imovel_id: "prop-demo-1",
    codigo_imovel: "CA0531",
    titulo_imovel: "Casa térrea com jardim e área gourmet",
    corretor_atribuido_id: "corretor-marcos",
    corretor_nome: "Marcos Vinicius",
    status: "em_atendimento",
    data_envio: new Date(Date.now() - 3600000 * 2).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: "msg-demo-2",
    tipo: "captacao",
    nome_cliente: "Dra. Renata Vasconcellos",
    telefone_cliente: "(12) 98112-9988",
    email_cliente: "renata.vasc@clinica.com.br",
    interesse: "Anunciar meu imóvel",
    mensagem: "Tenho um sobrado no Condomínio Terras do Vale e quero colocar para venda exclusiva. Imóvel recém reformado.",
    tipo_imovel: "Casa em Condomínio",
    cidade_bairro: "Caçapava - Terras do Vale",
    valor_pretendido: 1450000,
    foto_imovel_url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&auto=format&fit=crop&q=80",
    corretor_atribuido_id: "corretor-michele",
    corretor_nome: "Michele Folster",
    status: "pendente",
    data_envio: new Date(Date.now() - 3600000 * 5).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: "msg-demo-3",
    tipo: "imovel",
    nome_cliente: "Mariana Costa",
    telefone_cliente: "(12) 98122-3344",
    email_cliente: "mariana.costa@hotmail.com",
    interesse: "Mais informações",
    mensagem: "Procuro apartamento com vista livre e pelo menos 2 vagas. Esse imóvel aceita permuta com veículo?",
    imovel_id: "prop-demo-2",
    codigo_imovel: "AP0214",
    titulo_imovel: "Apartamento com vista para o mar",
    corretor_atribuido_id: "corretor-michele",
    corretor_nome: "Michele Folster",
    status: "pendente",
    data_envio: new Date(Date.now() - 86400000).toISOString(),
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "msg-demo-4",
    tipo: "captacao",
    nome_cliente: "Fernando Bezerra",
    telefone_cliente: "(12) 99188-7744",
    email_cliente: "fernando.bezerra@agro.com.br",
    interesse: "Anunciar meu imóvel",
    mensagem: "Quero anunciar um terreno de 1.200m² plano no Portal das Colinas, quitado e com escritura registrada.",
    tipo_imovel: "Terreno",
    cidade_bairro: "Caçapava - Portal das Colinas",
    valor_pretendido: 480000,
    foto_imovel_url: null,
    status: "concluido",
    corretor_atribuido_id: "corretor-patricia",
    corretor_nome: "Patrícia Lima",
    data_envio: new Date(Date.now() - 86400000 * 3).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
];

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

  return INITIAL_MESSAGES;
}

export function getLocalMessages(): MessageLead[] {
  return INITIAL_MESSAGES;
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
  const newId =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `msg-${Date.now()}`;

  const now = new Date().toISOString();

  const newMessage: MessageLead = {
    id: newId,
    tipo: payload.tipo,
    nome_cliente: payload.nome_cliente,
    telefone_cliente: payload.telefone_cliente,
    email_cliente: payload.email_cliente ?? null,
    interesse: payload.interesse,
    mensagem: payload.mensagem,
    imovel_id: payload.imovel_id ?? null,
    codigo_imovel: payload.codigo_imovel ?? null,
    titulo_imovel: payload.titulo_imovel ?? null,
    corretor_atribuido_id: payload.corretor_atribuido_id ?? null,
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
    interest: payload.interesse,
    consent: true,
    property_id: payload.imovel_id ?? null,
    property_code: payload.codigo_imovel ?? null,
    property_title: payload.titulo_imovel ?? null,
    source: payload.tipo === "captacao" ? "Anuncie Seu Imóvel" : "Site",
    source_page: typeof window !== "undefined" ? window.location.pathname : null,
    status: "novo",
    temperature: "quente",
    transaction_type: payload.interesse === "locacao" ? "alugar" : "comprar",
    broker_id: payload.corretor_atribuido_id ?? null,
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
  try {
    await supabase.from("leads").insert({
      id: newId,
      name: payload.nome_cliente,
      phone: payload.telefone_cliente,
      email: payload.email_cliente ?? null,
      message: payload.mensagem,
      interest: payload.interesse,
      consent: true,
      property_id: payload.imovel_id ?? null,
      property_code: payload.codigo_imovel ?? null,
      source: payload.tipo === "captacao" ? "Anuncie Seu Imóvel" : "Site",
      status: "novo",
      broker_id: payload.corretor_atribuido_id === "c011e701-0001-4000-8000-000000000001" ? null : payload.corretor_atribuido_id ?? null,
    });
  } catch (err) {
    console.warn("Aviso ao sincronizar novo lead no Supabase:", err);
  }

  return newMessage;
}

export async function updateMessageStatus(id: string, newStatus: MessageStatus): Promise<void> {
  const statusMap: Record<MessageStatus, string> = {
    pendente: "novo",
    em_atendimento: "em_atendimento",
    concluido: "fechado",
  };
  try {
    await supabase.from("leads").update({ status: statusMap[newStatus] || "novo" }).eq("id", id);
  } catch (err) {
    console.warn("Aviso ao atualizar status da mensagem no Supabase:", err);
  }
}

export async function assignMessageBroker(id: string, brokerId: string, brokerName: string): Promise<void> {
  try {
    await supabase.from("leads").update({ broker_id: brokerId }).eq("id", id);
  } catch (err) {
    console.warn("Aviso ao atribuir corretor no Supabase:", err);
  }
}

export async function deleteLocalMessage(id: string): Promise<void> {
  try {
    await supabase.from("leads").delete().eq("id", id);
  } catch (err) {
    console.warn("Aviso ao excluir mensagem no Supabase:", err);
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
