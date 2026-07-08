import "@testing-library/jest-dom/vitest";
import { vi, beforeAll, afterAll } from "vitest";

// Mock de matchMedia (requerido por Radix UI, re-charts, etc. en JSDOM)
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// ResizeObserver mock
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// PointerEvent mock
if (typeof window !== "undefined") {
  // @ts-ignore
  window.PointerEvent = class PointerEvent extends Event {};
}

// ─── Silenciar ruido de React/jsdom durante tests ────────────────────────────
// React en modo desarrollo + jsdom imprimen stack traces cuando un Error Boundary
// captura una excepción. Estos mensajes van tanto por console.error como por
// process.stderr directamente, así que interceptamos ambos canales.
// Los errores reales de tu código siguen siendo visibles.
const NOISE_PATTERNS = [
  /The above error occurred in the/,
  /React will try to recreate this component/,
  /Consider adding an error boundary/,
  /act\(\.\.\.\)/,
  /Warning: An update to/,
  /at mountIndeterminateComponent/,
  /at beginWork/,
  /at HTMLUnknownElement\.callCallback/,
  /at HTMLUnknownElement\.callTheUserObjects/,
  /at innerInvokeEventListeners/,
  /at performUnitOfWork/,
  /at workLoopSync/,
  /at renderRootSync/,
  /react-dom\.development\.js/,
  /node_modules[/\\]jsdom[/\\]/,
  /node_modules[/\\]react-dom[/\\]/,
  /ExperimentalWarning: localStorage is not available/,
  /--localstorage-file was not provided/,
  /Use `node --trace-warnings/,
  /Use `node\.EXE --trace-warnings/,
];

function isSuppressed(message: string): boolean {
  return NOISE_PATTERNS.some((p) => p.test(message));
}

let originalConsoleError: typeof console.error;
let originalConsoleWarn: typeof console.warn;
let originalStderrWrite: typeof process.stderr.write;

beforeAll(() => {
  // Intercept console.error
  originalConsoleError = console.error;
  console.error = (...args: unknown[]) => {
    if (!isSuppressed(args.map(String).join(" "))) {
      originalConsoleError(...args);
    }
  };

  // Intercept console.warn
  originalConsoleWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    if (!isSuppressed(args.map(String).join(" "))) {
      originalConsoleWarn(...args);
    }
  };

  // Intercept process.stderr (where jsdom/react-dom write stack traces directly)
  originalStderrWrite = process.stderr.write.bind(process.stderr);
  process.stderr.write = (chunk: any, ...rest: any[]) => {
    const message = typeof chunk === "string" ? chunk : chunk.toString();
    if (isSuppressed(message)) return true;
    return originalStderrWrite(chunk, ...rest);
  };
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  process.stderr.write = originalStderrWrite;
});
