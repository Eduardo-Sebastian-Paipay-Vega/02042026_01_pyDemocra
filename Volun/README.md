
  # Sistema de Gestión Voluntariado

  This is a code bundle for Sistema de Gestión Voluntariado. The original project is available at https://www.figma.com/design/TMgzxdFdxazshqb4M7cJUT/Sistema-de-Gesti%C3%B3n-Voluntariado.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

  ## Calendar MVP (Mock Local)

  Se implementó un MVP de calendario compacto tipo Google Calendar + split view tipo Tesla en:
  - `src/components/calendar-mvp/`
  - `src/components/ActivityCalendar.tsx` (wrapper de entrada)

  ### Características incluidas
  - React + TypeScript + Tailwind.
  - Datos mock locales:
    - `src/components/calendar-mvp/mock-data.json`
  - Roles simulados con selector superior:
    - `PRINCIPAL`
    - `TRABAJADOR`
  - Estados soportados:
    - `PLANIFICADA`, `EJECUCION`, `CERRADA`, `CANCELADA`
  - Vista mensual compacta estable:
    - máximo 2 chips visibles por día
    - `+N más` cuando excede
  - Click en día:
    - abre `DayPopover` anclado al cuadro del día (tipo Google Calendar)
  - Click en evento:
    - abre `EventQuickPopover`
    - `Ver detalles` abre `DrawerDetalleActividad` (sin vista por horas)
  - Crear/editar actividad con validaciones:
    - `endTime > startTime`
    - alerta por solapamiento opcional
  - Cambio de estado en calendario:
    - solo `PRINCIPAL`
  - Extras:
    - buscador por título/descripcion/tag
    - filtro por estado

  ### Estructura principal de componentes
  - `CalendarMonth`
  - `DayCell`
  - `EventChip`
  - `DayModal`
  - `EventQuickPopover`
  - `DrawerDetalleActividad`
  - `ActivityDetail`
  - `ActivityFormModal`

  ### Nota de arquitectura
  La lógica está preparada para migrar de mock a base de datos reemplazando el origen en:
  - `src/components/calendar-mvp/mock-data.ts`
  - `src/components/calendar-mvp/state.ts`
  
