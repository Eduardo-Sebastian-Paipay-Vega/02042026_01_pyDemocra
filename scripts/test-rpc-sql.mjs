import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const sqlContent = fs.readFileSync(path.join(process.cwd(), "supabase", "migrations", "20260728_post_dev_complete_schema.sql"), "utf8");

async function testRpc() {
  console.log(`[RPC Test] Probando RPC exec_sql o exec en Supabase...`);

  // Probar RPC exec_sql o run_sql
  const { data: d1, error: e1 } = await supabase.rpc("exec_sql", { query: sqlContent });
  console.log(`RPC exec_sql:`, { data: d1, error: e1?.message });

  const { data: d2, error: e2 } = await supabase.rpc("exec", { sql: sqlContent });
  console.log(`RPC exec:`, { data: d2, error: e2?.message });
}

testRpc();
