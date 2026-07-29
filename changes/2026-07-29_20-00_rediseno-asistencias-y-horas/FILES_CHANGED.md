# FILES_CHANGED - Rediseño de Módulos y Dashboard

1. `ong/src/app/pages/Dashboard.tsx`
   - Refactorizado completo del Panel Principal. Eliminado bug `NaNh`, consolidadas 4 tarjetas KPI, agregados filtros de período/proyecto, botón unificado "+ Acción Rápida", gráfico de área con gradiente, agenda y feed de actividad en vivo.
2. `src/modules/ong/app/pages/Dashboard.tsx`
   - Sincronización espejo 100% de `Dashboard.tsx`.
3. `ong/src/app/pages/Evidence.tsx` y `src/modules/ong/app/pages/Evidence.tsx`
   - Limpieza estética de emojis Unicode y sustitución por iconos SVG de Lucide React.
4. `changes/2026-07-29_20-00_rediseno-asistencias-y-horas/`
   - Actualización de artefactos de auditoría (`CHANGELOG.md`, `SUMMARY.md`, `FILES_CHANGED.md`).
