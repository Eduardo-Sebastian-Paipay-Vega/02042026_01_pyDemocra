/**
 * validate-env.mjs
 * Run: node scripts/validate-env.mjs
 *
 * Checks that both dev servers are healthy and ports are not in conflict.
 * Run this after `npm run dev` (root) and `cd ONG && npm run dev` are both started.
 */

const CHECKS = [
  // ── LEGACY (root, port 5173) ─────────────────────────────────────────────
  { label: "Legacy index.html",       url: "http://localhost:5173/",                expect: 200 },
  { label: "Legacy login.html",       url: "http://localhost:5173/login.html",       expect: 200 },
  { label: "Legacy register.html",    url: "http://localhost:5173/register.html",    expect: 200 },
  { label: "Legacy onboarding.html",  url: "http://localhost:5173/onboarding.html",  expect: 200 },

  // ── ONG React SPA (port 5174) ────────────────────────────────────────────
  { label: "ONG app root",            url: "http://localhost:5174/",                expect: 200 },
  { label: "ONG /login route",        url: "http://localhost:5174/login",            expect: 200 },
  { label: "ONG /app/ong path",       url: "http://localhost:5174/app/ong",          expect: 200 },

  // ── Express API (port 8787) ──────────────────────────────────────────────
  { label: "API health",              url: "http://localhost:8787/api/health",       expect: [200, 404] },
];

const GREEN  = "\x1b[32m";
const RED    = "\x1b[31m";
const YELLOW = "\x1b[33m";
const RESET  = "\x1b[0m";
const BOLD   = "\x1b[1m";

async function checkUrl({ label, url, expect }) {
  const expectedCodes = Array.isArray(expect) ? expect : [expect];
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    const ok = expectedCodes.includes(res.status);
    const status = `${res.status}`;
    if (ok) {
      console.log(`  ${GREEN}✓${RESET} ${label.padEnd(30)} ${GREEN}${status}${RESET}  ${url}`);
    } else {
      console.log(`  ${RED}✗${RESET} ${label.padEnd(30)} ${RED}${status} (expected ${expectedCodes.join("|")})${RESET}  ${url}`);
    }
    return ok;
  } catch (err) {
    const reason = err.name === "TimeoutError" ? "TIMEOUT" : "CONNECTION REFUSED";
    console.log(`  ${RED}✗${RESET} ${label.padEnd(30)} ${RED}${reason}${RESET}  ${url}`);
    return false;
  }
}

async function checkPortConflict() {
  const ports = [5173, 5174, 8787];
  console.log(`\n${BOLD}Port isolation check:${RESET}`);
  const responses = await Promise.all(
    ports.map(async (port) => {
      try {
        const res = await fetch(`http://localhost:${port}/`, { signal: AbortSignal.timeout(2000) });
        return { port, status: res.status, alive: true };
      } catch {
        return { port, alive: false };
      }
    })
  );

  const alive = responses.filter((r) => r.alive);
  if (alive.length === 0) {
    console.log(`  ${YELLOW}⚠${RESET}  No servers detected. Start them first.`);
    return;
  }

  // Detect if ONG app leaked onto port 5173 or vice versa
  for (const r of alive) {
    console.log(`  Port ${r.port}: ${r.alive ? `${GREEN}active${RESET}` : `${YELLOW}offline${RESET}`}`);
  }

  const ports5173and5174 = alive.filter((r) => r.port === 5173 || r.port === 5174);
  if (ports5173and5174.length === 2) {
    console.log(`  ${GREEN}✓${RESET} Ports 5173 and 5174 are isolated — no conflict.`);
  }
}

async function main() {
  console.log(`\n${BOLD}╔══════════════════════════════════════════════╗${RESET}`);
  console.log(`${BOLD}║  Democra Dev Environment Validator           ║${RESET}`);
  console.log(`${BOLD}╚══════════════════════════════════════════════╝${RESET}\n`);

  await checkPortConflict();

  console.log(`\n${BOLD}Endpoint checks:${RESET}`);
  const results = await Promise.all(CHECKS.map(checkUrl));
  const passed = results.filter(Boolean).length;
  const total  = results.length;

  console.log(`\n${BOLD}Result: ${passed === total ? GREEN : RED}${passed}/${total} checks passed${RESET}`);

  if (passed < total) {
    console.log(`\n${YELLOW}Tip: make sure both servers are running:${RESET}`);
    console.log("  Terminal 1 (root legacy):  npm run dev");
    console.log("  Terminal 2 (ONG modern):   cd ONG && npm run dev\n");
    process.exit(1);
  } else {
    console.log(`\n${GREEN}All systems nominal. Happy coding!${RESET}\n`);
  }
}

main();
