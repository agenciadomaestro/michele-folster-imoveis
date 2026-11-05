import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Building2,
  Users,
  LogOut,
  ExternalLink,
  PlusCircle,
  Eye,
  Tag,
  MapPin,
  Edit,
  ShieldCheck,
  Trash2,
  Search,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/site/SiteLayout";
import { toast } from "sonner";
import { priceLabel, type Property } from "@/lib/realty";
import { mergeWithLocalProperties, deleteLocalProperty } from "@/lib/localProperties";

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
  const [searchCode, setSearchCode] = useState("");

  // Query Properties
  const { data: properties = [], isLoading: loadingProps, refetch: refetchProps } = useQuery({
    queryKey: ["admin", "properties-list"],
    queryFn: async () => {
      let supabaseItems: Property[] = [];
      try {
        const { data } = await supabase
          .from("properties")
          .select("*, property_photos(url, position)")
          .order("created_at", { ascending: false });
        if (data) supabaseItems = data as Property[];
      } catch (err) {
        console.warn("Aviso ao buscar lista de imóveis:", err);
      }
      const merged = mergeWithLocalProperties(supabaseItems);
      merged.sort((a, b) => new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime());
      return merged;
    },
  });

  const handleDeleteProperty = async (id: string, propTitle: string) => {
    if (!confirm(`Deseja realmente excluir o imóvel "${propTitle}"?`)) return;
    deleteLocalProperty(id);
    try {
      await supabase.from("properties").delete().eq("id", id);
    } catch {}
    toast.success("Imóvel removido com sucesso.");
    refetchProps();
  };

  const filteredProperties = properties.filter((item) => {
    if (!searchCode.trim()) return true;
    const term = searchCode.trim().toUpperCase();
    return item.code ? item.code.toUpperCase().includes(term) : false;
  });

  // Query Leads
  const { data: leads = [] } = useQuery({
    queryKey: ["admin", "recent-leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(6);
      if (error) return [];
      return data || [];
    },
  });

  // Query Current User & Role
  const { data: userProfile } = useQuery({
    queryKey: ["admin", "current-user"],
    queryFn: async () => {
      let masterUser: any = null;
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("master_auth_user");
        if (stored) {
          try {
            masterUser = JSON.parse(stored);
          } catch {}
        }
      }

      const { data } = await supabase.auth.getUser();
      const user = data?.user || masterUser;
      if (!user) return null;

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const isMaster =
        user.email === "agbipe@agenciabipe.com" ||
        user.email === "contato@agenciabipe.com" ||
        Boolean(masterUser);

      return {
        id: user.id,
        email: user.email,
        name:
          profile?.full_name ||
          user.user_metadata?.["full_name"] ||
          (isMaster ? "Master Agbipe" : user.email),
        roles: (roles || []).map((r) => r.role),
        isAdmin:
          isMaster ||
          (roles || []).some((r) => r.role === "admin" || r.role === "owner"),
      };
    },
  });

  const handleLogout = async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("master_auth_user");
    }
    await supabase.auth.signOut();
    toast.success("Sessão encerrada com sucesso.");
    router.navigate({ to: "/auth" });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-surface px-6 py-4 sticky top-0 z-30">
        <div className="container-page flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 border-r border-border pr-4">
              <div className="grid size-8 place-items-center rounded-full bg-accent text-primary">
                <ShieldCheck className="size-4" />
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-foreground">
                  {userProfile?.name || "Everson Maestro"}
                </p>
                <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">
                  {userProfile?.isAdmin ? "Administrador Master" : "Corretor"}
                </span>
              </div>
            </div>

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
          <Link to="/admin/imoveis/novo" className="btn btn-primary shadow-sm">
            <PlusCircle className="mr-1.5 size-4" />
            Cadastrar Novo Imóvel
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="panel p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Imóveis no Catálogo</span>
              <Building2 className="size-5 text-primary" />
            </div>
            <div className="mt-3 text-3xl font-bold">{properties.length}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              {properties.filter((p) => p.status === "publicado").length} publicados no site
            </p>
          </div>

          <div className="panel p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Leads Recebidos</span>
              <Users className="size-5 text-primary" />
            </div>
            <div className="mt-3 text-3xl font-bold">{leads.length}</div>
            <p className="mt-1 text-xs text-muted-foreground">Contatos recebidos via site</p>
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
                    {filteredProperties.length} {filteredProperties.length === 1 ? "resultado" : "resultados"}
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

              <Link to="/admin/imoveis/novo" className="btn btn-soft text-xs h-9 shrink-0">
                <PlusCircle className="mr-1.5 size-3.5" />
                Novo Imóvel
              </Link>
            </div>
          </div>

          {loadingProps ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Carregando lista de imóveis...
            </div>
          ) : properties.length === 0 ? (
            <div className="py-12 text-center">
              <Building2 className="mx-auto size-10 text-muted-foreground/50 mb-3" />
              <p className="text-base font-semibold">Nenhum imóvel cadastrado ainda</p>
              <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
                Comece cadastrando seu primeiro imóvel pelo formulário completo em etapas.
              </p>
              <Link to="/admin/imoveis/novo" className="btn btn-primary mt-4">
                Cadastrar Imóvel Agora
              </Link>
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="py-12 text-center">
              <Search className="mx-auto size-10 text-muted-foreground/40 mb-3" />
              <p className="text-base font-semibold">Nenhum imóvel encontrado</p>
              <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
                Não encontramos nenhum imóvel com o código contendo{" "}
                <span className="font-bold text-foreground font-mono">"{searchCode.toUpperCase()}"</span>.
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
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                              item.status === "publicado"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {item.status}
                          </span>
                          {item.featured && (
                            <span className="text-[11px] bg-purple-100 text-purple-800 font-semibold px-1.5 py-0.5 rounded">
                              Destaque
                            </span>
                          )}
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
                      <Link
                        to={`/admin/imoveis/${item.id}` as any}
                        className="btn btn-outline text-xs h-8"
                        title="Editar imóvel"
                      >
                        <Edit className="mr-1 size-3.5" />
                        Editar
                      </Link>
                      <Link
                        to={`/imovel/${item.code}` as any}
                        target="_blank"
                        className="btn btn-ghost text-xs h-8"
                        title="Ver no site público"
                      >
                        <Eye className="mr-1 size-3.5" />
                        Ver Página
                      </Link>
                      <button
                        onClick={() => handleDeleteProperty(item.id, item.title)}
                        className="btn btn-ghost text-xs h-8 text-destructive hover:bg-destructive/10"
                        title="Excluir imóvel"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Leads Section */}
        <div className="panel p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">Leads & Contatos Recentes</h2>
              <p className="text-xs text-muted-foreground">
                Últimos formulários enviados por clientes no site
              </p>
            </div>
            <span className="chip text-xs">Tempo Real</span>
          </div>

          {leads.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">Nenhum lead recebido ainda.</p>
          ) : (
            <div className="divide-y divide-border">
              {leads.map((lead: any) => (
                <div key={lead.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{lead.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {lead.phone} • {lead.email || "Sem e-mail"}
                      {lead.property_code ? ` • Ref: ${lead.property_code}` : ""}
                    </p>
                  </div>
                  <span className="chip text-xs capitalize">{lead.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
