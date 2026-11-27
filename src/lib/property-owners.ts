import { supabase } from "@/integrations/supabase/client";

export type OwnerDetails = { name: string; phone: string; email: string; notes: string };
export const emptyOwnerDetails: OwnerDetails = { name: "", phone: "", email: "", notes: "" };

export function ownerPayload(propertyId: string, owner: OwnerDetails) {
  return {
    property_id: propertyId,
    name: owner.name.trim(),
    phone: owner.phone.trim(),
    email: owner.email.trim(),
    notes: owner.notes.trim(),
  };
}

export async function fetchPropertyOwner(propertyId: string) {
  try {
    const { data: prop } = await supabase
      .from("properties")
      .select("owner_id, owner_name, owner_phone")
      .eq("id", propertyId)
      .maybeSingle();

    if (prop?.owner_id) {
      const { data: owner } = await supabase
        .from("property_owners")
        .select("name, phone, email, notes")
        .eq("id", prop.owner_id)
        .maybeSingle();
      if (owner) return owner;
    }

    if (prop?.owner_name || prop?.owner_phone) {
      return {
        name: prop.owner_name || "",
        phone: prop.owner_phone || "",
        email: "",
        notes: "",
      };
    }
  } catch {}

  try {
    const { data } = await supabase
      .from("property_owners" as any)
      .select("name, phone, email, notes")
      .eq("property_id", propertyId)
      .maybeSingle();
    if (data) return data;
  } catch {}

  return null;
}

export async function savePropertyOwner(propertyId: string, owner: OwnerDetails) {
  const payload = ownerPayload(propertyId, owner);
  const { error } = await supabase
    .from("property_owners")
    .upsert(payload as any)
    .select("property_id")
    .single();

  if (error) {
    // If database schema does not have property_id column on property_owners
    if (error.message?.includes("property_id") || (error as any).code === "42703") {
      const { data: prop } = await supabase
        .from("properties")
        .select("owner_id")
        .eq("id", propertyId)
        .maybeSingle();

      if (prop?.owner_id) {
        await supabase
          .from("property_owners")
          .update({
            name: owner.name.trim(),
            phone: owner.phone.trim(),
            email: owner.email.trim(),
            notes: owner.notes.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", prop.owner_id);
      } else if (owner.name.trim() || owner.phone.trim() || owner.email.trim() || owner.notes.trim()) {
        const { data: newOwner } = await supabase
          .from("property_owners")
          .insert({
            name: owner.name.trim(),
            phone: owner.phone.trim(),
            email: owner.email.trim(),
            notes: owner.notes.trim(),
          })
          .select("id")
          .maybeSingle();

        if (newOwner?.id) {
          await supabase
            .from("properties")
            .update({
              owner_id: newOwner.id,
              owner_name: owner.name.trim() || null,
              owner_phone: owner.phone.trim() || null,
            })
            .eq("id", propertyId);
        }
      }
      return;
    }
    throw new Error(`Não foi possível salvar os dados do proprietário: ${error.message}`);
  }
}
