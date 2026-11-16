export type StaffRole = "super_admin" | "admin" | "corretor";
export interface StaffPermissions {
  pode_cadastrar_imovel: boolean;
  pode_ver_ofertas_gerais: boolean;
  pode_ver_captacoes: boolean;
}
export function resolveStaffRole(roles: string[]): StaffRole | null {
  if (roles.includes("owner")) return "super_admin";
  if (roles.includes("admin")) return "admin";
  if (roles.includes("broker")) return "corretor";
  return null;
}
export function staffPermissions(
  role: StaffRole,
  saved?: Partial<StaffPermissions> | null,
): StaffPermissions {
  return {
    pode_cadastrar_imovel: role !== "corretor" || saved?.pode_cadastrar_imovel === true,
    pode_ver_ofertas_gerais: role !== "corretor" || saved?.pode_ver_ofertas_gerais === true,
    pode_ver_captacoes: role !== "corretor" || saved?.pode_ver_captacoes === true,
  };
}
