import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const createBroker = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      name: z.string().trim().min(2).max(120),
      email: z.string().email(),
      phone: z.string().max(30),
      creci: z.string().max(30),
      password: z.string().min(8).max(128),
      role: z.enum(["admin", "corretor"]),
    }),
  )
  .handler(async ({ data, context }) => {
    const { data: allowed, error } = await context.supabase.rpc("is_staff_manager", {
      _user_id: context.userId,
    });
    if (error) throw new Error(error.message);
    if (!allowed) throw new Error("Acesso negado");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: created, error: creationError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      user_metadata: { full_name: data.name },
    });
    if (creationError) throw new Error(creationError.message);
    if (!created.user) throw new Error("Conta não criada");
    const id = created.user.id;
    try {
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update({ full_name: data.name, email: data.email, phone: data.phone, creci: data.creci })
        .eq("id", id);
      if (profileError) throw new Error(profileError.message);
      const { error: roleError } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: id, role: data.role === "admin" ? "admin" : "broker" });
      if (roleError) throw new Error(roleError.message);
      const { error: permissionError } = await supabaseAdmin.from("broker_permissions").insert({
        user_id: id,
        pode_cadastrar_imovel: true,
        pode_ver_ofertas_gerais: data.role === "admin",
        pode_ver_captacoes: data.role === "admin",
      });
      if (permissionError) throw new Error(permissionError.message);
      const { error: inviteError } = await supabaseAdmin.auth.resend({
        type: "signup",
        email: data.email,
      });
      if (inviteError) throw new Error(inviteError.message);
      return { id };
    } catch (failure) {
      const { error: cleanupError } = await supabaseAdmin.auth.admin.deleteUser(id);
      if (cleanupError)
        throw new Error(
          `${failure instanceof Error ? failure.message : String(failure)}; ${cleanupError.message}`,
        );
      throw failure;
    }
  });
