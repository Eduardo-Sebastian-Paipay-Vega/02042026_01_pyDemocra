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

/* ─── Light tokens ───
 * Paleta humanizada para voluntariado (ONG_LIGHT_MODE_REDESIGN_REPORT.md):
 * azul suave (#4A7BA7) como primario, teal cálido como secundario, tierra
 * marrón como terciario, arena dorada como acento cálido. Sombras color
 * café suave (tinte de --t-text) en vez de negro. Es el tema por defecto.
 */
const lightTokens = {
  suave: {
    "--t-bg": "#F8F7F5",
    "--t-board": "#FBFAF8",
    "--t-surface": "#FFFFFF",
    "--t-elevated": "#F5F3F0",
    "--t-border": "#E9E3DB",
    "--t-border-strong": "#DCD3C8",
    "--t-text": "#1A1915",
    "--t-text-secondary": "#5C5752",
    "--t-text-tertiary": "#736D63",
    "--t-text-dim": "#8A8578",
    "--t-muted": "#8A8578",
    "--t-placeholder": "rgba(138,133,120,0.62)",
    "--t-primary": "#4A7BA7",
    "--t-primary-soft": "#E3EBF5",
    "--t-secondary": "#4D9B8F",
    "--t-secondary-soft": "#DFF0ED",
    "--t-tertiary": "#7B6B5C",
    "--t-accent-warm": "#D4A76A",
    "--t-ai-accent": "#D4A76A",
    "--t-success": "#5FB380",
    "--t-success-soft": "#E5F2EC",
    "--t-warning": "#E8A84F",
    "--t-warning-soft": "#FBF3E5",
    "--t-info": "#4A7BA7",
    "--t-info-soft": "#E3EBF5",
    "--t-danger": "#D97060",
    "--t-danger-soft": "#F8E9E5",
    "--t-error": "#D97060",
    "--t-error-soft": "#F8E9E5",
    "--t-hover": "#F3EEE8",
    "--t-active": "rgba(74,123,167,0.08)",
    "--t-input-bg": "#FFFFFF",
    "--t-sidebar": "#FFFFFF",
    "--t-topbar": "#FFFFFF",
    "--t-shadow": "0 1px 2px rgba(26,25,21,0.06)",
    "--t-shadow-lg": "0 6px 18px rgba(26,25,21,0.08)",
  },
  normal: {
    "--t-bg": "#F8F7F5",
    "--t-board": "#FBFAF8",
    "--t-surface": "#FFFFFF",
    "--t-elevated": "#F5F3F0",
    "--t-border": "#E4DDD5",
    "--t-border-strong": "#D6CCBF",
    "--t-text": "#1A1915",
    "--t-text-secondary": "#5C5752",
    "--t-text-tertiary": "#736D63",
    "--t-text-dim": "#8A8578",
    "--t-muted": "#8A8578",
    "--t-placeholder": "rgba(138,133,120,0.66)",
    "--t-primary": "#4A7BA7",
    "--t-primary-soft": "#E3EBF5",
    "--t-secondary": "#4D9B8F",
    "--t-secondary-soft": "#DFF0ED",
    "--t-tertiary": "#7B6B5C",
    "--t-accent-warm": "#D4A76A",
    "--t-ai-accent": "#D4A76A",
    "--t-success": "#5FB380",
    "--t-success-soft": "#E5F2EC",
    "--t-warning": "#E8A84F",
    "--t-warning-soft": "#FBF3E5",
    "--t-info": "#4A7BA7",
    "--t-info-soft": "#E3EBF5",
    "--t-danger": "#D97060",
    "--t-danger-soft": "#F8E9E5",
    "--t-error": "#D97060",
    "--t-error-soft": "#F8E9E5",
    "--t-hover": "#F0EBE5",
    "--t-active": "rgba(74,123,167,0.10)",
    "--t-input-bg": "#FFFFFF",
    "--t-sidebar": "#FFFFFF",
    "--t-topbar": "#FFFFFF",
    "--t-shadow": "0 1px 3px rgba(26,25,21,0.08)",
    "--t-shadow-lg": "0 8px 24px rgba(26,25,21,0.10)",
  },
  vibrante: {
    "--t-bg": "#F6F4F1",
    "--t-board": "#FBFAF8",
    "--t-surface": "#FFFFFF",
    "--t-elevated": "#F2EFEA",
    "--t-border": "#DDD3C6",
    "--t-border-strong": "#CBBEAE",
    "--t-text": "#151410",
    "--t-text-secondary": "#544F49",
    "--t-text-tertiary": "#6C665B",
    "--t-text-dim": "#847E70",
    "--t-muted": "#847E70",
    "--t-placeholder": "rgba(132,126,112,0.70)",
    "--t-primary": "#3D6D99",
    "--t-primary-soft": "#DCE6F1",
    "--t-secondary": "#3F8A7E",
    "--t-secondary-soft": "#D6EDE8",
    "--t-tertiary": "#6C5C4E",
    "--t-accent-warm": "#C99652",
    "--t-ai-accent": "#C99652",
    "--t-success": "#4EA271",
    "--t-success-soft": "#DCEEE4",
    "--t-warning": "#D89639",
    "--t-warning-soft": "#F8EBD8",
    "--t-info": "#3D6D99",
    "--t-info-soft": "#DCE6F1",
    "--t-danger": "#C85F4E",
    "--t-danger-soft": "#F3DFD9",
    "--t-error": "#C85F4E",
    "--t-error-soft": "#F3DFD9",
    "--t-hover": "#ECE5DC",
    "--t-active": "rgba(61,109,153,0.14)",
    "--t-input-bg": "#FFFFFF",
    "--t-sidebar": "#FFFFFF",
    "--t-topbar": "#FFFFFF",
    "--t-shadow": "0 1px 3px rgba(21,20,16,0.10)",
    "--t-shadow-lg": "0 10px 28px rgba(21,20,16,0.13)",
  },
};

function getTokens(theme: Theme, intensity: Intensity) {
  return theme === "oscuro" ? darkTokens[intensity] : lightTokens[intensity];
}

/* ─── Context ─── */
const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    try { return (localStorage.getItem("app-theme") as Theme) || "claro"; }
    catch { return "claro"; }
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
