# democra.pro · EduOS Platform — Design System

> **Regla fundamental:** Este documento es la fuente de verdad para todo cambio visual en el proyecto. Antes de modificar cualquier componente, leer y respetar estas especificaciones. Ningún cambio de UI debe contradecir estas reglas sin actualizar primero este documento y justificar el cambio.

---

## 1. Identidad de Marca

### Producto
- **Nombre comercial:** democra.pro
- **Sub-producto:** EduOS Platform
- **Versión actual:** v2.0

### Logotipos disponibles (en `/src/imports/`)

| Archivo | Descripción | Uso recomendado |
|---|---|---|
| `d-core-neon.png` | Monograma "D" doble con gradiente azul/oscuro, fondo opaco | Sidebar, footer, elementos pequeños |
| `mono-core.png` | Monograma "D" blanco sobre fondo transparente | Login header, sobre fondos oscuros |
| `d-core-monogram.png` | Monograma "D" blanco sobre fondo negro | Favicon, íconos de app |
| `core-vector.png` | Monograma "D" negro sobre fondo transparente | Contextos claros (tema light, futuro) |
| `democra-pro-identity.png` | Logo completo con wordmark horizontal | Documentos, presentaciones |

### Reglas de uso de logos
- **Nunca deformar ni reescalar con distorsión de aspecto.** Siempre `object-fit: contain`.
- **Nunca recrear el logo como SVG o CSS art.** Importar siempre como módulo ES (`import logo from '@/imports/...'`).
- **No poner rutas de string en `src`.** Vite procesa los assets en build; una ruta literal rompe en producción.
- El favicon usa `d-core-monogram.png` (negro sobre negro, legible como ícono de pestaña).
- En el sidebar se usa `d-core-neon.png` a 26×26px con `border-radius: 6px`.
- En el login se usa `mono-core.png` a 52×52px sin borde ni fondo adicional.

### Wordmark en código
```tsx
// Forma correcta de escribir el wordmark en JSX:
<span>democra<span style={{ color: 'var(--blue)' }}>.pro</span></span>
// Sub-label siempre en uppercase con letter-spacing
<span style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: 10 }}>EduOS Platform</span>
```

---

## 2. Paleta de Color

### Tema actual: Dark (único activo — Light y Sistema están en roadmap)

Todos los valores están definidos en `src/index.css` bajo `:root`. **Nunca usar hex directamente en componentes; siempre variables CSS.**

### Superficies (de más oscura a más clara)

| Token | Valor | Uso |
|---|---|---|
| `--bg` | `#0C0B0A` | Fondo de página principal |
| `--s1` | `#111010` | Sidebar, Navbar, superficies de chrome |
| `--s2` | `#161513` | Cards principales (`.card`) |
| `--s3` | `#1D1B19` | Cards interiores (`.card-inner`), inputs, fondos de filas |
| `--s4` | `#252320` | Hover de nav-items, progress track, elementos terciarios |

> **Regla de jerarquía:** Cada nivel de profundidad usa una superficie más clara. Nunca mezclar superficies fuera de orden (e.g., no poner `--s4` como fondo de una card que contiene un elemento `--s2`).

### Login específico (valores propios, no compartidos con el resto del app)

| Propósito | Valor |
|---|---|
| Body background | `#090909` |
| Card background | `#111110` |
| Input background | `#181817` |
| Ambient glow | `radial-gradient(ellipse, rgba(37,99,235,0.055) 0%, transparent 70%)` |

### Bordes

| Token | Valor | Uso |
|---|---|---|
| `--border` | `rgba(255,255,255,0.07)` | Bordes por defecto, hairlines |
| `--border-md` | `rgba(255,255,255,0.11)` | Bordes en hover, elementos más prominentes |

> **Regla:** Los bordes deben organizar, no dominar. Nunca usar bordes de más de 1px salvo en estados de error o focus muy específicos.

### Texto

| Token | Valor | Uso |
|---|---|---|
| `--tx` | `rgba(255,255,255,0.92)` | Texto principal, headings, valores activos |
| `--tx-2` | `rgba(255,255,255,0.55)` | Texto secundario, labels, descripciones |
| `--tx-3` | `rgba(255,255,255,0.32)` | Texto terciario, placeholders, metadatos |

### Colores semánticos

| Token | Hex | Dim (bg de badges) | Uso |
|---|---|---|---|
| `--blue` | `#3B82F6` | `rgba(59,130,246,0.12)` | Acción primaria, selección, DEMI |
| `--green` | `#22C55E` | `rgba(34,197,94,0.12)` | Éxito, activo, saludable |
| `--amber` | `#F59E0B` | `rgba(245,158,11,0.12)` | Advertencia, pendiente, alerta |
| `--red` | `#EF4444` | `rgba(239,68,68,0.12)` | Error, crítico, peligro |
| `--purple` | `#8B5CF6` | `rgba(139,92,246,0.12)` | Tier Enterprise, módulos premium |

> **Regla de acento:** El azul institucional (`--blue`) es el único color de acción interactiva. No introducir nuevos colores de acción sin modificar el design system. El morado está reservado exclusivamente para el tier Enterprise.

---

## 3. Tipografía

### Fuente única: Inter

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

body {
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}
```

> **Regla:** No introducir otras fuentes sin actualizar este documento. Inter es la única fuente del proyecto.

### Escala tipográfica

| Elemento | Tamaño | Peso | Letter-spacing | Uso |
|---|---|---|---|---|
| `h1` | 22px | 600 | -0.3px | Títulos de página |
| `h2` | 18px | 600 | -0.2px | Títulos de sección |
| `h3` | 15px | 600 | — | Subtítulos de bloque |
| Body | 14px | 400 | — | Texto principal del app |
| Small | 13px | 400/500 | — | Labels, contenido de cards |
| XSmall | 12px | 500 | — | Labels de formulario, badges |
| Micro | 11px | 500/600 | 0.06em | Table headers (uppercase), metadata |
| Nano | 10px | 500/600 | 0.08–0.14em | Sub-labels, timestamps |

### Login (escala propia)

| Elemento | Tamaño | Peso | Notas |
|---|---|---|---|
| Wordmark "democra.pro" | 24px | 800 | Letter-spacing -0.6px |
| Sub-label "EDUOS PLATFORM" | 10px | 600 | Uppercase, letter-spacing 0.14em |
| Título "Iniciar sesión" | 26px | 700 | Letter-spacing -0.4px |
| Subtítulo semestre | 13px | 400 | Color `--tx-2` |
| Labels de campo | 13px | 500 | Color `rgba(255,255,255,0.55)` |

---

## 4. Espaciado

### Sistema base: múltiplos de 4px

```
4 / 8 / 12 / 16 / 20 / 24 / 28 / 32 / 36 / 40 / 48px
```

> **Regla:** Nunca usar valores arbitrarios fuera de esta escala. Si necesitas un valor intermedio, redondear al múltiplo de 4 más cercano.

### Variables de layout (afectadas por densidad)

| Token | Normal | Compacta | Cómoda | Descripción |
|---|---|---|---|---|
| `--page-p` | 24px | 14px | 34px | Padding de páginas |
| `--topbar-h` | 52px | 44px | 62px | Altura del topbar |
| `--nav-py` | 7px | 5px | 10px | Padding vertical nav-items |
| `--card-p` | 24px 28px | 16px 18px | 32px 36px | Padding interior de cards |
| `--row-py` | 11px | 8px | 15px | Padding vertical de filas de tabla |
| `--gap-md` | 16px | 12px | 22px | Gap medio entre elementos |

### Layout principal

| Token | Valor | Descripción |
|---|---|---|
| `--sidebar-w` | 220px (expandido) / 52px (colapsado) | Ancho del sidebar |
| `--radius` | 6px | Radio base de esquinas |
| `--radius-lg` | 8px / 14px (login card) | Radio de cards |
| `--transition` | 150ms ease | Duración base de transiciones |

---

## 5. Componentes Base

### Botones

| Clase | Descripción | Altura | Uso |
|---|---|---|---|
| `.btn.btn-primary` | Azul sólido, texto blanco | 34px | Acción principal de formularios |
| `.btn.btn-secondary` | Surface `--s3`, borde `--border` | 34px | Acciones secundarias |
| `.btn.btn-ghost` | Transparente, texto `--tx-2` | 34px | Acciones terciarias, toolbar |
| `.btn.btn-danger` | Red-dim background, texto rojo | 34px | Acciones destructivas |
| `.btn.btn-sm` | Variante pequeña | 28px | Acciones en tablas, inline |

> **Regla:** Nunca crear un botón sin usar una de estas clases base. Los botones del login son la excepción (tienen estilos propios para mayor control visual, altura 46–48px).

### Cards

```css
.card       { background: var(--s2); border: 1px solid var(--border); border-radius: var(--radius-lg); }
.card-inner { background: var(--s3); border: 1px solid var(--border); border-radius: var(--radius); }
```

> **Regla de anidación:** `.card-inner` siempre va dentro de `.card`. Nunca anidar `.card` dentro de `.card`.

### Badges

```css
/* Variantes disponibles: */
.badge-green   /* estado OK, activo, completado */
.badge-amber   /* advertencia, pendiente */
.badge-red     /* error, crítico */
.badge-blue    /* informativo, seleccionado */
.badge-muted   /* neutral, desactivado */
.badge-purple  /* Enterprise tier exclusivamente */
```

Tamaño estándar: `font-size: 11px`, `padding: 2px 7px`, `border-radius: 4px`.

### Dots de estado

```css
.dot.dot-green / .dot-amber / .dot-red / .dot-blue / .dot-muted
/* Dimensiones: 6×6px, border-radius: 50% */
```

### Tablas

- Header: `font-size: 11px`, `font-weight: 600`, color `--tx-3`, `text-transform: uppercase`, `letter-spacing: 0.06em`
- Celda: `padding: var(--row-py) 16px`, color `--tx-2`
- Hover row: background `--s3`, color `--tx`
- Siempre usar clase `.table` en el elemento `<table>`

### Inputs / Formularios

- Fondo: `var(--s3)`
- Border: `1px solid var(--border)` en reposo, `var(--blue)` en focus
- Border-radius: `var(--radius)`
- Altura efectiva: `padding: 7px 11px` (≈32px) en vistas internas; 46px en login
- Placeholder color: `var(--tx-3)`
- Nunca usar `outline` visible; el border coloreado es el indicador de focus

### Nav-items (sidebar)

```css
.nav-item          { padding: var(--nav-py) 12px; font-size: 13px; color: var(--tx-2); }
.nav-item:hover    { background: var(--s3); color: var(--tx); }
.nav-item.active   { background: var(--s4); color: var(--tx); font-weight: 500; }
```

**DEMI item (excepción):** tiene fondo `rgba(37,99,235,0.08)`, borde `rgba(37,99,235,0.2)`, color `var(--blue)`. Es el único nav-item con estilo de acento permanente.

---

## 6. Layout de la Aplicación

```
┌──────────────────────────────────────────────────────────┐
│  SIDEBAR (220px / 52px colapsado)                        │
│  ┌────────────────────────────────────────────────────┐  │
│  │ Logo row (--topbar-h)                              │  │
│  │ Nav items (scrollable)                             │  │
│  │ Footer: user + logout                              │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  MAIN (flex: 1)                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │ NAVBAR (--topbar-h) — breadcrumb / search / icons  │  │
│  │ CONTENT (flex: 1, overflow-y: auto)                │  │
│  │   padding: var(--page-p)                           │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

- El sidebar tiene `transition: width 200ms ease` al colapsar.
- El contenido principal nunca tiene scroll horizontal.
- El topbar tiene `z-index: 10` para quedar sobre el contenido.

---

## 7. Densidad de Interfaz

El sistema de densidad se aplica globalmente via `document.documentElement.style.setProperty()` y el atributo `data-density` en `<html>`.

### Implementación

```tsx
// src/context/SettingsContext.tsx
// Valores en DENSITY_VARS para cada densidad:
// 'compact' | 'normal' | 'comfy'
```

> **Regla:** Al crear un nuevo componente que use spacing de layout, usar las variables `--page-p`, `--row-py`, `--gap-md` en lugar de valores fijos, para que respete la densidad seleccionada.

---

## 8. Animaciones

| Clase / Keyframe | Duración | Uso |
|---|---|---|
| `.fade-up` | 200ms ease | Entrada de páginas y vistas |
| `.slide-in` | 180ms ease | Entrada desde la izquierda |
| `.count-up` | 300ms ease | Aparición de números/KPIs |
| `demiSlide` | 200ms cubic-bezier(0.22,1,0.36,1) | Apertura del chat DEMI flotante |
| `msgIn` | 200ms ease | Entrada de mensajes en DemiPage |
| `demiBounce` | 1.1s infinite | Indicador de escritura DEMI |
| `spin` | 600ms linear infinite | Spinner de carga en botón login |

> **Regla:** Duración máxima de animaciones de UI: 300ms. Nunca usar `animation-duration > 400ms` en transiciones de navegación. Las animaciones de estado (spinners, bouncing) pueden ser más largas.

---

## 9. DEMI — Asistente IA

DEMI es un módulo de primera clase en la plataforma, con presencia en tres lugares:

### 9.1 Módulo de página completa (`/src/features/demi/DemiPage.tsx`)
- Vista de chat full-height, sin padding de página externa
- Burbujas DEMI: fondo `--s2`, borde `--border`, border-radius `4px 14px 14px 14px`
- Burbujas usuario: fondo `var(--blue)`, sin borde, border-radius `14px 4px 14px 14px`
- Avatar DEMI: gradiente `linear-gradient(135deg, #2563EB, #1D4ED8)`, ícono `Sparkles`
- Input fijo en footer con barra `--s1` y borde superior
- Se activa desde el nav-item superior del sidebar

### 9.2 Nav-item en Sidebar
- Primer ítem en todos los roles
- Ícono: `Sparkles` (lucide-react)
- Estilo diferenciado: fondo azul tenue, borde azul, texto azul (ver §5 Nav-items)
- Separación inferior de 8px respecto a los otros ítems

### 9.3 Chat flotante (`/src/components/demi/DemiChat.tsx`)
- Posición: `fixed`, `bottom: 24px`, `right: 24px`, `z-index: 1000`
- Botón: gradiente azul, `border-radius: 100px`, shadow con tono azul
- Ventana: 360×520px, `border-radius: 14px`, shadow oscura fuerte
- **Se oculta automáticamente cuando `activeView === 'demi'`**

### 9.4 Barra de búsqueda
- Placeholder: `"Buscar o preguntar a DEMI..."`

> **Regla:** No añadir funcionalidad de IA fuera de estos tres puntos de entrada sin actualizar este documento. DEMI es la única interfaz de IA del producto.

---

## 10. Roles y Navegación

| Rol ID | Label UI | Módulos principales |
|---|---|---|
| `prime` | PRIME | Todos los módulos (acceso total) |
| `director` | Director | Dashboard, Matrícula, Dirección, Finanzas, EWS, Enterprise |
| `docente` | Docente | Clases, Cursos, Calificaciones, Asistencia, Comunicaciones, Actas |
| `coordinador` | Coordinador | Dashboard, Inscripción, Conflictos, Reporte Deuda |
| `padres` | Padre / Madre | Mi Hijo, Desempeño, Comunicaciones, Pagos, Autorizaciones |
| `cfo` | CFO | Finanzas, Transacciones, Deudores, Agentes IA |

> **Regla:** Cada rol ve exactamente los módulos definidos en `navByRole` en `Sidebar.tsx`. No mostrar módulos no autorizados para el rol activo.

### Vistas especiales (fuera del rol)
- `profile` → `ProfilePage` (todos los roles)
- `settings` → `SettingsPage` (todos los roles)
- `demi` → `DemiPage` (todos los roles)

---

## 11. Sistema de Configuración de Usuario

Gestionado por `src/context/SettingsContext.tsx` con persistencia en `localStorage`.

| Setting | Opciones | Por defecto | Efecto |
|---|---|---|---|
| `theme` | `dark` / `light` / `system` | `dark` | Solo `dark` activo; otros "Próximamente" |
| `density` | `compact` / `normal` / `comfy` | `normal` | Cambia CSS vars de spacing globalmente |

> **Regla:** Nuevas preferencias de usuario deben agregarse al contexto, no como estado local de componentes. Siempre persistir en `localStorage`.

---

## 12. Pantalla de Login

La pantalla de login es un caso especial con su propio sistema de tokens visuales (ver §2 Login específico).

### Estructura
```
BODY (#090909) + ambient glow sutil
  └── CONTAINER (max-width: 460px, centrado vertical y horizontal)
       ├── BRANDING (logo + wordmark + sub-label)
       ├── HEADING ("Iniciar sesión" + subtítulo semestre)
       └── CARD (#111110, border-radius: 14px, padding: 32px 36px)
            ├── Role selector (grid 3 columnas)
            ├── Campo email (height: 46px)
            ├── Campo contraseña + "Olvidé mi contraseña"
            ├── Error state (si aplica)
            └── Botón "Ingresar" (height: 48px, full-width)
       └── FOOTER (favicon tiny + copyright)
```

### Role selector
- Grid de 3 columnas × 2 filas para los 6 roles
- Cada card: `padding: 9px 10px`, `border-radius: 8px`, radio indicator real
- Selected: `border: 1px solid rgba(59,130,246,0.55)`, `background: rgba(59,130,246,0.1)`
- Radio dot selected: `background: #3B82F6`, 6×6px

### Botón Ingresar
- Height: 48px, full-width, `border-radius: 8px`
- Normal: `background: #2563EB`
- Hover: `background: #1D4ED8`
- Active: `background: #1E40AF`
- Loading: `background: rgba(37,99,235,0.7)` + spinner animado

### Responsivo
- `padding-bottom: 80px` en el wrapper para compensar banners de preview
- En mobile (`< 520px`): card padding 24px 20px, roles en 1 columna

---

## 13. Módulos Enterprise

Los módulos Enterprise están marcados con el color `--purple` (`#8B5CF6`).

> **Regla:** Cualquier módulo nuevo de tier Enterprise debe:
> 1. Usar `--purple` y `--purple-dim` para indicadores y badges
> 2. Mostrar badge `badge-purple` con el texto "Enterprise" en su card de integración
> 3. Estar listado bajo la sección "Enterprise Tier" en `navByRole` del Sidebar

---

## 14. Reglas de Código para UI

### Imports de assets
```tsx
// SIEMPRE:
import logoSrc from '@/imports/logo.png'
<img src={logoSrc} alt="descripción" />

// NUNCA:
<img src="/src/imports/logo.png" />
```

### Variables CSS vs valores inline
```tsx
// SIEMPRE usar variables:
style={{ color: 'var(--tx-2)', background: 'var(--s3)' }}

// NUNCA usar hex directo en componentes:
style={{ color: 'rgba(255,255,255,0.55)', background: '#1D1B19' }}

// EXCEPCIÓN aceptada: login y DemiPage que tienen tokens propios
// documentados en este design system
```

### Transiciones
```tsx
// Duración estándar: var(--transition) = 150ms ease
transition: 'background var(--transition), color var(--transition)'
// No usar duraciones distintas sin justificación
```

### Scrollbars
- Siempre 4px de ancho, track transparente, thumb `var(--border-md)` — ya definido globalmente.
- No agregar estilos de scrollbar en componentes individuales.

---

## 15. Lo que NO se debe hacer

| ❌ Prohibido | ✅ Alternativa |
|---|---|
| Usar `#ffffff` o negro absoluto `#000000` | Usar tokens del sistema |
| Añadir nuevas fuentes tipográficas | Usar Inter con diferentes pesos |
| Crear gradientes llamativos decorativos | Gradientes solo para avatares DEMI y botón flotante |
| Sombras grandes o glassmorphism | Bordes + contraste de superficie |
| `border-radius > 16px` en elementos de UI del app | Reservar radios grandes solo para Login card y modales |
| Estilos inline de colores fuera de excepciones documentadas | Variables CSS |
| `z-index > 1000` sin documentar | Escalar: content=1, navbar=10, dropdowns=100, modales=500, flotante=1000 |
| Introducir nuevo color de acción | Usar `--blue` o justificar en design system |
| Recrear logos con CSS/SVG | Importar archivos de `/src/imports/` |
| Añadir scroll horizontal | Ajustar layout para que el contenido fluya |

---

## 16. Checklist antes de cada cambio de diseño

- [ ] ¿Estoy usando variables CSS del sistema (`--bg`, `--tx`, `--blue`, etc.)?
- [ ] ¿El espaciado es múltiplo de 4px?
- [ ] ¿El componente respeta la densidad vía variables `--page-p`, `--row-py`, etc.?
- [ ] ¿Los bordes son `1px solid var(--border)` o `--border-md`?
- [ ] ¿Las transiciones usan `var(--transition)` o están justificadas?
- [ ] ¿Los logos se importan como módulos ES?
- [ ] ¿El nuevo elemento tiene hover state, focus state y estado activo?
- [ ] ¿El contraste de texto cumple AA (4.5:1 para texto normal, 3:1 para grande)?
- [ ] ¿El componente funciona en densidad compacta, normal y cómoda?
- [ ] ¿Se ve correcto en sidebar expandido y colapsado (si aplica)?

---

*Última actualización: agosto 2026 — democra.pro EduOS v2.0*
