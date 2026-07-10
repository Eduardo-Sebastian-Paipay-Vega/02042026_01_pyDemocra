# Archivos modificados

## Modificados
- `ong/src/app/components/shared/ProjectHierarchySteps.tsx`:
  - `STEPS[].paths: string[]` → `STEPS[].path: string`; se quitan las rutas
    de Operaciones del step "Actividades".
  - Nueva función `resolveActiveIndex(pathname)` (coincidencia de prefijo
    más específica) reemplaza el `Array.prototype.findIndex` anterior.
  - Cada nodo pasa de `<div>` a `<Link to={step.path}>` (import de `Link`
    agregado desde `react-router`).
- `ong/src/app/modules/projects/ProjectsWorkspace.tsx`:
  - Se elimina el bloque JSX de la barra de píldoras (`SECTION_META`
    renderizado como enlaces `rounded-full`).
  - Se quita el import de `Link` (ya sin uso en este archivo).

## Creados
- `changes/2026-07-10_08-10_stepper-navegable-y-scope-proyectos/CHANGELOG.md`
- `changes/2026-07-10_08-10_stepper-navegable-y-scope-proyectos/SUMMARY.md`
- `changes/2026-07-10_08-10_stepper-navegable-y-scope-proyectos/FILES_CHANGED.md`

## Eliminados
Ninguno.

## Carpetas afectadas
- `ong/src/app/components/shared/`
- `ong/src/app/modules/projects/`
- `changes/2026-07-10_08-10_stepper-navegable-y-scope-proyectos/` (nueva).
