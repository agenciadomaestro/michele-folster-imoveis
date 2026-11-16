import { supabase } from "@/integrations/supabase/client";
import {
  resolveStaffRole,
  staffPermissions,
  type StaffRole,
  type StaffPermissions,
} from "./access";
export type AppUserRole = StaffRole;
export type BrokerPermissions = StaffPermissions;
export interface Broker {
  id: string;
  name: string;
  email: string;
  phone: string;
  creci: string;
  photo_url?: string | null;
  role: AppUserRole;
  active: boolean;
  is_hidden?: boolean;
  properties_count?: number;
  permissions: BrokerPermissions;
  created_at: string;
}
export function isUuid(value: string | null | undefined): boolean {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
  );
}
export async function fetchBrokers(includeHidden = false): Promise<Broker[]> {
  const [profiles, roles, permissions] = await Promise.all([
    supabase.from("profiles").select("*").order("created_at"),
    supabase.from("user_roles").select("user_id, role"),
    supabase.from("broker_permissions").select("*"),
  ]);
  for (const response of [profiles, roles, permissions])
    if (response.error) throw new Error(response.error.message);
  return (profiles.data ?? []).flatMap((p) => {
    const role = resolveStaffRole(
      (roles.data ?? []).filter((r) => r.user_id === p.id).map((r) => r.role),
    );
    if (!role || (!includeHidden && role === "super_admin")) return [];
    return [
      {
        id: p.id,
        name: p.full_name ?? "",
        email: p.email ?? "",
        phone: p.phone ?? "",
        creci: p.creci ?? "",
        photo_url: p.photo_url,
        role,
        active: p.active,
        is_hidden: role === "super_admin",
        permissions: staffPermissions(
          role,
          permissions.data?.find((r) => r.user_id === p.id),
        ),
        created_at: p.created_at,
      },
    ];
  });
}
export async function saveBrokerDirect(broker: Broker): Promise<Broker> {
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: broker.name,
      email: broker.email,
      phone: broker.phone,
      creci: broker.creci,
      active: broker.active,
    })
    .eq("id", broker.id)
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return broker;
}
export async function updateBrokerPermissions(
  brokerId: string,
  permissions: Partial<BrokerPermissions>,
) {
  const { error } = await supabase
    .from("broker_permissions")
    .upsert({ user_id: brokerId, ...permissions })
    .select("user_id")
    .single();
  if (error) throw new Error(error.message);
}
export async function updateBrokerStatus(brokerId: string, active: boolean) {
  const { error } = await supabase
    .from("profiles")
    .update({ active })
    .eq("id", brokerId)
    .select("id")
    .single();
  if (error) throw new Error(error.message);
}
export async function reassignAndDeleteBroker(
  brokerId: string,
  _brokerName: string,
): Promise<{ reassignedProps: number; reassignedLeads: number; reassignedMsgs: number }> {
  const { data, error } = await supabase.rpc("retire_broker", { _broker_id: brokerId });
  if (error) throw new Error(error.message);
  if (!data || typeof data !== "object" || Array.isArray(data))
    throw new Error("Transferência não confirmada");
  return {
    reassignedProps: Number(data["reassignedProps"]),
    reassignedLeads: Number(data["reassignedLeads"]),
    reassignedMsgs: Number(data["reassignedMsgs"]),
  };
}
export async function getCurrentUserProfile() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw new Error(error.message);
  if (!data.user) throw new Error("Entre na sua conta");
  const broker = (await fetchBrokers(true)).find((b) => b.id === data.user.id);
  if (!broker?.active) throw new Error("Acesso da equipe não autorizado");
  return {
    ...broker,
    roleLabel:
      broker.role === "super_admin"
        ? "Master Agência — Super Admin"
        : broker.role === "admin"
          ? "Gestora / Administradora"
          : "Corretor(a)",
    isSuperAdmin: broker.role === "super_admin",
    isAdmin: broker.role !== "corretor",
    isBroker: broker.role === "corretor",
  };
}
export function formatMembershipDuration(createdAtStr?: string): string {
  if (!createdAtStr) return "Cadastrado recentemente";
  const created = new Date(createdAtStr);
  const now = new Date();
  const diffMs = Math.max(0, now.getTime() - created.getTime());
  const diffDays = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  if (diffDays < 30) {
    return `${diffDays} ${diffDays === 1 ? "dia" : "dias"}`;
  }
  const diffMonths = Math.floor(diffDays / 30);
  const remDays = diffDays % 30;
  if (diffMonths < 12) {
    return remDays > 0
      ? `${diffMonths} ${diffMonths === 1 ? "mês" : "meses"} e ${remDays} dias`
      : `${diffMonths} ${diffMonths === 1 ? "mês" : "meses"}`;
  }
  const diffYears = Math.floor(diffMonths / 12);
  const remMonths = diffMonths % 12;
  return `${diffYears} ${diffYears === 1 ? "ano" : "anos"}${remMonths > 0 ? ` e ${remMonths} meses` : ""}`;
}
