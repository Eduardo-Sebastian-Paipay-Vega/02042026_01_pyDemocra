import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

/**
 * SPA fallback: serve index.html for any client-side route so React Router
 * can handle it. Skips static assets (has an extension) and the /app sub-app
 * path (served by the ONG Vite instance on port 5174 in dev).
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

    // Skip the ONG sub-app path (served by Vite on port 5174 in dev)
    const isOngApp = pathname === "/app" || pathname.startsWith("/app/");

    if (!isViteInternal && !isAsset && !isOngApp) {
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
      "@": resolve(__dirname, "src"),
    },
  },
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
      },
    },
  },
});
