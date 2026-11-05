import { createFileRoute } from "@tanstack/react-router";
import { PropertyForm } from "@/components/admin/PropertyForm";

export const Route = createFileRoute("/admin/imoveis/$id")({
  head: () => ({
    meta: [
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

