import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const projectRef = supabaseUrl ? supabaseUrl.replace("https://", "").split(".")[0] : "qafvnjoqvdtnrdvlnwco";

console.log(`[Supabase Deploy] Proyecto Target: ${projectRef}`);
console.log(`[Supabase Deploy] Leyendo script de migración SQL...`);

const sqlFilePath = path.join(process.cwd(), "supabase", "migrations", "20260728_post_dev_complete_schema.sql");
const sqlContent = fs.readFileSync(sqlFilePath, "utf8");

async function deployMigration() {
  console.log(`[Supabase Deploy] Ejecutando SQL query contra Supabase REST/Management API...`);

  // Intentar ejecutar mediante Supabase Query API
  try {
    const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${serviceRoleKey}`,
        "apiKey": serviceRoleKey,
      },
      body: JSON.stringify({ query: sqlContent }),
    });

    const text = await response.text();
    console.log(`[Supabase Deploy] Status Response: ${response.status}`);
    console.log(`[Supabase Deploy] Raw Response: ${text.substring(0, 500)}`);

    if (response.ok) {
      console.log(`✅ [Supabase Deploy] Migración SQL aplicada exitosamente al proyecto Supabase!`);
    } else {
      console.log(`⚠️ [Supabase Deploy] La API Management retornó estado ${response.status}, evaluando métodos alternativos...`);
    }
  } catch (err) {
    console.error(`❌ [Supabase Deploy] Error al conectar: ${err.message}`);
  }
}

deployMigration();
