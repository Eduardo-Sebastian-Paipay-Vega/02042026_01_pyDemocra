/**
 * clean-cache.mjs
 * Elimina la caché de Vite de todos los frontends antes de arrancar.
 * Nunca lanza error si los directorios no existen.
 *
 * Run: node scripts/clean-cache.mjs
 */

import { rmSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT  = resolve(__dir, "..");

const GREEN = "\x1b[32m";
const DIM   = "\x1b[2m";
const BOLD  = "\x1b[1m";
const RESET = "\x1b[0m";

const TARGETS = [
  { label: "Root  Vite cache", path: resolve(ROOT, "node_modules", ".vite") },
  { label: "ONG   Vite cache", path: resolve(ROOT, "ONG", "node_modules", ".vite") },
  { label: "Root  dist/",      path: resolve(ROOT, "dist") },
  { label: "ONG   dist/",      path: resolve(ROOT, "ONG", "dist") },
];

console.log(`\n${BOLD}Limpiando caché y builds previos...${RESET}`);

for (const { label, path } of TARGETS) {
  if (existsSync(path)) {
    rmSync(path, { recursive: true, force: true });
    console.log(`  ${GREEN}✓${RESET} ${label.padEnd(22)} eliminado`);
  } else {
    console.log(`  ${DIM}○${RESET} ${label.padEnd(22)} ${DIM}no existe — OK${RESET}`);
  }
}

console.log("");
