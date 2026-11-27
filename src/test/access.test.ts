import { describe, it, expect } from "vitest";
import { resolveStaffRole, staffPermissions } from "@/lib/access";
import { imageDimensions, PHOTO_QUALITY, PHOTO_MAX_WIDTH } from "@/lib/image-upload";

describe("Staff access", () => {
  it("gives agency owners unrestricted manager permissions", () => {
    expect(resolveStaffRole(["broker", "owner"])).toBe("super_admin");
    expect(
      staffPermissions("super_admin", { pode_cadastrar_imovel: false }).pode_cadastrar_imovel,
    ).toBe(true);
  });
  it("gives real administrators access to all listings", () => {
    expect(resolveStaffRole(["admin"])).toBe("admin");
    expect(staffPermissions("admin").pode_ver_ofertas_gerais).toBe(true);
  });
  it("gives manager role GESTOR permissions", () => {
    expect(resolveStaffRole(["manager"])).toBe("manager");
    expect(staffPermissions("manager").pode_ver_ofertas_gerais).toBe(true);
    expect(staffPermissions("manager").pode_cadastrar_imovel).toBe(true);
    expect(staffPermissions("manager").pode_ver_captacoes).toBe(true);
  });
  it("denies property creation without the broker permission", () => {
    expect(staffPermissions("corretor").pode_cadastrar_imovel).toBe(false);
    expect(
      staffPermissions("corretor", { pode_cadastrar_imovel: true }).pode_cadastrar_imovel,
    ).toBe(true);
  });
  it("denies all-offers visibility unless explicitly enabled", () => {
    expect(staffPermissions("corretor").pode_ver_ofertas_gerais).toBe(false);
    expect(
      staffPermissions("corretor", { pode_ver_ofertas_gerais: true }).pode_ver_ofertas_gerais,
    ).toBe(true);
  });
  it("does not grant staff access to an account without a role", () => {
    expect(resolveStaffRole([])).toBeNull();
  });
});
describe("Photo conversion rules", () => {
  it("limits width to 1280 pixels while keeping aspect ratio", () => {
    expect(PHOTO_MAX_WIDTH).toBe(1280);
    expect(imageDimensions(2560, 1920)).toEqual({ width: 1280, height: 960 });
    expect(imageDimensions(640, 480)).toEqual({ width: 640, height: 480 });
  });
  it("encodes at the requested 0.80 quality", () => {
    expect(PHOTO_QUALITY).toBe(0.8);
  });
});
