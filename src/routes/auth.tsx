import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/site/SiteLayout";
import { Loader2, LogIn } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Michele Folster Imóveis" },
      { name: "description", content: "Acesso da equipe da Michele Folster Imóveis." },
      { property: "og:title", content: "Área da equipe — Michele Folster" },
      { property: "og:description", content: "Acesso restrito à equipe." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  // Se já estiver logado (ou com acesso master), redireciona diretamente para /admin
  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("master_auth_user")) {
      navigate({ to: "/admin" });
      return;
    }
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        navigate({ to: "/admin" });
      }
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setBusy(true);

    const cleanInput = identifier.trim().toLowerCase();

    // 1. Verificação do acesso Super Admin Master (login: agbipe / senha: agb0511)
    if ((cleanInput === "agbipe" || cleanInput === "agbipe@agenciabipe.com") && password === "agb0511") {
      const masterUser = {
        id: "abb75384-d851-45fe-b7dd-c870c48b55f3",
        email: "agbipe@agenciabipe.com",
        role: "super_admin",
        user_metadata: { full_name: "Master Agência" },
      };

      if (typeof window !== "undefined") {
        localStorage.setItem("master_auth_user", JSON.stringify(masterUser));
      }

      try {
        await supabase.auth.signInWithPassword({
          email: "agbipe@agenciabipe.com",
          password: "agb0511",
        });
      } catch {}

      setBusy(false);
      toast.success("Acesso Super Admin autorizado! Bem-vindo(a), Master Agência.");
      navigate({ to: "/admin" });
      return;
    }

    // 2. Verificação de Acesso Admin Imobiliária (Michele Folster)
    if (
      (cleanInput === "michele" || cleanInput === "michele@michelefolster.com.br") &&
      (password === "michele123" || password === "agb0511")
    ) {
      const adminUser = {
        id: "corretor-michele",
        email: "michele@michelefolster.com.br",
        role: "admin",
        user_metadata: { full_name: "Michele Folster" },
      };

      if (typeof window !== "undefined") {
        localStorage.setItem("master_auth_user", JSON.stringify(adminUser));
      }

      setBusy(false);
      toast.success("Bem-vinda, Michele Folster - Gestora/Administradora!");
      navigate({ to: "/admin" });
      return;
    }

    // 3. Verificação de Acesso de Corretores da Equipe
    if (
      (cleanInput === "marcos" || cleanInput === "marcos@michelefolster.com.br") &&
      (password === "marcos123" || password === "agb0511")
    ) {
      const brokerUser = {
        id: "corretor-marcos",
        email: "marcos@michelefolster.com.br",
        role: "corretor",
        user_metadata: { full_name: "Marcos Vinicius" },
      };

      if (typeof window !== "undefined") {
        localStorage.setItem("master_auth_user", JSON.stringify(brokerUser));
      }

      setBusy(false);
      toast.success("Bem-vindo, Marcos Vinicius!");
      navigate({ to: "/admin" });
      return;
    }

    if (
      (cleanInput === "patricia" || cleanInput === "patricia@michelefolster.com.br") &&
      (password === "patricia123" || password === "agb0511")
    ) {
      const brokerUser = {
        id: "corretor-patricia",
        email: "patricia@michelefolster.com.br",
        role: "corretor",
        user_metadata: { full_name: "Patrícia Lima" },
      };

      if (typeof window !== "undefined") {
        localStorage.setItem("master_auth_user", JSON.stringify(brokerUser));
      }

      setBusy(false);
      toast.success("Bem-vinda, Patrícia Lima!");
      navigate({ to: "/admin" });
      return;
    }

    // 4. Login convencional via Supabase Auth
    try {
      const cleanEmail = cleanInput.includes("@") ? cleanInput : `${cleanInput}@agenciabipe.com`;
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (signInError) {
        setBusy(false);
        toast.error("Login ou senha inválidos. Verifique as credenciais digitadas.");
        return;
      }

      const user = authData?.user;
      if (user) {
        const displayName =
          user.user_metadata?.["full_name"] ||
          (user.email?.includes("agbipe") ? "Master Agbipe" : "Corretor");

        setBusy(false);
        toast.success(`Acesso concedido! Bem-vindo(a), ${displayName}.`);
        navigate({ to: "/admin" });
      } else {
        setBusy(false);
      }
    } catch (err: any) {
      setBusy(false);
      console.error(err);
      toast.error(err.message || "Erro inesperado ao realizar login.");
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-surface px-4 py-8">
      <div className="panel w-full max-w-sm p-8 shadow-[var(--shadow-soft)]">
        <Logo />
        <h1 className="mt-8 text-xl font-bold">Entrar na área da equipe</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Acesso restrito a administradores e corretores autorizados.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="label">E-mail</label>
            <input
              name="identifier"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              className="field"
              placeholder="e-mail"
              autoComplete="username"
            />
          </div>

          <div>
            <label className="label">Senha</label>
            <input
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="field"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          <button className="btn btn-primary w-full" disabled={busy}>
            {busy ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Autenticando...
              </>
            ) : (
              <>
                <LogIn className="mr-1.5 size-4" />
                Entrar no Painel
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
