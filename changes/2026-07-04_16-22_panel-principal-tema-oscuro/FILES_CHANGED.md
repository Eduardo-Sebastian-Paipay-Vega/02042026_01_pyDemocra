# FILES_CHANGED — Tema oscuro navy/cyan para el Panel Principal

## Modificados

- **`ONG/src/app/pages/Dashboard.tsx`**:
  - Clase `panel-principal-theme` agregada al `<motion.div>` raíz y a los 6 `<ModalShell>` (crear/editar actividad, detalle de actividad, detalle de horas, detalle de admisión, cancelar actividad, resolución).
  - Ícono "Pendiente": `text-amber-400/70` → `text-[var(--t-warning)]/70`.
  - Ícono "Control": `text-red-400/70` → `text-[var(--t-danger)]/70`.
  - Relleno de barra del gráfico de horas mensuales: hex fijo `#4A7BA7`/`rgba(74,123,167,0.35)` → `var(--t-primary)` / `var(--t-primary-soft)`.
  - Degradado del indicador de pestaña activa: hex fijo `#4A7BA7` → `var(--t-primary)`.
  - `KpiCard` de las 8 tarjetas: se agregó `iconColor="var(--t-primary)"`.
  - 3 `GhostButton` terciarios (Crear actividad, Ver actividades, Revisar admisión): se agregó `className="panel-principal-tertiary-btn"`.
- **`ONG/src/app/components/shared/KpiCard.tsx`** — se agregó el prop opcional `iconColor` (default `"var(--t-text-dim)"`, retrocompatible) y se usa para colorear el ícono en vez del valor fijo anterior.
- **`ONG/src/styles/index.css`** — el selector de la regla de paleta compartida se extendió de `.fichas-medicas-theme` a `.fichas-medicas-theme, .panel-principal-theme`; se agregaron 3 reglas nuevas: `--t-warning`/`--t-danger` específicos de este scope, extensión del fix de `StatusDot` a este scope, y la regla de fondo para `.panel-principal-tertiary-btn`.

## Creados

- `changes/2026-07-04_16-22_panel-principal-tema-oscuro/CHANGELOG.md`
- `changes/2026-07-04_16-22_panel-principal-tema-oscuro/SUMMARY.md`
- `changes/2026-07-04_16-22_panel-principal-tema-oscuro/FILES_CHANGED.md`

## Eliminados

Ninguno.

## Carpetas afectadas

- `ONG/src/app/pages/`
- `ONG/src/app/components/shared/`
- `ONG/src/styles/`
- `changes/`
