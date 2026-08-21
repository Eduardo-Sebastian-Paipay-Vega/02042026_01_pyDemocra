---
name: ui-ux-pro
description: Professional UI/UX design enforcement for EDUCACION OS. Use this skill whenever creating or modifying any interface, dashboard, component, page, landing, admin panel, or SaaS screen. Ensures visual hierarchy, spacing, typography, contrast, accessibility, and design consistency. Always executes FIRST before any other frontend skill.
---

# UI/UX Pro — EDUCACION OS

> **Prioridad: 1 (MÁXIMA).** Esta skill debe activarse PRIMERO en cualquier tarea de Frontend. Piensa como diseñador senior antes de escribir una sola línea de código.

---

## 📐 1. Jerarquía Visual Obligatoria

Cada pantalla debe tener una jerarquía tipográfica clara y deliberada:

- **H1 (una sola por pantalla):** Título principal — tamaño mayor, peso `font-bold` o `font-extrabold`.
- **H2:** Sección — tamaño medio, peso `font-semibold`.
- **H3:** Subsección o card title — tamaño base, peso `font-medium`.
- **Body:** Texto de contenido — tamaño base o `text-sm`, peso `font-normal`.
- **Caption/Label:** Etiquetas, metadatos — `text-xs`, `text-muted-foreground`.

**Regla:** Máximo 3 tamaños de fuente diferentes por pantalla. Nunca más.

---

## 🎨 2. Sistema de Color Obligatorio

**Nunca usar colores arbitrarios.** Usar siempre los tokens del Design System:

```
primary    → Acción principal, CTAs, links activos
secondary  → Acciones secundarias
destructive → Error, eliminar, advertencia crítica
muted      → Texto secundario, placeholders, deshabilitados
accent     → Hover states, highlights sutiles
background → Fondo de página
foreground → Texto principal
border     → Bordes de tarjetas, inputs, separadores
```

Aplicar opacidades (`/10`, `/20`, `/50`) para superficies, hover states y overlays.

---

## 📏 3. Espaciado: Ritmo Visual Consistente

- **Sistema base:** Múltiplos de 4px (4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96).
- **Padding de cards:** `p-4` (mobile) → `p-6` (tablet) → `p-8` (desktop).
- **Gap entre elementos:** `gap-4` (relacionados) → `gap-6` (grupos) → `gap-8` (secciones).
- **Margen entre secciones:** `mb-8` o `mb-12` o `space-y-8`.
- **Nunca usar valores mágicos** como `mt-[13px]` o `p-[7px]` salvo casos muy específicos.

---

## 🔤 4. Tipografía

```
Font stack recomendado: Inter, Geist Sans, o Outfit (Google Fonts)
Siempre importar desde next/font o con link rel=preconnect
```

- Línea base de legibilidad: `leading-relaxed` para párrafos largos.
- Para números/datos: `tabular-nums` para evitar jitter en dashboards.
- Máximo 80 caracteres por línea en bloques de texto largo.

---

## 👁️ 5. Contraste y Accesibilidad Visual

- Contraste mínimo **WCAG AA:** 4.5:1 texto normal, 3:1 texto grande.
- Nunca texto gris claro sobre fondo blanco (ej. `text-gray-300` sobre `bg-white`).
- Indicadores de estado no deben depender únicamente del color (agregar ícono + texto).
- Focus ring siempre visible: `focus-visible:ring-2 focus-visible:ring-primary`.

---

## 🎭 6. Estados de UI Obligatorios

Para **cada elemento interactivo**, implementar TODOS los estados:

| Estado | Cómo implementarlo |
|--------|-------------------|
| **Default** | Estilo base |
| **Hover** | `hover:` — cambio sutil de color/sombra |
| **Focus** | `focus-visible:ring-2` — nunca quitar outline |
| **Active / Pressed** | `active:scale-95` o cambio de color |
| **Disabled** | `disabled:opacity-50 disabled:cursor-not-allowed` |
| **Loading** | Spinner o Skeleton — nunca pantalla en blanco |
| **Empty State** | Ilustración + mensaje + CTA |
| **Error State** | Icono de error + mensaje claro + acción a tomar |
| **Success State** | Confirmación visual (checkmark + mensaje) |

---

## 🌑 7. Dark Mode

- Todo componente debe funcionar en dark mode usando clases `dark:`.
- Usar variables CSS de Tailwind (`bg-background`, `text-foreground`) en lugar de colores hardcodeados.
- Probar siempre ambos modos antes de considerar la tarea terminada.

---

## 🪄 8. Microinteracciones

- Transiciones en hover/focus: `transition-colors duration-200`.
- Entrada de modales/drawers: `animate-in fade-in-0 zoom-in-95 duration-200`.
- Salida: `animate-out fade-out-0 zoom-out-95 duration-200`.
- Skeletons: usar `animate-pulse` para estados de carga.
- Nunca animaciones lentas (> 400ms) en interacciones de usuario.

---

## ✅ Checklist Pre-entrega UI/UX

Antes de considerar terminada cualquier interfaz, verificar:
- [ ] Jerarquía visual clara (H1 → H2 → body → caption)
- [ ] Sistema de color del Design System (sin colores arbitrarios)
- [ ] Espaciado en múltiplos de 4px
- [ ] Todos los estados de UI implementados (loading, empty, error, success)
- [ ] Dark mode funcional
- [ ] Contraste WCAG AA
- [ ] Transiciones suaves (200-300ms)
- [ ] La pantalla "parece diseñada en Figma"
