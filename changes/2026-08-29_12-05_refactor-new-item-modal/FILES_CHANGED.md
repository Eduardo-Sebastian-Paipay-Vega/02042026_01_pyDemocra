# Archivos Modificados

- `ong/src/app/pages/Inventory.tsx`
  - Se añadió el estado `itemFormErrors` para manejar errores visuales.
  - Se importó el ícono `X` de `lucide-react`.
  - Se reescribió completamente el layout del Modal de Creación/Edición de Ítems (validaciones, switch, grid layout).
  - Se reinicia `itemFormErrors` al abrir el modal desde el Header.
- `src/core/components/ui/image-upload-field.tsx`
  - Se corrigieron strings corruptos (`aqu├¡` -> `aquí`, `bot├│n` -> `botón`).
