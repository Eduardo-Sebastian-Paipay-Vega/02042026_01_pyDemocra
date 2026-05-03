import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

/* ─── Types ─── */
export type Theme = "claro" | "oscuro";
export type Intensity = "suave" | "normal" | "vibrante";

interface ThemeContextValue {
  theme: Theme;
  intensity: Intensity;
  setTheme: (t: Theme) => void;
  setIntensity: (i: Intensity) => void;
  toggleTheme: () => void;
  vars: Record<string, string>;
}

/* ─── Token Sets ─── */
const darkTokens = {
  suave: {
    "--t-bg": "#060608",
    "--t-board": "rgba(10,11,13,0.84)",
    "--t-surface": "rgba(18,20,24,0.78)",
    "--t-elevated": "rgba(26,28,33,0.92)",
    "--t-border": "rgba(255,255,255,0.07)",
    "--t-border-strong": "rgba(255,255,255,0.12)",
    "--t-text": "#F5F7FA",
    "--t-text-secondary": "rgba(226,231,238,0.80)",
    "--t-text-tertiary": "rgba(200,207,218,0.64)",
    "--t-text-dim": "rgba(183,191,204,0.50)",
    "--t-muted": "#BEC5D2",
    "--t-placeholder": "rgba(183,191,204,0.56)",
    "--t-danger": "#F87171",
    "--t-danger-soft": "rgba(248,113,113,0.14)",
    "--t-hover": "rgba(255,255,255,0.04)",
    "--t-active": "rgba(117,69,226,0.16)",
    "--t-input-bg": "rgba(255,255,255,0.055)",
    "--t-sidebar": "rgba(8,9,12,0.96)",
    "--t-topbar": "rgba(10,11,14,0.78)",
    "--t-glow-purple": "0.022",
    "--t-glow-orange": "0.016",
    "--t-shadow": "0 18px 48px rgba(0,0,0,0.28)",
    "--t-shadow-lg": "0 34px 96px rgba(0,0,0,0.56)",
  },
  normal: {
    "--t-bg": "#060608",
    "--t-board": "rgba(10,11,13,0.88)",
    "--t-surface": "rgba(19,21,25,0.82)",
    "--t-elevated": "rgba(26,28,33,0.94)",
    "--t-border": "rgba(255,255,255,0.08)",
    "--t-border-strong": "rgba(255,255,255,0.14)",
    "--t-text": "#F5F7FA",
    "--t-text-secondary": "rgba(226,231,238,0.84)",
    "--t-text-tertiary": "rgba(205,211,222,0.68)",
    "--t-text-dim": "rgba(184,191,204,0.54)",
    "--t-muted": "#C2C8D5",
    "--t-placeholder": "rgba(184,191,204,0.60)",
    "--t-danger": "#F87171",
    "--t-danger-soft": "rgba(248,113,113,0.16)",
    "--t-hover": "rgba(255,255,255,0.05)",
    "--t-active": "rgba(117,69,226,0.18)",
    "--t-input-bg": "rgba(255,255,255,0.065)",
    "--t-sidebar": "rgba(8,9,12,0.96)",
    "--t-topbar": "rgba(10,11,14,0.82)",
    "--t-glow-purple": "0.028",
    "--t-glow-orange": "0.02",
    "--t-shadow": "0 18px 52px rgba(0,0,0,0.32)",
    "--t-shadow-lg": "0 36px 110px rgba(0,0,0,0.58)",
  },
  vibrante: {
    "--t-bg": "#060608",
    "--t-board": "rgba(10,11,14,0.90)",
    "--t-surface": "rgba(20,22,27,0.86)",
    "--t-elevated": "rgba(28,30,36,0.96)",
    "--t-border": "rgba(255,255,255,0.10)",
    "--t-border-strong": "rgba(255,255,255,0.16)",
    "--t-text": "#F7F8FC",
    "--t-text-secondary": "rgba(232,236,243,0.86)",
    "--t-text-tertiary": "rgba(209,215,225,0.72)",
    "--t-text-dim": "rgba(188,196,209,0.58)",
    "--t-muted": "#CBD1DE",
    "--t-placeholder": "rgba(188,196,209,0.64)",
    "--t-danger": "#FB7185",
    "--t-danger-soft": "rgba(251,113,133,0.16)",
    "--t-hover": "rgba(255,255,255,0.06)",
    "--t-active": "rgba(117,69,226,0.22)",
    "--t-input-bg": "rgba(255,255,255,0.08)",
    "--t-sidebar": "rgba(8,9,12,0.97)",
    "--t-topbar": "rgba(10,11,14,0.86)",
    "--t-glow-purple": "0.038",
    "--t-glow-orange": "0.028",
    "--t-shadow": "0 20px 58px rgba(0,0,0,0.34)",
    "--t-shadow-lg": "0 42px 120px rgba(0,0,0,0.62)",
  },
};

const lightTokens = {
  suave: {
    "--t-bg": "#F7F7F8",
    "--t-board": "rgba(255,255,255,0.78)",
    "--t-surface": "rgba(255,255,255,0.86)",
    "--t-elevated": "rgba(255,255,255,0.94)",
    "--t-border": "rgba(0,0,0,0.05)",
    "--t-border-strong": "rgba(0,0,0,0.10)",
    "--t-text": "#111113",
    "--t-text-secondary": "rgba(66,70,82,0.80)",
    "--t-text-tertiary": "rgba(92,98,112,0.68)",
    "--t-text-dim": "rgba(108,114,128,0.54)",
    "--t-muted": "#5A5E69",
    "--t-placeholder": "rgba(108,114,128,0.58)",
    "--t-danger": "#DC2626",
    "--t-danger-soft": "rgba(220,38,38,0.08)",
    "--t-hover": "rgba(0,0,0,0.02)",
    "--t-active": "rgba(0,0,0,0.04)",
    "--t-input-bg": "rgba(0,0,0,0.03)",
    "--t-sidebar": "rgba(245,245,246,0.95)",
    "--t-topbar": "rgba(247,247,248,0.82)",
    "--t-glow-purple": "0.02",
    "--t-glow-orange": "0.014",
    "--t-shadow": "0 16px 36px rgba(15,23,42,0.07)",
    "--t-shadow-lg": "0 28px 68px rgba(15,23,42,0.10)",
  },
  normal: {
    "--t-bg": "#F7F7F8",
    "--t-board": "rgba(255,255,255,0.82)",
    "--t-surface": "rgba(255,255,255,0.90)",
    "--t-elevated": "rgba(255,255,255,0.97)",
    "--t-border": "rgba(0,0,0,0.06)",
    "--t-border-strong": "rgba(0,0,0,0.12)",
    "--t-text": "#111113",
    "--t-text-secondary": "rgba(64,68,80,0.82)",
    "--t-text-tertiary": "rgba(90,96,110,0.72)",
    "--t-text-dim": "rgba(106,112,126,0.58)",
    "--t-muted": "#595D69",
    "--t-placeholder": "rgba(106,112,126,0.60)",
    "--t-danger": "#DC2626",
    "--t-danger-soft": "rgba(220,38,38,0.09)",
    "--t-hover": "rgba(0,0,0,0.025)",
    "--t-active": "rgba(0,0,0,0.05)",
    "--t-input-bg": "rgba(0,0,0,0.035)",
    "--t-sidebar": "rgba(245,245,246,0.95)",
    "--t-topbar": "rgba(247,247,248,0.85)",
    "--t-glow-purple": "0.026",
    "--t-glow-orange": "0.018",
    "--t-shadow": "0 18px 40px rgba(15,23,42,0.08)",
    "--t-shadow-lg": "0 32px 76px rgba(15,23,42,0.12)",
  },
  vibrante: {
    "--t-bg": "#F7F7F8",
    "--t-board": "rgba(255,255,255,0.86)",
    "--t-surface": "rgba(255,255,255,0.94)",
    "--t-elevated": "rgba(255,255,255,0.99)",
    "--t-border": "rgba(0,0,0,0.08)",
    "--t-border-strong": "rgba(0,0,0,0.16)",
    "--t-text": "#111113",
    "--t-text-secondary": "rgba(58,62,74,0.84)",
    "--t-text-tertiary": "rgba(86,92,106,0.74)",
    "--t-text-dim": "rgba(103,109,123,0.60)",
    "--t-muted": "#585C68",
    "--t-placeholder": "rgba(103,109,123,0.62)",
    "--t-danger": "#DC2626",
    "--t-danger-soft": "rgba(220,38,38,0.10)",
    "--t-hover": "rgba(0,0,0,0.03)",
    "--t-active": "rgba(0,0,0,0.06)",
    "--t-input-bg": "rgba(0,0,0,0.04)",
    "--t-sidebar": "rgba(245,245,246,0.95)",
    "--t-topbar": "rgba(247,247,248,0.88)",
    "--t-glow-purple": "0.034",
    "--t-glow-orange": "0.024",
    "--t-shadow": "0 20px 44px rgba(15,23,42,0.10)",
    "--t-shadow-lg": "0 36px 84px rgba(15,23,42,0.14)",
  },
};

function getTokens(theme: Theme, intensity: Intensity) {
  return theme === "oscuro" ? darkTokens[intensity] : lightTokens[intensity];
}

/* ─── Context ─── */
const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    try { return (localStorage.getItem("app-theme") as Theme) || "oscuro"; }
    catch { return "oscuro"; }
  });
  const [intensity, setIntensityState] = useState<Intensity>(() => {
    try { return (localStorage.getItem("app-intensity") as Intensity) || "normal"; }
    catch { return "normal"; }
  });

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    try { localStorage.setItem("app-theme", t); } catch {}
  }, []);

  const setIntensity = useCallback((i: Intensity) => {
    setIntensityState(i);
    try { localStorage.setItem("app-intensity", i); } catch {}
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "oscuro" ? "claro" : "oscuro");
  }, [theme, setTheme]);

  const vars = getTokens(theme, intensity);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const root = document.documentElement;
    root.dataset.appTheme = theme;
    root.dataset.appIntensity = intensity;
    root.classList.toggle("dark", theme === "oscuro");
    root.style.colorScheme = theme === "oscuro" ? "dark" : "light";

    Object.entries(vars).forEach(([token, value]) => {
      root.style.setProperty(token, value);
    });
  }, [intensity, theme, vars]);

  return (
    <ThemeContext.Provider value={{ theme, intensity, setTheme, setIntensity, toggleTheme, vars }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be inside ThemeProvider");
  return ctx;
}
