import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

/**
 * MPA nativa: dos apps bajo un mismo dominio.
 *   /       -> index.html      (landing/admin, src/*)
 *   /ong/*  -> ONG/index.html  (módulo ONG, ONG/src/*)
 *
 * El folder físico se llama "ONG" (mayúsculas) pero la URL pública es
 * "/ong" (minúsculas). Este middleware hace ese mapeo en dev; vercel.json
 * hace el equivalente en producción. Ver también ong/src/app/routes.tsx
 * (ROUTER_BASENAME) — debe coincidir con el "/ong" de aquí y de vercel.json.
 */
function spaFallback() {
  const rewrite = (req, _res, next) => {
    if (req.method !== "GET") {
      next();
      return;
    }

    const pathname = String(req.url || "").split("?")[0];

    // Skip Vite internals: /@vite/client, /@react-refresh, /__vite_ping, etc.
    const isViteInternal =
      pathname.startsWith("/@") ||
      pathname.startsWith("/__") ||
      pathname.startsWith("/node_modules");

    // Skip static assets (URL contains a file extension)
    const isAsset = pathname.includes(".") && !pathname.endsWith("/");

    if (isViteInternal || isAsset) {
      next();
      return;
    }

    const isOngPath = pathname === "/ong" || pathname.startsWith("/ong/");
    const isEducPath = pathname === "/educ" || pathname.startsWith("/educ/");
    
    if (isOngPath) {
      req.url = "/ong/index.html";
    } else if (isEducPath) {
      req.url = "/educ/index.html";
    } else {
      req.url = "/index.html";
    }

    next();
  };

  return {
    name: "spa-fallback",
    configureServer(server) {
      server.middlewares.use(rewrite);
    },
    configurePreviewServer(server) {
      server.middlewares.use(rewrite);
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), spaFallback()],
  resolve: {
    alias: {
      // Namespaced por módulo para que "@" no se pise entre src/ y ONG/src/
      // (ninguno de los dos usa hoy el alias "@", pero si empiezan a usarlo
      // conviene que cada módulo resuelva contra su propia carpeta).
      "@": resolve(__dirname, "src"),
      "@ong": resolve(__dirname, "ong/src"),
      "@educ": resolve(__dirname, "educ/src"),
    },
  },
  // Requerido por el módulo ONG: imports "raw" de SVG/CSV.
  // No añadir .css/.tsx/.ts a esta lista.
  assetsInclude: ["**/*.svg", "**/*.csv"],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      "/api/educacion": {
        target: "http://localhost:8788",
        changeOrigin: true,
      },
      "/api": {
        target: "http://localhost:8787",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: resolve(__dirname, "index.html"),
        ong: resolve(__dirname, "ong/index.html"),
        educ: resolve(__dirname, "educ/index.html"),
      },
      output: {
        // Agrupa dependencias pesadas de terceros en chunks propios,
        // separados del código de cada página (que ya se divide solo via
        // React.lazy() en ong/src/app/routes.tsx). Beneficio real: estos
        // vendor chunks se descargan una vez y quedan cacheados por el
        // navegador — no se vuelven a pedir en cada navegación entre
        // páginas, y se comparten entre "/" y "/ong" al ser el mismo origen.
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return undefined;
          }
          if (id.includes("@supabase")) {
            return "vendor-supabase";
          }
          if (id.includes("lucide-react")) {
            return "vendor-icons";
          }
          if (id.includes("@mui") || id.includes("@emotion") || id.includes("@popperjs")) {
            return "vendor-mui";
          }
          if (id.includes("@radix-ui")) {
            return "vendor-radix";
          }
          if (id.includes("recharts") || id.includes("d3-")) {
            return "vendor-charts";
          }
          if (id.includes("node_modules/motion") || id.includes("node_modules/framer-motion")) {
            return "vendor-motion";
          }
          if (id.includes("react-router")) {
            return "vendor-router";
          }
          // react/react-dom/scheduler se dejan en el bucket genérico "vendor"
          // a propósito: separarlos en su propio chunk generaba una
          // dependencia circular vendor <-> vendor-react (Rollup lo resuelve
          // pero no es ideal). Casi todo depende de react igual, así que
          // agruparlo con el resto no pierde nada práctico.
          return "vendor";
        },
      },
    },
  },
  test: {
    pool: "threads",
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
    include: ["src/**/*.test.{ts,tsx}", "ong/src/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      // Directorio propio: Jest ya usa "coverage/" para server/, si Vitest
      // escribiera ahí también se pisarían los reportes entre sí.
      reportsDirectory: "coverage-web",
    },
  },
});
