import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo, useEffect } from "react";
import {
  MessageSquare,
  Search,
  Filter,
  ArrowLeft,
  Building2,
  Phone,
  Mail,
  Calendar,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertCircle,
  Home,
  User,
  Sliders,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/site/SiteLayout";
import {
  type MessageLead,
  type MessageStatus,
  type MessageType,
  fetchMessages,
  updateMessageStatus,
  assignMessageBroker,
  deleteLocalMessage,
  isUuid,
  buildClientWhatsappReplyUrl,
} from "@/lib/messages";
import { fetchBrokers, getCurrentUserProfile } from "@/lib/brokers";
import { brl } from "@/lib/realty";

export const Route = createFileRoute("/admin/mensagens")({
  head: () => ({
    meta: [
      { title: "Central de Mensagens e Contatos — Michele Folster Imóveis" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminMessagesPage,
});

function AdminMessagesPage() {
  const queryClient = useQueryClient();
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterBroker, setFilterBroker] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Perfil do usuário atual
  const { data: currentUser } = useQuery({
    queryKey: ["current-user-profile"],
    queryFn: getCurrentUserProfile,
  });

  // Lista de mensagens do Supabase
  const { data: messagesList = [] } = useQuery({
    queryKey: ["admin", "messages-leads-list"],
    queryFn: fetchMessages,
  });

  // Lista de corretores do Supabase
  const { data: brokers = [] } = useQuery({
    queryKey: ["admin", "brokers-list"],
    queryFn: () => fetchBrokers(false),
  });

  // Sincronização em tempo real para novas mensagens e leads
  useEffect(() => {
    const channel = supabase
      .channel("admin-mensagens-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "leads" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["admin", "messages-leads-list"] });
          queryClient.invalidateQueries({ queryKey: ["admin", "crm-leads-list"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["admin", "brokers-list"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const handleStatusChange = async (id: string, newStatus: MessageStatus) => {
    // Evita tentar atualizar registros fictícios de demo no banco real
    if (!isUuid(id) || id.startsWith("msg-demo") || id.startsWith("demo-")) {
      queryClient.setQueryData(["admin", "messages-leads-list"], (prev: MessageLead[] = []) =>
        prev.filter((m) => m.id !== id)
      );
      queryClient.invalidateQueries({ queryKey: ["admin", "messages-leads-list"] });
      toast.info("Registro de demonstração antigo removido da lista.");
      return;
    }

    const res = await updateMessageStatus(id, newStatus);
    if (!res.success) {
      toast.error(`Falha ao salvar no Supabase: ${res.error}`);
      return;
    }
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin", "messages-leads-list"] }),
      queryClient.invalidateQueries({ queryKey: ["admin", "crm-leads-list"] }),
      queryClient.invalidateQueries({ queryKey: ["admin", "leads-crm-list"] }),
    ]);
    toast.success(`Status da mensagem atualizado para "${newStatus.replace("_", " ")}".`);
  };

  const handleBrokerAssign = async (id: string, brokerId: string) => {
    const broker = brokers.find((b) => b.id === brokerId);
    if (!broker) return;

    // Evita tentar atualizar registros fictícios de demo no banco real
    if (!isUuid(id) || id.startsWith("msg-demo") || id.startsWith("demo-")) {
      queryClient.setQueryData(["admin", "messages-leads-list"], (prev: MessageLead[] = []) =>
        prev.filter((m) => m.id !== id)
      );
      queryClient.invalidateQueries({ queryKey: ["admin", "messages-leads-list"] });
      toast.info("Registro de demonstração antigo removido da lista.");
      return;
    }

    const res = await assignMessageBroker(id, broker.id, broker.name);
    if (!res.success) {
      toast.error(`Falha ao salvar no Supabase: ${res.error}`);
      return;
    }
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin", "messages-leads-list"] }),
      queryClient.invalidateQueries({ queryKey: ["admin", "crm-leads-list"] }),
      queryClient.invalidateQueries({ queryKey: ["admin", "leads-crm-list"] }),
    ]);
    toast.success(`Mensagem atribuída a ${broker.name}.`);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente remover esta mensagem da listagem?")) return;

    // Evita tentar deletar registros fictícios de demo no banco real
    if (!isUuid(id) || id.startsWith("msg-demo") || id.startsWith("demo-")) {
      queryClient.setQueryData(["admin", "messages-leads-list"], (prev: MessageLead[] = []) =>
        prev.filter((item) => item.id !== id)
      );
      queryClient.invalidateQueries({ queryKey: ["admin", "messages-leads-list"] });
      toast.success("Mensagem removida com sucesso.");
      return;
    }

    const res = await deleteLocalMessage(id);
    if (!res.success) {
      toast.error(`Falha ao excluir no Supabase: ${res.error}`);
      return;
    }
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin", "messages-leads-list"] }),
      queryClient.invalidateQueries({ queryKey: ["admin", "crm-leads-list"] }),
      queryClient.invalidateQueries({ queryKey: ["admin", "leads-crm-list"] }),
    ]);
    toast.success("Mensagem removida com sucesso.");
  };

  // Filtragem com respeito a permissões granulares de acesso (RBAC)
  const filteredMessages = useMemo(() => {
    return messagesList.filter((msg) => {
      // 1. Regras de RBAC para Corretor
      if (currentUser && currentUser.isBroker) {
        // Se não puder ver captações, esconde solicitações de anúncio
        if (msg.tipo === "captacao" && !currentUser.permissions.pode_ver_captacoes) {
          return false;
        }
        // Se não puder ver ofertas gerais, vê apenas se estiver atribuída a ele
        if (!currentUser.permissions.pode_ver_ofertas_gerais) {
          if (msg.corretor_atribuido_id !== currentUser.id) {
            return false;
          }
        }
      }

      // 2. Filtro por Tipo (Todas, Imóvel, Captação, Geral)
      if (filterType !== "all" && msg.tipo !== filterType) {
        return false;
      }

      // 3. Filtro por Status
      if (filterStatus !== "all" && msg.status !== filterStatus) {
        return false;
      }

      // 4. Filtro por Corretor
      if (filterBroker !== "all" && msg.corretor_atribuido_id !== filterBroker) {
        return false;
      }

      // 5. Busca por texto livre (nome, telefone, código do imóvel, mensagem)
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchesName = msg.nome_cliente.toLowerCase().includes(query);
        const matchesPhone = msg.telefone_cliente.toLowerCase().includes(query);
        const matchesCode = msg.codigo_imovel?.toLowerCase().includes(query);
        const matchesContent = msg.mensagem.toLowerCase().includes(query);
        const matchesInterest = msg.interesse.toLowerCase().includes(query);
        if (!matchesName && !matchesPhone && !matchesCode && !matchesContent && !matchesInterest) {
          return false;
        }
      }

      return true;
    });
  }, [messagesList, currentUser, filterType, filterStatus, filterBroker, searchQuery]);

  const stats = useMemo(() => {
    return {
      total: messagesList.length,
      pendentes: messagesList.filter((m) => m.status === "pendente").length,
      emAtendimento: messagesList.filter((m) => m.status === "em_atendimento").length,
      captacoes: messagesList.filter((m) => m.tipo === "captacao").length,
    };
  }, [messagesList]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-surface px-6 py-4 sticky top-0 z-30">
        <div className="container-page flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/admin"
              className="btn btn-ghost size-9 p-0 text-muted-foreground hover:text-foreground"
              title="Voltar ao Painel"
            >
              <ArrowLeft className="size-5" />
            </Link>
            <Logo />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-muted-foreground hidden sm:inline">
              Logado como: <strong className="text-foreground">{currentUser?.roleLabel}</strong>
            </span>
            <Link to="/admin/leads" className="btn btn-outline text-xs h-9">
              Ver CRM Kanban
            </Link>
          </div>
        </div>
      </header>

      <main className="container-page py-8 space-y-8">
        {/* Título e Visão Geral */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Central de Mensagens e Contatos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Acompanhe mensagens de clientes por imóvel, solicitações de captação e contatos gerais do site.
          </p>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="panel p-4 border border-border">
            <p className="text-xs text-muted-foreground font-medium">Total de Mensagens</p>
            <p className="text-2xl font-bold mt-1 text-foreground">{stats.total}</p>
          </div>
          <div className="panel p-4 border border-amber-500/30 bg-amber-500/5">
            <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">Pendentes</p>
            <p className="text-2xl font-bold mt-1 text-amber-800 dark:text-amber-300">
              {stats.pendentes}
            </p>
          </div>
          <div className="panel p-4 border border-blue-500/30 bg-blue-500/5">
            <p className="text-xs text-blue-700 dark:text-blue-400 font-medium">Em Atendimento</p>
            <p className="text-2xl font-bold mt-1 text-blue-800 dark:text-blue-300">
              {stats.emAtendimento}
            </p>
          </div>
          <div className="panel p-4 border border-emerald-500/30 bg-emerald-500/5">
            <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
              Captações de Imóveis
            </p>
            <p className="text-2xl font-bold mt-1 text-emerald-800 dark:text-emerald-300">
              {stats.captacoes}
            </p>
          </div>
        </div>

        {/* Filtros e Busca */}
        <div className="panel p-5 shadow-sm space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            {/* Campo de Busca Livre */}
            <div className="relative md:col-span-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Busca por nome, telefone ou código..."
                className="field h-10 pl-9 text-xs"
              />
            </div>

            {/* Filtro por Categoria / Origem */}
            <div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="field h-10 text-xs"
              >
                <option value="all">Todas as Mensagens</option>
                <option value="imovel">Interesse em Imóvel</option>
                <option value="captacao">Solicitações de Anúncio (Captação)</option>
                <option value="geral">Dúvidas Gerais / Outros</option>
              </select>
            </div>

            {/* Filtro por Status */}
            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="field h-10 text-xs"
              >
                <option value="all">Todos os Status</option>
                <option value="pendente">Pendente</option>
                <option value="em_atendimento">Em Atendimento</option>
                <option value="concluido">Concluído</option>
              </select>
            </div>

            {/* Filtro por Corretor (Visível para Admin ou se tiver permissão geral) */}
            {(!currentUser?.isBroker || currentUser?.permissions.pode_ver_ofertas_gerais) && (
              <div>
                <select
                  value={filterBroker}
                  onChange={(e) => setFilterBroker(e.target.value)}
                  className="field h-10 text-xs"
                >
                  <option value="all">Todos os Corretores</option>
                  {brokers.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Tabela de Mensagens */}
        <div className="panel p-0 overflow-hidden shadow-sm">
          {filteredMessages.length === 0 ? (
            <div className="py-16 text-center">
              <MessageSquare className="mx-auto size-10 text-muted-foreground/40 mb-3" />
              <p className="text-base font-semibold">Nenhuma mensagem encontrada</p>
              <p className="text-xs text-muted-foreground mt-1">
                Tente ajustar os filtros ou aguarde novas mensagens do site.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-secondary/60 text-muted-foreground uppercase font-semibold text-[10px] tracking-wider border-b border-border">
                  <tr>
                    <th className="py-3 px-4">Data</th>
                    <th className="py-3 px-4">Cliente & Contato</th>
                    <th className="py-3 px-4">Assunto / Imóvel</th>
                    <th className="py-3 px-4">Mensagem</th>
                    <th className="py-3 px-4">Corretor</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Ação Direta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredMessages.map((msg) => {
                    const replyUrl = buildClientWhatsappReplyUrl(msg);
                    return (
                      <tr key={msg.id} className="hover:bg-secondary/20 transition-colors">
                        {/* Data */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-muted-foreground">
                          <div className="flex items-center gap-1 font-mono text-[11px]">
                            <Clock className="size-3 text-muted-foreground" />
                            {new Date(msg.data_envio).toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </td>

                        {/* Cliente & Contato */}
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-foreground text-sm">{msg.nome_cliente}</p>
                          <div className="flex flex-col gap-0.5 mt-0.5">
                            <span className="font-mono text-[11px] text-muted-foreground flex items-center gap-1">
                              <Phone className="size-3 text-emerald-600" />
                              {msg.telefone_cliente}
                            </span>
                            {msg.email_cliente && (
                              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                <Mail className="size-3" />
                                {msg.email_cliente}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Assunto / Imóvel */}
                        <td className="py-3.5 px-4 max-w-[220px]">
                          {msg.tipo === "captacao" ? (
                            <div>
                              <span className="chip text-[10px] bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 font-bold mb-1">
                                Captação / Anúncio
                              </span>
                              <p className="font-semibold text-foreground text-xs mt-0.5">
                                {msg.tipo_imovel || "Imóvel"}
                              </p>
                              {msg.cidade_bairro && (
                                <p className="text-[11px] text-muted-foreground">
                                  {msg.cidade_bairro}
                                </p>
                              )}
                              {msg.valor_pretendido && (
                                <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                                  {typeof msg.valor_pretendido === "number"
                                    ? brl(msg.valor_pretendido)
                                    : `R$ ${msg.valor_pretendido}`}
                                </p>
                              )}
                            </div>
                          ) : msg.codigo_imovel ? (
                            <div>
                              <Link
                                to={`/imovel/${msg.codigo_imovel}` as any}
                                target="_blank"
                                className="font-mono text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
                              >
                                {msg.codigo_imovel}
                                <ExternalLink className="size-3" />
                              </Link>
                              <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                                {msg.titulo_imovel}
                              </p>
                              <span className="chip text-[10px] bg-secondary text-foreground mt-1">
                                {msg.interesse}
                              </span>
                            </div>
                          ) : (
                            <div>
                              <span className="chip text-[10px] bg-secondary text-foreground font-semibold">
                                {msg.interesse}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Mensagem / Observações */}
                        <td className="py-3.5 px-4 max-w-[300px]">
                          <p className="text-xs text-foreground/90 line-clamp-3 leading-relaxed whitespace-pre-wrap">
                            {msg.mensagem || "Sem mensagem complementar."}
                          </p>
                          {msg.foto_imovel_url && (
                            <a
                              href={msg.foto_imovel_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-primary hover:underline font-semibold mt-1 inline-block"
                            >
                              Ver Foto do Imóvel Enviada
                            </a>
                          )}
                        </td>

                        {/* Corretor Atribuído */}
                        <td className="py-3.5 px-4">
                          {currentUser?.isAdmin ? (
                            <select
                              value={msg.corretor_atribuido_id || ""}
                              onChange={(e) => handleBrokerAssign(msg.id, e.target.value)}
                              className="field h-8 text-[11px] py-0"
                            >
                              <option value="">Não Atribuído</option>
                              {brokers.map((b) => (
                                <option key={b.id} value={b.id}>
                                  {b.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-xs text-foreground font-medium">
                              {msg.corretor_nome || "Geral da Imobiliária"}
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 text-center">
                          <select
                            value={msg.status}
                            onChange={(e) =>
                              handleStatusChange(msg.id, e.target.value as MessageStatus)
                            }
                            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold border ${
                              msg.status === "pendente"
                                ? "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300"
                                : msg.status === "em_atendimento"
                                ? "bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300"
                                : "bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300"
                            }`}
                          >
                            <option value="pendente">Pendente</option>
                            <option value="em_atendimento">Em Atendimento</option>
                            <option value="concluido">Concluído</option>
                          </select>
                        </td>

                        {/* Ação Direta WhatsApp */}
                        <td className="py-3.5 px-4 text-right">
                          <a
                            href={replyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-500 transition-colors"
                            title="Conversar diretamente no WhatsApp"
                          >
                            <Phone className="size-3.5 fill-current" />
                            <span>WhatsApp</span>
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

