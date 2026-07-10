# Changelog — Formulario "Crear proyecto": código automático, etiqueta real del presupuesto, ruta de imagen y espaciado

## Fecha y hora
2026-07-10, 07:57

## Objetivo del cambio
Resolver los 4 requerimientos de `dds/MEJORAS/09072026/REQ006.md` (REQ-006 a
REQ-009) sobre el modal "Crear proyecto"/"Crear actividad": quitar la
captura manual del código, etiquetar correctamente el campo numérico sin
nombre, confirmar y afinar la carga de imagen, y reducir espacios en blanco
del formulario.

## Contexto del problema
- REQ-006: el campo "Código" era editable con placeholder "auto si vacío",
  pero el usuario pidió que nunca se le pida escribirlo.
- REQ-007: un campo numérico con valor por defecto "0" no mostraba ninguna
  etiqueta visible; el usuario sospechaba "número de participantes" sin
  confirmarlo.
- REQ-008: dudas sobre si la carga de imagen del proyecto efectivamente
  sube y persiste el archivo.
- REQ-009: espacios en blanco excesivos en los modales "Crear proyecto" y
  "Crear actividad" (mismo componente de formulario).

## Cruce con el esquema real de producción y con el propio código del backend
Antes de tocar la UI se revisó tanto `dds/MEJORAS/BD_viva_09072026.txt` como
`ong/src/app/services/proyectos/projects.service.ts` y
`ong/src/app/utils/generateCode.ts`:
- **REQ-006**: `createProject()` (`projects.service.ts:772-775`) YA genera un
  código correlativo (`generateProjectCode`, formato `PROJ-XXX` por tenant)
  cada vez que `input.code` llega vacío, con reintento implícito vía
  `ensureProjectCodeAvailable` antes del insert. La única falta era la UI:
  el input de texto seguía permitiendo (e invitando) a teclear un código
  manual. No hizo falta ningún cambio de backend.
- **REQ-007**: `ong.proyectos.presupuesto numeric default 0` es la columna
  real detrás del campo "0" sin etiqueta (confirmado en el esquema; además
  `buildProjectPayload()` ya usa el mensaje de error "El presupuesto debe
  ser un numero mayor o igual a cero" para ese mismo campo). No existe
  ninguna columna de "participantes" en `ong.proyectos`. Por instrucción
  explícita del propio REQ-007 ("en caso de que el campo corresponda a
  presupuesto, informar la discrepancia en lugar de aplicar directamente el
  rótulo solicitado"), se etiquetó como "Presupuesto", no como "Número de
  participantes".
- **REQ-008**: se rastreó el flujo completo — `uploadFileToStorage()` sube el
  archivo al bucket `avatars`/`assets` (según `getAssetsUploadBucket()`),
  `resolvedImageUrl` se asigna a `formWithUrl.imageUrl`, que llega a
  `buildProjectPayload()` como `imagen_url` y se persiste en el INSERT/UPDATE
  de `ong.proyectos`. Los errores de subida ya se capturan y muestran con
  `toast.error(...)`. **Conclusión: la carga de imagen ya funcionaba de
  punta a punta**, no estaba rota. Se encontró y corrigió un defecto menor:
  el segmento de ruta de Storage usaba `projectForm.code`, que ahora (tras
  el cambio de REQ-006) siempre llega vacío al momento de subir la imagen,
  amontonando todas las imágenes de proyectos nuevos bajo
  `proyectos/proyecto/...` en vez de tener una ruta identificable por
  proyecto (no había pérdida ni colisión de archivos porque
  `uploadFileToStorage` ya antepone un timestamp único al nombre de
  archivo, pero sí era una carpeta poco organizada).

## Solución implementada
En `ong/src/app/modules/projects/ProjectsWorkspace.tsx`:
- Se quitó el `InputField` del campo "Código" del formulario de
  proyectos (ambos casos, crear y editar comparten el mismo modal).
  `projectForm.code` se conserva en el estado (usado al editar un proyecto
  existente) pero ya no es editable desde este formulario.
- El campo numérico de presupuesto ahora tiene una etiqueta visible
  ("Presupuesto") sobre el input, en vez de depender únicamente del
  atributo `placeholder`, que nunca se veía porque el valor por defecto ya
  es `"0"` (no vacío). No se tocó ninguna otra etiqueta del formulario.
- El segmento de ruta de Storage para la imagen del proyecto pasó de
  `projectForm.code || "proyecto"` a `editingProjectId ?? projectForm.name
  || "nuevo"` — usa un identificador realmente disponible en ese momento.
- Fecha inicio/fin se agruparon en una fila explícita (`grid grid-cols-2`
  propio) para que siempre queden emparejadas visualmente, sin depender del
  flujo natural del grid (que se rompió justamente al quitar el campo
  Código, por el corrimiento de columnas).
- El contenedor del cuerpo del modal pasó de `space-y-4` a `space-y-3`
  (menos aire vertical entre secciones), aplicado tanto a "Crear proyecto"
  como a "Crear actividad" por compartir el mismo componente.

## Riesgos identificados
- El ajuste de espaciado (REQ-009) se aplicó solo al formulario de
  Proyectos/Actividades (las dos evidencias concretas del requerimiento).
  El propio REQ-009 pide aplicarlo "de forma consistente" a todos los
  popups de formularios de la aplicación; auditar y ajustar el resto de
  modales del sistema queda fuera del alcance de esta tanda y se recomienda
  como seguimiento.
- El correlativo `generateProjectCode` no usa una secuencia atómica de base
  de datos — dos creaciones simultáneas del mismo tenant podrían competir
  por el mismo número; `ensureProjectCodeAvailable` lo detecta antes del
  insert y lanza un error claro (no se pierde integridad de datos, pero el
  usuario tendría que reintentar). Esto ya existía antes de este cambio, no
  se introdujo ahora.

## Impacto esperado
El usuario ya no ve ni puede tocar un campo de código en "Crear proyecto";
el campo de presupuesto tiene una etiqueta correcta y visible; las imágenes
de proyectos nuevos quedan mejor organizadas en Storage; el formulario se
ve más denso/compacto.

## Módulos afectados
- `ong/src/app/modules/projects/ProjectsWorkspace.tsx` (único archivo
  tocado — cubre los formularios de Proyectos y Actividades, que comparten
  el mismo modal).

## Dependencias involucradas
Ninguna nueva.

## Posibles efectos secundarios
Ninguno esperado sobre `updateProject` (edición): sigue recibiendo
`projectForm.code` intacto desde el estado precargado al abrir el modal en
modo edición, solo dejó de ser editable por el usuario.

## Estado del cambio
Completado. Verificado con `tsc --noEmit` (0 errores nuevos en el archivo
tocado). No se probó manualmente contra Supabase real la creación de un
proyecto end-to-end en esta sesión (misma limitación de entorno de las
tandas anteriores) — se recomienda una prueba manual antes de dar por
cerrado REQ-008 en producción.
