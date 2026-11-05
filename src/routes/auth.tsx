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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Se já estiver logado, redireciona diretamente para /admin
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        navigate({ to: "/admin" });
      }
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setBusy(true);

    const cleanEmail = email.trim();

    try {
      // 1. Login direto no Supabase Auth com email e senha
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (signInError) {
        setBusy(false);
        const errLower = signInError.message.toLowerCase();
        if (errLower.includes("confirm") || errLower.includes("email not confirmed")) {
          toast.error("E-mail não confirmado no Supabase Auth. Verifique o seu e-mail ou execute o script de seed.");
        } else {
          toast.error("E-mail ou senha inválidos. Verifique as suas credenciais.");
        }
        return;
      }

      const user = authData?.user;
      if (user) {
        // 2. Se for o usuário Master, garante perfil na tabela profiles
        if (user.email === "contato@agenciabipe.com") {
          try {
            await supabase.from("profiles").upsert({
              id: user.id,
              full_name: "Everson Maestro",
              active: true,
            });
          } catch (e) {
            console.warn("Aviso ao sincronizar perfil:", e);
          }
        }

        const displayName =
          user.user_metadata?.["full_name"] ||
          (user.email === "contato@agenciabipe.com" ? "Everson Maestro" : "Corretor");

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
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="field"
              placeholder="seuemail@exemplo.com"
              autoComplete="email"
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
