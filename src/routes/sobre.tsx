import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre — Michele Folster Imóveis" },
      { name: "description", content: "Conheça a Michele Folster Imóveis e nossa forma de atender." },
      { property: "og:title", content: "Sobre a Michele Folster Imóveis" },
      { property: "og:description", content: "Conheça nossa forma de atender." },
    ],
  }),
  component: () => (
    <SiteLayout>
      <div className="container-page max-w-3xl pt-16">
        <span className="chip">Sobre nós</span>
        <h1 className="mt-4 text-4xl font-bold">Michele Folster Imóveis</h1>
        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
          Trabalhamos com uma carteira selecionada de imóveis e um atendimento próximo, do primeiro contato à entrega das chaves.
          Cada cliente é acompanhado por um corretor dedicado, com transparência em todas as etapas.
        </p>
        <Link to="/contato" className="btn btn-primary mt-8">Fale conosco</Link>
      </div>
    </SiteLayout>
  ),
});
