# Changelog - Refactor Áreas Organizacionales

**Fecha:** 2026-08-29
**Hora:** 15:15
**Objetivo:** Refactorizar el módulo de Áreas Organizacionales para alinearlo con los estándares de diseño (Design Skills de Antigravity), evitar acciones redundantes, y enriquecer relacionalmente la tabla con la cantidad de proyectos asociados a cada área según el esquema en `BD.json`.

**Contexto del Problema:**
- Existía duplicidad de acciones de "+ Nueva área" (una redundante junto a la barra de búsqueda).
- La tabla de áreas no exponía explícitamente sus botones de acción (Editar, Activar/Desactivar) de manera obvia, requiriendo de una columna "Acciones".
- La jerarquía tipográfica entre el nombre y el código del área competía visualmente.
- El módulo no aportaba contexto inmediato sobre el uso del área, como cuántos proyectos existen bajo dicha área.

**Solución Implementada:**
- **Limpieza de UI:** Se eliminó el botón "+ Nueva área" en el `FilterBar` (`Areas.tsx`), dejando únicamente el principal.
- **Jerarquía Visual:** Se incorporó el componente `Badge` al código de área, silenciando el peso visual.
- **Enriquecimiento Relacional:** Se modificó la consulta en `areas.service.ts` para hacer un count relacional hacia `ong.proyectos` usando `proyectos(count)`.
- **Datos expuestos en UI:** Se añadió la columna "Proyectos" en la `DataTable` de áreas para visualizar el count obtenido.
- **Mejora UX en Filtro:** Se introdujo `debouncedSearch` en `Areas.tsx` para optimizar las peticiones a base de datos al tipear en la barra de búsqueda.
- **Destructive Actions:** Se mejoró la acción "Desactivar" para mostrarse como destructiva (color rojo) en el menú de 3 puntos.

**Riesgos Identificados / Efectos Secundarios:**
- La modificación en la query asume que la foreign key en base de datos existe para `ong.proyectos.id_area -> ong.areas.id`. De no estar bien definida a nivel físico o en la configuración de PostgREST, la consulta `proyectos(count)` fallaría.

**Estado del Cambio:** Completado
