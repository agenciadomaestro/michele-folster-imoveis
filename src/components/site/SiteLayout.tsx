import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { AGENCY } from "@/lib/realty";

const NAV = [
  { to: "/venda", label: "Comprar" },
  { to: "/locacao", label: "Alugar" },
  { to: "/imoveis", label: "Todos os imóveis" },
  { to: "/sobre", label: "Sobre" },
  { to: "/contato", label: "Contato" },
] as const;

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span className="grid size-9 place-items-center rounded-xl bg-accent text-sm font-bold text-primary">MF</span>
      <span className="leading-tight">
        <span className="block text-[15px] font-bold text-foreground">{AGENCY.name}</span>
        <span className="block text-[11px] font-medium tracking-wide text-muted-foreground">Imóveis</span>
      </span>
    </Link>
  );
}

export function SiteLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="container-page flex h-[72px] items-center justify-between">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="rounded-xl px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                activeProps={{ className: "bg-accent text-primary" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="hidden md:block">
            <Link to="/auth" className="btn btn-outline h-10">Área do corretor</Link>
          </div>
          <button aria-label="Abrir menu" className="btn btn-ghost size-10 rounded-full p-0 md:hidden" onClick={() => setOpen(!open)}>
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
        {open && (
          <nav className="container-page flex flex-col gap-1 pb-4 md:hidden">
            {NAV.map((n) => (
              <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-secondary">
                {n.label}
              </Link>
            ))}
            <Link to="/auth" className="btn btn-outline mt-2">Área do corretor</Link>
          </nav>
        )}
      </header>
      <main className="flex-1">{children}</main>
      <footer className="mt-24 border-t bg-surface">
        <div className="container-page grid gap-10 py-14 md:grid-cols-4">
          <div className="md:col-span-2">
            <Logo />
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">{AGENCY.tagline}.</p>
          </div>
          <div>
            <p className="text-sm font-semibold">Navegação</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {NAV.map((n) => (
                <li key={n.to}><Link to={n.to} className="hover:text-primary">{n.label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold">Privacidade</p>
            <p className="mt-3 text-sm text-muted-foreground">
              Seus dados são usados apenas para retornar seu contato, conforme a LGPD.
            </p>
          </div>
        </div>
        <div className="container-page border-t py-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} {AGENCY.name} Imóveis. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}
