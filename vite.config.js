import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
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
      },
    },
  },
});
