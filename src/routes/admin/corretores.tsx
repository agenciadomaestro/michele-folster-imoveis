import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  ArrowLeft,
  Users,
  Shield,
  Plus,
  Building,
  UserCheck,
  UserX,
  Sliders,
  Check,
  X,
  Mail,
  Phone,
} from "lucide-react";
import { Logo } from "@/components/site/SiteLayout";
import {
  type Broker,
  type BrokerPermissions,
  updateBrokerPermissions,
  updateBrokerStatus,
} from "@/lib/brokers";
import { supabase } from "@/integrations/supabase/client";
import { Property } from "@/lib/realty";
import { BrokerManagementModal } from "@/components/admin/BrokerManagementModal";

export const Route = createFileRoute("/admin/corretores")({
  head: () => ({
    meta: [
      {
        name: "description",
        content: "Gestão de Corretores — Michele Folster Imóveis — Área da equipe autorizada.",
      },
      { property: "og:title", content: "Gestão de Corretores — Michele Folster Imóveis" },
      {
        property: "og:description",
        content: "Gestão de Corretores — Michele Folster Imóveis — Área da equipe autorizada.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Gestão de Corretores — Michele Folster Imóveis" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminBrokersPage,
});

function AdminBrokersPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: properties = [] } = useQuery({
    queryKey: ["admin", "properties-list"],
    queryFn: async () => {
      let supabaseItems: Property[] = [];
      try {
        const { data } = await supabase.from("properties").select("*");
        if (data) supabaseItems = data as Property[];
      } catch {}
      return supabaseItems;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-surface px-6 py-4 sticky top-0 z-30">
        <div className="container-page flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/admin"
              className="btn btn-ghost size-9 p-0 text-muted-foreground hover:text-foreground"
              title="Voltar ao Painel"
            >
              <ArrowLeft className="size-5" />
            </Link>
            <Logo />
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary text-xs h-9 gap-1.5 shadow-xs"
          >
            <Plus className="size-4" />
            <span>Novo Corretor</span>
          </button>
        </div>
      </header>

      <main className="container-page py-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Equipe de Corretores</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Gerencie permissões individuais, credenciais e acompanhe imóveis atribuídos.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary text-xs h-9 gap-1.5 shadow-xs"
          >
            <Sliders className="size-4" />
            <span>Painel Completo de Permissões</span>
          </button>
        </div>

        {/* Modal interativo de corretores */}
        <BrokerManagementModal
          isOpen={true}
          onClose={() => {
            window.location.href = "/admin";
          }}
          properties={properties}
        />
      </main>
    </div>
  );
}
