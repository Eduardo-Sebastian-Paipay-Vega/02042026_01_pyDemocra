# Resumen ejecutivo

## Qué se hizo
En el modal "Crear proyecto"/"Crear actividad": se quitó el campo de código
manual (el backend ya lo generaba automáticamente, solo faltaba dejar de
mostrar el input), se etiquetó correctamente el campo de presupuesto, se
verificó y afinó la ruta de subida de la imagen del proyecto, y se redujo
el espaciado del formulario.

## Por qué se hizo
REQ-006 a REQ-009 (`dds/MEJORAS/09072026/REQ006.md`) reportaron estos cuatro
problemas puntuales sobre el mismo formulario.

## Qué beneficio aporta
- Los usuarios ya no pueden introducir códigos de proyecto inconsistentes o
  duplicados manualmente.
- El campo de presupuesto deja de ser un misterio ("un cero sin
  etiqueta") y se etiqueta con su significado real, evitando que en el
  futuro alguien lo mal-interprete como "número de participantes" (dato que
  no existe en la base de datos).
- Se confirmó formalmente que la carga de imágenes de proyecto **sí
  funciona** de punta a punta — dato importante porque el usuario tenía
  dudas activas al respecto.
- El formulario se ve más compacto.

## Qué funcionalidades quedaron afectadas
Ninguna se rompió. La edición de proyectos existentes sigue funcionando
igual (el código no cambia al editar, solo dejó de ser editable). El resto
de campos del formulario (nombre, área, estado, fechas, descripción) no se
tocó.
