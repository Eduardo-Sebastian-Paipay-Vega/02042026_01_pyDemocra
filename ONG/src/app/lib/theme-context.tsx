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

/* ─── Token Sets ───
 * Paleta alineada a LOOK_AND_FEEL_ONG.md: azul de marca (#002EFE) como
 * primario/acción/foco, cian (#00D1FF) reservado a funciones asistidas por
 * IA, semántica completa (éxito/advertencia/error/info) y neutros cálidos
 * (no fríos absolutos). Fondo oscuro profundo pero nunca negro absoluto.
 */
const darkTokens = {
  suave: {
    "--t-bg": "#100E0C",
    "--t-board": "rgba(16,14,12,0.84)",
    "--t-surface": "rgba(24,21,18,0.78)",
    "--t-elevated": "rgba(32,28,24,0.92)",
    "--t-border": "rgba(255,250,240,0.07)",
    "--t-border-strong": "rgba(255,250,240,0.12)",
    "--t-text": "#F7F5F1",
    "--t-text-secondary": "rgba(232,227,218,0.80)",
    "--t-text-tertiary": "rgba(210,203,192,0.64)",
    "--t-text-dim": "rgba(188,181,170,0.50)",
    "--t-muted": "#C7C0B4",
    "--t-placeholder": "rgba(188,181,170,0.56)",
    "--t-primary": "#3D6BFF",
    "--t-primary-soft": "rgba(61,107,255,0.16)",
    "--t-secondary": "#3C6491",
    "--t-tertiary": "#2DBFB0",
    "--t-accent-warm": "#C99552",
    "--t-ai-accent": "#00D1FF",
    "--t-success": "#34D399",
    "--t-success-soft": "rgba(52,211,153,0.16)",
    "--t-warning": "#FBBF24",
    "--t-warning-soft": "rgba(251,191,36,0.16)",
    "--t-info": "#7FA8FF",
    "--t-info-soft": "rgba(127,168,255,0.16)",
    "--t-danger": "#F87171",
    "--t-danger-soft": "rgba(248,113,113,0.14)",
    "--t-hover": "rgba(255,250,240,0.04)",
    "--t-active": "rgba(61,107,255,0.16)",
    "--t-input-bg": "rgba(255,250,240,0.055)",
    "--t-sidebar": "rgba(14,12,10,0.96)",
    "--t-topbar": "rgba(16,14,11,0.78)",
    "--t-shadow": "0 18px 48px rgba(0,0,0,0.28)",
    "--t-shadow-lg": "0 34px 96px rgba(0,0,0,0.56)",
  },
  normal: {
    "--t-bg": "#100E0C",
    "--t-board": "rgba(16,14,12,0.88)",
    "--t-surface": "rgba(24,21,18,0.82)",
    "--t-elevated": "rgba(32,28,24,0.94)",
    "--t-border": "rgba(255,250,240,0.08)",
    "--t-border-strong": "rgba(255,250,240,0.14)",
    "--t-text": "#F7F5F1",
    "--t-text-secondary": "rgba(232,227,218,0.84)",
    "--t-text-tertiary": "rgba(210,203,192,0.68)",
    "--t-text-dim": "rgba(188,181,170,0.54)",
    "--t-muted": "#C7C0B4",
    "--t-placeholder": "rgba(188,181,170,0.60)",
    "--t-primary": "#3D6BFF",
    "--t-primary-soft": "rgba(61,107,255,0.18)",
    "--t-secondary": "#3C6491",
    "--t-tertiary": "#2DBFB0",
    "--t-accent-warm": "#C99552",
    "--t-ai-accent": "#00D1FF",
    "--t-success": "#34D399",
    "--t-success-soft": "rgba(52,211,153,0.18)",
    "--t-warning": "#FBBF24",
    "--t-warning-soft": "rgba(251,191,36,0.18)",
    "--t-info": "#7FA8FF",
    "--t-info-soft": "rgba(127,168,255,0.18)",
    "--t-danger": "#F87171",
    "--t-danger-soft": "rgba(248,113,113,0.16)",
    "--t-hover": "rgba(255,250,240,0.05)",
    "--t-active": "rgba(61,107,255,0.18)",
    "--t-input-bg": "rgba(255,250,240,0.065)",
    "--t-sidebar": "rgba(14,12,10,0.96)",
    "--t-topbar": "rgba(16,14,11,0.82)",
    "--t-shadow": "0 18px 52px rgba(0,0,0,0.32)",
    "--t-shadow-lg": "0 36px 110px rgba(0,0,0,0.58)",
  },
  vibrante: {
    "--t-bg": "#100E0C",
    "--t-board": "rgba(16,14,12,0.90)",
    "--t-surface": "rgba(25,22,19,0.86)",
    "--t-elevated": "rgba(33,29,25,0.96)",
    "--t-border": "rgba(255,250,240,0.10)",
    "--t-border-strong": "rgba(255,250,240,0.16)",
    "--t-text": "#F9F7F3",
    "--t-text-secondary": "rgba(236,231,222,0.86)",
    "--t-text-tertiary": "rgba(214,207,196,0.72)",
    "--t-text-dim": "rgba(192,185,174,0.58)",
    "--t-muted": "#CDC6BA",
    "--t-placeholder": "rgba(192,185,174,0.64)",
    "--t-primary": "#5C82FF",
    "--t-primary-soft": "rgba(92,130,255,0.22)",
    "--t-secondary": "#43699A",
    "--t-tertiary": "#35CABB",
    "--t-accent-warm": "#D3A15E",
    "--t-ai-accent": "#22D8FF",
    "--t-success": "#4ADE9E",
    "--t-success-soft": "rgba(74,222,158,0.20)",
    "--t-warning": "#FCC94E",
    "--t-warning-soft": "rgba(252,201,78,0.20)",
    "--t-info": "#8FB4FF",
    "--t-info-soft": "rgba(143,180,255,0.20)",
    "--t-danger": "#FB7185",
    "--t-danger-soft": "rgba(251,113,133,0.16)",
    "--t-hover": "rgba(255,250,240,0.06)",
    "--t-active": "rgba(92,130,255,0.22)",
    "--t-input-bg": "rgba(255,250,240,0.08)",
    "--t-sidebar": "rgba(14,12,10,0.97)",
    "--t-topbar": "rgba(16,14,11,0.86)",
    "--t-shadow": "0 20px 58px rgba(0,0,0,0.34)",
    "--t-shadow-lg": "0 42px 120px rgba(0,0,0,0.62)",
  },
};

const lightTokens = {
  suave: {
    "--t-bg": "#F8F6F2",
    "--t-board": "rgba(255,255,255,0.78)",
    "--t-surface": "rgba(255,255,255,0.86)",
    "--t-elevated": "rgba(255,255,255,0.94)",
    "--t-border": "rgba(20,15,5,0.05)",
    "--t-border-strong": "rgba(20,15,5,0.10)",
    "--t-text": "#18140F",
    "--t-text-secondary": "rgba(74,68,60,0.80)",
    "--t-text-tertiary": "rgba(100,94,84,0.68)",
    "--t-text-dim": "rgba(114,108,98,0.54)",
    "--t-muted": "#635D53",
    "--t-placeholder": "rgba(114,108,98,0.58)",
    "--t-primary": "#002EFE",
    "--t-primary-soft": "rgba(0,46,254,0.06)",
    "--t-secondary": "#1E3A5F",
    "--t-tertiary": "#0F9B8E",
    "--t-accent-warm": "#D9A566",
    "--t-ai-accent": "#00A9D6",
    "--t-success": "#10B981",
    "--t-success-soft": "rgba(16,185,129,0.10)",
    "--t-warning": "#B45309",
    "--t-warning-soft": "rgba(245,158,11,0.12)",
    "--t-info": "#3D67D6",
    "--t-info-soft": "rgba(61,103,214,0.08)",
    "--t-danger": "#DC2626",
    "--t-danger-soft": "rgba(220,38,38,0.08)",
    "--t-hover": "rgba(20,15,5,0.02)",
    "--t-active": "rgba(0,46,254,0.05)",
    "--t-input-bg": "rgba(20,15,5,0.03)",
    "--t-sidebar": "rgba(247,245,240,0.95)",
    "--t-topbar": "rgba(248,246,241,0.82)",
    "--t-shadow": "0 16px 36px rgba(15,23,42,0.07)",
    "--t-shadow-lg": "0 28px 68px rgba(15,23,42,0.10)",
  },
  normal: {
    "--t-bg": "#F8F6F2",
    "--t-board": "rgba(255,255,255,0.82)",
    "--t-surface": "rgba(255,255,255,0.90)",
    "--t-elevated": "rgba(255,255,255,0.97)",
    "--t-border": "rgba(20,15,5,0.06)",
    "--t-border-strong": "rgba(20,15,5,0.12)",
    "--t-text": "#18140F",
    "--t-text-secondary": "rgba(74,68,60,0.82)",
    "--t-text-tertiary": "rgba(100,94,84,0.72)",
    "--t-text-dim": "rgba(114,108,98,0.58)",
    "--t-muted": "#635D53",
    "--t-placeholder": "rgba(114,108,98,0.60)",
    "--t-primary": "#002EFE",
    "--t-primary-soft": "rgba(0,46,254,0.07)",
    "--t-secondary": "#1E3A5F",
    "--t-tertiary": "#0F9B8E",
    "--t-accent-warm": "#D9A566",
    "--t-ai-accent": "#00A9D6",
    "--t-success": "#10B981",
    "--t-success-soft": "rgba(16,185,129,0.11)",
    "--t-warning": "#B45309",
    "--t-warning-soft": "rgba(245,158,11,0.13)",
    "--t-info": "#3D67D6",
    "--t-info-soft": "rgba(61,103,214,0.09)",
    "--t-danger": "#DC2626",
    "--t-danger-soft": "rgba(220,38,38,0.09)",
    "--t-hover": "rgba(20,15,5,0.025)",
    "--t-active": "rgba(0,46,254,0.06)",
    "--t-input-bg": "rgba(20,15,5,0.035)",
    "--t-sidebar": "rgba(247,245,240,0.95)",
    "--t-topbar": "rgba(248,246,241,0.85)",
    "--t-shadow": "0 18px 40px rgba(15,23,42,0.08)",
    "--t-shadow-lg": "0 32px 76px rgba(15,23,42,0.12)",
  },
  vibrante: {
    "--t-bg": "#F8F6F2",
    "--t-board": "rgba(255,255,255,0.86)",
    "--t-surface": "rgba(255,255,255,0.94)",
    "--t-elevated": "rgba(255,255,255,0.99)",
    "--t-border": "rgba(20,15,5,0.08)",
    "--t-border-strong": "rgba(20,15,5,0.16)",
    "--t-text": "#18140F",
    "--t-text-secondary": "rgba(68,62,54,0.84)",
    "--t-text-tertiary": "rgba(96,90,80,0.74)",
    "--t-text-dim": "rgba(111,105,95,0.60)",
    "--t-muted": "#5E584E",
    "--t-placeholder": "rgba(111,105,95,0.62)",
    "--t-primary": "#0026E0",
    "--t-primary-soft": "rgba(0,38,224,0.08)",
    "--t-secondary": "#1B3557",
    "--t-tertiary": "#0D8C80",
    "--t-accent-warm": "#DA9F52",
    "--t-ai-accent": "#009EC7",
    "--t-success": "#0EA371",
    "--t-success-soft": "rgba(14,163,113,0.12)",
    "--t-warning": "#9A4508",
    "--t-warning-soft": "rgba(245,158,11,0.14)",
    "--t-info": "#3459C4",
    "--t-info-soft": "rgba(52,89,196,0.10)",
    "--t-danger": "#C81E1E",
    "--t-danger-soft": "rgba(220,38,38,0.10)",
    "--t-hover": "rgba(20,15,5,0.03)",
    "--t-active": "rgba(0,38,224,0.07)",
    "--t-input-bg": "rgba(20,15,5,0.04)",
    "--t-sidebar": "rgba(247,245,240,0.95)",
    "--t-topbar": "rgba(248,246,241,0.88)",
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
