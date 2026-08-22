import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '@educ/lib/supabase'

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
  saveSettings: (s: AppSettings) => Promise<void>
  refreshSettings: () => Promise<void>
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
  saveSettings: async () => {},
  refreshSettings: async () => {}
})

export function useSettings() { return useContext(Ctx) }

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
  root.setAttribute('data-theme', resolveTheme(s.theme))
  Object.entries(DENSITY_VARS[s.density]).forEach(([k, v]) => root.style.setProperty(k, v))
  root.setAttribute('data-density', s.density)
  body.style.fontSize = `${s.fontSize}px`
  root.classList.toggle('no-animations', !s.animaciones)
  localStorage.setItem('sidebar-pinned', String(s.sidebarPinned))
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT)

  const refreshSettings = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8787'}/api/core/profile/preferences`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      })
      if (res.ok) {
        const data = await res.json()
        if (data.preferences && data.preferences.theme) {
          setSettings(prev => ({ ...prev, ...data.preferences }))
        }
      }
    } catch (err) {
      console.error('Error fetching settings', err)
    }
  }

  useEffect(() => {
    refreshSettings()
  }, [])

  useEffect(() => { applyAll(settings) }, [settings])

  useEffect(() => {
    if (settings.theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => document.documentElement.setAttribute('data-theme', resolveTheme('system'))
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [settings.theme])

  const saveSettings = async (s: AppSettings) => {
    setSettings(s)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8787'}/api/core/profile/preferences`, {
          method: 'POST',
          headers: { 
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ preferences: s })
        })
      }
    } catch (err) {
      console.error('Error saving settings', err)
    }
  }

  return (
    <Ctx.Provider value={{ ...settings, saveSettings, refreshSettings }}>
      {children}
    </Ctx.Provider>
  )
}
