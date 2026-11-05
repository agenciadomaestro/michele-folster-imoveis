import { createFileRoute } from "@tanstack/react-router";
import { MessageCircle, Phone, MapPin, Clock, Mail } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { LeadForm } from "@/components/site/LeadForm";
import { AGENCY, getWhatsappUrl } from "@/lib/realty";

export const Route = createFileRoute("/contato")({
  head: () => ({
    meta: [
      { title: "Contato — Michele Folster Imóveis" },
      { name: "description", content: "Envie sua mensagem para a Michele Folster Imóveis." },
      { property: "og:title", content: "Contato — Michele Folster Imóveis" },
      { property: "og:description", content: "Envie sua mensagem e retornaremos em breve." },
    ],
  }),
  component: () => (
    <SiteLayout>
      <div className="container-page grid gap-12 pt-16 md:grid-cols-2">
        <div className="space-y-6">
          <div>
            <span className="chip">Contato Direto</span>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight">Vamos conversar</h1>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              Quer comprar, alugar, anunciar seu imóvel ou tirar dúvidas? Fale diretamente conosco pelo WhatsApp ou preencha o formulário ao lado.
            </p>
          </div>

          <div className="space-y-4 pt-2">
            <a
              href={getWhatsappUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-2xl bg-emerald-600/10 border border-emerald-600/20 p-4 text-emerald-800 transition-colors hover:bg-emerald-600/20"
            >
              <div className="grid size-11 place-items-center rounded-xl bg-emerald-600 text-white shadow-xs">
                <MessageCircle className="size-5" />
              </div>
              <div>
                <span className="block text-xs font-semibold text-emerald-900">Conversar no WhatsApp</span>
                <span className="text-base font-bold text-emerald-700">{AGENCY.phone}</span>
              </div>
            </a>

            <div className="grid gap-3 sm:grid-cols-2">
              <a
                href={`tel:${AGENCY.phone.replace(/\D/g, "")}`}
                className="flex items-center gap-3 rounded-2xl border border-border p-3.5 transition-colors hover:bg-secondary"
              >
                <div className="grid size-9 place-items-center rounded-xl bg-accent text-primary">
                  <Phone className="size-4" />
                </div>
                <div>
                  <span className="block text-[11px] text-muted-foreground font-medium">Telefone</span>
                  <span className="text-xs font-bold text-foreground">{AGENCY.phone}</span>
                </div>
              </a>

              <div className="flex items-center gap-3 rounded-2xl border border-border p-3.5">
                <div className="grid size-9 place-items-center rounded-xl bg-accent text-primary">
                  <MapPin className="size-4" />
                </div>
                <div>
                  <span className="block text-[11px] text-muted-foreground font-medium">Localização</span>
                  <span className="text-xs font-bold text-foreground">{AGENCY.address}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-border p-3.5 sm:col-span-2">
                <div className="grid size-9 place-items-center rounded-xl bg-accent text-primary">
                  <Clock className="size-4" />
                </div>
                <div>
                  <span className="block text-[11px] text-muted-foreground font-medium">Horário de Atendimento</span>
                  <span className="text-xs font-bold text-foreground">{AGENCY.hours}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="panel p-6 md:p-8">
          <h2 className="text-lg font-bold mb-1">Envie sua mensagem</h2>
          <p className="text-xs text-muted-foreground mb-4">Retornaremos o contato o mais rápido possível.</p>
          <LeadForm source="contato" />
        </div>
      </div>
    </SiteLayout>
  ),
});
