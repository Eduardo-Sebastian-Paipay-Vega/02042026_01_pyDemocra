# CHANGELOG — Tema oscuro navy/cyan para el Panel Principal (Dashboard, ONG/)

**Fecha:** 2026-07-04
**Hora:** 16:22 (America/Lima)
**Autor:** Claude Sonnet 5 (Claude Code)
**Estado:** Completado

## Objetivo del cambio

Aplicar la misma paleta navy/cyan de la landing al panel principal (`localhost:5174/app/ong/home`, `Dashboard.tsx`), únicamente en modo oscuro, con especificaciones puntuales por sección: contenedor, 8 tarjetas KPI, secciones agrupadas Hoy/Pendiente/Control, botones (primario/secundario/terciario), tipografía, elementos de estado (con `#ffa500`/`#ff6b6b` para pendiente/crítico) y bordes/separadores.

## Contexto del problema

Este es el segundo módulo (después de fichas médicas) al que se le pide la misma paleta navy/cyan de la landing, solo en modo oscuro. La infraestructura de scope CSS (`[data-app-theme="oscuro"] .{scope-class}`) ya existía de ese cambio anterior.

## Motivo de la modificación

Extender la consistencia visual establecida en fichas médicas al panel principal, que es la pantalla de aterrizaje del sistema (home) y por tanto la de mayor visibilidad.

## Solución implementada

1. **Reutilización de la regla CSS compartida**: en vez de duplicar el bloque de paleta, se extendió el selector existente de `.fichas-medicas-theme` a `.fichas-medicas-theme, .panel-principal-theme`, evitando duplicar ~30 líneas de CSS. Se agregó una regla adicional exclusiva de este scope para `--t-warning: #ffa500` y `--t-danger: #ff6b6b` (valores que fichas médicas no especificaba).
2. **Clase de scope en 7 puntos**: el contenedor raíz de `Dashboard.tsx` y sus **6 modales** (crear/editar actividad, detalle de actividad, detalle de horas, detalle de admisión, cancelar actividad, resolución de admisión — todos vía `ModalShell`/`createPortal`) recibieron `className="panel-principal-theme"`.
3. **Colores hardcodeados convertidos a tokens** (impedían que el scope tuviera efecto):
   - Ícono "Pendiente" (`text-amber-400`) → `text-[var(--t-warning)]`
   - Ícono "Control" (`text-red-400`) → `text-[var(--t-danger)]`
   - Relleno de barra del gráfico de horas mensuales y degradado del indicador de pestaña activa (hex fijo `#4A7BA7`) → `var(--t-primary)` / `var(--t-primary-soft)`
4. **Ícono de las 8 tarjetas KPI**: `KpiCard.tsx` (componente compartido por otras páginas) tenía el color de ícono hardcodeado a `var(--t-text-dim)`. Se agregó un prop opcional `iconColor` (default = `var(--t-text-dim)`, sin cambiar el comportamiento en ningún otro consumidor) y se usa `iconColor="var(--t-primary)"` solo desde `Dashboard.tsx`.
5. **Botones terciarios** (Crear actividad / Ver actividades / Revisar admisión, `GhostButton`): se agregó una clase marcador `panel-principal-tertiary-btn` + una regla CSS scoped a oscuro que les da fondo `var(--t-border)` — deliberadamente NO se usó una clase Tailwind directa (`bg-[var(--t-border)]`) porque eso habría aplicado también en modo claro, violando la restricción explícita.
6. Se extendió el fix de `StatusDot` (badge "info" morado) para cubrir también este scope, ya que el Dashboard también usa esa variante ("interviewing" en admisión).

## Riesgos identificados

- **`fill` de SVG con `var()`**: el gráfico de barras (Recharts `<Cell fill={...}>`) pasó de un hex fijo a `var(--t-primary)`. Se verificó explícitamente que los navegadores modernos resuelven variables CSS dentro del atributo de presentación `fill` de SVG — no es una suposición, se confirmó con una prueba dirigida (ver Verificación).
- **Archivo más grande de lo esperado**: `Dashboard.tsx` tiene 2325 líneas y 6 modales, no solo la vista principal. Se revisó el archivo completo para no dejar ningún modal sin la clase de scope.

## Impacto esperado

- El panel principal se ve con la paleta navy/cyan solo en modo oscuro.
- Modo claro: sin cambios (verificado).
- Otras páginas que usan `KpiCard` (compartido): sin cambios, gracias al valor por defecto del nuevo prop `iconColor`.

## Módulos afectados

- `ONG/src/app/pages/Dashboard.tsx`
- `ONG/src/app/components/shared/KpiCard.tsx`
- `ONG/src/styles/index.css`

## Dependencias involucradas

Ninguna nueva. Reutiliza el sistema de theming y el patrón de scope CSS ya establecido por el cambio de fichas médicas (ver `changes/2026-07-04_16-21_fichas-medicas-tema-oscuro/`).

## Posibles efectos secundarios

- Ninguno detectado fuera del alcance. El prop `iconColor` de `KpiCard` es opcional y retrocompatible; ningún otro llamador del componente lo pasa, por lo que su apariencia no cambia.

## Verificación realizada

- `npm run build` (ONG): exitoso, sin errores nuevos, 2978 módulos.
- Verificación técnica con Playwright: tokens resueltos exactamente a los valores pedidos en oscuro (`--t-bg: #0a0e27`, `--t-warning: #ffa500`, `--t-danger: #ff6b6b`, etc.), vacíos en claro (sin efecto), fondo del botón terciario resuelto a `rgb(42, 53, 72)` (`#2a3548` exacto), y `fill="var(--t-primary)"` en un `<rect>` SVG de prueba resolvió correctamente a `rgb(74, 159, 216)`.

## Cómo revertir

`git revert` del commit `feat(ong): tema oscuro navy/cyan para el panel principal`, o restaurar manualmente los 3 archivos listados (ver `FILES_CHANGED.md`). Nota: revertir este commit solo, sin revertir el de fichas médicas, es seguro — la regla CSS compartida vuelve a su forma anterior (solo `.fichas-medicas-theme`) automáticamente al deshacer los cambios de este commit en `index.css`.
