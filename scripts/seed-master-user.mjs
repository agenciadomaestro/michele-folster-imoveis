import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://qqpscxedajlgeivthxhv.supabase.co";
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_8mBLAdSBZvfJdWELR8jlGQ_WuvQcUfC";

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSeed() {
  console.log("⚡ Executando verificação e inicialização do usuário Master...");
  console.log(`📡 Conectado ao Supabase: ${supabaseUrl}`);

  // 1. Tenta RPC ensure_master_user se disponível
  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc("ensure_master_user");
    if (!rpcError && rpcData) {
      console.log("✅ Função RPC ensure_master_user executada com sucesso no PostgreSQL:", rpcData);
    }
  } catch (e) {
    // RPC pode não estar criada ainda no banco
  }

  // 2. Tenta login direto para testar as credenciais
  console.log("🔑 Testando autenticação de contato@agenciabipe.com...");
  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
    email: "contato@agenciabipe.com",
    password: "tato@agen29",
  });

  if (!loginError && loginData.user) {
    console.log(`✅ Sucesso! Usuário autenticado. ID: ${loginData.user.id}`);
    
    // Atualiza/garante o perfil
    const { error: profError } = await supabase.from("profiles").upsert({
      id: loginData.user.id,
      full_name: "Everson Maestro",
      active: true,
    });
    if (!profError) {
      console.log("✅ Tabela profiles atualizada para Everson Maestro (ativo: true).");
    }

    // Consulta papéis
    const { data: roles } = await supabase.from("user_roles").select("*").eq("user_id", loginData.user.id);
    console.log("📋 Papéis vinculados no Supabase:", roles?.map((r) => r.role) || []);
    return;
  }

  // 3. Se falhou, tenta signUp inicial
  console.log("ℹ️ Tentando registrar novo usuário caso ainda não exista no Supabase Auth...");
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: "contato@agenciabipe.com",
    password: "tato@agen29",
    options: {
      data: {
        full_name: "Everson Maestro",
      },
    },
  });

  if (signUpError) {
    console.log("⚠️ Informação do Auth:", signUpError.message);
  } else {
    console.log(`✅ Usuário criado no Supabase Auth com ID: ${signUpData.user?.id}`);
  }

  console.log("\n📌 Dica: Se o seu projeto Supabase tiver confirmação de e-mail ativada,");
  console.log("execute a migration 'supabase/migrations/20261029153000_seed_master_user.sql'");
  console.log("no SQL Editor do Supabase para confirmar o e-mail instantaneamente.");
}

runSeed();

