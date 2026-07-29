# Audit Log - Rediseño de Vista de Asignaciones (Assignments)

- **Fecha:** 2026-07-29 18:49
- **Autor:** Claude Code / Antigravity
- **Objetivo:** Corregir omisiones críticas de datos (columna de persona/recurso asignado) y transformar la vista `/projects/assignments` en una herramienta de gestión completa con KPIs, filtros y menú de acciones.

---

### 1. Contexto del Problema
En la vista de Asignaciones (`/projects/assignments`):
1. **Falta la entidad asignada:** La tabla mostraba Tipo, Contexto (Proyecto) y Rol, pero NO mostraba el Nombre de la Persona (voluntario) ni del Recurso Material asignado.
2. **Fecha cruda ISO String:** La columna `ACTUALIZADO` mostraba timestamps sin formatear (ej. `2026-07-29T04:19:29.782043+00:00`).
3. **Ausencia de métricas (KPIs):** No existían tarjetas métricas superiores para supervisar la cantidad global de asignaciones, personal activo, recursos materiales y asignaciones vigentes.
4. **Falta de columna de Acciones:** No se incluía un menú desplegable `...` por fila para ver detalle, reasignar o desvincular.
5. **Sin exportación a CSV:** No se permitía exportar reportes de asignaciones.

### 2. Solución Implementada
1. **Columna "ASIGNADO A" (Entidad Asignada):**
   - Muestra Avatar circular con iniciales o icono `<User />` para personal/voluntarios.
   - Muestra icono `<Package />` en fondo morado para Recursos Materiales/Equipos.
   - Muestra el nombre completo de la persona (`volunteerName`) o nombre del equipo (`itemName`).
   - Muestra subtexto clasificatorio ("Voluntario Registrado", "Recurso Material").
2. **Badges de Tipo Enriquecidos:**
   - Badge Azul/Índigo con `<User />` para `Voluntario (Proyecto)`.
   - Badge Sky con `<User />` para `Voluntario (Actividad)`.
   - Badge Púrpura con `<Package />` para `Equipo / Material`.
3. **Formateo de Fecha:**
   - Uso de `formatDateString(row.updatedAt)` para mostrar fechas legibles en español.
4. **Tarjetas de Resumen KPI (4 Módulos Superiores):**
   - **Total Asignaciones** (`assignmentRows.length`).
   - **Voluntarios / Personal** (`volunteerAssignmentsCount`).
   - **Recursos Materiales** (`resourceAssignmentsCount`).
   - **Asignaciones Vigentes** (`activeAssignmentsCount`).
5. **Columna "ACCIONES" con Menú Desplegable `...`:**
   - **Ver Detalle:** Abre el modal ejecutivo de asignación.
   - **Editar / Reasignar:** Abre el modal de reasignación/rol.
   - **Desvincular / Eliminar:** Opción en rojo para finalizar la asignación.
6. **Filtros Unificados y Exportación CSV:**
   - Filtro por Proyecto y Filtro por Tipo de Asignación.
   - Botón `Exportar CSV` que genera `asignaciones_YYYY-MM-DD.csv`.
