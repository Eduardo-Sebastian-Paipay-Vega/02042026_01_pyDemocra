export interface RGBColor {
  r: number
  g: number
  b: number
  a: number
}

export const rgbToHex = ({ r, g, b }: RGBColor): string => {
  const h = (n: number) => Math.round(n).toString(16).padStart(2, '0')
  return `#${h(r)}${h(g)}${h(b)}`
}

export const hexToRgb = (hex: string): RGBColor | null => {
  const clean = hex.replace('#', '')
  if (!/^[0-9A-Fa-f]{6}$/.test(clean)) return null
  const n = parseInt(clean, 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: 1 }
}

export const getContrastText = ({ r, g, b }: RGBColor): string => {
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return lum > 0.5 ? '#0f172a' : '#ffffff'
}

export const rgbToCss = ({ r, g, b, a }: RGBColor): string =>
  `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${a})`

export const applyColorVars = (colors: Record<string, RGBColor>) => {
  const root = document.documentElement
  Object.entries(colors).forEach(([key, c]) => {
    root.style.setProperty(`--color-${key}`, rgbToCss(c))
    root.style.setProperty(`--color-${key}-rgb`, `${Math.round(c.r)}, ${Math.round(c.g)}, ${Math.round(c.b)}`)
    root.style.setProperty(`--color-${key}-text`, getContrastText(c))
  })
}
