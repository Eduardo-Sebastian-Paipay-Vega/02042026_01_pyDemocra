# FILES_CHANGED — Rediseño modal de creación/edición de roles

## Archivos modificados

### `ong/src/app/pages/Roles.tsx`
- **Líneas 80-90:** `sanitizePermissionDescription` — Añadidos 3 regex adicionales para eliminar `fn_` sin paréntesis, limpiar paréntesis vacíos y colapsar espacios dobles.
- **Líneas 587-604:** Header del modal — Título a 15px/semibold, subtítulo acortado a 11px, botón "X" reemplazado por SVG icon con `aria-label`.
- **Líneas 649-656:** Nueva sección "Permisos por módulo" con ícono Shield y contador de seleccionados.
- **Línea 657:** `max-h` del scroll aumentado de 420px a 480px.
- **Líneas 692-725:** Tarjetas de permiso rediseñadas: eliminado div wrapper del checkbox, añadido estado visual de selección (border + bg dinámicos), ID subido a 12px font-mono, colores mejorados.
- **Líneas 731-739:** Botón Guardar: color `#2563EB`, label contextual "Crear rol"/"Actualizar rol", padding y weight aumentados.

## Archivos creados

### `changes/2026-08-31_12-57_rediseno-modal-roles/CHANGELOG.md`
Documentación detallada del cambio.

### `changes/2026-08-31_12-57_rediseno-modal-roles/SUMMARY.md`
Resumen ejecutivo.

### `changes/2026-08-31_12-57_rediseno-modal-roles/FILES_CHANGED.md`
Este archivo.
