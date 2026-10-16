import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const supabaseUrl = "https://uzjvycaygwtpaiwvkylt.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6anZ5Y2F5Z3d0cGFpd3ZreWx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIxNTYyNzIsImV4cCI6MjEwNzczMjI3Mn0.GbVUAIkl-sy3Tcp1Oq0hFzeFCoA0d8cZhFd13gQakDI";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log("=== SINCRONIZANDO SIGTAP COMPLETO COM O SUPABASE ===");

  // 1. Autentica como Administrador
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: "bernardo.silva@saude.ba.gov.br",
    password: "PharmaCare@2026",
  });

  if (authErr || !authData.session) {
    console.error("Erro na autenticação:", authErr);
    process.exit(1);
  }
  console.log(`[+] Autenticado com sucesso como: ${authData.user.email}`);

  // 2. Lê catálogo JSON gerado pelo processamento dos arquivos
  const catalogPath = path.join(rootDir, "data", "sigtap_ceaf_catalog.json");
  if (!fs.existsSync(catalogPath)) {
    console.error("Arquivo de catálogo não encontrado:", catalogPath);
    process.exit(1);
  }

  const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf-8"));
  console.log(`[*] Total de CIDs a subir: ${catalog.cids.length}`);
  console.log(`[*] Total de Medicamentos CEAF a subir: ${catalog.medications.length}`);

  // 3. Upsert CIDs em lotes
  const BATCH_SIZE = 100;
  let cidsUpserted = 0;
  for (let i = 0; i < catalog.cids.length; i += BATCH_SIZE) {
    const chunk = catalog.cids.slice(i, i + BATCH_SIZE).map((c) => ({
      code: c.code,
      description: c.description,
      active: true,
    }));

    const { error } = await supabase
      .from("cids")
      .upsert(chunk, { onConflict: "code" });

    if (error) {
      console.error(`Erro ao subir lote de CIDs [${i}..${i + chunk.length}]:`, error);
    } else {
      cidsUpserted += chunk.length;
    }
  }
  console.log(`[✓] CIDs sincronizados com sucesso: ${cidsUpserted}`);

  // 4. Upsert Medicamentos em lotes
  let medsUpserted = 0;
  for (let i = 0; i < catalog.medications.length; i += BATCH_SIZE) {
    const chunk = catalog.medications.slice(i, i + BATCH_SIZE).map((m) => ({
      sigtap_code: m.sigtap_code,
      name: m.name,
      pharmaceutical_form: m.pharmaceutical_form || null,
      component: "CEAF",
      active: true,
    }));

    const { error } = await supabase
      .from("medications")
      .upsert(chunk, { onConflict: "sigtap_code" });

    if (error) {
      console.error(`Erro ao subir lote de Medicamentos [${i}..${i + chunk.length}]:`, error);
    } else {
      medsUpserted += chunk.length;
    }
  }
  console.log(`[✓] Medicamentos sincronizados com sucesso: ${medsUpserted}`);

  // 5. Monta e insere todos os relacionamentos em lotes
  const allRelations = [];
  catalog.medications.forEach((m) => {
    if (m.sigtap_code && Array.isArray(m.compatible_cid_codes)) {
      m.compatible_cid_codes.forEach((cidCode) => {
        allRelations.push({
          sigtap_code: m.sigtap_code,
          cid_code: cidCode,
          is_primary: false,
        });
      });
    }
  });

  console.log(`[*] Total de vínculos Procedimento x CID: ${allRelations.length}`);

  let relsUpserted = 0;
  const REL_BATCH_SIZE = 200;
  for (let i = 0; i < allRelations.length; i += REL_BATCH_SIZE) {
    const chunk = allRelations.slice(i, i + REL_BATCH_SIZE);
    const { error } = await supabase
      .from("medication_authorized_cids")
      .upsert(chunk, { onConflict: "sigtap_code,cid_code" });

    if (error) {
      console.error(`Erro ao subir lote de vínculos [${i}..${i + chunk.length}]:`, error);
    } else {
      relsUpserted += chunk.length;
    }
  }
  console.log(`[✓] Relacionamentos PCDT sincronizados com sucesso: ${relsUpserted}`);

  console.log("\n=== SINCRONIZAÇÃO COM O SUPABASE CONCLUÍDA COM ÊXITO ===");
}

main().catch((err) => {
  console.error("Erro fatal:", err);
  process.exit(1);
});
