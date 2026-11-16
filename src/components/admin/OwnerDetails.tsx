import { useId } from "react";
import { LockKeyhole, Phone, Mail, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { OwnerDetails as Owner } from "@/lib/property-owners";

export function OwnerDetails({
  value,
  onChange,
}: {
  value: Owner;
  onChange?: (value: Owner) => void;
}) {
  const id = useId();
  const fields = [
    { key: "name", label: "Nome", type: "text" },
    { key: "phone", label: "Telefone", type: "tel" },
    { key: "email", label: "E-mail", type: "email" },
    { key: "notes", label: "Observações", type: "text" },
  ] as const;

  return (
    <section className="mt-8 rounded-2xl border border-primary/20 bg-accent/20 p-6 shadow-xs">
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
            <LockKeyhole className="size-4 text-primary" />
            Dados do Proprietário
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Informações confidenciais · Visível exclusivamente para corretores autorizados
          </p>
        </div>
        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
          Uso Interno
        </span>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {fields.map((field) => (
          <div key={field.key} className={field.key === "notes" ? "sm:col-span-2" : ""}>
            <label htmlFor={`${id}-${field.key}`} className="label font-semibold text-xs">
              {field.label}
            </label>
            {onChange ? (
              field.key === "notes" ? (
                <Textarea
                  id={`${id}-${field.key}`}
                  value={value.notes}
                  placeholder="Ex: Chaves na portaria com Sr. Marcos, ligar antes de visitar..."
                  onChange={(event) => onChange({ ...value, notes: event.target.value })}
                  className="min-h-[80px]"
                />
              ) : (
                <Input
                  id={`${id}-${field.key}`}
                  type={field.type}
                  placeholder={
                    field.key === "phone"
                      ? "(12) 99999-9999"
                      : field.key === "email"
                        ? "proprietario@email.com"
                        : "Nome do proprietário"
                  }
                  value={value[field.key]}
                  onChange={(event) => onChange({ ...value, [field.key]: event.target.value })}
                />
              )
            ) : (
              <div className="mt-1 rounded-lg bg-surface border border-border/60 p-2.5 text-xs">
                {field.key === "phone" && value.phone ? (
                  <div className="flex items-center gap-2">
                    <Phone className="size-3.5 text-primary" />
                    <a
                      href={`tel:${value.phone.replace(/\D/g, "")}`}
                      className="font-medium text-foreground hover:text-primary transition-colors hover:underline"
                    >
                      {value.phone}
                    </a>
                    {value.phone.replace(/\D/g, "").length >= 10 && (
                      <a
                        href={`https://wa.me/55${value.phone.replace(/\D/g, "").replace(/^55/, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700"
                      >
                        WhatsApp
                      </a>
                    )}
                  </div>
                ) : field.key === "email" && value.email ? (
                  <div className="flex items-center gap-2">
                    <Mail className="size-3.5 text-primary" />
                    <a
                      href={`mailto:${value.email}`}
                      className="font-medium text-foreground hover:text-primary transition-colors hover:underline"
                    >
                      {value.email}
                    </a>
                  </div>
                ) : field.key === "notes" ? (
                  <div className="flex items-start gap-2">
                    <FileText className="size-3.5 text-primary shrink-0 mt-0.5" />
                    <p className="whitespace-pre-wrap break-words text-foreground leading-relaxed">
                      {value.notes || "Nenhuma observação informada."}
                    </p>
                  </div>
                ) : (
                  <p className="font-medium text-foreground">
                    {value[field.key] || "Não informado"}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
