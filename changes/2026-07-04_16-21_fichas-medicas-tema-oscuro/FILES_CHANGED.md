# FILES_CHANGED — Tema oscuro navy/cyan para Fichas Médicas

## Modificados

- **`ONG/src/app/pages/MedicalRecords.tsx`** — se agregó la clase `fichas-medicas-theme` al `<motion.div>` raíz del componente (junto a la clase `space-y-6` existente). Ningún otro cambio en el archivo.
- **`ONG/src/app/modules/people/components/MedicalRecordPanels.tsx`** — se agregó `className="fichas-medicas-theme"` a las 3 invocaciones de `<ModalShell>` (Motivo de acceso sensible, Detalle de ficha sensible, Registrar/Editar ficha sensible). Ningún otro cambio.
- **`ONG/src/styles/index.css`** — se agregó al final del archivo un nuevo bloque CSS con la regla `[data-app-theme="oscuro"] .fichas-medicas-theme { ... }` (paleta completa) y una regla adicional para corregir el badge morado de `StatusDot` dentro de ese mismo scope.

## Creados

- `changes/2026-07-04_16-21_fichas-medicas-tema-oscuro/CHANGELOG.md`
- `changes/2026-07-04_16-21_fichas-medicas-tema-oscuro/SUMMARY.md`
- `changes/2026-07-04_16-21_fichas-medicas-tema-oscuro/FILES_CHANGED.md`

## Eliminados

Ninguno.

## Carpetas afectadas

- `ONG/src/app/pages/`
- `ONG/src/app/modules/people/components/`
- `ONG/src/styles/`
- `changes/` (nueva, creada por esta política de auditoría)
