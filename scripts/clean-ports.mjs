/**
 * clean-ports.mjs
 * Frees ports 8787, 5173, 5174 before launching dev servers.
 * No dependencies — usa Node.js built-ins + comandos nativos del SO.
 * Nunca lanza error: si un puerto ya está libre, simplemente continúa.
 *
 * Run:  node scripts/clean-ports.mjs
 */

import { execSync } from "node:child_process";
import { platform } from "node:os";

const PORTS   = [8787, 5173, 5174];
const IS_WIN  = platform() === "win32";

// ── ANSI helpers ──────────────────────────────────────────────────────────────
const GREEN  = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED    = "\x1b[31m";
const DIM    = "\x1b[2m";
const RESET  = "\x1b[0m";
const BOLD   = "\x1b[1m";

// ── Windows: obtiene PIDs que escuchan en un puerto ───────────────────────────
function getPidsWindows(port) {
  try {
    const output = execSync("netstat -ano", { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] });
    const pids = new Set();

    for (const line of output.split("\n")) {
      const parts = line.trim().split(/\s+/);
      // netstat cols: Proto  Local  Foreign  State  PID
      if (parts.length < 5) continue;
      const localAddr = parts[1];
      const state     = parts[3];
      const pid       = parts[4];

      // Extrae el puerto del extremo local (IPv4 y IPv6)
      const colonIdx  = localAddr.lastIndexOf(":");
      const addrPort  = colonIdx !== -1 ? localAddr.slice(colonIdx + 1) : "";

      if (addrPort === String(port) && state === "LISTENING" && /^\d+$/.test(pid) && pid !== "0") {
        pids.add(pid);
      }
    }

    return [...pids];
  } catch {
    return [];
  }
}

// ── Unix/Mac: obtiene PIDs con lsof ───────────────────────────────────────────
function getPidsUnix(port) {
  try {
    const output = execSync(`lsof -ti tcp:${port}`, {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
    return output ? output.split("\n").filter(Boolean) : [];
  } catch {
    return [];
  }
}

// ── Mata un PID ───────────────────────────────────────────────────────────────
function killPid(pid) {
  try {
    if (IS_WIN) {
      execSync(`taskkill /PID ${pid} /F`, { stdio: "pipe" });
    } else {
      execSync(`kill -9 ${pid}`, { stdio: "pipe" });
    }
    return true;
  } catch {
    return false; // El proceso ya desapareció entre el netstat y el kill — ignorar
  }
}

// ── Limpia un puerto ──────────────────────────────────────────────────────────
function cleanPort(port) {
  const pids = IS_WIN ? getPidsWindows(port) : getPidsUnix(port);

  if (pids.length === 0) {
    console.log(`  ${DIM}○${RESET} Puerto ${BOLD}${port}${RESET} ${DIM}ya libre${RESET}`);
    return;
  }

  for (const pid of pids) {
    const killed = killPid(pid);
    if (killed) {
      console.log(`  ${GREEN}✓${RESET} Puerto ${BOLD}${port}${RESET} liberado ${DIM}(PID ${pid} terminado)${RESET}`);
    } else {
      console.log(`  ${YELLOW}⚠${RESET} Puerto ${BOLD}${port}${RESET} ${DIM}PID ${pid} ya no existe — OK${RESET}`);
    }
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
console.log(`\n${BOLD}Limpiando puertos...${RESET}`);

for (const port of PORTS) {
  cleanPort(port);
}

console.log("");
