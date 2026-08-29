# Changelog

**Fecha y Hora:** 2026-08-29 14:57  
**Objetivo del Cambio:** Refactorizar el módulo de Historial de Notificaciones siguiendo los parámetros UX/UI del Prompt Maestro y el modelo de BD `comunicaciones.historial_notificaciones`.

**Contexto del Problema:**  
La pantalla inicial exhibía excesivos "technical logs" en su cabecera, tenía los filtros de búsqueda apilados sin colapsar (comiendo espacio vital), mostraba métricas genéricas y adolecía de una tabla funcional, prefiriendo estados "Empty" o paginaciones crudas ("0-0 de 0"). Los errores largos deformaban la UI.

**Solución Implementada:**  
- **Supresión de logs y bloques técnicos** en `NotificationHistory.tsx`.
- Refactor del `PageHeader` para que se ajuste a un diseño más limpio.
- **Implementación de Popover** de `@/core/components/ui/popover` para encerrar todos los filtros accesorios bajo el botón "Filtros Avanzados".
- Se diseñó un grid para las `Columns` de la tabla usando `StatusDot` y `Tooltip` para esconder el string gigante de los errores.
- Inserción de una acción "Ver Payload" conectada a un nuevo `ModalShell` que pinta con `NotificationsCodePreview` el campo `jsonb`.
- Paginación amigable con un pie de página (`div`) estilizado y botones condicionados a `page <= 1` y `page * PAGE_SIZE >= data.total`.

**Riesgos Identificados:**  
Bajo riesgo. Los cálculos de la paginación y KPIs recaen en las variables preexistentes extraídas por `useNotificationHistory` que, al ser auditadas, están correctamente conectadas con Supabase (`.range()` y `.count()`).

**Impacto Esperado:**  
Mejora sustancial en la usabilidad del sistema, permitiendo auditar cientos de notificaciones con extrema agilidad sin sobrecargar cognitivamente al usuario.

**Estado del Cambio:** Completado.
