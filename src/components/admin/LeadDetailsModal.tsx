import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  X,
  Phone,
  MessageCircle,
  Mail,
  Calendar,
  Clock,
  User,
  Building,
  Tag,
  AlertCircle,
  CheckCircle2,
  Send,
  ExternalLink,
  ChevronRight,
  Flame,
  Sun,
  Snowflake,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  type Lead,
  type LeadStatus,
  type LeadTemperature,
  type BrokerProfile,
  KANBAN_COLUMNS,
  TEMPERATURE_CONFIG,
  buildWhatsappChatUrl,
  isUuid,
  normalizeLeadStatus,
} from "@/lib/leads";
import { brl } from "@/lib/realty";

interface LeadDetailsModalProps {
  lead: Lead;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedLead: Lead) => void;
  onDelete?: (leadId: string) => Promise<boolean>;
  brokers: BrokerProfile[];
  isAdmin: boolean;
  currentUserName: string;
}

export function LeadDetailsModal({
  lead,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  brokers,
  isAdmin,
  currentUserName,
}: LeadDetailsModalProps) {
  const queryClient = useQueryClient();

  const [status, setStatus] = useState<LeadStatus>(lead.status);
  const [temperature, setTemperature] = useState<LeadTemperature>(lead.temperature);
  const [brokerId, setBrokerId] = useState(lead.broker_id || "");
  const [nextAction, setNextAction] = useState(lead.next_action || "");
  const [nextActionDate, setNextActionDate] = useState(
    lead.next_action_date ? lead.next_action_date.slice(0, 16) : "",
  );
  const [lossReason, setLossReason] = useState(lead.loss_reason || "");
  const [newNote, setNewNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);

  const handleSave = async () => {
    if (isSaving || isDeleting || isAddingNote) return;
    const assignedBroker = brokers.find((b) => b.id === brokerId);

    const updated: Lead = {
      ...lead,
      status: normalizeLeadStatus(status),
      temperature,
      broker_id: brokerId || null,
      broker_name: assignedBroker?.name || lead.broker_name || null,
      next_action: nextAction.trim() || null,
      next_action_date: nextActionDate || null,
      loss_reason: status === "perdido" ? lossReason.trim() : null,
      updated_at: new Date().toISOString(),
    };

    if (!isUuid(updated.id)) {
      toast.error("Identificador inválido");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("leads")
        .update({
          status: updated.status,
          notes: updated.notes || null,
          temperature: updated.temperature,
          next_action: updated.next_action ?? null,
          next_action_date: updated.next_action_date ?? null,
          loss_reason: updated.loss_reason ?? null,
          broker_name: updated.broker_name ?? null,
          broker_id: updated.broker_id || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", updated.id);

      if (error) {
        console.error("Erro ao salvar no Supabase:", error.message);
        toast.error(`Falha ao salvar: ${error.message}`);
        return;
      }

      queryClient.setQueryData(["admin", "leads-crm-list"], (prev: Lead[] = []) =>
        prev.map((item) => (item.id === updated.id ? updated : item)),
      );

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "leads-crm-list"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "crm-leads-list"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "messages-leads-list"] }),
      ]);
    } catch (caught) {
    const err = caught as Error;
      console.error("Erro inesperado ao salvar lead no Supabase:", err);
      toast.error(`Falha ao salvar: ${err?.message || err}`);
      return;
    } finally {
      setIsSaving(false);
    }

    onUpdate(updated);
    toast.success("Lead atualizado com sucesso!");
    onClose();
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || isSaving || isDeleting || isAddingNote) return;

    const newActivity = {
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      author_name: currentUserName || "Corretor",
      type: "note" as const,
      content: newNote.trim(),
    };

    const updatedTimeline = [newActivity, ...(lead.timeline || [])];
    const updated: Lead = {
      ...lead,
      timeline: updatedTimeline,
      notes: newNote.trim(),
      updated_at: new Date().toISOString(),
    };

    if (!isUuid(updated.id)) {
      toast.error("Identificador inválido");
      return;
    }

    setIsAddingNote(true);
    try {
      const { error } = await supabase
        .from("leads")
        .update({
          notes: updated.notes ?? null,
          timeline: updated.timeline.map((activity) => ({ ...activity })),
          updated_at: new Date().toISOString(),
        })
        .eq("id", updated.id);

      if (error) {
        console.error("Erro ao salvar no Supabase:", error.message);
        toast.error(`Falha ao salvar: ${error.message}`);
        return;
      }

      queryClient.setQueryData(["admin", "leads-crm-list"], (prev: Lead[] = []) =>
        prev.map((item) => (item.id === updated.id ? updated : item)),
      );

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "leads-crm-list"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "crm-leads-list"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "messages-leads-list"] }),
      ]);
    } catch (caught) {
    const err = caught as Error;
      console.error("Erro inesperado ao salvar nota no Supabase:", err);
      toast.error(`Falha ao salvar: ${err?.message || err}`);
      return;
    } finally {
      setIsAddingNote(false);
    }

    onUpdate(updated);
    setNewNote("");
    toast.success("Anotação adicionada ao histórico da conversa!");
  };

  const currentColumn = KANBAN_COLUMNS.find((c) => c.id === status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-2xl bg-card border border-border shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4 bg-muted/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm">
              {lead.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-foreground">{lead.name}</h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${currentColumn?.badgeBg} ${currentColumn?.badgeText}`}
                >
                  {currentColumn?.title}
                </span>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <span>Criado em {new Date(lead.created_at).toLocaleDateString("pt-BR")}</span>
                <span>•</span>
                <span>
                  Origem: <strong>{lead.source}</strong>
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onDelete && isAdmin && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={isDeleting || isSaving || isAddingNote}
                onClick={async () => {
                  if (confirm(`Deseja excluir o lead de ${lead.name}?`)) {
                    setIsDeleting(true);
                    try {
                      if (await onDelete(lead.id)) onClose();
                    } finally {
                      setIsDeleting(false);
                    }
                  }
                }}
                className="btn btn-ghost text-xs text-destructive hover:bg-destructive/10 size-8 p-0"
                title="Excluir lead"
              >
                <Trash2 className="size-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              aria-label="Fechar detalhes"
              onClick={onClose}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              <X className="size-5" />
            </Button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Quick Contact Bar */}
          <div className="flex flex-wrap items-center gap-3 p-3.5 rounded-xl bg-accent/40 border border-primary/20">
            <a
              href={buildWhatsappChatUrl(lead.phone, lead.name, lead.property_code)}
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex-1 sm:flex-none"
            >
              <MessageCircle className="mr-1.5 size-4" />
              Conversar no WhatsApp
            </a>

            <a
              href={`tel:${lead.phone.replace(/\D/g, "")}`}
              className="btn btn-outline text-xs h-9"
            >
              <Phone className="mr-1.5 size-3.5 text-muted-foreground" />
              {lead.phone}
            </a>

            {lead.email && (
              <a
                href={`mailto:${lead.email}`}
                className="btn btn-outline text-xs h-9 text-muted-foreground hover:text-foreground"
              >
                <Mail className="mr-1.5 size-3.5" />
                {lead.email}
              </a>
            )}
          </div>

          {/* Form Fields & Controls */}
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Etapa do Funil (Status) */}
            <div>
              <label className="label">Etapa do Funil (Pipeline)</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as LeadStatus)}
                className="field"
              >
                {KANBAN_COLUMNS.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Temperatura */}
            <div>
              <label className="label">Temperatura do Lead</label>
              <select
                value={temperature}
                onChange={(e) => setTemperature(e.target.value as LeadTemperature)}
                className="field"
              >
                <option value="quente">🔥 Quente (Alta intenção)</option>
                <option value="morno">☀️ Morno (Em avaliação)</option>
                <option value="frio">❄️ Frio (Pouco engajado)</option>
              </select>
            </div>

            {/* Corretor Responsável */}
            <div>
              <label className="label">Corretor Responsável</label>
              {isAdmin ? (
                <select
                  value={brokerId}
                  onChange={(e) => setBrokerId(e.target.value)}
                  className="field"
                >
                  <option value="">Não atribuído</option>
                  {brokers.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.role === "owner" ? "Master" : b.role})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="field flex items-center text-xs font-medium text-foreground bg-secondary/50">
                  <User className="mr-1.5 size-3.5 text-muted-foreground" />
                  {lead.broker_name || "Seu Lead"}
                </div>
              )}
            </div>
          </div>

          {/* Imóvel de Interesse */}
          {(lead.property_code || lead.property_title || lead.interest) && (
            <div className="p-3.5 rounded-xl border border-border bg-secondary/30 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Building className="size-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">
                    {lead.property_title || lead.interest || "Imóvel de Interesse"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {lead.property_code && (
                      <span className="font-mono font-bold mr-2">{lead.property_code}</span>
                    )}
                    {lead.property_price && <span>Valor: {brl(lead.property_price)}</span>}
                  </p>
                </div>
              </div>

              {lead.property_code && (
                <a
                  href={`/imovel/${lead.property_code}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-ghost text-xs h-8 text-primary hover:text-primary/80"
                >
                  <ExternalLink className="mr-1 size-3.5" />
                  Ver Página do Imóvel
                </a>
              )}
            </div>
          )}

          {/* Motivo da Perda (Se status for perdido) */}
          {status === "perdido" && (
            <div className="p-3.5 rounded-xl border border-rose-300 bg-rose-50/50 dark:bg-rose-950/20 space-y-1.5">
              <label className="text-xs font-bold text-rose-800 dark:text-rose-300">
                Motivo da Perda / Desistência
              </label>
              <input
                type="text"
                value={lossReason}
                onChange={(e) => setLossReason(e.target.value)}
                placeholder="Ex: Comprou com outro corretor, preço acima do teto, desistiu..."
                className="field bg-white dark:bg-card border-rose-200"
              />
            </div>
          )}

          {/* Próxima Ação & Lembrete */}
          <div className="p-4 rounded-xl border border-border bg-secondary/20 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-foreground">
              <Calendar className="size-4 text-primary" />
              <span>Próxima Ação / Lembrete de Follow-up</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <input
                  type="text"
                  value={nextAction}
                  onChange={(e) => setNextAction(e.target.value)}
                  placeholder="Ex: Ligar para confirmar visita ou enviar contraproposta"
                  className="field text-xs"
                />
              </div>
              <div>
                <input
                  type="date"
                  value={nextActionDate}
                  onChange={(e) => setNextActionDate(e.target.value)}
                  className="field text-xs"
                />
              </div>
            </div>
          </div>

          {/* Mensagem Inicial do Cliente */}
          {lead.message && (
            <div className="p-3.5 rounded-xl border border-border/70 bg-background text-xs space-y-1">
              <span className="font-bold text-muted-foreground">
                Mensagem enviada pelo cliente:
              </span>
              <p className="text-foreground italic">"{lead.message}"</p>
            </div>
          )}

          {/* Timeline & Conversas do Lead */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Clock className="size-4 text-primary" />
                Histórico & Andamento das Conversas
              </h3>
              <span className="text-xs text-muted-foreground">
                {lead.timeline?.length || 0} registros
              </span>
            </div>

            {/* Formulário de Nova Anotação */}
            <form onSubmit={handleAddNote} className="space-y-2">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Escreva detalhes da ligação, conversa no WhatsApp, dúvidas ou acordo feito com o cliente..."
                rows={2}
                className="field text-xs resize-none"
              />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={!newNote.trim() || isAddingNote || isSaving || isDeleting}
                  className="btn btn-primary text-xs h-8"
                >
                  <Send className="mr-1.5 size-3" />
                  Registrar no Histórico
                </Button>
              </div>
            </form>

            {/* Lista da Linha do Tempo */}
            <div className="space-y-3 pt-2">
              {lead.timeline && lead.timeline.length > 0 ? (
                lead.timeline.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl border border-border/60 bg-muted/20 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="font-semibold text-foreground flex items-center gap-1.5">
                        <span className="size-2 rounded-full bg-primary" />
                        {item.author_name}
                      </span>
                      <span>
                        {new Date(item.created_at).toLocaleDateString("pt-BR")}{" "}
                        {new Date(item.created_at).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-foreground whitespace-pre-wrap pl-3.5 border-l-2 border-border mt-1">
                      {item.content}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Nenhuma anotação registrada ainda. Use o campo acima para adicionar registros da
                  conversa.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Actions Bar */}
        <div className="flex items-center justify-end gap-3 border-t border-border px-5 py-3.5 bg-muted/40 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="btn btn-outline text-xs h-9"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving || isDeleting || isAddingNote}
            className="btn btn-primary text-xs h-9 shadow-sm"
          >
            Salvar Alterações
          </Button>
        </div>
      </div>
    </div>
  );
}
