import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import {
  ArrowRight,
  ShieldCheck,
  Home,
  Handshake,
  Building2,
  Building,
  Sparkles,
  CheckCircle2,
  PhoneCall,
  MessageCircle,
  Star,
  MapPin,
  TrendingUp,
} from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { SearchBox } from "@/components/site/SearchBox";
import { PropertyCard, CardSkeleton } from "@/components/site/PropertyCard";
import { supabase } from "@/integrations/supabase/client";
import { AGENCY, getWhatsappUrl, type Property } from "@/lib/realty";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Michele Folster Imóveis — Imóveis Selecionados em Santa Catarina" },
      {
        name: "description",
        content:
          "Casas, apartamentos de alto padrão, coberturas e terrenos selecionados para comprar ou alugar com a Michele Folster Imóveis.",
      },
      { property: "og:title", content: "Michele Folster Imóveis — Boutique Imobiliária" },
      {
        property: "og:description",
        content: "Imóveis exclusivos em Florianópolis e região com consultoria personalizada.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const queryClient = useQueryClient();
  const [filterPurpose, setFilterPurpose] = useState<"todos" | "venda" | "locacao">("todos");

  const { data, isLoading } = useQuery({
    queryKey: ["featured"],
    queryFn: async () => {
      let supabaseItems: Property[] = [];
      try {
        const { data, error } = await supabase
          .from("properties")
          .select("*, property_photos(url, position)")
          .eq("status", "publicado")
          .order("featured", { ascending: false })
          .order("created_at", { ascending: false });
        if (!error && data) {
          supabaseItems = data as Property[];
        }
      } catch (err) {
        console.warn("Aviso ao carregar imóveis do Supabase:", err);
      }

      const list = [...supabaseItems];
      list.sort((a, b) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime();
      });

      return list.slice(0, 9);
    },
  });

  const filteredProperties = (data || []).filter((p) => {
    if (filterPurpose === "todos") return true;
    if (filterPurpose === "venda") return p.purpose === "venda" || p.purpose === "ambos";
    if (filterPurpose === "locacao") return p.purpose === "locacao" || p.purpose === "ambos";
    return true;
  });

  const categories = [
    {
      title: "Apartamentos & Coberturas",
      subtitle: "Vista mar e áreas nobres",
      type: "Apartamento",
      icon: Building2,
      count: "Disponíveis",
    },
    {
      title: "Casas & Vilas",
      subtitle: "Amplas, com jardim e piscina",
      type: "Casa",
      icon: Home,
      count: "Disponíveis",
    },
    {
      title: "Sobrados em Condomínio",
      subtitle: "Segurança e conforto para a família",
      type: "Sobrado",
      icon: Building,
      count: "Disponíveis",
    },
    {
      title: "Terrenos & Lotes",
      subtitle: "Para construir o seu projeto",
      type: "Terreno",
      icon: MapPin,
      count: "Disponíveis",
    },
  ];

  const whatsappUrl = getWhatsappUrl();

  return (
    <SiteLayout>
      {/* ========================================================================= */}
      {/* HERO SECTION */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden pt-10 pb-16 md:flex md:min-h-[699px] md:items-center md:py-24">
        {/* Ambient Light Gradients */}
        <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-[radial-gradient(ellipse_60%_50%_at_50%_20%,oklch(0.53_0.17_292/14%),transparent_70%)]" />

        <div className="container-page relative z-10">
          <div className="mx-auto max-w-3xl text-center">
            {/* Main Headline */}
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-6xl md:leading-[1.12]">
              O imóvel certo, com quem{" "}
              <span className="bg-gradient-to-r from-primary via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                entende de você.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mt-5 text-base text-muted-foreground sm:text-lg max-w-2xl mx-auto leading-relaxed [text-wrap:balance]">
              Curadoria de casas, apartamentos, terrenos,
              <br className="sm:hidden" /> galpões e pontos comerciais nas localizações
              <br className="sm:hidden" /> mais desejadas de{" "}
              <span className="whitespace-nowrap">Caçapava-SP.</span>
            </p>
          </div>

          {/* Floating SearchBox */}
          <div className="mx-auto mt-10 max-w-5xl">
            <SearchBox />
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* IMÓVEIS EM DESTAQUE */}
      {/* ========================================================================= */}
      <section className="container-page py-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
              <Star className="size-3.5 fill-current" />
              <span>Coleção Selecionada</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl mt-1">
              Imóveis em Destaque
            </h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-xl">
              Nossa curadoria mais recente de oportunidades selecionadas a dedo para morar ou
              investir.
            </p>
          </div>

          {/* Quick Purpose Filter Buttons */}
          <div className="flex items-center gap-1.5 rounded-2xl bg-secondary p-1">
            {[
              { id: "todos", label: "Todos" },
              { id: "venda", label: "Comprar" },
              { id: "locacao", label: "Alugar" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterPurpose(tab.id as never)}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                  filterPurpose === tab.id
                    ? "bg-background text-primary shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Property Cards Grid */}
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
          ) : filteredProperties.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-dashed border-border p-12 text-center">
              <Home className="mx-auto size-10 text-muted-foreground/40 mb-3" />
              <p className="text-base font-semibold">Nenhum imóvel disponível para este filtro</p>
              <p className="text-xs text-muted-foreground mt-1">
                Confira todas as opções disponíveis em nosso catálogo completo.
              </p>
              <Link to="/imoveis" className="btn btn-primary mt-4">
                Ver Todos os Imóveis
              </Link>
            </div>
          ) : (
            filteredProperties.map((p) => <PropertyCard key={p.id} p={p} />)
          )}
        </div>

        {/* Bottom CTA to see full portfolio */}
        <div className="mt-12 text-center">
          <Link
            to="/imoveis"
            className="btn btn-outline h-12 px-8 font-bold text-sm hover:border-primary hover:text-primary transition-all"
          >
            <span>Explorar Todos os Imóveis da Carteira</span>
            <ArrowRight className="size-4 ml-1.5" />
          </Link>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* CATEGORIAS EM DESTAQUE */}
      {/* ========================================================================= */}
      <section className="bg-accent/40 py-12">
        <div className="container-page">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                Categorias Populares
              </span>
              <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl mt-1">
                Explore pelo Tipo de Imóvel
              </h2>
            </div>
            <Link
              to="/imoveis"
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
            >
              Ver todos os filtros <ArrowRight className="size-3.5" />
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((c) => {
              const Icon = c.icon;
              return (
                <Link
                  key={c.type}
                  to="/imoveis"
                  search={{ type: c.type } as never}
                  className="group relative overflow-hidden rounded-[22px] border border-border/70 bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[var(--shadow-lift)]"
                >
                  <div className="flex items-center justify-between">
                    <div className="grid size-12 place-items-center rounded-2xl bg-accent text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                      <Icon className="size-6" />
                    </div>
                    <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold text-muted-foreground group-hover:text-foreground">
                      Ver Imóveis
                    </span>
                  </div>
                  <h3 className="mt-5 font-bold text-foreground text-base group-hover:text-primary transition-colors">
                    {c.title}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{c.subtitle}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* DIFERENCIAIS / EXPERIÊNCIA MICHELE FOLSTER */}
      {/* ========================================================================= */}
      <section className="border-y border-border/60 bg-surface/60 py-20">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Excelência e Confiança
            </span>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Por que escolher a Michele Folster Imóveis?
            </h2>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Diferente das imobiliárias tradicionais de massa, atuamos com foco exclusivo no seu
              tempo, segurança patrimonial e conforto.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Home,
                title: "Curadoria de Alto Nível",
                desc: "Cada imóvel de nossa carteira passa por rigorosa vistoria e avaliação antes de ser oferecido aos clientes.",
              },
              {
                icon: Handshake,
                title: "Consultoria Dedicada",
                desc: "Um atendimento direto, acolhedor e próximo. Acompanhamos cada visita e tiramos todas as suas dúvidas.",
              },
              {
                icon: ShieldCheck,
                title: "Segurança Jurídica Total",
                desc: "Conferência documental minuciosa, elaboração segura de contratos e suporte até o registro em cartório.",
              },
            ].map((b) => (
              <div
                key={b.title}
                className="group relative rounded-[24px] border border-border/80 bg-card p-8 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[var(--shadow-lift)]"
              >
                <div className="grid size-12 place-items-center rounded-2xl bg-accent text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                  <b.icon className="size-6" />
                </div>
                <h3 className="mt-6 text-lg font-bold text-foreground">{b.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* BANNER CTA: QUER VENDER OU AVALIAR SEU IMÓVEL */}
      {/* ========================================================================= */}
      <section className="container-page py-20">
        <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-primary via-purple-700 to-indigo-900 p-8 sm:p-14 text-white shadow-xl shadow-primary/20">
          {/* Subtle Circles Background */}
          <div className="pointer-events-none absolute -right-20 -top-20 size-96 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 size-80 rounded-full bg-black/20 blur-xl" />

          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3.5 py-1 text-xs font-semibold backdrop-blur-md">
              <TrendingUp className="size-3.5" /> Para Proprietários
            </span>
            <h2 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl leading-tight">
              Pensando em vender ou alugar o seu imóvel?
            </h2>
            <p className="mt-4 text-sm sm:text-base text-white/85 leading-relaxed">
              Conte com produção fotográfica profissional, ampla divulgação nas melhores mídias e
              atendimento exclusivo aos potenciais compradores.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn bg-white text-primary hover:bg-white/90 h-12 px-6 font-bold text-sm shadow-md transition-all active:scale-95"
              >
                <MessageCircle className="size-4 mr-1 text-emerald-600" />
                Falar com a Michele no WhatsApp
              </a>
              <Link
                to="/contato"
                className="btn border border-white/30 bg-white/10 hover:bg-white/20 text-white h-12 px-6 font-semibold text-sm backdrop-blur-sm"
              >
                Solicitar Avaliação Online
              </Link>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
