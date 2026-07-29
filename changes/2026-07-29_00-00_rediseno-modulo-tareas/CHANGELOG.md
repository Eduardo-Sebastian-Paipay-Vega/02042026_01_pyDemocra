# CHANGELOG — Rediseño Completo del Módulo de Tareas (`/projects/tasks`)

- **Fecha y Hora:** 2026-07-29 00:00 (UTC-5)
- **Objetivo del Cambio:** Transformar el módulo de Tareas y el Modal de Crear/Editar Tareas para ofrecer una experiencia interactiva completa, incluyendo KPIs superiores, selector de vista (Tabla / Tablero Kanban), badges de prioridad con colores, alerta de tareas vencidas, completado rápido con checkbox, barra flotante de acciones masivas (bulk actions), exportación a CSV y asignación directa de responsables.

## Contexto del Problema
La vista de Tareas anterior carecía de asignación explícita de responsables en el formulario de creación, no contaba con nivel de prioridad, no destacaba visualmente las tareas vencidas, no disponía de vista Kanban ni de selección múltiple para operaciones masivas.

## Solución Implementada
1. **Tipos e Interfaces (`types.ts`):**
   - Incorporación de `TaskPriority` (`"baja" | "media" | "alta" | "urgente"`).
   - Extensión de `TaskListFilters`, `TaskRow` y `TaskFormValues` con `priority`, `estimatedHours`, `assignedVolunteerIds`, `attachedFile`, `sendEmailNotification`.

2. **Workspace Principal (`ProjectsWorkspace.tsx`):**
   - **Tarjetas de Resumen (KPIs):** Total Tareas, En Progreso, Completadas y Tareas Vencidas 🚨 con click-to-filter.
   - **Checkbox de Finalización Rápida:** Permite marcar/desmarcar tareas directamente desde la fila o tarjeta Kanban.
   - **Alerta de Fecha Límite:** Cálculo y renderizado de badge `🚨 Vencida` cuando la fecha pasó y la tarea no está completada.
   - **Tablero Kanban de Tareas:** 4 columnas (*Por Hacer*, *En Progreso*, *En Revisión*, *Completada*) con tarjetas interactivas.
   - **Barra Flotante de Acciones Masivas:** Selección múltiple con checkbox para completar, exportar o eliminar tareas en lote.
   - **Rediseño del Modal `CreateTaskModal`:** Formulario multicolumna con Responsable, Prioridad, Tiempo Estimado (Horas), Fecha Límite, Drag & Drop de referencias y Checkbox de Notificación por correo.

3. **Sincronización Monorepo & Despliegue:**
   - Sincronización idéntica en ambos árboles `ong/src/` y `src/modules/ong/`.
   - Compilación Vite y ejecución exitosa de los 548 tests Vitest.
   - Commit & push a `origin/main` y despliegue a producción en Vercel aliased a `https://www.democra.pro`.

## Impacto Esperado y Módulos Afectados
- **Módulo afectado:** `ProjectsWorkspace` (`/ong/app/ong/projects/tasks`).
- **Estado del cambio:** COMPLETADO Y PUBLICADO EN PRODUCCIÓN.
