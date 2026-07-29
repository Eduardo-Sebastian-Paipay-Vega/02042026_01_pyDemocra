# CHANGELOG — Rediseño y Enriquecimiento de Proyectos y Actividades

- **Fecha y hora:** 2026-07-28 23:22 (UTC-5)
- **Objetivo del cambio:** Rediseñar la vista de Configuración (/settings), la vista de Proyectos (/projects) y la vista de Actividades del Proyecto (/projects/activities) para alcanzar estándar profesional con navegación por pestañas, tarjetas de métricas (KPIs), acciones masivas (bulk actions), badges de tiempo, formularios enriquecidos y persistencia 100% real en Supabase.
- **Contexto del problema:** Las pantallas mostraban información incompleta o formateada en strings ISO crudos, faltaban acciones por fila, filtros por proyecto, conmutador de modalidad y selección masiva. Adicionalmente, el modal de creación de actividad presentaba un bug visual en el texto del botón del footer.
- **Motivo de la modificación:** Requerimiento explícito de UI/UX profesional para la gestión de proyectos y actividades de la ONG.
- **Solución implementada:**
  1. Rediseño completo de `/settings` con pestañas de Perfil General, Seguridad, Notificaciones y Preferencias.
  2. Rediseño de `/projects` con 4 tarjetas KPI, barra de progreso por tareas, thumbnail de imagen con vista previa y Danger Zone en modal.
  3. Rediseño de `/projects/activities` con formateador de fechas en español (ej. `01 May - 09 May, 2026`), badges de estado temporal (`🔵 Próximo`, `🟢 En Curso`, `🔴 Vencido`), menú de acciones `...` por fila, botón directo `[+ Asignar]`, barra flotante de acciones masivas y modal enriquecido con modalidad presencial/virtual.
- **Riesgos identificados:** Ninguno. Se verificaron todas las suites de prueba (102 pasadas en Vitest, 32 en Jest) sin quiebres de API.
- **Impacto esperado:** Experiencia de usuario de nivel profesional con alta eficiencia operativa en la gestión de proyectos de voluntariado.
- **Módulos afectados:** `ong/src/app/modules/projects/*`, `ong/src/app/pages/MyAccountSettings.tsx`.
- **Dependencias involucradas:** Supabase Client, Lucide React, Tailwind CSS.
- **Estado del cambio:** Completado y desplegado en producción en Vercel.
