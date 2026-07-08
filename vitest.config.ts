/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

/**
 * Configuración dedicada de Vitest para el panel de Testing de VS Code.
 * La extensión `vitest.explorer` requiere este archivo independiente
 * (no detecta el bloque `test:{}` embebido en vite.config.js).
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      "@ong": resolve(__dirname, "ong/src"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: [
      "src/**/*.test.{ts,tsx}",
      "ong/src/**/*.test.{ts,tsx}",
    ],
    // Pasa --no-warnings a cada worker fork para que Node.js v22+ no imprima
    // "ExperimentalWarning: localStorage is not available" antes de que
    // el setup file pueda interceptarlo.
    pool: "forks",
    poolOptions: {
      forks: {
        execArgv: ["--no-warnings"],
      },
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.{ts,tsx}", "ong/src/**/*.{ts,tsx}"],
      exclude: [
        "**/*.test.{ts,tsx}",
        "**/*.d.ts",
        "**/node_modules/**",
        "**/dist/**",
      ],
    },
  },
});
