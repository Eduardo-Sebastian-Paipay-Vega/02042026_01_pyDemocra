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
    server: {
      deps: {
        inline: [
          "@exodus/bytes",
          "html-encoding-sniffer",
          "jsdom",
          "data-urls",
          "whatwg-url",
          "whatwg-mimetype"
        ],
      },
    },
    globals: true,
    environment: "happy-dom",
    setupFiles: ["./vitest.setup.ts"],
    include: [
      "src/**/*.test.{ts,tsx}",
      "ong/src/**/*.test.{ts,tsx}",
    ],
    // Pasa --no-warnings a cada worker fork para que Node.js v22+ no imprima
    // "ExperimentalWarning: localStorage is not available" antes de que
    // el setup file pueda interceptarlo.
    pool: "forks",
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      // Directorio propio: Jest ya usa "coverage/" para server/, si Vitest
      // escribiera ahí también se pisarían los reportes entre sí.
      reportsDirectory: "coverage-web",
      include: [
        "ong/src/app/modules/people/hooks/useIdCardDetail.ts",
        "ong/src/app/modules/people/hooks/useIdCardTemplateDetail.ts",
        "ong/src/app/modules/operation/hooks/useAprobacionDetail.ts",
        "ong/src/app/modules/resources/hooks/useKardex.ts",
        "ong/src/app/services/shared/storage.ts",
        "ong/src/app/modules/resources/hooks/useReportesFinancieros.ts",
        "ong/src/app/modules/operation/hooks/useHoraDetail.ts",
      ],
      exclude: [
        "**/*.test.{ts,tsx}",
        "**/*.d.ts",
      ],
    },
    // Forzar sourcemaps para V8
    css: false,
  },
});
