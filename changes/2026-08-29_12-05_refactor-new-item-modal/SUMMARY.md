# Resumen de Cambios

## Qué se hizo
Se refactorizó por completo el modal de "Nuevo Ítem" / "Editar Ítem" en el inventario y el componente `ImageUploadField`.

## Por qué se hizo
Para cumplir con los requerimientos tácticos del Prompt Maestro de UX/UI:
- El formulario no indicaba los campos obligatorios.
- Faltaba feedback visual durante validaciones de error antes del submit.
- El checkbox nativo para "Item activo" estaba mal alineado y no era profesional.
- El componente `ImageUploadField` tenía caracteres corruptos de codificación ("aqu├¡", "bot├│n").

## Qué beneficio aporta
- **UX Profesional:** El formulario ahora tiene una jerarquía clara, layout distribuido, indicadores de campos obligatorios (*) y bordes/textos de error en rojo al fallar la validación.
- **Componente Switch:** Se diseñó un interruptor (switch) limpio y moderno utilizando Tailwind CSS para gestionar el estado "Activo/Inactivo", con un texto de ayuda descriptivo.
- **Corrección de Strings:** Se resolvió el problema de codificación UTF-8 en el drag-and-drop de imágenes, devolviéndole su aspecto profesional.
- **Estado de Botón:** El botón de "Guardar" ahora muestra un spinner giratorio junto al texto "Guardando..." previniendo envíos duplicados con claridad.

## Qué funcionalidades quedaron afectadas
- UI del Modal de Ítems en `ong/src/app/pages/Inventory.tsx`.
- Textos del drag-and-drop en `src/core/components/ui/image-upload-field.tsx`.
