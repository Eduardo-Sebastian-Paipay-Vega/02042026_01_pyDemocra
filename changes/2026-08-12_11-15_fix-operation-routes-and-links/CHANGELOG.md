# CHANGELOG

- **Fecha y Hora:** 2026-08-12 11:15:00 -05:00
- **Objetivo del Cambio:** Corregir los errores de enrutamiento al navegar a `http://localhost:5173/ong/app/ong/operation` y sus enlaces derivados.
- **Contexto del Problema:** Al ingresar a `/ong/app/ong/operation` o hacer clic en resultados de búsqueda global de actividades o enlaces derivados como `/app/ong/operation/activities`, React Router devolvía un error de ruta no encontrada (404/redirect fallido) porque la ruta raíz del módulo Operación (`/app/ong/operation`) no estaba declarada explícitamente en el router de la SPA (`routes.tsx`), y las actividades pertenecían a la ruta `/app/ong/projects/activities`.
- **Motivo de la Modificación:** Permitir navegación limpia, fluida y transparente tanto para las rutas directas de Operación como para búsquedas y aliases en español.
- **Solución Implementada:**
  1. En `ong/src/app/routes.tsx`, se agregaron las redirecciones de la ruta base `/app/ong/operation` hacia `/app/ong/operation/attendance` (sección principal de asistencia).
  2. Se agregó la redirección para `/app/ong/operation/activities` redirigiendo a `/app/ong/projects/activities`.
  3. Se agregaron alias y redirecciones en español (`/app/ong/operation/asistencias`, `/app/ong/operation/horas`, `/app/ong/operation/evidencias`, `/operacion`, `/horas`, `/evidencias`).
  4. Se actualizó `homeSearchService.ts` para apuntar los resultados de búsqueda de actividades a la ruta correcta `/app/ong/projects/activities`.
- **Riesgos Identificados:** Ninguno. Los cambios son puramente declarativos de enrutamiento y no alteran estados de BD ni contratos de API.
- **Impacto Esperado:** Alta disponibilidad en la navegación de Operación y prevención de errores de pantalla en blanco o 404 al usar enlaces derivados.
- **Módulos Afectados:** Módulo de Operación y Búsqueda Global (`ong/src/app/routes.tsx`, `homeSearchService.ts`).
- **Dependencias Involucradas:** `react-router`.
- **Posibles Efectos Secundarios:** Ninguno.
- **Estado del Cambio:** Completado.
