/**
 * startup-banner.mjs
 * Runs automatically before `npm run dev:all` via the predev:all hook.
 * Prints the service map and validates critical env vars before servers start.
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT  = resolve(__dir, "..");

// ── ANSI helpers ─────────────────────────────────────────────────────────────
const C = {
  reset:  "\x1b[0m",
  bold:   "\x1b[1m",
  dim:    "\x1b[2m",
  green:  "\x1b[32m",
  yellow: "\x1b[33m",
  blue:   "\x1b[34m",
  cyan:   "\x1b[36m",
  red:    "\x1b[31m",
  white:  "\x1b[37m",
  bgBlue: "\x1b[44m",
};

const ok   = (msg) => `  ${C.green}✓${C.reset} ${msg}`;
const warn = (msg) => `  ${C.yellow}⚠${C.reset} ${msg}`;
const err  = (msg) => `  ${C.red}✗${C.reset} ${msg}`;

// ── Load .env files manually (no dotenv dependency) ──────────────────────────
function loadEnv(filePath) {
  if (!existsSync(filePath)) return {};
  const lines = readFileSync(filePath, "utf-8").split("\n");
  const result = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
    result[key] = val;
  }
  return result;
}

const rootEnv = loadEnv(resolve(ROOT, ".env"));
const ongEnv  = loadEnv(resolve(ROOT, "ONG", ".env"));

// ── Validation ────────────────────────────────────────────────────────────────
const issues = [];

// 1. Backend port
const apiPort = rootEnv["API_PORT"] ?? "8787";
if (apiPort !== "8787") {
  issues.push(`ROOT .env: API_PORT=${apiPort} — expected 8787`);
}

// 2. Root Supabase vars
if (!rootEnv["VITE_SUPABASE_URL"]) {
  issues.push("ROOT .env: VITE_SUPABASE_URL is missing");
}

// 3. ONG Supabase vars
if (!ongEnv["VITE_ONG_DB_SUPABASE_URL"] && !ongEnv["ONG_DB_SUPABASE_URL"]) {
  issues.push("ONG .env: ONG_DB_SUPABASE_URL / VITE_ONG_DB_SUPABASE_URL both missing");
}

// 4. Check root vite config has strictPort
const rootViteConfig = existsSync(resolve(ROOT, "vite.config.js"))
  ? readFileSync(resolve(ROOT, "vite.config.js"), "utf-8")
  : "";
const ongViteConfig = existsSync(resolve(ROOT, "ONG", "vite.config.ts"))
  ? readFileSync(resolve(ROOT, "ONG", "vite.config.ts"), "utf-8")
  : "";

const rootHasStrictPort = rootViteConfig.includes("strictPort: true");
const ongHasStrictPort  = ongViteConfig.includes("strictPort: true");

if (!rootHasStrictPort) issues.push("ROOT vite.config.js: strictPort: true is missing");
if (!ongHasStrictPort)  issues.push("ONG vite.config.ts: strictPort: true is missing");

// ── Print banner ──────────────────────────────────────────────────────────────
console.log("");
console.log(`${C.bold}${C.bgBlue}                                              ${C.reset}`);
console.log(`${C.bold}${C.bgBlue}   Democra · Dev Environment                  ${C.reset}`);
console.log(`${C.bold}${C.bgBlue}                                              ${C.reset}`);
console.log("");

console.log(`${C.bold}Services:${C.reset}`);
console.log(`  ${C.blue}◆${C.reset}  API  (Express)   ${C.cyan}http://localhost:8787${C.reset}  ${C.dim}server/index.js${C.reset}`);
console.log(`  ${C.yellow}◆${C.reset}  ADMIN (Legacy)   ${C.cyan}http://localhost:5173${C.reset}  ${C.dim}vite.config.js${C.reset}`);
console.log(`  ${C.green}◆${C.reset}  ONG   (React)    ${C.cyan}http://localhost:5174${C.reset}  ${C.dim}ONG/vite.config.ts${C.reset}`);
console.log(`  ${C.green}◆${C.reset}  ONG Login        ${C.cyan}http://localhost:5174/login${C.reset}`);
console.log("");

console.log(`${C.bold}Supabase:${C.reset}`);
const supaUrl = ongEnv["VITE_ONG_DB_SUPABASE_URL"] ?? ongEnv["ONG_DB_SUPABASE_URL"] ?? "(not found)";
const shortUrl = supaUrl.replace("https://", "").split(".")[0];
console.log(`  ${C.dim}Project ref:${C.reset} ${shortUrl}`);
console.log("");

console.log(`${C.bold}Config checks:${C.reset}`);
console.log(rootHasStrictPort ? ok("ROOT  strictPort: true") : warn("ROOT  strictPort missing — port may float"));
console.log(ongHasStrictPort  ? ok("ONG   strictPort: true") : warn("ONG   strictPort missing — port may float"));
console.log(rootEnv["VITE_SUPABASE_URL"] ? ok("ROOT  VITE_SUPABASE_URL set") : warn("ROOT  VITE_SUPABASE_URL missing"));
console.log((ongEnv["VITE_ONG_DB_SUPABASE_URL"] || ongEnv["ONG_DB_SUPABASE_URL"]) ? ok("ONG   Supabase URL set") : warn("ONG   Supabase URL missing"));
console.log(apiPort === "8787" ? ok(`API_PORT = ${apiPort}`) : warn(`API_PORT = ${apiPort} (expected 8787)`));
console.log("");

if (issues.length > 0) {
  console.log(`${C.yellow}${C.bold}Warnings (${issues.length}):${C.reset}`);
  for (const issue of issues) {
    console.log(warn(issue));
  }
  console.log("");
}

console.log(`${C.dim}Starting servers...${C.reset}`);
console.log(`${C.dim}─────────────────────────────────────────────${C.reset}`);
console.log("");
