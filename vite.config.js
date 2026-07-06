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
 * hace el equivalente en producción. Ver también ONG/src/app/routes.tsx
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
    req.url = isOngPath ? "/ONG/index.html" : "/index.html";

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
      "@ong": resolve(__dirname, "ONG/src"),
    },
  },
  // Requerido por el módulo ONG: imports "raw" de SVG/CSV.
  // No añadir .css/.tsx/.ts a esta lista.
  assetsInclude: ["**/*.svg", "**/*.csv"],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
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
        ong: resolve(__dirname, "ONG/index.html"),
      },
    },
  },
});
