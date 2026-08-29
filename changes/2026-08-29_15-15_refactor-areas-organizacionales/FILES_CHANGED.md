# Archivos Modificados - Refactor Áreas Organizacionales

1. **`ong/src/app/pages/Areas.tsx`**
   - Importación del componente `Badge`.
   - Adición de debounce (`debouncedSearch`) y `useEffect` con `setTimeout` (400ms) para la búsqueda.
   - Eliminación de la acción repetida `Nueva área` en el `FilterBar`.
   - Modificación de las columnas de `DataTable` para estructurar la jerarquía visual del "Código de Área".
   - Inclusión de la nueva columna "Proyectos" con contador numérico.
   - Modificación de estilos y variantes en `tableActions`.

2. **`ong/src/app/services/gobernanza/areas.service.ts`**
   - Agregado `projectCount: number` a las interfaces `AreaRow`.
   - Modificación de todas las queries `select()` (en `listAreas`, `createArea`, `updateArea`) para solicitar `proyectos(count)`.
   - Lógica de extracción del conteo de proyectos en la función mapper `mapArea`.
