import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { LeadForm } from "@/components/site/LeadForm";

export const Route = createFileRoute("/contato")({
  head: () => ({
    meta: [
      { title: "Contato — Michele Folster Imóveis" },
      { name: "description", content: "Envie sua mensagem para a Michele Folster Imóveis." },
      { property: "og:title", content: "Contato — Michele Folster Imóveis" },
      { property: "og:description", content: "Envie sua mensagem e retornaremos em breve." },
    ],
  }),
  component: () => (
    <SiteLayout>
      <div className="container-page grid gap-12 pt-16 md:grid-cols-2">
        <div>
          <span className="chip">Contato</span>
          <h1 className="mt-4 text-4xl font-bold">Vamos conversar</h1>
          <p className="mt-4 text-muted-foreground">Quer comprar, alugar ou anunciar seu imóvel? Deixe sua mensagem e um corretor retornará.</p>
        </div>
        <div className="panel p-6 md:p-8"><LeadForm source="contato" /></div>
      </div>
    </SiteLayout>
  ),
});
