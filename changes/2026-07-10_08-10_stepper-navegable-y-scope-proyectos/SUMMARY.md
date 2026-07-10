# Resumen ejecutivo

## Qué se hizo
Se corrigió el flujo/stepper de Proyectos → Actividades → Tareas →
Asignaciones para que ilumine el camino completo hasta la sección activa
real (no solo "Proyectos" por un bug de coincidencia de rutas), se
convirtieron sus nodos en enlaces de navegación reemplazando la barra de
botones duplicada de abajo, y se sacó por completo del módulo Operaciones.

## Por qué se hizo
REQ-010, REQ-011 y REQ-012 (`dds/MEJORAS/09072026/REQ007.md`,
`REQ008.md`) señalaron estos tres problemas sobre el mismo componente
compartido.

## Qué beneficio aporta
- Se encontró y corrigió la causa raíz real (un bug de resolución de rutas
  por prefijo, no solo un tema de estilos de "iluminado"), que afectaba a
  todo el módulo Proyectos, no solo a la vista de Asignaciones reportada.
- Una sola forma de navegar entre las cuatro secciones (los nodos), en vez
  de dos controles redundantes.
- El stepper deja de confundir a los usuarios de Operaciones, que no tiene
  relación jerárquica con Proyectos/Actividades/Tareas/Asignaciones.

## Qué funcionalidades quedaron afectadas
Ninguna se rompió. El resto de la vista "Asistencias" (y demás pantallas de
Operaciones) no se tocó. La navegación lateral (sidebar) tampoco se
modificó — este cambio es un método de navegación adicional, no un
reemplazo.
