import { supabase } from '@/integrations/supabase/client';

export type OwnerDetails = { name: string; phone: string; email: string; notes: string };
export const emptyOwnerDetails: OwnerDetails = { name: '', phone: '', email: '', notes: '' };

export function ownerPayload(propertyId: string, owner: OwnerDetails) {
  return { property_id: propertyId, name: owner.name.trim(), phone: owner.phone.trim(), email: owner.email.trim(), notes: owner.notes.trim() };
}

export async function fetchPropertyOwner(propertyId: string) {
  const { data, error } = await supabase.from('property_owners').select('name, phone, email, notes').eq('property_id', propertyId).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function savePropertyOwner(propertyId: string, owner: OwnerDetails) {
  const { error } = await supabase.from('property_owners').upsert(ownerPayload(propertyId, owner)).select('property_id').single();
  if (error) throw new Error(`Não foi possível salvar os dados do proprietário: ${error.message}`);
}