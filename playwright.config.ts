import { defineConfig, devices } from "@playwright/test";
import { config as loadEnv } from "dotenv";

// Variables propias de E2E, separadas de .env (que trae secretos de Supabase
// server-side que Playwright no necesita). Ver .env.e2e.example.
loadEnv({ path: ".env.e2e", quiet: true });

const PORT = 5173;
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : undefined,
  reporter: [["html", { open: "never" }], ["list"]],

  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],

  // Levanta solo el frontend (Vite). El login llama a Supabase directo desde
  // el navegador (src/app/LoginGateway.tsx), no pasa por server/index.js, así
  // que no hace falta levantar la API para los flujos cubiertos hoy.
  webServer: {
    command: "npm run dev:web",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
