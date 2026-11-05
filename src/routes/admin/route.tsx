import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin")({
  ssr: false,
  beforeLoad: async () => {
    // 1. Permite acesso imediato se autenticado como Master agbipe
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("master_auth_user");
      if (stored) {
        try {
          return { user: JSON.parse(stored) };
        } catch {}
      }
    }

    // 2. Verificação de sessão oficial do Supabase
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: () => <Outlet />,
});
