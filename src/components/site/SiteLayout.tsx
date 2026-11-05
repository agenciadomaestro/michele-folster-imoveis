import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  Menu,
  X,
  Phone,
  MessageCircle,
  MapPin,
  Mail,
  Shield,
  ArrowUpRight,
  Lock,
  Building2,
  ChevronRight,
  Clock,
} from "lucide-react";
import { AGENCY, getWhatsappUrl } from "@/lib/realty";

const NAV = [
  { to: "/venda", label: "Comprar" },
  { to: "/locacao", label: "Alugar" },
  { to: "/imoveis", label: "Todos os Imóveis" },
  { to: "/sobre", label: "Sobre Nós" },
  { to: "/contato", label: "Contato" },
] as const;

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link to="/" className="group flex items-center gap-3 transition-opacity hover:opacity-90">
      <div className="relative flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-primary-hover to-purple-800 text-white shadow-md shadow-primary/20 transition-transform group-hover:scale-105">
        <span className="font-serif text-lg font-black tracking-tight">MF</span>
        <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-400 ring-2 ring-background" />
      </div>
      <div className="flex flex-col leading-none">
        <span className={`text-[17px] font-extrabold tracking-tight ${light ? "text-white" : "text-foreground"}`}>
          {AGENCY.name}
        </span>
        <span className="mt-1 text-[11px] font-medium tracking-wide text-muted-foreground">
          Imóveis
        </span>
      </div>
    </Link>
  );
}

export function SiteLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  const whatsappUrl = getWhatsappUrl();

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-primary/20 selection:text-primary">
      {/* Top Notification / Contact Micro-bar */}
      <div className="border-b border-border/50 bg-secondary/50 px-4 py-1.5 text-xs text-muted-foreground">
        <div className="container-page flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="hidden items-center gap-1.5 sm:inline-flex">
              <MapPin className="size-3 text-primary" />
              <span>{AGENCY.address}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
              <Clock className="size-3 text-primary" />
              <span>Atendimento: Seg a Sex, 09h às 17h30h</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href={`tel:${AGENCY.phone.replace(/\D/g, "")}`}
              className="hidden items-center gap-1 hover:text-primary transition-colors sm:inline-flex"
            >
              <Phone className="size-3 text-primary" />
              <span>{AGENCY.phone}</span>
            </a>
            <Link
              to="/auth"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              <Lock className="size-3" />
              <span>Acesso Corretor</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Sticky Header */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur-md transition-shadow">
        <div className="container-page flex h-[76px] items-center justify-between">
          <Logo />

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-1 lg:flex">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="relative rounded-xl px-4 py-2 text-sm font-semibold text-muted-foreground transition-all hover:bg-secondary hover:text-foreground"
                activeProps={{ className: "bg-accent/80 text-primary font-bold shadow-xs" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden items-center gap-3 md:flex">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-500 hover:shadow-emerald-600/20 active:scale-95"
            >
              <MessageCircle className="size-4" />
              <span>Fale pelo WhatsApp</span>
            </a>

            <Link
              to="/contato"
              className="btn btn-outline h-10 px-4 text-xs font-semibold"
            >
              Anuncie seu Imóvel
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            className="grid size-11 place-items-center rounded-xl bg-secondary text-foreground transition-colors hover:bg-accent md:hidden"
            onClick={() => setOpen(!open)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {open && (
          <div className="border-b border-border bg-background/98 px-4 pb-6 pt-2 backdrop-blur-xl md:hidden">
            <nav className="container-page flex flex-col gap-1.5">
              {NAV.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between rounded-xl px-4 py-3 text-base font-semibold text-foreground transition-colors hover:bg-secondary"
                  activeProps={{ className: "bg-accent text-primary" }}
                >
                  <span>{n.label}</span>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </Link>
              ))}

              <div className="my-2 border-t border-border/60" />

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-sm"
              >
                <MessageCircle className="size-4" />
                <span>Conversar no WhatsApp</span>
              </a>

              <Link
                to="/auth"
                onClick={() => setOpen(false)}
                className="btn btn-outline mt-1 w-full justify-center text-xs"
              >
                <Lock className="mr-1.5 size-3.5" />
                Área Restrita do Corretor
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* Page Content */}
      <main className="flex-1">{children}</main>

      {/* Luxury Footer */}
      <footer className="mt-28 border-t border-border/80 bg-surface/90">
        <div className="container-page grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-5">
          {/* Coluna 1 & 2: Identidade */}
          <div className="space-y-4 lg:col-span-2">
            <Logo />
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              {AGENCY.tagline}. Selecionamos casas, apartamentos de alto padrão, terrenos e coberturas nas regiões mais valorizadas de Santa Catarina.
            </p>
            <div className="pt-2 text-xs text-muted-foreground space-y-1.5">
              <p className="flex items-center gap-2">
                <MapPin className="size-3.5 text-primary shrink-0" />
                <span>{AGENCY.address}</span>
              </p>
              <p className="flex items-center gap-2">
                <Shield className="size-3.5 text-primary shrink-0" />
                <span>Registro Oficial: <strong>{AGENCY.creci}</strong></span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="size-3.5 text-primary shrink-0" />
                <span>{AGENCY.email}</span>
              </p>
            </div>
          </div>

          {/* Coluna 3: Navegação */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Navegação
            </h4>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              <li>
                <Link to="/venda" className="transition-colors hover:text-primary">
                  Imóveis à Venda
                </Link>
              </li>
              <li>
                <Link to="/locacao" className="transition-colors hover:text-primary">
                  Imóveis para Locação
                </Link>
              </li>
              <li>
                <Link to="/imoveis" className="transition-colors hover:text-primary">
                  Todos os Imóveis
                </Link>
              </li>
              <li>
                <Link to="/sobre" className="transition-colors hover:text-primary">
                  Sobre a Imobiliária
                </Link>
              </li>
              <li>
                <Link to="/contato" className="transition-colors hover:text-primary">
                  Fale Conosco
                </Link>
              </li>
            </ul>
          </div>

          {/* Coluna 4: Categorias */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Categorias
            </h4>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              <li>
                <Link to="/imoveis" search={{ type: "Apartamento" } as any} className="transition-colors hover:text-primary">
                  Apartamentos
                </Link>
              </li>
              <li>
                <Link to="/imoveis" search={{ type: "Casa" } as any} className="transition-colors hover:text-primary">
                  Casas & Vilas
                </Link>
              </li>
              <li>
                <Link to="/imoveis" search={{ type: "Sobrado" } as any} className="transition-colors hover:text-primary">
                  Sobrados em Condomínio
                </Link>
              </li>
              <li>
                <Link to="/imoveis" search={{ type: "Terreno" } as any} className="transition-colors hover:text-primary">
                  Terrenos & Lotes
                </Link>
              </li>
              <li>
                <Link to="/imoveis" search={{ type: "Sala comercial" } as any} className="transition-colors hover:text-primary">
                  Comerciais & Escritórios
                </Link>
              </li>
            </ul>
          </div>

          {/* Coluna 5: Atendimento VIP */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Atendimento VIP
            </h4>
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              Dúvidas ou agendamento de visitas exclusivas direto com a corretora responsável:
            </p>
            <div className="mt-4 space-y-2.5">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl bg-emerald-600/10 px-3 py-2 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-600/20"
              >
                <MessageCircle className="size-4 shrink-0" />
                <span>WhatsApp: {AGENCY.phone}</span>
              </a>
              <Link
                to="/contato"
                className="flex items-center justify-between rounded-xl border border-border px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-secondary"
              >
                <span>Avaliar meu imóvel</span>
                <ArrowUpRight className="size-3.5 text-muted-foreground" />
              </Link>
            </div>
          </div>
        </div>

        {/* Rodapé Inferior */}
        <div className="border-t border-border/60 py-6 text-xs text-muted-foreground">
          <div className="container-page flex flex-col items-center justify-between gap-3 sm:flex-row">
            <div>
              © {new Date().getFullYear()} {AGENCY.name} Imóveis • Todos os direitos reservados.
            </div>
            <div className="flex items-center gap-6">
              <span>Transparência e segurança conforme a LGPD</span>
              <Link to="/auth" className="hover:text-primary transition-colors">
                Área da equipe
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
