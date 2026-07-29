# Archivos Modificados — Rediseño del Módulo de Tareas

## Archivos Modificados

1. `ong/src/app/modules/projects/types.ts`
   - *Cambios:* Incorporación de `TaskPriority`, filtros de prioridad, horas estimadas, voluntario asignado, adjuntos y correo en interfaces `TaskListFilters`, `TaskRow` y `TaskFormValues`.

2. `src/modules/ong/app/modules/projects/types.ts`
   - *Cambios:* Sincronización exacta del archivo `types.ts`.

3. `ong/src/app/modules/projects/ProjectsWorkspace.tsx`
   - *Cambios:*
     - Helpers `exportTasksToCSV`, `renderTaskPriorityBadge`, `isTaskOverdue`, `formatTaskDeadline`.
     - KPIs superiores para Tareas con click-to-filter.
     - Barra Flotante de Acciones Masivas (Bulk Actions) para Tareas.
     - Checkbox de finalización rápida con effect line-through.
     - Tablero Kanban para Tareas con 4 columnas.
     - Rediseño del modal de creación/edición de tareas.

4. `src/modules/ong/app/modules/projects/ProjectsWorkspace.tsx`
   - *Cambios:* Sincronización exacta de `ProjectsWorkspace.tsx`.
