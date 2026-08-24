import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '@educ/lib/supabase'
import i18n from '../lib/i18n'
import { format as dateFnsFormat } from 'date-fns'
import { es, enUS, ptBR } from 'date-fns/locale'

export type Theme    = 'dark' | 'light' | 'system'
export type Density  = 'compact' | 'normal' | 'comfy'
export type FontSize = '12' | '13' | '14' | '15'

export interface AppSettings {
  theme:          Theme
  density:        Density
  fontSize:       FontSize
  animaciones:    boolean
  sidebarPinned:  boolean
  language:       string
  timezone:       string
  date_format:    string
  initial_view:   string
  tenant_settings: Record<string, any>
  integrations:   Record<string, boolean>
}

interface SettingsCtx extends AppSettings {
  saveSettings: (s: Partial<AppSettings>) => Promise<void>
  previewSettings: (s: Partial<AppSettings>) => void
  refreshSettings: () => Promise<void>
  formatDate: (date: Date | string | number) => string
}

const DEFAULT: AppSettings = {
  theme:         'dark',
  density:       'normal',
  fontSize:      '14',
  animaciones:   true,
  sidebarPinned: true,
  language:      'es',
  timezone:      'America/Lima',
  date_format:   'dmy',
  initial_view:  'dashboard',
  tenant_settings: {},
  integrations: { google: true, slack: false, zoom: true, whatsapp: false, sap: false }
}

const Ctx = createContext<SettingsCtx>({
  ...DEFAULT,
  saveSettings: async () => {},
  previewSettings: () => {},
  refreshSettings: async () => {},
  formatDate: () => ''
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
  const resolved = resolveTheme(s.theme)
  root.setAttribute('data-theme', resolved)
  root.classList.toggle('dark', resolved === 'dark')
  Object.entries(DENSITY_VARS[s.density]).forEach(([k, v]) => root.style.setProperty(k, v))
  root.setAttribute('data-density', s.density)
  body.style.fontSize = `${s.fontSize}px`
  root.classList.toggle('no-animations', !s.animaciones)
  localStorage.setItem('sidebar-pinned', String(s.sidebarPinned))
  
  if (i18n.language !== s.language) {
    i18n.changeLanguage(s.language)
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT)

  const refreshSettings = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data, error } = await supabase.from('profiles').select('preferences').eq('id', session.user.id).single()
      if (!error && data && data.preferences) {
        const p = data.preferences
        const g = p.generalSettings || {}
        setSettings(prev => ({ 
          ...prev, 
          theme: p.theme || prev.theme,
          density: p.density || prev.density,
          fontSize: p.fontSize || prev.fontSize,
          animaciones: p.animaciones ?? prev.animaciones,
          sidebarPinned: p.sidebarPinned ?? prev.sidebarPinned,
          language: g.language || prev.language,
          timezone: g.timezone || prev.timezone,
          date_format: g.date_format || prev.date_format,
          initial_view: g.initial_view || prev.initial_view,
          tenant_settings: p.tenant_settings || prev.tenant_settings,
          integrations: p.integrations || prev.integrations
        }))
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
    const handler = () => {
      const resolved = resolveTheme('system')
      document.documentElement.setAttribute('data-theme', resolved)
      document.documentElement.classList.toggle('dark', resolved === 'dark')
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [settings.theme])

  const previewSettings = (s: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...s }))
  }

  const saveSettings = async (s: Partial<AppSettings>) => {
    const newSettings = { ...settings, ...s }
    setSettings(newSettings)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { data: currentProfile } = await supabase.from('profiles').select('preferences').eq('id', session.user.id).single()
        const currentPrefs = currentProfile?.preferences || {}
        
        await supabase.from('profiles').update({
          preferences: {
            ...currentPrefs,
            theme: newSettings.theme,
            density: newSettings.density,
            fontSize: newSettings.fontSize,
            animaciones: newSettings.animaciones,
            sidebarPinned: newSettings.sidebarPinned,
            generalSettings: {
              ...(currentPrefs.generalSettings || {}),
              language: newSettings.language,
              timezone: newSettings.timezone,
              date_format: newSettings.date_format,
              initial_view: newSettings.initial_view
            },
            tenant_settings: {
              ...(currentPrefs.tenant_settings || {}),
              ...newSettings.tenant_settings
            },
            integrations: newSettings.integrations
          }
        }).eq('id', session.user.id)
      }
    } catch (err) {
      console.error('Error saving settings', err)
    }
  }

  const formatDate = (date: Date | string | number) => {
    try {
      const d = new Date(date)
      // Usamos el locale ptBR si el idioma es portugués.
      // date-fns no tiene quechua nativo, así que para quechua ('qu') usamos el default español ('es')
      const locale = settings.language === 'en' ? enUS : settings.language === 'pt' ? ptBR : es
      const fmtStr = settings.date_format === 'ymd' ? 'yyyy-MM-dd' :
                     settings.date_format === 'mdy' ? 'MM/dd/yyyy' : 'dd/MM/yyyy'
      return dateFnsFormat(d, fmtStr, { locale })
    } catch {
      return ''
    }
  }

  return (
    <Ctx.Provider value={{
      ...settings,
      saveSettings,
      previewSettings,
      refreshSettings,
      formatDate
    }}>
      {children}
    </Ctx.Provider>
  )
}
