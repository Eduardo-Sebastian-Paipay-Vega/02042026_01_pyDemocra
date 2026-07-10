# Archivos modificados

## Modificados
- `ong/src/app/modules/projects/ProjectsWorkspace.tsx`:
  - Se elimina el `InputField` del campo "Código" en el formulario de
    proyectos.
  - Se agrega un label visible ("Presupuesto") sobre el `InputField`
    numérico correspondiente a `ong.proyectos.presupuesto`.
  - `pathSegments` de `uploadFileToStorage` para la imagen del proyecto
    cambia de `["proyectos", projectForm.code || "proyecto"]` a
    `["proyectos", editingProjectId ?? projectForm.name || "nuevo"]`.
  - Fecha inicio/fin se agrupan en un sub-grid propio de 2 columnas.
  - El contenedor del cuerpo del modal pasa de `space-y-4` a `space-y-3`.

## Creados
- `changes/2026-07-10_07-57_form-crear-proyecto/CHANGELOG.md`
- `changes/2026-07-10_07-57_form-crear-proyecto/SUMMARY.md`
- `changes/2026-07-10_07-57_form-crear-proyecto/FILES_CHANGED.md`

## Eliminados
Ninguno.

## Carpetas afectadas
- `ong/src/app/modules/projects/`
- `changes/2026-07-10_07-57_form-crear-proyecto/` (nueva).
