import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://uzjvycaygwtpaiwvkylt.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6anZ5Y2F5Z3d0cGFpd3ZreWx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIxNTYyNzIsImV4cCI6MjEwNzczMjI3Mn0.GbVUAIkl-sy3Tcp1Oq0hFzeFCoA0d8cZhFd13gQakDI";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log("=== ZERANDO DADOS CLÍNICOS DO AMBIENTE REAL ===");

  // 1. Autentica como Administrador
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: "bernardo.silva@saude.ba.gov.br",
    password: "PharmaCare@2026",
  });

  if (authErr || !authData.session) {
    console.error("Erro na autenticação:", authErr);
    process.exit(1);
  }
  console.log(`[+] Autenticado como Administrador: ${authData.user.email}`);

  // 2. Remove consultas (cascata remove PRFs e medicações da consulta)
  const { count: consCount, error: consErr } = await supabase
    .from("consultations")
    .delete({ count: "exact" })
    .neq("id", "00000000-0000-0000-0000-000000000000");

  if (consErr) console.error("Erro ao deletar consultas:", consErr);
  else console.log(`[✓] Consultas removidas: ${consCount}`);

  // 3. Remove pacientes
  const { count: patCount, error: patErr } = await supabase
    .from("patients")
    .delete({ count: "exact" })
    .neq("id", "00000000-0000-0000-0000-000000000000");

  if (patErr) console.error("Erro ao deletar pacientes:", patErr);
  else console.log(`[✓] Pacientes removidos: ${patCount}`);

  // 4. Remove fechamentos mensais
  const { count: monthCount, error: monthErr } = await supabase
    .from("monthly_complementary_data")
    .delete({ count: "exact" })
    .neq("id", "00000000-0000-0000-0000-000000000000");

  if (monthErr) console.error("Erro ao deletar fechamento mensal:", monthErr);
  else console.log(`[✓] Fechamentos mensais removidos: ${monthCount}`);

  console.log("=== AMBIENTE REAL ZERADO COM SUCESSO! BASE LIMPA PARA USO REAL ===");
}

main().catch((err) => {
  console.error("Erro fatal:", err);
  process.exit(1);
});
