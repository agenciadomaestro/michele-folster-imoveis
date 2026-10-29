import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/site/SiteLayout";

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
  const [mode, setMode] = useState<"in" | "up">("in");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email")), password = String(fd.get("password"));
    setBusy(true);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) { toast.error("E-mail ou senha inválidos."); return; }
      navigate({ to: "/admin" });
    } else {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: window.location.origin + "/admin", data: { full_name: String(fd.get("name")) } },
      });
      setBusy(false);
      if (error) { toast.error(error.message); return; }
      toast.success("Conta criada. Confirme pelo link enviado ao seu e-mail.");
      setMode("in");
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-surface px-4">
      <div className="panel w-full max-w-sm p-8 shadow-[var(--shadow-soft)]">
        <Logo />
        <h1 className="mt-8 text-xl font-bold">{mode === "in" ? "Entrar na área da equipe" : "Criar acesso"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Proprietário, administradores e corretores.</p>
        <form onSubmit={submit} className="mt-6 space-y-3">
          {mode === "up" && <div><label className="label">Nome</label><input name="name" required className="field" /></div>}
          <div><label className="label">E-mail</label><input name="email" type="email" required className="field" /></div>
          <div><label className="label">Senha</label><input name="password" type="password" minLength={6} required className="field" /></div>
          <button className="btn btn-primary w-full" disabled={busy}>{busy ? "Aguarde..." : mode === "in" ? "Entrar" : "Criar conta"}</button>
        </form>
        <button className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-primary" onClick={() => setMode(mode === "in" ? "up" : "in")}>
          {mode === "in" ? "Primeiro acesso? Criar conta" : "Já tenho conta"}
        </button>
      </div>
    </div>
  );
}
