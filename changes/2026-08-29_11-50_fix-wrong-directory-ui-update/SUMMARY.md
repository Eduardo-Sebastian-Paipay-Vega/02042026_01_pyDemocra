# Resumen de Cambios

## Qué se hizo
Se aplicaron las mejoras de UX/UI en el inventario al directorio correcto `ong/src/app/pages/Inventory.tsx` que es el que actualmente sirve las rutas de `/ong/`. 

## Por qué se hizo
Las mejoras de la sesión pasada (como el cambio de tipografía, reubicación de botones de acción, iconos de refrescar, reemplazo de tenant, formato de SKU y visualización del layout de unidad/estado) se habían aplicado a `src/modules/ong/app/pages/Inventory.tsx`, el cual resultó ser un archivo obsoleto/no utilizado por el frontend live actual. El usuario reportó que "no veo los cambios realizados".

## Qué beneficio aporta
El módulo de ONG servido en `http://localhost:5173/ong/app/resources/inventory` ahora mostrará correctamente las mejoras visuales implementadas sin sacrificar la funcionalidad de Subida de Imágenes (`ImageUploadField`) que había sido agregada recientemente a este archivo activo.

## Qué funcionalidades quedaron afectadas
Se modernizó la vista `Inventory.tsx` del directorio activo `ong/src`. No se modificó la lógica de backend ni las consultas.
