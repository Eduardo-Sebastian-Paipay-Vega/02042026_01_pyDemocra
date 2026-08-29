# Archivos Modificados

- `ong/src/app/pages/Inventory.tsx`
  - Se añadieron importaciones para `Avatar`, `Package`, `RefreshCw` y `cn`.
  - Se modificaron las columnas de `itemColumns` y `locationColumns` para renderizar el `Avatar` y mejorar el diseño de texto (`CÓD:` , `flex` en unidades).
  - Se movió la acción principal a `getHeaderAction()` consumido por el `PageHeader`.
  - Se eliminó el botón de refresco original del `PageHeader` y se insertó como icono al lado de la información de paginación.
