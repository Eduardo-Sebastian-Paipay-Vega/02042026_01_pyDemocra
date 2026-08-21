import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type Theme    = 'dark' | 'light' | 'system'
export type Density  = 'compact' | 'normal' | 'comfy'
export type FontSize = '12' | '13' | '14' | '15'

export interface AppSettings {
  theme:          Theme
  density:        Density
  fontSize:       FontSize
  animaciones:    boolean
  sidebarPinned:  boolean
}

interface SettingsCtx extends AppSettings {
  saveSettings: (s: AppSettings) => void
}

const DEFAULT: AppSettings = {
  theme:         'dark',
  density:       'normal',
  fontSize:      '14',
  animaciones:   true,
  sidebarPinned: true,
}

const Ctx = createContext<SettingsCtx>({
  ...DEFAULT,
  saveSettings: () => {},
})

export function useSettings() { return useContext(Ctx) }

// ── Apply helpers ──────────────────────────────────────────────

const DENSITY_VARS: Record<Density, Record<string, string>> = {
  compact: { '--page-p': '14px', '--topbar-h': '44px', '--nav-py': '5px',  '--card-p': '16px 18px', '--row-py': '8px',  '--gap-md': '12px' },
  normal:  { '--page-p': '24px', '--topbar-h': '52px', '--nav-py': '7px',  '--card-p': '24px 28px', '--row-py': '11px', '--gap-md': '16px' },
  comfy:   { '--page-p': '34px', '--topbar-h': '62px', '--nav-py': '10px', '--card-p': '32px 36px', '--row-py': '15px', '--gap-md': '22px' },
}

function resolveTheme(theme: Theme): 'dark' | 'light' {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return theme
}

function applyAll(s: AppSettings) {
  const root = document.documentElement
  const body = document.body

  // Theme
  root.setAttribute('data-theme', resolveTheme(s.theme))

  // Density
  Object.entries(DENSITY_VARS[s.density]).forEach(([k, v]) => root.style.setProperty(k, v))
  root.setAttribute('data-density', s.density)

  // Font size
  body.style.fontSize = `${s.fontSize}px`

  // Animations
  root.classList.toggle('no-animations', !s.animaciones)

  // Sidebar pin — persisted separately (App reads from localStorage)
  localStorage.setItem('sidebar-pinned', String(s.sidebarPinned))
}

function load(): AppSettings {
  try {
    const raw = localStorage.getItem('app-settings')
    if (raw) return { ...DEFAULT, ...JSON.parse(raw) }
  } catch {}
  return DEFAULT
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(load)

  // Apply on mount and whenever settings change
  useEffect(() => { applyAll(settings) }, [settings])

  // Re-apply theme when OS preference changes (for system mode)
  useEffect(() => {
    if (settings.theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => document.documentElement.setAttribute('data-theme', resolveTheme('system'))
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [settings.theme])

  const saveSettings = (s: AppSettings) => {
    setSettings(s)
    localStorage.setItem('app-settings', JSON.stringify(s))
  }

  return (
    <Ctx.Provider value={{ ...settings, saveSettings }}>
      {children}
    </Ctx.Provider>
  )
}
