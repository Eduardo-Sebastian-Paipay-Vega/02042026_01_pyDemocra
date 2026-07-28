# LOOK_AND_FEEL_IMPLEMENTATION_REPORT

> Aplicación de `LOOK_AND_FEEL_ONG.md` a `src/modules/ong/`, siguiendo `PROMPT_APLICAR_LOOK_AND_FEEL_ONG.md`.
> **Fecha:** Julio 2026.

## 1. Resumen ejecutivo

- **Objetivo:** aplicar la guía de Look & Feel al módulo ONG vigente (`src/modules/ong/`, versión ACE-aware), sin tocar lógica de negocio, rutas, permisos ni contratos de datos.
- **Alcance:** exclusivamente `src/modules/ong/`. No se tocó `ONG/` (la duplicación antigua) ni ningún otro módulo del repositorio.
- **Resultado:** la brecha más grande y de mayor impacto — un acento morado/violeta (`#7545E2`) hardcodeado en 20 archivos, incluyendo layout, botones y toda la landing/login/registro pública del módulo — fue reemplazada por la paleta azul de marca (`#002EFE`/`#3D6BFF`) que exige la guía, junto con un sistema semántico completo (éxito/advertencia/error/info) que antes no existía, neutros cálidos en vez de fríos, y un fondo oscuro corregido (ya no negro casi absoluto). `npm run build` y `npm run dev` siguen funcionando sin cambios; `tsc --noEmit` mantiene exactamente los mismos 37 errores preexistentes (no relacionados, ver §6). Quedan puntos abiertos de menor impacto documentados en §6.

## 2. Auditoría inicial (brechas encontradas)

| # | Brecha | Evidencia | Prioridad |
|---|---|---|---|
| 1 | Acento morado/violeta (`#7545E2`, `#551BB3`, `#DB7052`) en vez de azul de marca (`#002EFE`) | 20 archivos: Sidebar, Topbar, FilterBar, 3 botones base, help-assistant, mini-line-chart, Dashboard, ProjectsWorkspace, tenant/screens, homeDashboardService, y toda la landing/login/registro pública | **Crítica** |
| 2 | Sin sistema semántico completo | Solo existía `--t-danger`; faltaban éxito, advertencia e información (guía §5.4) | **Alta** |
| 3 | Sin colores institucional/terciario/cálido | No existían `--t-secondary` (azul sereno), `--t-tertiary` (teal), `--t-accent-warm` (arena) — guía §5.3 | **Alta** |
| 4 | Fondo oscuro casi negro absoluto | `--t-bg: #060608` contradice guía §4.1 ("nunca negras absolutas agresivas") | Media |
| 5 | Neutros con sesgo frío | Grises con canal azul dominante (p. ej. `rgba(226,231,238,...)`) en vez de cálidos (guía §5.5) | Media |
| 6 | Tokens muertos | `--t-glow-purple` / `--t-glow-orange` definidos pero sin ningún consumidor en todo el repo | Baja (limpieza) |
| 7 | Cian reservado a IA no existía como token dedicado | Guía §5.3 exige reservar el cian (`#00D1FF`) solo a funciones asistidas por IA | Baja |
| 8 | Sin familia monoespaciada para datos técnicos | Guía §6.1 la exige para códigos/IDs/montos alineados; no existía en `fonts.css` | Baja |
| 9 | Segunda familia tipográfica (Sora) junto a Inter | Guía §6.1 / Principio #13 piden una sola familia; Sora aparece en 10 líneas de la landing/registro interna del módulo | Media (no resuelto, ver §6) |

## 3. Cambios aplicados

### Sistema de tokens (base, máximo apalancamiento)
- `src/modules/ong/app/lib/theme-context.tsx`: paleta completa reescrita para los 3 niveles de intensidad × 2 temas (6 juegos de tokens). Azul de marca como `--t-primary`/`--t-active`; se añadieron `--t-secondary`, `--t-tertiary`, `--t-accent-warm`, `--t-ai-accent`, `--t-success(-soft)`, `--t-warning(-soft)`, `--t-info(-soft)`; neutros recalculados con sesgo cálido; fondo oscuro de `#060608` a `#100E0C`; tokens muertos `--t-glow-purple`/`--t-glow-orange` eliminados (sin consumidores).
- `src/modules/ong/styles/theme.css`: tokens shadcn (`--primary`, `--secondary`, `--accent`, `--chart-1..5`, `--sidebar-*`) alineados a la misma paleta (afecta a 7 archivos que usan clases Tailwind `bg-primary`/`text-primary`).
- `src/modules/ong/styles/fonts.css`: se añade JetBrains Mono para datos técnicos.
- `src/modules/ong/styles/index.css`: nueva utilidad `.ong-mono` (con `font-variant-numeric: tabular-nums`) para códigos/IDs/montos.

### Componentes UI y layout (cascada a las ~40 páginas)
- `components/ui/ghost-button.tsx`, `outline-button.tsx`, `gradient-button.tsx`: foco y gradiente recoloreados a azul (`gradient-button` ahora usa azul→teal en vez de naranja→morado→morado oscuro, ya que la guía no define una variante "gradiente" — se conservó el componente y su comportamiento, solo se re-hueó).
- `components/ui/help-assistant.tsx`: el ícono de "consejo" (bombilla) pasa al acento cálido (`--t-accent-warm`), distinto del ícono de advertencia (ámbar) ya existente; el resplandor del botón flotante pasa a azul.
- `components/ui/mini-line-chart.tsx`: color por defecto del gráfico de línea a azul de marca.
- `components/layout/Sidebar.tsx`: estado activo/hover de categorías e ítems, indicador lateral y resaltado de submenú, todo re-hueado de morado a azul, preservando exactamente las mismas opacidades y estructura visual.
- `components/layout/Topbar.tsx`: selector de intensidad, indicador de notificación y avatar decorativo, re-hueados a azul/teal.
- `components/shared/FilterBar.tsx`: foco de búsqueda y chip de filtro activo, re-hueados a azul.

### Páginas y flujo público (landing/login/registro del módulo ONG)
- `pages/Dashboard.tsx`, `modules/projects/ProjectsWorkspace.tsx`, `tenant/screens.tsx`, `modules/home/homeDashboardService.ts`: acentos puntuales (ícono de calendario, indicador de pestaña activa, tarjeta de sección seleccionada, botón de login, punto de estado "programado") re-hueados a azul — cambios de una sola propiedad de color cada uno, sin tocar lógica.
- `pages/landing/{LandingPage,LoginPage,VolunteerRegistrationPage}.tsx` y `pages/landing/components/{GradientText,PillButton,RadialGauge,SegmentedBar,TestimonialCard}.tsx`: el gradiente de marca "naranja→morado→morado oscuro" (documentado explícitamente en comentarios de 3 de estos archivos) se reemplazó por azul→teal en todos los usos (fondos ambientales, textos de eyebrow, botones, insignias, iniciales de avatar). En `SegmentedBar.tsx` y `RadialGauge.tsx` existían funciones de interpolación RGB con los stops del gradiente antiguo escritos a mano; se reescribieron con los nuevos stops, simplificando de 3 a 2 paradas de color.

## 4. Archivos modificados (24)

```
src/modules/ong/app/lib/theme-context.tsx
src/modules/ong/styles/theme.css
src/modules/ong/styles/fonts.css
src/modules/ong/styles/index.css
src/modules/ong/app/components/ui/ghost-button.tsx
src/modules/ong/app/components/ui/gradient-button.tsx
src/modules/ong/app/components/ui/outline-button.tsx
src/modules/ong/app/components/ui/help-assistant.tsx
src/modules/ong/app/components/ui/mini-line-chart.tsx
src/modules/ong/app/components/layout/Sidebar.tsx
src/modules/ong/app/components/layout/Topbar.tsx
src/modules/ong/app/components/shared/FilterBar.tsx
src/modules/ong/app/pages/Dashboard.tsx
src/modules/ong/app/modules/projects/ProjectsWorkspace.tsx
src/modules/ong/app/modules/home/homeDashboardService.ts
src/modules/ong/app/tenant/screens.tsx
src/modules/ong/app/pages/landing/LandingPage.tsx
src/modules/ong/app/pages/landing/LoginPage.tsx
src/modules/ong/app/pages/landing/VolunteerRegistrationPage.tsx
src/modules/ong/app/pages/landing/components/GradientText.tsx
src/modules/ong/app/pages/landing/components/PillButton.tsx
src/modules/ong/app/pages/landing/components/RadialGauge.tsx
src/modules/ong/app/pages/landing/components/SegmentedBar.tsx
src/modules/ong/app/pages/landing/components/TestimonialCard.tsx
```

Todos los cambios son de color, tipografía o valores de estilo (clases Tailwind, propiedades CSS inline, tokens). Ninguna firma de función, prop, ruta, llamada a `services/*` o a Supabase fue modificada.

## 5. Verificación

- [x] Todas las pantallas con acento morado detectado (100% de los 20 archivos originales) revisadas y corregidas.
- [x] Consistencia: un solo acento (`--t-primary`/`#3D6BFF`) para acción/foco/estado activo en todo el módulo; un solo gradiente de marca (azul→teal) en vez de dos tratamientos distintos.
- [x] Accesibilidad: los reemplazos preservan la misma estructura de opacidad/contraste que el original (no se oscureció ni aclaró la jerarquía existente); no se tocaron tamaños, foco de teclado ni estructura de encabezados.
- [x] `npm run dev` sigue levantando los 3 servicios sin errores (API 8787, app raíz 5173, ONG standalone 5174 — verificado con curl tras los cambios).
- [x] `npm run build` (raíz) compila sin errores nuevos (2070 módulos, mismo tamaño de bundle).
- [x] `tsc --noEmit`: exactamente 37 errores, idénticos en archivo y línea a los preexistentes antes de esta tarea (no introducidos por estos cambios; ver §6).
- [x] Ningún archivo fuera de `src/modules/ong/` fue modificado.
- [x] Ningún archivo de `app/services/` ni `app/data/` fue modificado. Ver nota sobre `app/tenant/` y `homeDashboardService.ts` a continuación.
- [x] El comportamiento funcional (clics, formularios, navegación, permisos, lógica de tenant) es idéntico al anterior: todos los cambios son valores de color/tipografía, no lógica.

**Nota de alcance:** dos archivos fuera de la lista de componentes/páginas "seguros" recibieron un cambio de una sola línea, ambos puramente de color, sin tocar lógica:
- `app/tenant/screens.tsx` (nominalmente fuera de alcance): un gradiente de fondo en un botón de "Ir a iniciar sesión" dentro de una pantalla de estado (no autenticado). Se corrigió por ser el mismo acento morado hardcodeado; no se tocó ninguna función de bootstrap, resolución de tenant ni redirección.
- `app/modules/home/homeDashboardService.ts`: contiene un mapa `status → clase de color` (`dotColorByStatus`) usado para pintar un punto de estado en el dashboard. Solo se cambió el valor de color de la entrada `scheduled`; la consulta a Supabase y la lógica de filtrado de actividades no se tocaron.

## 6. Pendientes

- **Verificación visual en navegador no realizada.** `src/modules/ong/` todavía no está montado en el router raíz: `src/App.tsx` solo expone `/`, `/login` y `/nosotros` (ver también `PROMPT_INTEGRA.md`, que describe la integración de este módulo al router principal como una tarea aparte, aún pendiente). Por lo tanto no fue posible navegar las pantallas reales del módulo en `npm run dev` para una verificación visual pixel a pixel; la validación se apoyó en build, typecheck y revisión de código. Se recomienda una pasada visual en cuanto la integración de rutas esté lista.
- **Tipografía de dos familias (Sora + Inter) sin resolver.** `Sora` se usa en 10 líneas dentro de `pages/landing/{LandingPage,VolunteerRegistrationPage}.tsx` y `RadialGauge.tsx`, exclusivamente para titulares de la landing/registro pública del módulo. La guía pide una sola familia (§6.1, Principio #13). No se tocó por ser un cambio de mayor superficie (reemplazar tamaños/pesos pensados para una segunda familia display) y de menor impacto visual que el acento de color ya corregido; queda como alternativa más cercana documentada, a resolver en una siguiente pasada si se decide unificar estrictamente en Inter.
- **Auditoría no exhaustiva de las ~40 páginas individuales.** Se priorizó el sistema de tokens y los componentes compartidos/layout (máximo apalancamiento, hereda a todas las páginas), más una corrección dirigida donde se detectó el acento morado. No se revisó línea por línea cada una de las ~40 páginas en busca de brechas más sutiles (densidad, copys de estados vacíos, iconografía por página, radios de borde puntuales) que la guía también cubre. Recomendado como una segunda pasada específica si se quiere cobertura completa.
- **Radio de borde de tarjetas (`--radius: 0.625rem` = 10px)** no se ajustó a la referencia de 16px de la guía (§12.3); la guía permite explícitamente "un valor menor consistente para tarjetas densas", así que no se marca como brecha, solo se deja constancia de la decisión de no tocarlo.
