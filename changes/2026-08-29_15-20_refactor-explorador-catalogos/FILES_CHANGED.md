# FILES CHANGELOG

- `src/modules/ong/app/pages/Catalogs.tsx`
  - **Modificado**: Importaciones actualizadas para usar `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue` y `Library` (de lucide-react). Eliminadas dependencias sin uso (`GradientButton`, `OutlineButton`).
  - **Modificado**: Columna `support` removida de la constante `columns`.
  - **Modificado**: UI del banner de advertencia (`Alert`) reescrita a lenguaje humano en lugar de mostrar `public.cat_permissions`.
  - **Modificado**: Sección de filtros transformada de `summaryButtons` map a un único componente `Select`.
  - **Modificado**: Modal de detalle, donde se quitó el bloque que renderizaba `selectedCatalog.sourceReference` ya que mostraba rutas internas del proyecto.
