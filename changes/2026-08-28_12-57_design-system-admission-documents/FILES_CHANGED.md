# FILES_CHANGED — Design System: Admission Documents

## Archivos modificados

### `ong/src/styles/index.css`
- **Qué cambió:** Se agregó un nuevo bloque de scope CSS `.admision-docs-theme` al final del archivo (líneas 171–215). Mapea los tokens del Design System del usuario (warm-dark: `#100F0D`, `#171512`, `#26231F`, etc.) a las variables CSS `--t-*` existentes del proyecto. Solo se activa dentro de `[data-app-theme="oscuro"]`.
- **No se tocaron** las reglas existentes de `.panel-principal-theme` ni `.fichas-medicas-theme`.

### `ong/src/app/pages/AdmissionDocuments.tsx`
- **Imports:** Se añadieron iconos de `lucide-react` (`CheckCircle2`, `Clock`, `FileText`, `AlertTriangle`, `BarChart3`, `X`) para usar en KPI badges y empty states.
- **Root wrapper:** `<motion.div>` ahora lleva `className="admision-docs-theme space-y-6"` con `style={{ background: "var(--t-bg)", color: "var(--t-text)" }}` para aplicar el scope CSS.
- **KPI Cards row:** Se agregó un `grid grid-cols-2 sm:grid-cols-4 gap-3` con 4 tarjetas que muestran métricas reales: total solicitudes, documentos pendientes, tasa de aprobación (%), documentos rechazados. Cada una con badge pill coloreado (blue, amber, green, red).
- **Empty states:** Reemplazado `<EmptyState>` genérico por empty states in-line con ícono en contenedor soft (`bg var(--t-hover) rounded-xl`), título y subtítulo centrados.
- **Card borders:** `rounded-2xl` → `rounded-xl` (12px) para coherencia con el Design System.
- **Modal close button:** Texto "X" → ícono `<X>` de lucide-react con hover interactivo.
- **Hover interactivo en sidebar:** `className` con Tailwind hover → `onMouseEnter/Leave` inline para usar variables CSS correctamente.

## Archivos creados

### `changes/2026-08-28_12-57_design-system-admission-documents/CHANGELOG.md`
Registro técnico detallado del cambio.

### `changes/2026-08-28_12-57_design-system-admission-documents/SUMMARY.md`
Resumen ejecutivo.

### `changes/2026-08-28_12-57_design-system-admission-documents/FILES_CHANGED.md`
Este archivo.

## Archivos eliminados
Ninguno.
