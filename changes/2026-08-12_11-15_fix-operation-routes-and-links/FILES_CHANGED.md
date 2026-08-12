# FILES CHANGED

## Archivos Modificados

- **`ong/src/app/routes.tsx`**
  - Añadida ruta `operation` que redirige a `/app/ong/operation/attendance`.
  - Añadida ruta `operation/activities` que redirige a `/app/ong/projects/activities`.
  - Añadidas subrutas alias en español `operation/asistencias`, `operation/horas`, `operation/evidencias`.
  - Añadidos alias globales `/operacion`, `/operacion/*`, `/horas`, `/evidencias` a `spanishRouteRedirects`.

- **`ong/src/app/modules/home/homeSearchService.ts`**
  - Corregido el valor de retorno para entidades de tipo `activity` a `/app/ong/projects/activities?${params.toString()}`.

- **`src/modules/ong/app/modules/home/homeSearchService.ts`**
  - Sincronizado el valor de retorno para entidades de tipo `activity` a `/app/ong/projects/activities?${params.toString()}`.
