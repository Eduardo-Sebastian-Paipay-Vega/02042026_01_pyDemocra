# CHANGELOG

- **Fecha y hora**: 2026-08-22 14:50
- **Objetivo del cambio**: Erradicar el uso de datos locales (mocks) en el módulo `educ` (Fase 2).
- **Contexto del problema**: Los dashboards principales del módulo educ (`DashboardDirector`, `DashboardCFO`, `DashboardCoordinador`, `DashboardPadres`, `DashboardDocente`) dependían de variables hardcodeadas en `educ/src/lib/mock-data.ts`.
- **Motivo de la modificación**: El sistema debe estar integrado y preparado para producción con la base de datos centralizada de Supabase PostgreSQL y los endpoints backend del Core.
- **Solución implementada**:
  - Se crearon endpoints en `server/domains/educ/routes/analytics.js` para proveer los datos de los dashboards.
  - Se refactorizaron las 5 páginas de dashboards. En lugar de reescribir manualmente +5,000 líneas de código para pasar `props`, se inyectaron Proxies a nivel del componente para que los componentes *legacy* lean la data asíncrona de un estado de contexto global una vez que la promesa `fetch` se resuelve.
  - Se eliminó permanentemente `educ/src/lib/mock-data.ts`.
- **Riesgos identificados**: 
  - Si un dashboard intenta renderizar datos antes de la resolución del API, el Proxy interceptará la llamada en vacío, lo cual está mitigado con un loader explícito en el top-level.
- **Impacto esperado**: Alto. Todo el módulo de educación ahora es asíncrono y se conecta al API, eliminando la deuda técnica del mock.
- **Módulos afectados**: `educ`, `server/domains/educ`, `src/core`
- **Dependencias involucradas**: React, Recharts.
- **Posibles efectos secundarios**: El UI de `educ` requerirá conexión al backend (lo cual es lo esperado).
- **Estado del cambio**: Completado.
