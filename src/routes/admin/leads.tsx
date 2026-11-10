import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo, useEffect } from "react";
import {
  Users,
  Search,
  Filter,
  Kanban,
  Table as TableIcon,
  Plus,
  MessageCircle,
  Phone,
  ArrowLeft,
  Building2,
  Calendar,
  Sparkles,
  UserCheck,
  ShieldCheck,
  ExternalLink,
  X,
  Clock,
  ChevronRight,
  TrendingUp,
  Flame,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/site/SiteLayout";
import {
  type Lead,
  type LeadStatus,
  type LeadTemperature,
  type BrokerProfile,
  KANBAN_COLUMNS,
  DEFAULT_BROKERS,
  TEMPERATURE_CONFIG,
  fetchLeads,
  updateLeadStatusInDb,
  deleteLeadInDb,
  buildWhatsappChatUrl,
} from "@/lib/leads";
import { KanbanCard } from "@/components/admin/KanbanCard";
import { LeadDetailsModal } from "@/components/admin/LeadDetailsModal";
import { brl } from "@/lib/realty";

import { getCurrentUserProfile, fetchBrokers } from "@/lib/brokers";

export const Route = createFileRoute("/admin/leads")({
  head: () => ({
    meta: [
      { title: "Gestão de Leads — CRM Imobiliário" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: LeadsManagementPage,
});

function LeadsManagementPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // State
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBrokerId, setFilterBrokerId] = useState<string>("all");
  const [filterTemperature, setFilterTemperature] = useState<string>("all");
  const [filterSource, setFilterSource] = useState<string>("all");
  const [filterTransaction, setFilterTransaction] = useState<string>("all");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draggedOverCol, setDraggedOverCol] = useState<LeadStatus | null>(null);

  // 1. Current User & RBAC Verification
  const { data: currentUser } = useQuery({
    queryKey: ["admin", "current-user-info"],
    queryFn: getCurrentUserProfile,
  });

  const isAdmin = currentUser?.isAdmin ?? true;
  const currentUserId = currentUser?.id;
  const currentUserName = currentUser?.name || "Michele Folster";
  const currentUserRoleLabel = currentUser?.roleLabel || "Gestora/Administradora";

  // 2. Query Brokers List (Active profiles in platform, Super Admin hidden)
  const { data: brokers = [] } = useQuery({
    queryKey: ["admin", "active-brokers"],
    queryFn: async () => {
      const list = await fetchBrokers(false);
      return list.map((b) => ({
        id: b.id,
        name: b.name,
        email: b.email,
        role: b.role === "admin" ? ("admin" as const) : ("broker" as const),
        active: b.active,
      }));
    },
  });

  // 3. Query Leads from Supabase
  const { data: allLeads = [] } = useQuery({
    queryKey: ["admin", "leads-crm-list"],
    queryFn: fetchLeads,
  });

  // Listener em tempo real para sincronização instantânea de leads entre navegadores
  useEffect(() => {
    const channel = supabase
      .channel("crm-leads-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "leads" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["admin", "leads-crm-list"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // 4. Access Control Filter (RBAC)
  // Admins see all leads (or filter by broker); Standard brokers see ONLY their assigned leads
  const roleFilteredLeads = useMemo(() => {
    if (isAdmin || currentUser?.permissions.pode_ver_ofertas_gerais) {
      if (filterBrokerId === "all") return allLeads;
      if (filterBrokerId === "unassigned") return allLeads.filter((l) => !l.broker_id);
      return allLeads.filter((l) => l.broker_id === filterBrokerId);
    }
    // Standard broker can ONLY see leads assigned to them
    return allLeads.filter((l) => l.broker_id === currentUserId);
  }, [allLeads, isAdmin, currentUser, filterBrokerId, currentUserId]);

  // 5. Search & Additional Filters
  const filteredLeads = useMemo(() => {
    return roleFilteredLeads.filter((lead) => {
      // Search term (name, phone, email, property_code)
      if (searchQuery.trim()) {
        const term = searchQuery.trim().toLowerCase();
        const matchesName = lead.name.toLowerCase().includes(term);
        const matchesPhone = lead.phone.toLowerCase().includes(term);
        const matchesEmail = lead.email ? lead.email.toLowerCase().includes(term) : false;
        const matchesCode = lead.property_code ? lead.property_code.toLowerCase().includes(term) : false;
        if (!matchesName && !matchesPhone && !matchesEmail && !matchesCode) {
          return false;
        }
      }

      // Filter Temperature
      if (filterTemperature !== "all" && lead.temperature !== filterTemperature) {
        return false;
      }

      // Filter Source
      if (filterSource !== "all" && lead.source.toLowerCase() !== filterSource.toLowerCase()) {
        return false;
      }

      // Filter Transaction Type
      if (filterTransaction !== "all" && lead.transaction_type !== filterTransaction) {
        return false;
      }

      return true;
    });
  }, [roleFilteredLeads, searchQuery, filterTemperature, filterSource, filterTransaction]);

  // Handle moving a lead to a new Kanban column
  const handleMoveStatus = async (leadId: string, newStatus: LeadStatus) => {
    const targetLead = allLeads.find((l) => l.id === leadId);
    if (!targetLead || targetLead.status === newStatus) return;

    const newStatusCol = KANBAN_COLUMNS.find((c) => c.id === newStatus)?.title;

    // Persistência direta no Supabase DB
    const res = await updateLeadStatusInDb(leadId, newStatus);
    if (!res.success) {
      toast.error(`Falha ao salvar no Supabase: ${res.error}`);
      return;
    }

    queryClient.invalidateQueries({ queryKey: ["admin", "leads-crm-list"] });
    toast.success(`Lead movido para "${newStatusCol}"`);
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent, colId: LeadStatus) => {
    e.preventDefault();
    if (draggedOverCol !== colId) {
      setDraggedOverCol(colId);
    }
  };

  const handleDragLeave = () => {
    setDraggedOverCol(null);
  };

  const handleDrop = (e: React.DragEvent, colId: LeadStatus) => {
    e.preventDefault();
    setDraggedOverCol(null);
    const leadId = e.dataTransfer.getData("text/plain");
    if (leadId) {
      handleMoveStatus(leadId, colId);
    }
  };

  const handleOpenDetails = (lead: Lead) => {
    setSelectedLead(lead);
    setIsModalOpen(true);
  };

  const handleLeadUpdated = (updated: Lead) => {
    queryClient.invalidateQueries({ queryKey: ["admin", "leads-crm-list"] });
    setSelectedLead(updated);
  };

  const handleDeleteLead = async (leadId: string) => {
    const res = await deleteLeadInDb(leadId);
    if (!res.success) {
      toast.error(`Falha ao excluir no Supabase: ${res.error}`);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["admin", "leads-crm-list"] });
    toast.success("Lead removido com sucesso.");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Header */}
      <header className="border-b bg-surface px-4 sm:px-6 py-3.5 sticky top-0 z-30 shadow-xs">
        <div className="container-page flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/admin"
              className="btn btn-ghost text-xs h-8 text-muted-foreground hover:text-foreground"
              title="Voltar ao Painel"
            >
              <ArrowLeft className="mr-1.5 size-3.5" />
              Painel
            </Link>
            <div className="h-4 w-px bg-border" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                  Gestão de Leads (CRM)
                </h1>
                <span className="rounded-full bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5">
                  {filteredLeads.length} leads
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle: Kanban vs Tabela */}
            <div className="flex items-center rounded-xl border border-border bg-muted/50 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setViewMode("kanban")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                  viewMode === "kanban"
                    ? "bg-card text-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Kanban className="size-3.5" />
                <span>Kanban</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                  viewMode === "table"
                    ? "bg-card text-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <TableIcon className="size-3.5" />
                <span>Tabela</span>
              </button>
            </div>

            <Link
              to="/admin/mensagens"
              className="btn btn-ghost text-xs h-8 text-muted-foreground hover:text-foreground hidden sm:inline-flex"
            >
              Central de Mensagens
            </Link>

            {/* User Badge */}
            <div className="hidden md:flex items-center gap-2 pl-3 border-l border-border">
              <div className="text-right">
                <p className="text-xs font-bold text-foreground">{currentUserName}</p>
                <p className="text-[10px] text-primary font-semibold uppercase">
                  {currentUserRoleLabel}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main CRM Workspace */}
      <main className="container-page py-6 space-y-6">
        {/* Filter Controls Bar */}
        <div className="panel p-4 shadow-sm space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nome, telefone, e-mail ou código..."
                className="field pl-9 pr-8 text-xs h-9.5"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap items-center gap-2.5 text-xs">
              {/* Broker Selector (Admin Only) */}
              {isAdmin && (
                <div className="flex items-center gap-1.5">
                  <UserCheck className="size-3.5 text-primary" />
                  <select
                    value={filterBrokerId}
                    onChange={(e) => setFilterBrokerId(e.target.value)}
                    className="field h-9 text-xs py-1"
                  >
                    <option value="all">Todos os Corretores</option>
                    {brokers.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                    <option value="unassigned">Leads Não Atribuídos</option>
                  </select>
                </div>
              )}

              {/* Temperature Filter */}
              <div className="flex items-center gap-1.5">
                <select
                  value={filterTemperature}
                  onChange={(e) => setFilterTemperature(e.target.value)}
                  className="field h-9 text-xs py-1"
                >
                  <option value="all">Todas as Temperaturas</option>
                  <option value="quente">🔥 Quente</option>
                  <option value="morno">☀️ Morno</option>
                  <option value="frio">❄️ Frio</option>
                </select>
              </div>

              {/* Source Filter */}
              <div className="flex items-center gap-1.5">
                <select
                  value={filterSource}
                  onChange={(e) => setFilterSource(e.target.value)}
                  className="field h-9 text-xs py-1"
                >
                  <option value="all">Todas as Origens</option>
                  <option value="site">Site</option>
                  <option value="meta_ads">Meta Ads</option>
                  <option value="portal">Portal</option>
                  <option value="indicacao">Indicação</option>
                  <option value="whatsapp">WhatsApp</option>
                </select>
              </div>

              {/* Transaction Type */}
              <div className="flex items-center gap-1.5">
                <select
                  value={filterTransaction}
                  onChange={(e) => setFilterTransaction(e.target.value)}
                  className="field h-9 text-xs py-1"
                >
                  <option value="all">Compra ou Locação</option>
                  <option value="comprar">Comprar</option>
                  <option value="alugar">Alugar</option>
                </select>
              </div>

              {/* Clear Filters Button */}
              {(searchQuery ||
                filterBrokerId !== "all" ||
                filterTemperature !== "all" ||
                filterSource !== "all" ||
                filterTransaction !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setFilterBrokerId("all");
                    setFilterTemperature("all");
                    setFilterSource("all");
                    setFilterTransaction("all");
                  }}
                  className="btn btn-ghost text-xs h-9 text-muted-foreground hover:text-foreground"
                >
                  Limpar Filtros
                </button>
              )}
            </div>
          </div>
        </div>

        {/* View 1: KANBAN BOARD */}
        {viewMode === "kanban" && (
          <div className="overflow-x-auto pb-6">
            <div className="flex gap-4 min-w-[1380px] items-start">
              {KANBAN_COLUMNS.map((col) => {
                const colLeads = filteredLeads.filter((l) => l.status === col.id);
                const isOver = draggedOverCol === col.id;

                return (
                  <div
                    key={col.id}
                    onDragOver={(e) => handleDragOver(e, col.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, col.id)}
                    className={`flex-1 min-w-[240px] max-w-[280px] flex flex-col rounded-2xl border transition-colors bg-surface/50 p-3 ${
                      isOver
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "border-border/70"
                    }`}
                  >
                    {/* Column Header */}
                    <div className="flex items-start justify-between pb-3 mb-2 border-b border-border/50">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`size-2 rounded-full ${col.borderColor.replace("border-", "bg-")}`} />
                          <h3 className="text-xs font-bold text-foreground tracking-tight">
                            {col.title}
                          </h3>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {col.subtitle}
                        </p>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${col.badgeBg} ${col.badgeText}`}
                      >
                        {colLeads.length}
                      </span>
                    </div>

                    {/* Cards Container */}
                    <div className="flex flex-col gap-2.5 min-h-[300px]">
                      {colLeads.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-4 border border-dashed border-border/60 rounded-xl text-center text-muted-foreground/60 text-xs">
                          <span>Nenhum lead nesta etapa</span>
                        </div>
                      ) : (
                        colLeads.map((lead) => (
                          <KanbanCard
                            key={lead.id}
                            lead={lead}
                            onOpenDetails={handleOpenDetails}
                            onMoveStatus={handleMoveStatus}
                            isAdmin={isAdmin}
                          />
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* View 2: TABLE VIEW */}
        {viewMode === "table" && (
          <div className="panel shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
                  <tr>
                    <th className="py-3 px-4">Cliente / Contato</th>
                    <th className="py-3 px-4">Temperatura</th>
                    <th className="py-3 px-4">Imóvel de Interesse</th>
                    <th className="py-3 px-4">Etapa do Funil</th>
                    <th className="py-3 px-4">Origem</th>
                    {isAdmin && <th className="py-3 px-4">Corretor</th>}
                    <th className="py-3 px-4">Próxima Ação</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredLeads.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-muted-foreground">
                        Nenhum lead encontrado com os filtros atuais.
                      </td>
                    </tr>
                  ) : (
                    filteredLeads.map((lead) => {
                      const temp = TEMPERATURE_CONFIG[lead.temperature] || TEMPERATURE_CONFIG.morno;
                      const col = KANBAN_COLUMNS.find((c) => c.id === lead.status);

                      return (
                        <tr
                          key={lead.id}
                          onClick={() => handleOpenDetails(lead)}
                          className="hover:bg-secondary/40 cursor-pointer transition-colors"
                        >
                          <td className="py-3.5 px-4">
                            <p className="font-bold text-foreground text-xs">{lead.name}</p>
                            <p className="text-[11px] text-muted-foreground">{lead.phone}</p>
                          </td>

                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${temp.badgeClass}`}
                            >
                              <span>{temp.icon}</span>
                              <span>{temp.label}</span>
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <p className="font-medium text-foreground truncate max-w-[200px]">
                              {lead.property_title || lead.interest || "Geral"}
                            </p>
                            {lead.property_code && (
                              <span className="font-mono text-[10px] text-muted-foreground font-bold">
                                {lead.property_code}
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${col?.badgeBg} ${col?.badgeText}`}
                            >
                              {col?.title}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="text-muted-foreground">{lead.source}</span>
                          </td>

                          {isAdmin && (
                            <td className="py-3.5 px-4">
                              <span className="font-medium text-foreground">
                                {lead.broker_name || "Não atribuído"}
                              </span>
                            </td>
                          )}

                          <td className="py-3.5 px-4">
                            {lead.next_action ? (
                              <span className="text-[11px] text-foreground flex items-center gap-1">
                                <Clock className="size-3 text-primary shrink-0" />
                                <span className="truncate max-w-[160px]">{lead.next_action}</span>
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-[10px]">Sem lembrete</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              <a
                                href={buildWhatsappChatUrl(lead.phone, lead.name, lead.property_code)}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/60"
                                title="Conversar no WhatsApp"
                              >
                                <MessageCircle className="size-4" />
                              </a>
                              <button
                                type="button"
                                onClick={() => handleOpenDetails(lead)}
                                className="btn btn-outline text-xs h-7.5 px-2.5"
                              >
                                Ver Detalhes
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Modal de Detalhes do Lead */}
      <LeadDetailsModal
        lead={selectedLead}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpdate={handleLeadUpdated}
        onDelete={handleDeleteLead}
        brokers={brokers}
        isAdmin={isAdmin}
        currentUserName={currentUserName}
      />
    </div>
  );
}

