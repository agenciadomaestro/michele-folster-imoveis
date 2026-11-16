import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PropertyForm } from "@/components/admin/PropertyForm";
import { getCurrentUserProfile } from "@/lib/brokers";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/admin/imoveis/novo")({
  head: () => ({
    meta: [
      {
        name: "description",
        content: "Cadastrar Imóvel — Painel Michele Folster — Área da equipe autorizada.",
      },
      { property: "og:title", content: "Cadastrar Imóvel — Painel Michele Folster" },
      {
        property: "og:description",
        content: "Cadastrar Imóvel — Painel Michele Folster — Área da equipe autorizada.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Cadastrar Imóvel — Painel Michele Folster" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: NovoImovelPage,
});

function NovoImovelPage() {
  const { data: userProfile, isLoading } = useQuery({
    queryKey: ["current-user-profile"],
    queryFn: getCurrentUserProfile,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background py-16 text-center text-sm text-muted-foreground">
        Verificando permissões de acesso...
      </div>
    );
  }

  const canCreate = userProfile?.isAdmin || userProfile?.permissions.pode_cadastrar_imovel;

  if (!canCreate) {
    return (
      <div className="min-h-screen bg-background grid place-items-center p-4">
        <div className="panel max-w-md p-8 text-center shadow-lg space-y-4">
          <div className="grid size-14 place-items-center rounded-2xl bg-destructive/10 text-destructive mx-auto">
            <ShieldAlert className="size-7" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Permissão Bloqueada</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Seu perfil de corretor está configurado com a permissão de cadastro e edição de imóveis
            bloqueada. Entre em contato com a Michele Folster (Gestora) para solicitar a liberação
            de inclusão.
          </p>
          <div className="pt-2">
            <Link to="/admin" className="btn btn-outline text-xs">
              <ArrowLeft className="mr-1.5 size-3.5" />
              Voltar ao Painel
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6">
      <PropertyForm />
    </div>
  );
}
