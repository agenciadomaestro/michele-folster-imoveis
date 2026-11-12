import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  TrendingUp,
  Eye,
  Clock,
  Images,
  MessageCircle,
  Calendar,
  ArrowLeft,
  ExternalLink,
  ShieldAlert,
  Building2,
  RefreshCw,
  Globe,
  Share2,
} from "lucide-react";
import { Logo } from "@/components/site/SiteLayout";
import { getCurrentUserProfile } from "@/lib/brokers";
import {
  fetchAnalyticsData,
  formatDuration,
  type PeriodFilter,
} from "@/lib/analytics";
import { supabase } from "@/integrations/supabase/client";
import { priceLabel, type Property } from "@/lib/realty";

export const Route = createFileRoute("/admin/analytics")({
  head: () => ({
    meta: [
      { name: "description", content: "Dashboard de Audiência e Acessos — Michele Folster Imóveis." },
      { property: "og:title", content: "Audiência e Acessos — Michele Folster Imóveis" },
      { title: "Audiência e Acessos — Painel Administrativo" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AnalyticsDashboardPage,
});

const PERIOD_OPTIONS: { id: PeriodFilter; label: string }[] = [
  { id: "today", label: "Hoje" },
  { id: "7d", label: "Últimos 7 dias" },
  { id: "30d", label: "Últimos 30 dias" },
  { id: "all", label: "Todo o período" },
];

const SOURCE_COLORS: Record<string, { bg: string; bar: string; text: string }> = {
  "Google Meu Negócio": { bg: "bg-blue-500/10", bar: "bg-blue-600", text: "text-blue-700 dark:text-blue-400" },
  "Google (Busca)": { bg: "bg-sky-500/10", bar: "bg-sky-500", text: "text-sky-700 dark:text-sky-400" },
  "Instagram": { bg: "bg-pink-500/10", bar: "bg-gradient-to-r from-purple-500 to-pink-500", text: "text-pink-700 dark:text-pink-400" },
  "Facebook": { bg: "bg-indigo-500/10", bar: "bg-indigo-600", text: "text-indigo-700 dark:text-indigo-400" },
  "WhatsApp": { bg: "bg-emerald-500/10", bar: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-400" },
  "Meta Ads": { bg: "bg-amber-500/10", bar: "bg-amber-500", text: "text-amber-700 dark:text-amber-400" },
  "Acesso Direto": { bg: "bg-slate-500/10", bar: "bg-slate-500", text: "text-slate-700 dark:text-slate-400" },
};

function AnalyticsDashboardPage() {
  const router = useRouter();
  const [period, setPeriod] = useState<PeriodFilter>("7d");

  // 1. Verificação de Permissão RBAC (Restrito a Super Admin e Admin)
  const { data: userProfile, isLoading: loadingUser } = useQuery({
    queryKey: ["admin", "current-user-profile"],
    queryFn: getCurrentUserProfile,
  });

  const isAuthorized =
    userProfile?.role === "super_admin" ||
    userProfile?.role === "admin" ||
    userProfile?.isSuperAdmin === true;

  // 2. Query de Métricas de Audiência
  const {
    data: analytics,
    isLoading: loadingAnalytics,
    refetch: refetchAnalytics,
    isFetching,
  } = useQuery({
    queryKey: ["admin", "analytics-metrics", period],
    queryFn: () => fetchAnalyticsData(period),
    enabled: isAuthorized,
    refetchInterval: 60000, // Atualiza a cada 1 minuto
  });

  // 3. Query de Imóveis para cruzar com o ranking
  const { data: properties = [] } = useQuery({
    queryKey: ["admin", "analytics-properties"],
    queryFn: async () => {
      const { data } = await supabase
        .from("properties")
        .select("id, code, title, neighborhood, city, sale_price, rent_price, purpose, status, property_photos(url, position)")
        .order("created_at", { ascending: false });
      return (data || []) as Property[];
    },
    enabled: isAuthorized,
  });

  // Mapa de imóveis por ID
  const propertyMap = new Map(properties.map((p) => [p.id, p]));

  // Cruzar ranking de imóveis com os dados cadastrais
  const rankedProperties = (analytics?.topProperties || [])
    .map((item) => {
      const prop = propertyMap.get(item.propertyId);
      return {
        ...item,
        property: prop || null,
      };
    })
    .filter((item) => item.property !== null || item.viewsCount > 0);

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="size-6 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground font-medium">Verificando credenciais...</p>
        </div>
      </div>
    );
  }

  // Bloqueio rigoroso para corretores
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="panel max-w-md p-8 text-center space-y-4">
          <div className="mx-auto grid size-12 place-items-center rounded-full bg-destructive/10 text-destructive">
            <ShieldAlert className="size-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Acesso Restrito</h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            O Dashboard de Audiência e Métricas de Tráfego é exclusivo para a gestão da imobiliária (Master Agência e Administradora).
          </p>
          <div className="pt-2">
            <Link to="/admin" className="btn btn-primary text-xs w-full justify-center">
              Voltar ao Painel
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Header */}
      <header className="border-b bg-surface px-6 py-4 sticky top-0 z-30 shadow-xs">
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
            <Logo />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => refetchAnalytics()}
              disabled={isFetching}
              className="btn btn-outline text-xs h-9 gap-1.5"
              title="Atualizar métricas agora"
            >
              <RefreshCw className={`size-3.5 ${isFetching ? "animate-spin text-primary" : ""}`} />
              <span className="hidden sm:inline">Atualizar</span>
            </button>

            <Link
              to="/"
              target="_blank"
              className="btn btn-ghost text-xs h-9 text-muted-foreground hover:text-foreground hidden md:inline-flex"
            >
              <ExternalLink className="mr-1.5 size-3.5" />
              Ver Site
            </Link>
          </div>
        </div>
      </header>

      <main className="container-page py-8 space-y-8">
        {/* Title & Filter Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-primary/10 text-primary text-[10px] font-bold px-2.5 py-0.5 uppercase tracking-wider flex items-center gap-1">
                <Globe className="size-3" />
                Audiência Interna
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground mt-1">
              Audiência & Tráfego
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Rastreamento em tempo real de visitantes, tempo de permanência, engajamento com fotos e cliques no WhatsApp.
            </p>
          </div>

          {/* Filtro de Período */}
          <div className="flex items-center gap-1 bg-surface border border-border p-1 rounded-xl shadow-xs self-start sm:self-auto overflow-x-auto">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setPeriod(opt.id)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                  period === opt.id
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 4 Cards de Resumo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Visitas Totais */}
          <div className="panel p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Visitas Totais
                </span>
                <div className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Eye className="size-4" />
                </div>
              </div>
              <div className="mt-3 text-3xl font-extrabold text-foreground">
                {loadingAnalytics ? "..." : (analytics?.totalVisits ?? 0).toLocaleString("pt-BR")}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Páginas abertas no período selecionado
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-border/50 text-[11px] text-muted-foreground font-medium flex items-center gap-1">
              <span className="inline-block size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Rastreamento silencioso ativo
            </div>
          </div>

          {/* Card 2: Tempo Médio */}
          <div className="panel p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Tempo Médio no Site
                </span>
                <div className="grid size-8 place-items-center rounded-lg bg-amber-500/10 text-amber-600">
                  <Clock className="size-4" />
                </div>
              </div>
              <div className="mt-3 text-3xl font-extrabold text-foreground">
                {loadingAnalytics
                  ? "..."
                  : formatDuration(analytics?.averageDurationSeconds ?? 0)}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Permanência média por visitante
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-border/50 text-[11px] text-muted-foreground font-medium">
              Engajamento com o conteúdo
            </div>
          </div>

          {/* Card 3: Fotos Visualizadas */}
          <div className="panel p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Fotos Visualizadas
                </span>
                <div className="grid size-8 place-items-center rounded-lg bg-purple-500/10 text-purple-600">
                  <Images className="size-4" />
                </div>
              </div>
              <div className="mt-3 text-3xl font-extrabold text-foreground">
                {loadingAnalytics
                  ? "..."
                  : (analytics?.totalPhotosViewed ?? 0).toLocaleString("pt-BR")}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Passadas de foto na galeria dos imóveis
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-border/50 text-[11px] text-muted-foreground font-medium">
              Interação direta na vitrine
            </div>
          </div>

          {/* Card 4: Cliques no WhatsApp */}
          <div className="panel p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Cliques no WhatsApp
                </span>
                <div className="grid size-8 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600">
                  <MessageCircle className="size-4" />
                </div>
              </div>
              <div className="mt-3 text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {loadingAnalytics
                  ? "..."
                  : (analytics?.totalWhatsappClicks ?? 0).toLocaleString("pt-BR")}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Iniciações de conversa para atendimento
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-border/50 text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
              Alta intenção de compra/locação
            </div>
          </div>
        </div>

        {/* Seção 2: Origem do Tráfego & Ranking de Imóveis */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Gráfico / Distribuição de Origem de Tráfego */}
          <div className="lg:col-span-5 panel p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-border/60 pb-4">
                <div>
                  <h2 className="text-base font-bold text-foreground">Origem do Tráfego</h2>
                  <p className="text-xs text-muted-foreground">
                    Canais que trazem visitantes para o portal
                  </p>
                </div>
                <Share2 className="size-4 text-muted-foreground" />
              </div>

              <div className="mt-6 space-y-4">
                {analytics?.trafficSources.map((item) => {
                  const colors = SOURCE_COLORS[item.source] ?? SOURCE_COLORS["Acesso Direto"] ?? {
                    bg: "bg-slate-500/10",
                    bar: "bg-slate-500",
                    text: "text-slate-700",
                  };
                  return (
                    <div key={item.source} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-foreground flex items-center gap-1.5">
                          <span className={`size-2 rounded-full ${colors.bar}`} />
                          {item.source}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground font-mono">{item.count}</span>
                          <span className="font-bold text-foreground min-w-[36px] text-right">
                            {item.percentage}%
                          </span>
                        </div>
                      </div>

                      {/* Barra de Progresso Visual */}
                      <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${colors.bar}`}
                          style={{ width: `${Math.max(item.percentage, item.count > 0 ? 3 : 0)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}

                {analytics?.totalVisits === 0 && !loadingAnalytics && (
                  <div className="p-8 text-center text-xs text-muted-foreground">
                    Nenhum tráfego registrado no período selecionado.
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-border/60 text-[11px] text-muted-foreground">
              Rastreamento via parâmetros UTM e cabeçalhos de referência oficiais.
            </div>
          </div>

          {/* Ranking dos Imóveis Mais Vistos */}
          <div className="lg:col-span-7 panel p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-border/60 pb-4">
              <div>
                <h2 className="text-base font-bold text-foreground">Imóveis Mais Visualizados</h2>
                <p className="text-xs text-muted-foreground">
                  Propriedades com maior atenção e interesse dos clientes
                </p>
              </div>
              <Building2 className="size-4 text-muted-foreground" />
            </div>

            <div className="mt-6 space-y-3">
              {rankedProperties.length > 0 ? (
                rankedProperties.slice(0, 8).map((item, index) => {
                  const prop = item.property;
                  const photo = prop?.property_photos?.[0]?.url;
                  const code = prop?.code || "—";
                  const title = prop?.title || `Imóvel ${code}`;
                  const location = prop ? `${prop.neighborhood || ""}, ${prop.city || ""}` : "—";
                  const price = prop ? priceLabel(prop) : "—";

                  return (
                    <div
                      key={item.propertyId}
                      className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border/60 hover:border-primary/30 hover:bg-secondary/30 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Posição no Ranking */}
                        <span className="grid size-6 shrink-0 place-items-center rounded-full bg-secondary text-[11px] font-bold text-foreground">
                          {index + 1}
                        </span>

                        {/* Foto Thumbnail */}
                        <div className="size-12 shrink-0 rounded-lg bg-secondary overflow-hidden border border-border/60">
                          {photo ? (
                            <img src={photo} alt={title} className="size-full object-cover" />
                          ) : (
                            <div className="grid size-full place-items-center text-muted-foreground">
                              <Building2 className="size-5" />
                            </div>
                          )}
                        </div>

                        {/* Dados do Imóvel */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] font-bold text-primary">
                              {code}
                            </span>
                            <h3 className="text-xs font-bold text-foreground truncate max-w-[200px] sm:max-w-[280px]">
                              {title}
                            </h3>
                          </div>
                          <p className="text-[11px] text-muted-foreground truncate">{location}</p>
                          <p className="text-[11px] font-semibold text-foreground mt-0.5">{price}</p>
                        </div>
                      </div>

                      {/* Métricas do Imóvel */}
                      <div className="flex items-center gap-4 shrink-0 text-right">
                        <div>
                          <div className="flex items-center justify-end gap-1 text-xs font-bold text-foreground">
                            <Eye className="size-3 text-muted-foreground" />
                            <span>{item.viewsCount}</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground block">visitas</span>
                        </div>

                        <div>
                          <div className="flex items-center justify-end gap-1 text-xs font-bold text-purple-600">
                            <Images className="size-3" />
                            <span>{item.photoSwipesCount}</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground block">fotos</span>
                        </div>

                        <div>
                          <div className="flex items-center justify-end gap-1 text-xs font-bold text-emerald-600">
                            <MessageCircle className="size-3" />
                            <span>{item.whatsappClicksCount}</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground block">WhatsApp</span>
                        </div>

                        {prop?.code && (
                          <Link
                            to="/imovel/$code"
                            params={{ code: prop.code }}
                            target="_blank"
                            className="btn btn-ghost p-1.5 text-muted-foreground hover:text-primary"
                            title="Abrir no site"
                          >
                            <ExternalLink className="size-4" />
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-12 text-center text-xs text-muted-foreground">
                  Nenhuma visualização de imóvel registrada neste período ainda.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
