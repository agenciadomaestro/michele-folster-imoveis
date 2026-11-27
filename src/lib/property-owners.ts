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
  const { error } = await supabase
    .from("property_owners")
    .upsert(ownerPayload(propertyId, owner))
    .select("property_id")
    .single();
  if (error) throw new Error(`Não foi possível salvar os dados do proprietário: ${error.message}`);
}
