# CHANGELOG — Investigación: alcance de la duplicación ong/src vs src/modules/ong

**Fecha:** 2026-07-12
**Hora:** 11:00 (America/Lima)
**Autor:** Claude Sonnet 5 (Claude Code)
**Estado:** Completado (investigación y documento de decisión — sin refactor de código, según lo acordado con el usuario)

## Objetivo del cambio

Mapear con precisión el alcance real de la divergencia entre `ong/src/app/` (SPA standalone servida en `/ong`) y `src/modules/ong/app/` (copia embebida usada por el shell multi-industria de `src/industries/ong/`), identificada como hallazgo no obvio durante la Fase 1 de esta sesión. El usuario confirmó que la arquitectura multi-tenant/multi-industria es intencional, pero pidió investigar el alcance real de la divergencia de código antes de decidir qué hacer — **sin ejecutar ningún refactor todavía**.

## Contexto del problema

`ong/src/app/services/shared/storage.ts` y `src/modules/ong/app/services/shared/storage.ts` (el archivo que se corrigió en la Fase 2 de esta sesión) ya habían divergido en nombres de variables de entorno y casts de tipos antes de que llegáramos a tocarlo. Esto planteó la pregunta: ¿cuántos archivos más están en esta misma situación?

## Metodología

Se compararon los árboles de archivos de ambas copias por ruta relativa (ej. `app/tenant/bootstrap.ts` en ambas), se clasificaron en 4 categorías, y se sampleó el contenido de varios archivos representativos para entender la NATURALEZA de la divergencia (no solo contarla).

## Hallazgos

### Números generales

| | Cantidad |
|---|---|
| Archivos totales en `ong/src/` | 398 |
| Archivos totales en `src/modules/ong/` | 292 |
| Archivos con la misma ruta relativa en ambas copias | 289 |
| — de esos, **idénticos byte a byte** | 154 |
| — de esos, **divergidos** | **135 (46.7%)** |
| Archivos que existen SOLO en `ong/src/` | 109 |
| Archivos que existen SOLO en `src/modules/ong/` | 3 |

### Los 135 archivos divergidos NO son homogéneos — dos categorías muy distintas

1. **3 archivos son "shims" intencionales, no duplicación real**: `app/tenant/navigation.tsx` (647 líneas en `ong/src` vs **21 líneas** en `src/modules/ong`), `app/tenant/permissions.ts` (82 vs 10 líneas), `app/components/layout/AppShell.tsx` (291 vs **1 línea**). La versión de `src/modules/ong` de estos 3 archivos es literalmente un `export { ... } from "../../../../core/tenant/navigation"` — un adaptador delgado que re-exporta desde una capa ya compartida en `src/core/tenant/*`. Esto **no es deuda técnica**, es el patrón correcto ya aplicado parcialmente.
2. **132 archivos son duplicados genuinos e independientes** que han divergido de verdad en su contenido — tamaños comparables entre ambas copias (no hay un "shim" del lado de `src/modules/ong`). Confirmado con una muestra de `app/services/proyectos/activities.service.ts` (414 líneas de diff): los nombres de campos de la fila de base de datos difieren entre copias (`id_proyecto` vs `id_tarea`, shape distinto de `TaskDbRow`) — es decir, **cada copia asume un modelo de datos ligeramente distinto para la misma entidad**, no es solo una diferencia cosmética de imports.

Los 10 archivos con más líneas de diferencia (todos en la categoría "duplicado genuino"):

| Archivo | Líneas de diff |
|---|---|
| `app/pages/Courses.tsx` | 922 |
| `app/tenant/navigation.tsx` *(shim, ver arriba — no cuenta como deuda real)* | 668 |
| `app/pages/Attendance.tsx` | 638 |
| `app/services/proyectos/activities.service.ts` | 414 |
| `app/services/academico/cursos.service.ts` | 409 |
| `app/modules/people/components/IdCardTemplatePanels.tsx` | 400 |
| `app/pages/HoursApproval.tsx` | 366 |
| `app/services/admision/solicitudesAdmision.service.ts` | 340 |
| `app/pages/AccessControl.tsx` | 328 |
| `app/services/proyectos/tasks.service.ts` | 325 |

El core del sistema de tenant (`bootstrap.ts`, `screens.tsx`, `TenantBootstrapProvider.tsx` — la lógica que resuelve tenant/módulos/permisos, cubierta con tests nuevos en la Fase 3 de esta sesión) también está en esta categoría: son implementaciones completas e independientes en ambas copias (784/272/318 líneas en `src/modules/ong` vs 819/204/185 en `ong/src`), no shims.

### Archivos que solo existen en `ong/src/` (109)

Incluyen, entre otros:
- **Todo el sistema de credenciales ID en PDF** (`idCardBatch.ts`, `idCardPdfExport.ts` — el mismo módulo que se actualizó en la Fase 1 al subir `jspdf` a v4 —, `idCardTemplateSchema.ts`, `idCardUnits.ts`, `IdCardCanvasEditor.tsx`, `IdCardTemplateWizard.tsx`): **`src/modules/ong` no tiene esta funcionalidad en absoluto**.
- Archivos de entrada/shell propios de una SPA standalone (`App.tsx`, `PublicLayout.tsx`, `ErrorBoundary.tsx`, `RouteLoadingFallback.tsx`) — tiene sentido que difieran, ya que `src/modules/ong` se monta dentro del shell de `src/industries/ong/OngShell.tsx`, no tiene su propio punto de entrada.
- **TODOS los archivos de test** (`*.test.ts(x)`, carpetas `__tests__/`) — `src/modules/ong` no tiene ni un solo archivo de test propio. Esto incluye los tests nuevos agregados en la Fase 3 de esta sesión (`navigation.test.ts`, `bootstrap-context.test.ts`, `screens.test.tsx`): **cubren la lógica de `ong/src`, pero no protegen en absoluto la implementación paralela y divergida de `src/modules/ong`**, que tiene su propio `bootstrap.ts`/`screens.tsx` con bugs potencialmente distintos.

### Archivos que solo existen en `src/modules/ong/` (3)

`useNotificationHistoryMutations.ts`, `useNotificationsRealtime.ts` (hooks de notificaciones en tiempo real que `ong/src` no tiene), y `pages/landing/LoginPage.tsx` (tiene sentido: `src/modules/ong` vive dentro de la app raíz multi-tenant, que tiene su propio login compartido entre industrias).

### Consumidores reales de cada copia

- `ong/src/app/*` → servida standalone en `/ong` (segunda app de la MPA nativa de Vite, ver `vite.config.js` y `ONG/index.html`).
- `src/modules/ong/app/*` → importada por `src/industries/ong/{OngShell.tsx, registry.tsx}` y por `src/core/tenant/{industryRegistry.tsx, moduleRegistry.tsx, access.ts, index.ts, navigation.ts}` — es el módulo "ong" dentro del shell multi-industria de la app raíz `/`, que soporta múltiples tipos de industria (ong, gym, ...) bajo una misma sesión/login.

## Opciones para unificar (recomendación, sin ejecutar)

1. **Extender el patrón de shim ya probado (recomendado)**: `navigation.tsx`, `permissions.ts` y `AppShell.tsx` ya demuestran que el patrón "lógica compartida en `src/core/tenant/*` + adaptador delgado en cada copia" funciona en este mismo codebase. La ruta de menor riesgo es migrar los 132 archivos genuinamente duplicados (empezando por el núcleo: `bootstrap.ts`, `screens.tsx`, `TenantBootstrapProvider.tsx`, que ya tienen tests nuevos en `ong/src` que servirían de red de seguridad) hacia esa misma capa compartida, dejando ambas copias como adaptadores delgados. Esto es un proyecto de varias sesiones dado el tamaño (132 archivos), no algo para una sola sesión.
2. **Formalizarlas como productos deliberadamente distintos**: si hay una razón real de negocio para que `/ong` standalone y el módulo embebido difieran (por ejemplo, flujos de autenticación distintos), documentar explícitamente cuáles archivos son "libres de divergir a propósito" y cuáles deberían mantenerse en sync — pero el 53% de archivos compartidos que siguen siendo idénticos sugiere que la intención original SÍ era mantenerlos iguales, y la divergencia es deriva no intencional, no diseño.
3. **Retirar una de las dos copias**: si `/ong` standalone es la dirección estratégica (o si lo es el shell multi-industria embebido), evaluar deprecar la otra. Esto requiere una decisión de producto/negocio que no me corresponde tomar — el usuario debe decidir cuál es la dirección real antes de que cualquier trabajo de unificación tenga sentido.

## Riesgos identificados

- Esta es una investigación de solo lectura — **no se modificó ningún archivo de código**.
- El hallazgo de que `src/modules/ong` tiene 0% de cobertura de test propia (a pesar de tener implementaciones completas e independientes de lógica crítica como resolución de tenant/permisos) es un riesgo de producción real y separado de la duplicación en sí — si se decide NO unificar en el corto plazo, valdría la pena al menos espejar los tests de `tenant/` (Fase 3 de esta sesión) hacia `src/modules/ong/app/tenant/`, dado que son implementaciones independientes con la misma criticidad de negocio.

## Impacto esperado

Ninguno — documento de investigación, cero cambios de código.

## Módulos afectados

Ninguno (solo este documento).

## Verificación realizada

No aplica (investigación de solo lectura).

## Cómo revertir

No aplica — no se modificó código.
