import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import {
  Building2,
  Users,
  LogOut,
  ExternalLink,
  PlusCircle,
  Eye,
  MapPin,
  Edit,
  ShieldCheck,
  Trash2,
  Search,
  X,
  Kanban,
  ChevronRight,
  MessageSquare,
  Sliders,
  Shield,
  UserCheck,
  Star,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/site/SiteLayout";
import { toast } from "sonner";
import { priceLabel, type Property } from "@/lib/realty";
import { getCurrentUserProfile, fetchBrokers } from "@/lib/brokers";
import { fetchMessages } from "@/lib/messages";
import { fetchLeads } from "@/lib/leads";
import { BrokerManagementModal } from "@/components/admin/BrokerManagementModal";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Painel Administrativo — Michele Folster Imóveis" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchCode, setSearchCode] = useState("");
  const [isBrokersModalOpen, setIsBrokersModalOpen] = useState(false);

  // 1. Perfil do Usuário Autenticado e Permissões Granulares (RBAC)
  const { data: userProfile } = useQuery({
    queryKey: ["admin", "current-user-profile"],
    queryFn: getCurrentUserProfile,
  });

  // 2. Query de Corretores da Imobiliária (persistidos no Supabase profiles)
  const { data: brokers = [] } = useQuery({
    queryKey: ["admin", "brokers-list"],
    queryFn: async () => fetchBrokers(false),
  });

  // 3. Query de Mensagens & Contatos Recentes do Supabase
  const { data: messages = [] } = useQuery({
    queryKey: ["admin", "messages-leads-list"],
    queryFn: fetchMessages,
  });

  // 4. Query de Leads do CRM Kanban (persistidos no Supabase leads)
  const { data: leads = [] } = useQuery({
    queryKey: ["admin", "crm-leads-list"],
    queryFn: fetchLeads,
  });

  // 5. Query de Imóveis com Suporte a Permissão Granular (pode_ver_ofertas_gerais)
  const {
    data: rawProperties = [],
    isLoading: loadingProps,
  } = useQuery({
    queryKey: ["admin", "properties-list"],
    queryFn: async () => {
      let supabaseItems: Property[] = [];
      try {
        const { data, error } = await supabase
          .from("properties")
          .select("*, property_photos(url, position)")
          .order("created_at", { ascending: false });
        if (!error && data) supabaseItems = data as Property[];
      } catch (err) {
        console.warn("Aviso ao buscar lista de imóveis:", err);
      }
      return supabaseItems;
    },
  });

  // Sincronização em Tempo Real (Supabase Realtime Subscriptions)
  useEffect(() => {
    const channel = supabase
      .channel("admin-dashboard-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "properties" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["admin", "properties-list"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["admin", "brokers-list"] });
          queryClient.invalidateQueries({ queryKey: ["admin", "current-user-profile"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "leads" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["admin", "crm-leads-list"] });
          queryClient.invalidateQueries({ queryKey: ["admin", "messages-leads-list"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Filtragem de Imóveis conforme regras de acesso do Corretor
  const visibleProperties = rawProperties.filter((item) => {
    if (userProfile?.isAdmin) return true;
    if (userProfile?.isBroker && !userProfile.permissions.pode_ver_ofertas_gerais) {
      // Vê apenas se atribuído ao corretor ou sem corretor específico
      return item.broker_id === userProfile.id;
    }
    return true;
  });

  // Alternar Destaque no Supabase com sincronização imediata
  const handleToggleFeatured = async (property: Property) => {
    const nextFeatured = !property.featured;
    try {
      const { error } = await supabase
        .from("properties")
        .update({ featured: nextFeatured, updated_at: new Date().toISOString() })
        .eq("id", property.id);
      if (error) {
        console.warn("Aviso ao atualizar destaque no Supabase:", error.message);
      }
    } catch (err) {
      console.warn("Erro ao comunicar destaque no Supabase:", err);
    }
    queryClient.invalidateQueries({ queryKey: ["admin", "properties-list"] });
    toast.success(nextFeatured ? "Imóvel marcado como Destaque!" : "Destaque removido.");
  };

  // Alternar Status no Supabase (publicado / rascunho)
  const handleToggleStatus = async (property: Property) => {
    const nextStatus = property.status === "publicado" ? "rascunho" : "publicado";
    try {
      const { error } = await supabase
        .from("properties")
        .update({ status: nextStatus, updated_at: new Date().toISOString() })
        .eq("id", property.id);
      if (error) {
        console.warn("Aviso ao atualizar status no Supabase:", error.message);
      }
    } catch (err) {
      console.warn("Erro ao comunicar status no Supabase:", err);
    }
    queryClient.invalidateQueries({ queryKey: ["admin", "properties-list"] });
    toast.success(`Status alterado para "${nextStatus}".`);
  };

  // Excluir Imóvel diretamente no Supabase DB e Storage
  const handleDeleteProperty = async (id: string, propTitle: string) => {
    if (!confirm(`Deseja realmente excluir o imóvel "${propTitle}"?`)) return;
    try {
      // Deleta primeiro as fotos vinculadas para evitar conflitos de chave estrangeira
      await supabase.from("property_photos").delete().eq("property_id", id);
      const { error } = await supabase.from("properties").delete().eq("id", id);
      if (error) {
        console.warn("Aviso ao excluir imóvel no Supabase:", error.message);
      }
    } catch (err) {
      console.warn("Erro ao excluir imóvel no Supabase:", err);
    }
    queryClient.invalidateQueries({ queryKey: ["admin", "properties-list"] });
    toast.success("Imóvel removido com sucesso.");
  };

  const filteredProperties = visibleProperties.filter((item) => {
    if (!searchCode.trim()) return true;
    const term = searchCode.trim().toUpperCase();
    return item.code ? item.code.toUpperCase().includes(term) : false;
  });

  const handleLogout = async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("master_auth_user");
    }
    await supabase.auth.signOut();
    toast.success("Sessão encerrada com sucesso.");
    router.navigate({ to: "/auth" });
  };

  // Permissão de cadastro de imóvel
  const canCreateProperty =
    userProfile?.isAdmin || userProfile?.permissions.pode_cadastrar_imovel;

  return (
    <div className="min-h-screen bg-background">
      {/* Header com Identificação Dinâmica de Acesso */}
      <header className="border-b bg-surface px-6 py-4 sticky top-0 z-30">
        <div className="container-page flex items-center justify-between">
          <Logo />

          <div className="flex items-center gap-4">
            {/* Informações do Usuário Dinâmico */}
            <div className="hidden sm:flex items-center gap-2 border-r border-border pr-4">
              <div className="grid size-8 place-items-center rounded-full bg-accent text-primary">
                {userProfile?.isSuperAdmin ? (
                  <Shield className="size-4" />
                ) : userProfile?.isAdmin ? (
                  <ShieldCheck className="size-4" />
                ) : (
                  <UserCheck className="size-4" />
                )}
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-foreground">
                  {userProfile?.name || "Michele Folster"}
                </p>
                <span className="text-[10px] font-semibold text-primary uppercase tracking-wider block">
                  {userProfile?.roleLabel || "Gestora/Administradora"}
                </span>
              </div>
            </div>

            {/* Atalhos Rápidos */}
            <Link
              to="/admin/leads"
              className="btn btn-soft text-xs h-9 text-primary font-bold shadow-xs"
            >
              <Kanban className="mr-1.5 size-4" />
              Gestão de Leads (CRM)
            </Link>

            <Link
              to="/admin/mensagens"
              className="btn btn-ghost text-xs h-9 text-muted-foreground hover:text-foreground font-semibold"
            >
              <MessageSquare className="mr-1.5 size-4" />
              Central de Mensagens
            </Link>

            {userProfile?.isAdmin && (
              <button
                onClick={() => setIsBrokersModalOpen(true)}
                className="btn btn-outline text-xs h-9 font-semibold gap-1.5 hidden md:inline-flex"
              >
                <Sliders className="size-3.5 text-primary" />
                <span>Corretores</span>
              </button>
            )}

            <Link
              to="/"
              className="btn btn-ghost text-sm text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="mr-1.5 size-4" />
              Ver site
            </Link>

            <button
              onClick={handleLogout}
              className="btn btn-outline text-sm text-destructive hover:bg-destructive/10"
            >
              <LogOut className="mr-1.5 size-4" />
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="container-page py-10 space-y-10">
        {/* Title & Actions Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Painel Administrativo</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Gerencie seus imóveis, fotos e acompanhe os contatos de clientes em tempo real.
            </p>
          </div>

          {canCreateProperty ? (
            <Link to="/admin/imoveis/novo" className="btn btn-primary shadow-sm">
              <PlusCircle className="mr-1.5 size-4" />
              Cadastrar Novo Imóvel
            </Link>
          ) : (
            <div
              className="btn bg-muted text-muted-foreground cursor-not-allowed opacity-60 text-xs"
              title="Permissão desativada pelo administrador"
            >
              <PlusCircle className="mr-1.5 size-4" />
              Cadastro Bloqueado
            </div>
          )}
        </div>

        {/* Reformulação do Header do Dashboard: Grid 4x1 de Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1 - Imóveis no Catálogo */}
          <div className="panel p-5 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Imóveis no Catálogo
                </span>
                <Building2 className="size-5 text-primary" />
              </div>
              <div className="mt-3 text-3xl font-bold text-foreground">
                {visibleProperties.length}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {visibleProperties.filter((p) => p.status === "publicado").length} publicados no site
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-border/50 text-[11px] text-muted-foreground font-medium">
              Base ativa e atualizada
            </div>
          </div>

          {/* Card 2 - Leads Recebidos */}
          <div className="panel p-5 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Leads Recebidos
                </span>
                <Kanban className="size-5 text-primary" />
              </div>
              <div className="mt-3 text-3xl font-bold text-foreground">{leads.length}</div>
              <p className="mt-1 text-xs text-muted-foreground">Funil de vendas ativo</p>
            </div>
            <div className="mt-4 pt-3 border-t border-border/50">
              <Link
                to="/admin/leads"
                className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
              >
                <span>Acessar CRM Kanban</span>
                <ChevronRight className="size-3.5" />
              </Link>
            </div>
          </div>

          {/* Card 3 - Leads & Contatos Recentes (Movido do rodapé para este card) */}
          <div className="panel p-5 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Leads & Contatos Recentes
                </span>
                <MessageSquare className="size-5 text-primary" />
              </div>
              <div className="mt-3 text-3xl font-bold text-foreground">{messages.length}</div>
              <p className="mt-1 text-xs text-muted-foreground">
                {messages.filter((m) => m.status === "pendente").length} pendentes de atendimento
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-border/50">
              <Link
                to="/admin/mensagens"
                className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
              >
                <span>Central de Mensagens/Contatos</span>
                <ChevronRight className="size-3.5" />
              </Link>
            </div>
          </div>

          {/* Card 4 - Gestão de Corretores */}
          <div className="panel p-5 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Gestão de Corretores
                </span>
                <Users className="size-5 text-primary" />
              </div>
              <div className="mt-3 text-3xl font-bold text-foreground">{brokers.length}</div>
              <p className="mt-1 text-xs text-muted-foreground">
                {brokers.filter((b) => b.active).length} corretores ativos na equipe
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-border/50">
              <button
                type="button"
                onClick={() => setIsBrokersModalOpen(true)}
                className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
              >
                <span>Gerenciar Corretores</span>
                <ChevronRight className="size-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Properties Section */}
        <div className="panel p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">Imóveis Cadastrados</h2>
                {searchCode && (
                  <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-primary">
                    {filteredProperties.length}{" "}
                    {filteredProperties.length === 1 ? "resultado" : "resultados"}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Lista de imóveis gerenciados no sistema
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Campo de Busca por Código */}
              <div className="relative min-w-[210px] sm:w-60">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={searchCode}
                  onChange={(e) => setSearchCode(e.target.value)}
                  placeholder="Busca por código"
                  className="field h-9 pl-9 pr-8 text-xs font-semibold tracking-wider uppercase placeholder:normal-case placeholder:font-normal placeholder:tracking-normal"
                />
                {searchCode && (
                  <button
                    type="button"
                    onClick={() => setSearchCode("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                    title="Limpar busca"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              {canCreateProperty && (
                <Link to="/admin/imoveis/novo" className="btn btn-soft text-xs h-9 shrink-0">
                  <PlusCircle className="mr-1.5 size-3.5" />
                  Novo Imóvel
                </Link>
              )}
            </div>
          </div>

          {loadingProps ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Carregando lista de imóveis...
            </div>
          ) : visibleProperties.length === 0 ? (
            <div className="py-12 text-center">
              <Building2 className="mx-auto size-10 text-muted-foreground/50 mb-3" />
              <p className="text-base font-semibold">Nenhum imóvel disponível para sua visualização</p>
              <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
                {canCreateProperty
                  ? "Comece cadastrando seu primeiro imóvel pelo formulário completo em etapas."
                  : "Aguarde a atribuição de imóveis pelo gestor da imobiliária."}
              </p>
              {canCreateProperty && (
                <Link to="/admin/imoveis/novo" className="btn btn-primary mt-4">
                  Cadastrar Imóvel Agora
                </Link>
              )}
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="py-12 text-center">
              <Search className="mx-auto size-10 text-muted-foreground/40 mb-3" />
              <p className="text-base font-semibold">Nenhum imóvel encontrado</p>
              <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
                Não encontramos nenhum imóvel com o código contendo{" "}
                <span className="font-bold text-foreground font-mono">
                  "{searchCode.toUpperCase()}"
                </span>
                .
              </p>
              <button
                type="button"
                onClick={() => setSearchCode("")}
                className="btn btn-outline text-xs h-8 mt-4"
              >
                Limpar busca
              </button>
            </div>
          ) : (
            <div className="divide-y divide-border overflow-x-auto">
              {filteredProperties.map((item) => {
                const coverPhoto = item.property_photos?.sort(
                  (a, b) => a.position - b.position
                )[0]?.url;
                return (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 hover:bg-secondary/30 transition-colors rounded-xl px-3"
                  >
                    <div className="flex items-center gap-4">
                      <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-secondary border border-border">
                        {coverPhoto ? (
                          <img
                            src={coverPhoto}
                            alt={item.title}
                            className="size-full object-cover"
                          />
                        ) : (
                          <div className="grid size-full place-items-center text-muted-foreground text-xs">
                            Sem foto
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-primary bg-accent px-2 py-0.5 rounded-md">
                            {item.code}
                          </span>
                          <span className="chip text-[11px] h-5 capitalize">
                            {item.purpose}
                          </span>

                          {/* Status Toggle interativo com persistência no Supabase */}
                          {userProfile?.isAdmin ? (
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(item)}
                              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full transition-all cursor-pointer flex items-center gap-1 shadow-2xs hover:opacity-85 ${
                                item.status === "publicado"
                                  ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                                  : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                              }`}
                              title="Clique para alternar entre Publicado e Rascunho no banco de dados"
                            >
                              <span
                                className={`size-1.5 rounded-full ${
                                  item.status === "publicado" ? "bg-emerald-600" : "bg-amber-600"
                                }`}
                              />
                              <span className="capitalize">{item.status}</span>
                            </button>
                          ) : (
                            <span
                              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                                item.status === "publicado"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {item.status}
                            </span>
                          )}

                          {/* Destaque Toggle interativo com persistência no Supabase */}
                          {userProfile?.isAdmin ? (
                            <button
                              type="button"
                              onClick={() => handleToggleFeatured(item)}
                              className={`text-[11px] font-semibold px-2 py-0.5 rounded-md transition-all cursor-pointer flex items-center gap-1 shadow-2xs ${
                                item.featured
                                  ? "bg-purple-100 text-purple-800 hover:bg-purple-200 border border-purple-200"
                                  : "bg-secondary text-muted-foreground hover:bg-secondary/80 border border-border/40"
                              }`}
                              title={
                                item.featured
                                  ? "Imóvel em Destaque no site. Clique para remover do destaque."
                                  : "Clique para destacar este imóvel no topo do site."
                              }
                            >
                              <Star
                                className={`size-3 ${
                                  item.featured ? "fill-purple-600 text-purple-600" : "text-muted-foreground"
                                }`}
                              />
                              <span>{item.featured ? "Destaque" : "Normal"}</span>
                            </button>
                          ) : item.featured ? (
                            <span className="text-[11px] bg-purple-100 text-purple-800 font-semibold px-1.5 py-0.5 rounded flex items-center gap-1">
                              <Star className="size-3 fill-purple-600 text-purple-600" />
                              Destaque
                            </span>
                          ) : null}
                        </div>
                        <h3 className="font-semibold text-sm mt-1 text-foreground">
                          {item.title}
                        </h3>
                        <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                          <span className="flex items-center gap-1">
                            <MapPin className="size-3" />
                            {item.neighborhood ? `${item.neighborhood}, ` : ""}
                            {item.city}/{item.state}
                          </span>
                          •
                          <span className="font-semibold text-foreground">
                            {priceLabel(item)}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {canCreateProperty && (
                        <Link
                          to={`/admin/imoveis/${item.id}` as any}
                          className="btn btn-outline text-xs h-8"
                          title="Editar imóvel"
                        >
                          <Edit className="mr-1 size-3.5" />
                          Editar
                        </Link>
                      )}
                      <Link
                        to={`/imovel/${item.code}` as any}
                        target="_blank"
                        className="btn btn-ghost text-xs h-8"
                        title="Ver no site público"
                      >
                        <Eye className="mr-1 size-3.5" />
                        Ver Página
                      </Link>
                      {userProfile?.isAdmin && (
                        <button
                          onClick={() => handleDeleteProperty(item.id, item.title)}
                          className="btn btn-ghost text-xs h-8 text-destructive hover:bg-destructive/10"
                          title="Excluir imóvel"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Modal de Gestão de Corretores e Permissões */}
      <BrokerManagementModal
        isOpen={isBrokersModalOpen}
        onClose={() => setIsBrokersModalOpen(false)}
        properties={rawProperties}
        onBrokersUpdated={() => {
          queryClient.invalidateQueries({ queryKey: ["admin", "brokers-list"] });
          queryClient.invalidateQueries({ queryKey: ["admin", "current-user-profile"] });
        }}
      />
    </div>
  );
}
