import { createFileRoute } from "@tanstack/react-router";
import { PropertyForm } from "@/components/admin/PropertyForm";

export const Route = createFileRoute("/admin/imoveis/$id")({
  head: () => ({
    meta: [
      { name: "description", content: "Editar Imóvel — Painel Michele Folster — Área da equipe autorizada." },
      { property: "og:title", content: "Editar Imóvel — Painel Michele Folster" },
      { property: "og:description", content: "Editar Imóvel — Painel Michele Folster — Área da equipe autorizada." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Editar Imóvel — Painel Michele Folster" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: EditarImovelPage,
});

function EditarImovelPage() {
  const { id } = Route.useParams();
  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6">
      <PropertyForm propertyId={id} />
    </div>
  );
}

