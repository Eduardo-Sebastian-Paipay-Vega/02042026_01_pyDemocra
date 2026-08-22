# FILES CHANGED

- `src/core/features/profile/ProfilePage.tsx` - Modificado para usar `/api/core/profile/preferences`
- `src/core/features/settings/SettingsPage.tsx` - Modificado para delegar persistencia al backend
- `server/domains/educ/routes/analytics.js` - Creado con los endpoints de datos de dashboards
- `server/domains/educ/routes/index.js` - Creado para montar el router en el API Gateway del Core
- `server/index.js` - Modificado para registrar la ruta `/api/educ`
- `educ/src/features/director/DashboardDirector.tsx` - Modificado para proxying de `analytics/director`
- `educ/src/features/finanzas/DashboardCFO.tsx` - Modificado para proxying de `analytics/cfo`
- `educ/src/features/coordinador/DashboardCoordinador.tsx` - Modificado para proxying de `analytics/coordinador`
- `educ/src/features/padres/DashboardPadres.tsx` - Modificado para proxying de `analytics/padres`
- `educ/src/features/docente/DashboardDocente.tsx` - Modificado para proxying de `analytics/docente`
- `educ/src/features/finanzas/components/DashboardCFO.tsx` - Modificado para proxying
- `educ/src/lib/mock-data.ts` - Eliminado definitivamente
- `educ/src/lib/api.ts` - Creado para encapsular el fetcher `fetchEducData`
