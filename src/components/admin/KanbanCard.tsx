import { useState } from "react";
import {
  MessageCircle,
  Phone,
  Building,
  Calendar,
  Clock,
  User,
  MoreVertical,
  ChevronRight,
  ChevronLeft,
  Tag,
} from "lucide-react";
import {
  type Lead,
  type LeadStatus,
  TEMPERATURE_CONFIG,
  KANBAN_COLUMNS,
  buildWhatsappChatUrl,
} from "@/lib/leads";
import { brl } from "@/lib/realty";

interface KanbanCardProps {
  lead: Lead;
  onOpenDetails: (lead: Lead) => void;
  onMoveStatus: (leadId: string, newStatus: LeadStatus) => void;
  isAdmin: boolean;
}

export function KanbanCard({ lead, onOpenDetails, onMoveStatus, isAdmin }: KanbanCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const tempConfig = TEMPERATURE_CONFIG[lead.temperature] || TEMPERATURE_CONFIG.morno;

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("text/plain", lead.id);
    e.dataTransfer.effectAllowed = "move";
  };

  const currentIndex = KANBAN_COLUMNS.findIndex((c) => c.id === lead.status);
  const prevColumn = currentIndex > 0 ? KANBAN_COLUMNS[currentIndex - 1] : null;
  const nextColumn =
    currentIndex < KANBAN_COLUMNS.length - 1 ? KANBAN_COLUMNS[currentIndex + 1] : null;

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={() => onOpenDetails(lead)}
      className="group relative flex flex-col gap-2.5 rounded-xl border border-border/80 bg-card p-3.5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md cursor-pointer select-none active:cursor-grabbing"
    >
      {/* Top Bar: Name, Temperature & Menu */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h4 className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
              {lead.name}
            </h4>
            <span
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold border ${tempConfig.badgeClass}`}
            >
              <span>{tempConfig.icon}</span>
              <span>{tempConfig.label}</span>
            </span>
          </div>

          <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
            <span>{lead.phone}</span>
          </p>
        </div>

        {/* WhatsApp Quick Action Button */}
        <div className="flex items-center gap-1">
          <a
            href={buildWhatsappChatUrl(lead.phone, lead.name, lead.property_code)}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-1 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 transition-colors"
            title="Abrir WhatsApp"
          >
            <MessageCircle className="size-4" />
          </a>

          {/* Quick Move Dropdown */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-1 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
              title="Mover de coluna"
            >
              <MoreVertical className="size-3.5" />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 top-6 z-20 w-44 rounded-xl border border-border bg-card p-1 shadow-lg text-xs space-y-0.5 animate-in fade-in zoom-in-95">
                <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Mover para:
                </p>
                {KANBAN_COLUMNS.map((col) => (
                  <button
                    key={col.id}
                    disabled={col.id === lead.status}
                    onClick={() => {
                      onMoveStatus(lead.id, col.id);
                      setIsMenuOpen(false);
                    }}
                    className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center justify-between text-xs transition-colors ${
                      col.id === lead.status
                        ? "bg-primary/10 text-primary font-bold"
                        : "hover:bg-secondary text-foreground"
                    }`}
                  >
                    <span>{col.title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Property of Interest */}
      {(lead.property_code || lead.property_title || lead.interest) && (
        <div className="rounded-lg bg-secondary/50 p-2 text-[11px] border border-border/40 flex items-center gap-2">
          <Building className="size-3.5 text-primary shrink-0" />
          <div className="min-w-0 flex-1 truncate">
            <span className="font-semibold text-foreground truncate block">
              {lead.property_title || lead.interest}
            </span>
            <div className="text-[10px] text-muted-foreground flex items-center gap-1.5">
              {lead.property_code && (
                <span className="font-mono font-bold">{lead.property_code}</span>
              )}
              {lead.property_price && <span>• {brl(lead.property_price)}</span>}
            </div>
          </div>
        </div>
      )}

      {/* Tags: Source & Transaction Type */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          {lead.source}
        </span>
        <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground uppercase">
          {lead.transaction_type === "alugar" ? "Alugar" : "Comprar"}
        </span>
        {lead.status === "perdido" && lead.loss_reason && (
          <span className="rounded-md bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 px-1.5 py-0.5 text-[10px] font-medium truncate max-w-[150px]">
            {lead.loss_reason}
          </span>
        )}
      </div>

      {/* Next Action / Alert */}
      {lead.next_action && (
        <div className="rounded-md bg-accent/40 border border-primary/20 px-2 py-1 text-[10px] flex items-center gap-1.5 text-foreground">
          <Clock className="size-3 text-primary shrink-0" />
          <span className="truncate font-medium">{lead.next_action}</span>
          {lead.next_action_date && (
            <span className="text-muted-foreground ml-auto shrink-0 font-mono text-[9px]">
              {new Date(lead.next_action_date).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
              })}
            </span>
          )}
        </div>
      )}

      {/* Footer: Broker & Date */}
      <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[10px] text-muted-foreground">
        {isAdmin && lead.broker_name ? (
          <span className="flex items-center gap-1 truncate max-w-[130px]" title={lead.broker_name}>
            <User className="size-3 text-primary shrink-0" />
            <span className="truncate font-medium">{lead.broker_name}</span>
          </span>
        ) : (
          <span>{new Date(lead.created_at).toLocaleDateString("pt-BR")}</span>
        )}

        {/* Quick Stepper Navigation (Previous / Next) */}
        <div
          className="flex items-center gap-1 opacity-70 group-hover:opacity-100"
          onClick={(e) => e.stopPropagation()}
        >
          {prevColumn && (
            <button
              type="button"
              onClick={() => onMoveStatus(lead.id, prevColumn.id)}
              className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground"
              title={`Voltar para ${prevColumn.title}`}
            >
              <ChevronLeft className="size-3" />
            </button>
          )}
          {nextColumn && (
            <button
              type="button"
              onClick={() => onMoveStatus(lead.id, nextColumn.id)}
              className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground"
              title={`Avançar para ${nextColumn.title}`}
            >
              <ChevronRight className="size-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
