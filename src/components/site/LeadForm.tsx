import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { CheckCircle2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

import { saveMessageLead } from "@/lib/messages";

const schema = z.object({
  name: z.string().trim().min(2, "Informe seu nome completo").max(120),
  phone: z.string().trim().min(8, "Telefone inválido").max(30),
  email: z.string().trim().email("E-mail inválido").max(200).or(z.literal("")),
  message: z.string().trim().max(2000),
  interest: z.string(),
  consent: z.literal(true, { errorMap: () => ({ message: "É preciso autorizar o contato" }) }),
});

interface LeadFormProps {
  propertyId?: string | null;
  propertyCode?: string | null;
  propertyTitle?: string | null;
  brokerId?: string | null;
  source?: string;
}

export function LeadForm({
  propertyId,
  propertyCode,
  propertyTitle,
  brokerId,
  source = "site",
}: LeadFormProps) {
  const queryClient = useQueryClient();
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const openedAt = useRef(Date.now());

  const submit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (sending) return;
    const fd = new FormData(e.currentTarget);
    if (fd.get("website")) return;
    if (Date.now() - openedAt.current < 1500) {
      toast.error("Aguarde um instante e tente novamente.");
      return;
    }

    const parsed = schema.safeParse({
      name: fd.get("name"),
      phone: fd.get("phone"),
      email: fd.get("email") ?? "",
      message: fd.get("message") ?? "",
      interest: fd.get("interest") ?? "Mais informações",
      consent: fd.get("consent") === "on",
    });

    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((i) => [i.path[0], i.message])));
      return;
    }

    setErrors({});
    setSending(true);
    const v = parsed.data;

    try {
      await saveMessageLead({
        tipo: v.interest === "Anunciar meu imóvel" ? "captacao" : propertyId ? "imovel" : "geral",
        nome_cliente: v.name,
        telefone_cliente: v.phone,
        email_cliente: v.email || null,
        interesse: v.interest,
        mensagem: v.message,
        imovel_id: propertyId ?? null,
        codigo_imovel: propertyCode ?? null,
        titulo_imovel: propertyTitle ?? null,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
      setSending(false);
      return;
    }

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin", "crm-leads-list"] }),
      queryClient.invalidateQueries({ queryKey: ["admin", "leads-crm-list"] }),
      queryClient.invalidateQueries({ queryKey: ["admin", "messages-leads-list"] }),
    ]);

    setSending(false);
    setDone(true);
    toast.success("Mensagem enviada com sucesso! Em breve entraremos em contato.");
  };

  if (done)
    return (
      <div className="rounded-[20px] bg-success-soft p-6 text-center animate-in fade-in">
        <CheckCircle2 className="mx-auto size-8 text-success" />
        <p className="mt-3 font-semibold text-foreground">Mensagem enviada</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Nossa equipe já recebeu seus dados e retornará o contato em breve.
        </p>
      </div>
    );

  const err = (k: string) =>
    errors[k] && <p className="mt-1 text-xs text-destructive">{errors[k]}</p>;

  return (
    <form onSubmit={submit} className="space-y-3" noValidate>
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden
      />

      <div>
        <label className="label" htmlFor="lead-name">
          Nome completo *
        </label>
        <input
          id="lead-name"
          name="name"
          required
          className="field"
          placeholder="Seu nome completo"
        />
        {err("name")}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="lead-phone">
            WhatsApp/Telefone *
          </label>
          <input
            id="lead-phone"
            name="phone"
            type="tel"
            required
            className="field"
            placeholder="(12) 99999-9999"
          />
          {err("phone")}
        </div>
        <div>
          <label className="label" htmlFor="lead-email">
            E-mail (Opcional)
          </label>
          <input
            id="lead-email"
            name="email"
            type="email"
            className="field"
            placeholder="seu@email.com"
          />
          {err("email")}
        </div>
      </div>

      <div>
        <label className="label" htmlFor="lead-interest">
          Interesse
        </label>
        <select id="lead-interest" name="interest" className="field">
          <option value="Mais informações">Mais informações</option>
          <option value="Agendar visita">Agendar visita</option>
          <option value="Fazer proposta">Fazer proposta</option>
          <option value="Anunciar meu imóvel">Anunciar meu imóvel</option>
          <option value="Dúvidas gerais / Outros">Dúvidas gerais / Outros (NOVO)</option>
        </select>
      </div>

      <div>
        <label className="label" htmlFor="lead-message">
          Mensagem / Observação
        </label>
        <textarea
          id="lead-message"
          name="message"
          rows={3}
          className="field h-auto py-2.5"
          defaultValue={
            propertyCode
              ? `Olá! Gostaria de mais informações a respeito do imóvel de código ${propertyCode}.`
              : ""
          }
          placeholder="Digite sua mensagem ou preferência de horário para contato..."
        />
      </div>

      <label className="flex items-start gap-2 text-xs text-muted-foreground pt-1">
        <input
          type="checkbox"
          name="consent"
          defaultChecked
          className="mt-0.5 size-4 rounded accent-primary"
        />
        Autorizo o uso dos meus dados para retorno do atendimento, conforme a LGPD.
      </label>
      {err("consent")}

      <Button className="w-full h-11 text-xs font-bold gap-2 shadow-sm" disabled={sending}>
        <MessageSquare className="size-4" />
        <span>{sending ? "Enviando Mensagem..." : "Enviar Mensagem"}</span>
      </Button>
    </form>
  );
}
