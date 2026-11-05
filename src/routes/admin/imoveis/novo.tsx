import { createFileRoute } from "@tanstack/react-router";
import { PropertyForm } from "@/components/admin/PropertyForm";

export const Route = createFileRoute("/admin/imoveis/novo")({
  head: () => ({
    meta: [
      { title: "Cadastrar Imóvel — Painel Michele Folster" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: NovoImovelPage,
});

function NovoImovelPage() {
  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6">
      <PropertyForm />
    </div>
  );
}

