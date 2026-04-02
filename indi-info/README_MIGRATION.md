# README_MIGRATION

## 1) Resultado
Se creó una versión migrada en `vanilla-migrated/` con arquitectura modular HTML/CSS/JS (sin React), manteniendo la UI/UX del repositorio actual.

Nota importante: el repositorio fuente **ya era HTML/CSS/JS** (no React/Vite). La migración se enfocó en:
- ordenar arquitectura en `src/` por módulos,
- agregar toolchain `npm run dev/build` con Vite,
- mantener rutas visuales existentes,
- conservar comportamientos (modales, filtros, reveal, progreso, board interactivo).

## 2) Cómo correr
Desde `vanilla-migrated/`:

```bash
npm install
npm run dev
npm run build
```

Build de producción en:
- `vanilla-migrated/dist/`

## 3) Estructura creada
```text
vanilla-migrated/
  src/
    pages/
    components/
    styles/
    assets/
    services/
    state/
    utils/
  public/
    Imagen/
    assets/
  index.html
  studio.html
  nosotros.html
  vite.config.js
  package.json
```

## 4) Decisiones tomadas
- **Router/rutas**: multi-page con Vite, preservando URLs existentes:
  - `/index.html`
  - `/studio.html`
  - `/nosotros.html`
- **CSS**: se reutilizó el CSS actual (`styles.css`, `animations.css`, `about-board.css`) y se dejó bundling/minificación por Vite.
- **Estado**: mini store en `src/state/store.js`:
  - `authState`
  - `uiState` (modales/toasts)
  - `dataState` (activities/filters/pagination)
- **Render/UI behavior**: modularización en componentes:
  - modales (con focus trap y `Esc`)
  - reveal/stagger
  - section indicator
  - progress rail
  - sound interactions
  - clipboard copy
- **Carga por demanda**: lazy load por ruta desde `src/router.js`.
- **Debug panel**: opcional con `?debug=1` (persistente en `localStorage`).

## 5) Seguridad
- No se añadieron keys.
- No se expusieron tokens.
- Se dejó `supabase` en módulo placeholder (`src/services/supabase.js`) porque en el repo fuente no existe integración activa de Supabase en runtime.

## 6) QA por pantalla

### `/index.html` (Home)
- Render inicial: OK
- Navegación anchors: OK
- Modal contacto (open/close/backdrop/Esc): OK
- Copy buttons contacto: OK
- Reveal + progress + dots: OK

### `/studio.html` (Archivo)
- Render inicial: OK
- Filtros chips (`all/systems/strategy/future`): OK
- Preview modal por card: OK
- Modal contacto: OK
- Estados de interacción hover/active: OK

### `/nosotros.html` (Nosotros + Board)
- Render inicial: OK
- Board unlock workflow: OK
- Paths glow en hover: OK
- Modal contacto: OK
- Scroll triggers: OK

## 7) Diferencias conocidas
- En el código fuente, los cards de workflows usan `data-media` con archivos no presentes (`flow_01.png`, `flow_02.png`). Se respetó la referencia original.
- Se corrigió inconsistencia técnica en el board (`status-light` vs `status-dot`) para mantener comportamiento real esperado.
- El alcance solicitado (Login/Actividades/Calendario/Config) no existe en este repositorio. Se marca como no aplicable respecto a la base actual.

## 8) Estado final de rutas migradas

### Rutas reales del repositorio fuente
- `/index.html`: **OK**
- `/studio.html`: **OK**
- `/nosotros.html`: **OK**

### Rutas del plan genérico solicitado (no presentes en el fuente)
- `Login/Auth`: **pendiente (no existe en fuente)**
- `Home/Dashboard`: **OK** (equivalente: `/index.html`)
- `Actividades (lista)`: **pendiente (no existe en fuente)**
- `Detalle de Actividad`: **pendiente (no existe en fuente)**
- `Calendario + modal/form`: **pendiente (no existe en fuente)**
- `Configuración/Tablas maestras`: **pendiente (no existe en fuente)**

## 9) Qué faltaría para 100% pixel perfect
- Comparación visual automatizada screenshot-by-screenshot (antes/después) en los tres breakpoints objetivo.
- Validación final de tipografías remotas en todos los entornos de deploy (latencia/caching de CDNs).
