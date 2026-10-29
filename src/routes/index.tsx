import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ShieldCheck, Home, Handshake } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { SearchBox } from "@/components/site/SearchBox";
import { PropertyCard, CardSkeleton } from "@/components/site/PropertyCard";
import { supabase } from "@/integrations/supabase/client";
import type { Property } from "@/lib/realty";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Michele Folster Imóveis — Comprar e alugar imóveis" },
      { name: "description", content: "Encontre casas, apartamentos, terrenos e salas comerciais para comprar ou alugar com a Michele Folster Imóveis." },
      { property: "og:title", content: "Michele Folster Imóveis" },
      { property: "og:description", content: "Imóveis selecionados para comprar e alugar, com atendimento próximo." },
    ],
  }),
  component: Index,
});

function Index() {
  const { data, isLoading } = useQuery({
    queryKey: ["featured"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties").select("*, property_photos(url, position)")
        .eq("status", "publicado").order("featured", { ascending: false }).order("created_at", { ascending: false }).limit(6);
      if (error) throw error;
      return data as Property[];
    },
  });

  return (
    <SiteLayout>
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(60%_60%_at_50%_0%,var(--color-accent),transparent)]" />
        <div className="container-page relative pb-16 pt-16 md:pt-24">
          <div className="mx-auto max-w-2xl text-center">
            <span className="chip">Michele Folster Imóveis</span>
            <h1 className="mt-5 text-4xl font-bold leading-[1.1] text-foreground md:text-5xl">
              O imóvel certo, com quem entende de você.
            </h1>
            <p className="mt-4 text-base text-muted-foreground md:text-lg">
              Casas, apartamentos e espaços comerciais selecionados para comprar ou alugar.
            </p>
          </div>
          <div className="mx-auto mt-10 max-w-5xl">
            <SearchBox />
          </div>
        </div>
      </section>

      <section className="container-page mt-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Imóveis em destaque</h2>
            <p className="mt-1 text-sm text-muted-foreground">Seleção recente da nossa carteira.</p>
          </div>
          <Link to="/imoveis" className="btn btn-ghost hidden text-primary sm:inline-flex">Ver todos <ArrowRight className="size-4" /></Link>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading ? Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />) : data?.map((p) => <PropertyCard key={p.id} p={p} />)}
        </div>
      </section>

      <section className="container-page mt-24">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: Home, t: "Carteira selecionada", d: "Cada imóvel é visitado e avaliado antes de ser anunciado." },
            { icon: Handshake, t: "Atendimento próximo", d: "Um corretor acompanha você da primeira visita à assinatura." },
            { icon: ShieldCheck, t: "Negociação segura", d: "Documentação conferida e processo transparente." },
          ].map((b) => (
            <div key={b.t} className="rounded-[22px] bg-surface p-7">
              <span className="grid size-11 place-items-center rounded-2xl bg-accent text-primary"><b.icon className="size-5" /></span>
              <h3 className="mt-5 font-semibold">{b.t}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{b.d}</p>
            </div>
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}
