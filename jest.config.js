// jest.config.js se carga como ESM (package.json tiene "type": "module"),
// Jest soporta esto vía import() dinámico — no requiere renombrar a .mjs.
export default {
  testEnvironment: "node",
  // Alcance: solo server/ (API Express). ONG/ y src/ (frontend Vite/React)
  // tienen su propio tooling de build/test — no se escanean aquí para no
  // mezclar configuraciones ni ralentizar la corrida con archivos ajenos.
  roots: ["<rootDir>/server"],
  setupFiles: ["<rootDir>/jest.setup.js"],
  collectCoverage: true,
  collectCoverageFrom: [
    "server/**/*.js",
    // supabase.js es un wrapper delgado sobre @supabase/supabase-js, siempre
    // mockeado en los tests (ver jest.mock en cada *.test.js) — su cobertura
    // real mediría "el mock devuelve lo que le dije", no lógica propia.
    "!server/supabase.js",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "text-summary", "lcov"],
};
