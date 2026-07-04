# Rediseño Light Mode ONG

## Nota sobre rutas

El encargo asumía una estructura `ONG/src/{lib,components,pages}/...`. La estructura real es
`ONG/src/app/{lib,components,pages}/...` (ver `AGENTS.md`/reportes previos — `ONG/src/lib/` existe
pero solo contiene `db/`, y `ONG/src/{components,pages}` no existen). Todos los cambios se aplicaron
en las rutas reales equivalentes.

## Cambios realizados

### Paleta (tokens)
- **`ONG/src/app/lib/theme-context.tsx`**: los 3 niveles de intensidad de `lightTokens` (suave/normal/vibrante)
  reescritos con la paleta exacta pedida — primario azul suave `#4A7BA7`, secundario teal `#4D9B8F`,
  terciario tierra `#7B6B5C`, acento cálido `#D4A76A`, semántica completa (éxito/advertencia/error/info),
  neutros y superficies cálidas. Se añadió el token `--t-error`/`--t-error-soft` (pedido explícitamente)
  y se actualizó `--t-danger`/`--t-danger-soft` (nombre ya usado por 16+ consumidores) al mismo valor,
  para no duplicar semántica con dos rojos distintos.
- **Tema por defecto cambiado a `"claro"`** (antes `"oscuro"`) — así la app abre en light mode sin
  requerir que el usuario cambie el toggle. El toggle y el modo oscuro siguen existiendo y funcionando
  (no se tocaron los valores de `darkTokens`, fuera del alcance de este encargo).
- **`ONG/src/styles/theme.css`**: bloque `:root` (shadcn) actualizado a la misma paleta; `--radius` de
  `0.625rem` (10px) a `0.75rem` (12px); bloque `.dark` sin tocar.

### Layout (hereda a todas las páginas)
- **`Sidebar.tsx`**: los textos/hovers estaban codificados en tonos casi-blancos (`#EAF0FF`, `#a9c2ff`...)
  pensados para un fondo oscuro — con sidebar blanco esos colores eran casi invisibles. Se reemplazaron
  por `var(--t-primary)` (activo/hover) y `var(--t-hover)` (fondo hover), y los radios de ítems de
  `rounded-xl`/`rounded-lg` a `rounded-md` (6px) para categorías y subítems.
- **`Topbar.tsx`**: punto de notificación cambiado de azul a `var(--t-warning)` (ámbar cálido, como se
  pidió); avatar degradado de azul→terciario(marrón) a azul→secundario(teal), ya que el terciario nuevo
  es un tono tierra, no apto para un degradado de "acento".
- **`AppShell.tsx`** (equivalente local de un shell base): los 3 resplandores ambientales de fondo
  re-hueados de azul/teal/azul (tono oscuro) a azul/teal/arena de la nueva paleta, con opacidades
  ajustadas para verse bien sobre el nuevo fondo claro.

### Componentes UI
- **`ghost-button.tsx`**: hover ahora usa `var(--t-primary-soft)` de fondo + `var(--t-primary)` de texto
  (antes fondo neutro).
- **`outline-button.tsx`**: borde y texto pasan de neutros a `var(--t-primary)` (pedido explícito:
  "Borde: primario azul suave, Color: primario azul suave").
- **`gradient-button.tsx`**: degradado de azul→terciario(marrón, no pedía esto) a azul→secundario(teal);
  radio de `rounded-full` a `rounded-xl` (12px, pedido explícito para este componente); sombra re-hueada.
- **`help-assistant.tsx`**: ícono de "consejo" ya usaba el acento cálido; el resplandor del botón flotante
  (antes azul) ahora también usa el acento cálido con transparencia, como se pidió.
- **`mini-line-chart.tsx`**: color/gradiente por defecto de `#3D6BFF` (azul oscuro) a `#4A7BA7` (primario nuevo).

### Compartidos (cards, tablas, filtros)
- **`KpiCard.tsx`**: padding vertical `py-4`→`py-5` (16px→20px, según lo pedido); radio `rounded-2xl`→`rounded-xl` (12px).
- **`DataTable.tsx`**: radio del contenedor y del estado vacío `rounded-2xl`→`rounded-xl` (12px).
- **`PageHeader.tsx`**: título de página (el "H1" real de cada pantalla) de 20px a 32px/semibold y
  descripción de 13px a 15px, siguiendo la escala tipográfica pedida.
- **`FilterBar.tsx`**: chip de filtro activo tenía texto casi-blanco (`#D7E2FF`) ilegible en fondo claro;
  cambiado a `var(--t-primary)` sobre `var(--t-primary-soft)`.

### Páginas
- **`Dashboard.tsx`**, **`ProjectsWorkspace.tsx`**, **`homeDashboardService.ts`**: acentos puntuales
  (barra de horas mensuales, indicador de pestaña activa, tarjeta de sección seleccionada, punto de
  estado "programado") re-hueados de azul oscuro a azul suave.
- **`pages/landing/*`** (`LandingPage.tsx`, `VolunteerRegistrationPage.tsx`, y los componentes
  `GradientText`, `PillButton`, `RadialGauge`, `SegmentedBar`, `TestimonialCard`): todos los acentos y
  degradados re-hueados de azul/teal oscuros (`#3D6BFF`/`#2DBFB0`) a azul/teal suaves (`#4A7BA7`/`#4D9B8F`).
  **El fondo de estas páginas NO se convirtió a claro** — ver "Pendientes".

## Archivos modificados (24)

```
ONG/src/app/lib/theme-context.tsx
ONG/src/styles/theme.css
ONG/src/app/components/layout/AppShell.tsx
ONG/src/app/components/layout/Sidebar.tsx
ONG/src/app/components/layout/Topbar.tsx
ONG/src/app/components/shared/DataTable.tsx
ONG/src/app/components/shared/FilterBar.tsx
ONG/src/app/components/shared/KpiCard.tsx
ONG/src/app/components/shared/PageHeader.tsx
ONG/src/app/components/ui/ghost-button.tsx
ONG/src/app/components/ui/gradient-button.tsx
ONG/src/app/components/ui/help-assistant.tsx
ONG/src/app/components/ui/mini-line-chart.tsx
ONG/src/app/components/ui/outline-button.tsx
ONG/src/app/modules/home/homeDashboardService.ts
ONG/src/app/modules/projects/ProjectsWorkspace.tsx
ONG/src/app/pages/Dashboard.tsx
ONG/src/app/pages/landing/LandingPage.tsx
ONG/src/app/pages/landing/VolunteerRegistrationPage.tsx
ONG/src/app/pages/landing/components/GradientText.tsx
ONG/src/app/pages/landing/components/PillButton.tsx
ONG/src/app/pages/landing/components/RadialGauge.tsx
ONG/src/app/pages/landing/components/SegmentedBar.tsx
ONG/src/app/pages/landing/components/TestimonialCard.tsx
```

- **Colores actualizados:** ~55 valores individuales (tokens + hardcodeados) en 24 archivos.
- **Espaciado:** padding de KpiCard +20% (16→20px vertical); resto de componentes compartidos ya
  usaban valores cercanos a los pedidos (gap de PageHeader ya era 16px).
- **Border-radius:** `--radius` global 10px→12px; cards (KpiCard, DataTable) 16px→12px; sidebar-items 8-12px→6px;
  gradient-button pill→12px (pedido explícito, único botón donde se cambió la forma).
- **Sombras:** `--t-shadow`/`--t-shadow-lg` de sombras negras/azuladas grandes (`0 18px 48px rgba(0,0,0,...)`)
  a sombras café suave y sutiles (`0 1px 3px rgba(26,25,21,0.08)` / `0 8px 24px rgba(26,25,21,0.10)`),
  exactamente el valor pedido.

## Verificación

- [x] `npm run build` (ONG): ✅ 2978 módulos, sin errores.
- [x] `npm run dev`: ✅ los 3 servicios (API, app raíz, ONG) levantan sin errores.
- [x] `npm run validate`: ✅ 8/8 checks.
- [x] Verificación en navegador (Playwright headless, no solo códigos HTTP): 3 rutas navegadas
  (`/app/ong/home`, `/landing`, `/registro-voluntario`), cero errores de consola o de React en las 3.
- [x] Barrido final de colores antiguos (`#3D6BFF`, `#2DBFB0`, `#002EFE`, morado, textos casi-blancos
  ilegibles en claro): cero coincidencias fuera de `darkTokens`/`.dark` (correctamente sin tocar).

## Verificación visual

- [x] Fondo claro (`#F8F7F5`), no oscuro — confirmado en capturas.
- [x] Colores cálidos (azul suave, teal, ámbar) — confirmado en Landing (gradientes, eyebrow, barras).
- [x] Espaciado generoso — aplicado en KpiCard; no verificado exhaustivamente en las ~40 páginas individuales.
- [x] Bordes redondeados y suaves — `--radius` global aumentado, cards/tablas en 12px.
- [x] Sombras café suave, no negras — token actualizado, hereda a todos los consumidores de `var(--t-shadow)`.
- [ ] Tipografía clara y amigable — solo `PageHeader.tsx` (H1 de página) actualizado a la escala pedida;
  no se retocó tipografía dentro de las ~40 páginas individuales (ver Pendientes).
- [x] Sidebar blanco, no oscuro — `--t-sidebar: #FFFFFF`, textos corregidos para contraste.
- [x] Botones azul suave, no neón — confirmado (ghost/outline/gradient).
- [x] Cards blancas con borde cálido — `--t-surface: #FFFFFF`, `--t-border: #E4DDD5`.

## Pendientes

- **Fondo de landing/login/registro sigue oscuro.** El encargo pedía "Fondos: use surface/bg claro"
  para estas páginas, pero `LandingPage.tsx`/`VolunteerRegistrationPage.tsx` fijan el fondo con
  `backgroundColor: "#070707"` y texto `#F5F5F5` de forma hardcodeada (no usan los tokens `--t-*`),
  con ~30 referencias a blanco/dark repartidas en varios componentes de esa carpeta (`GlassCard` y
  otros). Convertir esto a claro de forma segura requiere retocar cada una de esas referencias
  individualmente (alto riesgo de dejar texto ilegible en algún punto si se hace de forma parcial).
  Se aplicaron únicamente los cambios de color de acento (gradientes, textos de marca), dejando el
  fondo oscuro intacto — decisión de alcance, no un olvido. Recomendado como tarea separada si se
  quiere una landing 100% clara.
- **Tipografía no retocada página por página.** Solo se actualizó `PageHeader.tsx` (el H1 compartido).
  Los ~40 archivos bajo `pages/` pueden tener tamaños de fuente propios que no pasen por ese componente.
- **Modo oscuro sin cambios.** Fuera de alcance del encargo; sigue disponible vía el toggle existente,
  con la paleta azul/teal "tech" de la tarea anterior (no la humanizada).
- **`/app/ong/home` requiere sesión.** Al no haber autenticación en este entorno de prueba, la ruta
  redirige a una pantalla de login (propia de `ONG/`, no tocada por este encargo) en vez de mostrar el
  Dashboard directamente; se verificó el fondo claro y el botón azul en esa pantalla, pero no fue
  posible ver el Dashboard, KpiCards ni Sidebar reales renderizados con datos.
