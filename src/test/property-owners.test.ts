import { describe, expect, it, vi } from "vitest";
const { from, upsert, select, single } = vi.hoisted(() => ({
  from: vi.fn(),
  upsert: vi.fn(),
  select: vi.fn(),
  single: vi.fn(),
}));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from } }));
import { ownerPayload, savePropertyOwner } from "@/lib/property-owners";

describe("Private owner details", () => {
  it("preserves all four owner fields and the property association", () => {
    expect(
      ownerPayload("property-123", {
        name: " Ana ",
        phone: " 12999990000 ",
        email: " ana@example.com ",
        notes: " Chaves na portaria ",
      }),
    ).toEqual({
      property_id: "property-123",
      name: "Ana",
      phone: "12999990000",
      email: "ana@example.com",
      notes: "Chaves na portaria",
    });
  });
  it("saves contacts separately from public property records", async () => {
    from.mockReturnValue({ upsert });
    upsert.mockReturnValue({ select });
    select.mockReturnValue({ single });
    single.mockResolvedValue({ error: null });
    await savePropertyOwner("property-123", { name: "Ana", phone: "", email: "", notes: "" });
    expect(from).toHaveBeenCalledWith("property_owners");
    expect(upsert).toHaveBeenCalledWith({
      property_id: "property-123",
      name: "Ana",
      phone: "",
      email: "",
      notes: "",
    });
  });
  it("does not report success when private contact persistence is denied", async () => {
    single.mockResolvedValue({ error: { message: "permission denied" } });
    await expect(
      savePropertyOwner("property-123", { name: "", phone: "", email: "", notes: "" }),
    ).rejects.toThrow("permission denied");
  });
});
