import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  eq: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  from: vi.fn(),
}));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: db.from } }));
import {
  KANBAN_COLUMNS,
  normalizeLeadStatus,
  updateLeadStatusInDb,
  deleteLeadInDb,
} from "@/lib/leads";

const id = "5839dc85-f229-47f9-927c-4a974705b15a";
beforeEach(() => {
  vi.clearAllMocks();
  db.from.mockReturnValue(db);
  db.update.mockReturnValue(db);
  db.delete.mockReturnValue(db);
  db.eq.mockResolvedValue({ error: null });
});

describe("CRM canonical stages", () => {
  it("uses all seven requested stage IDs", () => {
    expect(KANBAN_COLUMNS.map((column) => column.id)).toEqual([
      "novo",
      "em_contato",
      "visita_agendada",
      "proposta_feita",
      "em_negociacao",
      "fechado",
      "perdido",
    ]);
  });
  it.each([
    ["Novo / Não Atendido", "novo"],
    ["Em Contato", "em_contato"],
    ["Visita Agendada", "visita_agendada"],
    ["Proposta Feita", "proposta_feita"],
    ["Em Negociação", "em_negociacao"],
    ["Fechado / Ganho", "fechado"],
    ["Arquivado / Perdido", "perdido"],
    ["em_atendimento", "em_contato"],
    ["proposta", "proposta_feita"],
  ])("maps %s to %s", (label, canonical) => {
    expect(normalizeLeadStatus(label)).toBe(canonical);
  });
  it.each(["em_contato", "em_negociacao", "proposta_feita"] as const)(
    "saves %s without requesting a single row",
    async (status) => {
      expect(await updateLeadStatusInDb(id, status)).toEqual({ success: true });
      expect(db.update).toHaveBeenCalledWith(expect.objectContaining({ status }));
      expect(db.eq).toHaveBeenCalledWith("id", id);
    },
  );
});

describe("lead deletion", () => {
  it("deletes by ID with no single-row coercion", async () => {
    expect(await deleteLeadInDb(id)).toEqual({ success: true });
    expect(db.from).toHaveBeenCalledWith("leads");
    expect(db.delete).toHaveBeenCalledOnce();
    expect(db.eq).toHaveBeenCalledWith("id", id);
  });
  it("returns permission errors instead of claiming success", async () => {
    db.eq.mockResolvedValue({ error: { message: "permission denied" } });
    expect(await deleteLeadInDb(id)).toEqual({ success: false, error: "permission denied" });
  });
  it("rejects invalid IDs without pretending to delete local records", async () => {
    expect((await deleteLeadInDb("lead-demo")).success).toBe(false);
    expect(db.delete).not.toHaveBeenCalled();
  });
});
