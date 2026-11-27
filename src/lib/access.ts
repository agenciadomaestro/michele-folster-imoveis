export type StaffRole = "super_admin" | "admin" | "manager" | "corretor";
export interface StaffPermissions {
  pode_cadastrar_imovel: boolean;
  pode_ver_ofertas_gerais: boolean;
  pode_ver_captacoes: boolean;
}
export function resolveStaffRole(roles: string[]): StaffRole | null {
  if (roles.includes("owner")) return "super_admin";
  if (roles.includes("admin")) return "admin";
  if (roles.includes("manager")) return "manager";
  if (roles.includes("broker") || roles.includes("corretor")) return "corretor";
  return null;
}
export function staffPermissions(
  role: StaffRole,
  saved?: Partial<StaffPermissions> | null,
): StaffPermissions {
  const isPrivileged = role === "super_admin" || role === "admin" || role === "manager";
  return {
    pode_cadastrar_imovel: isPrivileged || saved?.pode_cadastrar_imovel === true,
    pode_ver_ofertas_gerais: isPrivileged || saved?.pode_ver_ofertas_gerais === true,
    pode_ver_captacoes: isPrivileged || saved?.pode_ver_captacoes === true,
  };
}
