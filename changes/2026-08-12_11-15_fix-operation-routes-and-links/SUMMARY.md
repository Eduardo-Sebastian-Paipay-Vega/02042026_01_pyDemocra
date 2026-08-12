# SUMMARY

## Qué se hizo
- Se resolvieron los fallos de navegación de `/app/ong/operation` configurando un redireccionamiento automático a la subruta activa predeterminada `/app/ong/operation/attendance`.
- Se corrigió el target de redirección de búsqueda global de actividades de `/app/ong/operation/activities` hacia la ruta correcta de actividades de proyecto `/app/ong/projects/activities`.
- Se añadieron alias y redirecciones de seguridad para rutas compuestas y en español (`/app/ong/operation/asistencias`, `/app/ong/operation/horas`, `/app/ong/operation/evidencias`, `/operacion`, etc.).

## Por qué se hizo
- La ausencia de una ruta para `/app/ong/operation` provocaba un error de React Router (o caída a la ruta raíz `/`) cuando los usuarios ingresaban esa dirección directamente o navegaban por derivados no mapeados.

## Qué beneficio aporta
- Navegación robusta e intuitiva sin pantallas rotas ni errores 404.
- Compatibilidad completa con búsquedas globales y enlaces directos en español.

## Qué funcionalidades quedaron afectadas
- Enrutamiento del módulo de Operación (`ong/src/app/routes.tsx`) y servicio de búsqueda global (`homeSearchService.ts`).
