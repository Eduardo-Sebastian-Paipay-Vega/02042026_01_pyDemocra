# Changelog — Stepper de jerarquía: nodo activo correcto, navegación y alcance exclusivo a Proyectos

## Fecha y hora
2026-07-10, 08:10

## Objetivo del cambio
Corregir el iluminado del flujo/stepper superior (Proyectos → Actividades →
Tareas → Asignaciones), convertir sus nodos en enlaces de navegación
reemplazando la barra de píldoras duplicada, y sacarlo por completo del
módulo Operaciones.

## Contexto del problema
- REQ-010 (`REQ007.md`): el usuario reportó que en "Asignaciones" solo el
  último segmento de línea aparecía resaltado, en vez de resaltarse todo el
  camino desde "Proyectos".
- REQ-011 (`REQ007.md`): existía una barra secundaria de botones tipo
  píldora debajo del título, redundante con el flujo superior.
- REQ-012 (`REQ008.md`): el mismo stepper aparecía también en el módulo
  Operaciones (ej. "Asistencias"), sin relación jerárquica real con esas
  pantallas.

## Causa raíz encontrada (no solo un ajuste de estilos)
Al leer `ong/src/app/components/shared/ProjectHierarchySteps.tsx` se
confirmó un bug más profundo del que describía el requerimiento: el nodo
"activo" se resolvía con `Array.prototype.findIndex` recorriendo `STEPS` en
orden de declaración, comprobando prefijos de ruta
(`pathname.startsWith(p + "/")`). Como "Proyectos" (`/app/ong/projects`) es
un prefijo literal de las rutas de sus tres hermanos
(`/app/ong/projects/activities`, `/tasks`, `/assignments`) y se declara
primero en el array, **cualquier ruta anidada bajo Proyectos coincidía
primero con "Proyectos"**, no con la sección real. La lógica de iluminado
acumulativo (`isPast = idx < activeIndex`) en sí ya era correcta — el
problema estaba río arriba, en qué índice se consideraba "activo".
Se reemplazó `findIndex` por una resolución que prioriza la coincidencia de
prefijo más larga (más específica) entre todos los steps, sin importar el
orden de declaración.

Adicionalmente, el propio archivo declaraba explícitamente las rutas de
Operaciones (`operation/attendance`, `operation/hours`, `operation/evidence`)
dentro de los `paths` del step "Actividades" — no era un layout compartido
"filtrando" por accidente (aunque el montaje en `AppShell` también es
global), sino una inclusión intencional pero incorrecta según REQ-012.

## Solución implementada
En `ong/src/app/components/shared/ProjectHierarchySteps.tsx`:
- Cada step pasa de `paths: string[]` a un único `path: string` (ya no
  necesita una lista, tras quitar las rutas de Operaciones).
- Se quitan `operation/attendance`, `operation/hours`, `operation/evidence`
  del step "Actividades" (REQ-012). Al no matchear ninguna ruta de
  Operaciones, `resolveActiveIndex` devuelve `-1` ahí y el componente sigue
  retornando `null` (comportamiento ya existente, `if (activeIndex === -1)
  return null`) — se resuelve sin tocar `AppShell.tsx` ni condicionar el
  layout compartido.
- Nueva función `resolveActiveIndex(pathname)`: recorre todos los steps y
  se queda con el de coincidencia de prefijo más larga, en vez de la
  primera coincidencia en orden de array (REQ-010, causa raíz).
- Cada nodo circular ahora es un `<Link to={step.path}>` de `react-router`
  en vez de un `<div>` estático (REQ-011), conservando exactamente los
  mismos estilos de iluminado/tamaño/color.

En `ong/src/app/modules/projects/ProjectsWorkspace.tsx`:
- Se eliminó la barra secundaria de botones tipo píldora (`SECTION_META`
  renderizado como enlaces `rounded-full`) que quedaba debajo del título de
  cada vista del módulo Proyectos (REQ-011). `SECTION_META` en sí se
  conserva: sigue usándose para resolver `meta.title`/`meta.description`
  del `PageHeader`.
- Se quitó el import de `Link` de `react-router`, que quedó sin uso tras
  eliminar la barra.

## Riesgos identificados
- Al convertir los nodos en `<Link>`, el contenedor pasó de `<div
  className="flex items-center shrink-0">` con un `<div>` interno a envolver
  un `<Link>` con los mismos estilos flex/gap — se revisó visualmente en el
  código que las clases y `style` inline se preservan 1:1, pero no se pudo
  confirmar con captura de pantalla real en esta sesión (ver limitación de
  entorno de tandas anteriores).
- El fix de `resolveActiveIndex` cambia el nodo activo detectado en
  ProjectHierarchySteps para *todas* las rutas del módulo Proyectos, no solo
  Asignaciones — es un cambio de comportamiento más amplio que el reportado
  explícitamente en REQ-010, pero es la corrección correcta de la causa
  raíz real (antes, el stepper prácticamente siempre mostraba "Proyectos"
  como activo en cualquier ruta anidada).

## Impacto esperado
El nodo y el camino de conectores correctos se iluminan según la sección
real en la que está el usuario; los nodos navegan directamente a su
sección; el stepper deja de aparecer en Operaciones.

## Módulos afectados
- `ong/src/app/components/shared/ProjectHierarchySteps.tsx`
- `ong/src/app/modules/projects/ProjectsWorkspace.tsx`

## Dependencias involucradas
Ninguna nueva.

## Posibles efectos secundarios
Ninguno esperado en Operaciones: el resto de la vista "Asistencias"
(estadísticas, filtros, tabla, botones de manual/QR) no fue tocado, solo se
modificó la configuración de rutas del stepper compartido.

## Estado del cambio
Completado. Verificado con `tsc --noEmit` (0 errores nuevos en los archivos
tocados). No se realizó verificación visual con navegador headless en esta
sesión (misma limitación de entorno de las tandas anteriores) — se
recomienda navegar manualmente por Proyectos → Actividades → Tareas →
Asignaciones y por una vista de Operaciones para confirmar el
comportamiento visual antes de considerar esta tanda 100% verificada.
