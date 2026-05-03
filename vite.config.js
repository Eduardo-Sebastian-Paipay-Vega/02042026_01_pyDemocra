import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

function integratedAppFallback() {
  const rewrite = (req, _res, next) => {
    if (req.method !== "GET") {
      next();
      return;
    }

    const rawUrl = String(req.url || "");
    const pathname = rawUrl.split("?")[0];
    const isIntegratedAppPath =
      pathname === "/app" ||
      pathname === "/app/" ||
      (pathname.startsWith("/app/") && !pathname.endsWith(".html") && !pathname.includes("."));

    if (isIntegratedAppPath) {
      req.url = "/app/index.html";
    }

    next();
  };

  return {
    name: "integrated-app-fallback",
    configureServer(server) {
      server.middlewares.use(rewrite);
    },
    configurePreviewServer(server) {
      server.middlewares.use(rewrite);
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), integratedAppFallback()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  server: {
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
        studio: resolve(__dirname, "studio.html"),
        nosotros: resolve(__dirname, "nosotros.html"),
        login: resolve(__dirname, "login.html"),
        registro: resolve(__dirname, "registro.html"),
        register: resolve(__dirname, "register.html"),
        onboarding: resolve(__dirname, "onboarding.html"),
        otpChallenge: resolve(__dirname, "otp-challenge.html"),
        terminalLogin: resolve(__dirname, "terminal-login.html"),
        app: resolve(__dirname, "app/index.html"),
      },
    },
  },
});
