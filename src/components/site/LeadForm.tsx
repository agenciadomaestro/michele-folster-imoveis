import { useRef, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { saveLocalLead, type Lead } from "@/lib/leads";

const schema = z.object({
  name: z.string().trim().min(2, "Informe seu nome").max(120),
  phone: z.string().trim().min(8, "Telefone inválido").max(30),
  email: z.string().trim().email("E-mail inválido").max(200).or(z.literal("")),
  message: z.string().trim().max(2000),
  interest: z.string(),
  consent: z.literal(true, { errorMap: () => ({ message: "É preciso autorizar o contato" }) }),
});

export function LeadForm({ propertyId, propertyCode, source = "site" }: { propertyId?: string; propertyCode?: string; source?: string }) {
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const openedAt = useRef(Date.now());

  const submit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (sending) return;
    const fd = new FormData(e.currentTarget);
    if (fd.get("website")) return;
    if (Date.now() - openedAt.current < 2500) { toast.error("Aguarde um instante e tente novamente."); return; }
    const parsed = schema.safeParse({
      name: fd.get("name"), phone: fd.get("phone"), email: fd.get("email") ?? "",
      message: fd.get("message") ?? "", interest: fd.get("interest") ?? "informacoes", consent: fd.get("consent") === "on",
    });
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((i) => [i.path[0], i.message])));
      return;
    }
    setErrors({});
    setSending(true);
    const v = parsed.data;

    // Salva localmente para refletir de imediato no CRM Kanban
    const localLeadId =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `lead-${Date.now()}`;

    const newLeadObj: Lead = {
      id: localLeadId,
      name: v.name,
      phone: v.phone,
      email: v.email || null,
      message: v.message || null,
      interest: v.interest,
      consent: true,
      property_id: propertyId ?? null,
      property_code: propertyCode ?? null,
      source: source || "Site",
      source_page: typeof window !== "undefined" ? window.location.pathname : null,
      status: "novo",
      temperature: "quente",
      transaction_type: v.interest === "locacao" ? "alugar" : "comprar",
      timeline: [
        {
          id: `act-${Date.now()}`,
          created_at: new Date().toISOString(),
          author_name: "Sistema (Site)",
          type: "contact",
          content: `Mensagem enviada pelo cliente através de ${source || "Site"}.`,
        },
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    saveLocalLead(newLeadObj);

    const { error } = await supabase.from("leads").insert({
      id: localLeadId,
      name: v.name, phone: v.phone, email: v.email || null, message: v.message || null,
      interest: v.interest, consent: true, property_id: propertyId ?? null, property_code: propertyCode ?? null,
      source, source_page: typeof window !== "undefined" ? window.location.pathname : null,
    });
    setSending(false);
    if (error) {
      toast.error(error.message.includes("duplicate_lead") ? "Recebemos seu contato há pouco. Em breve retornaremos." : "Não foi possível enviar. Tente novamente.");
      return;
    }
    setDone(true);
  };

  if (done)
    return (
      <div className="rounded-[20px] bg-success-soft p-6 text-center">
        <CheckCircle2 className="mx-auto size-8 text-success" />
        <p className="mt-3 font-semibold">Mensagem enviada</p>
        <p className="mt-1 text-sm text-muted-foreground">Um corretor entrará em contato em breve.</p>
      </div>
    );

  const err = (k: string) => errors[k] && <p className="mt-1 text-xs text-destructive">{errors[k]}</p>;

  return (
    <form onSubmit={submit} className="space-y-3" noValidate>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <div><label className="label" htmlFor="ln">Nome completo</label><input id="ln" name="name" className="field" />{err("name")}</div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div><label className="label" htmlFor="lp">Telefone</label><input id="lp" name="phone" type="tel" className="field" placeholder="(48) 99999-9999" />{err("phone")}</div>
        <div><label className="label" htmlFor="le">E-mail</label><input id="le" name="email" type="email" className="field" />{err("email")}</div>
      </div>
      <div>
        <label className="label" htmlFor="li">Interesse</label>
        <select id="li" name="interest" className="field">
          <option value="informacoes">Mais informações</option>
          <option value="visita">Agendar visita</option>
          <option value="proposta">Fazer proposta</option>
          <option value="anunciar">Anunciar meu imóvel</option>
        </select>
      </div>
      <div><label className="label" htmlFor="lm">Mensagem</label><textarea id="lm" name="message" rows={3} className="field h-auto py-3" defaultValue={propertyCode ? `Olá! Tenho interesse no imóvel ${propertyCode}.` : ""} /></div>
      <label className="flex items-start gap-2 text-xs text-muted-foreground">
        <input type="checkbox" name="consent" className="mt-0.5 size-4 rounded accent-primary" />
        Autorizo o uso dos meus dados para retorno do atendimento, conforme a LGPD.
      </label>
      {err("consent")}
      <button className="btn btn-primary w-full" disabled={sending}>{sending ? "Enviando..." : "Enviar mensagem"}</button>
    </form>
  );
}
