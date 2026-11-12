import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/site/SiteLayout";
import { getCurrentUserProfile } from "@/lib/brokers";
import { Button } from "@/components/ui/button";
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

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: '/admin' });
    });
  }, [navigate]);
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: identifier.trim(), password });
      if (error) throw new Error(error.message);
      await getCurrentUserProfile();
      toast.success('Acesso autorizado');
      navigate({ to: '/admin' });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally { setBusy(false); }
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
              type="email"
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

          <Button className="w-full" disabled={busy}>
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
          </Button>
        </form>
      </div>
    </div>
  );
}
