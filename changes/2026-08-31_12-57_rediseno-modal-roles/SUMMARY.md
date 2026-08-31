# SUMMARY — Rediseño modal de creación/edición de roles

## Qué se hizo
Rediseño completo del modal de creación/edición de roles en la vista de Settings → Roles del módulo ONG. Se corrigieron 6 problemas de maquetación, accesibilidad y limpieza de datos.

## Por qué se hizo
El modal exponía artefactos internos del backend (nombres de funciones Postgres, claves técnicas), tenía checkboxes desalineados por un wrapper `<div>` innecesario, y el botón principal no cumplía guías de contraste WCAG.

## Qué beneficio aporta
- Interfaz profesional sin fugas de código backend.
- Checkboxes perfectamente alineados en layout horizontal.
- Feedback visual claro de permisos seleccionados (borde azul + fondo tintado).
- Contraste WCAG AAA en el botón principal.
- Modal más compacto con instrucciones integradas.

## Funcionalidades afectadas
- Modal "Nuevo rol" / "Editar rol" en `/ong/app/settings/roles`.
- Sanitización de descripciones de permisos (también afecta la tabla de detalle de rol y el catálogo de permisos, donde se usa la misma función).
