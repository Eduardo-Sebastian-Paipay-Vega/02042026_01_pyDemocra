# Resumen Ejecutivo - Refactor Áreas Organizacionales

**¿Qué se hizo?**
- Refactorización de la UI del módulo "Áreas Organizacionales" (`ong/src/app/pages/Areas.tsx`).
- Corrección de botones duplicados y mejora visual de jerarquías.
- Modificación del servicio `areas.service.ts` para extraer conteo de proyectos.
- Implementación de `debounce` en la barra de búsqueda para optimizar rendimiento.

**¿Por qué se hizo?**
- Para cumplir con los requerimientos de auditoría UX/UI.
- Para proveer información relacional crítica (cantidad de proyectos asociados por área) antes de que el usuario decida editar o desactivar un área.
- Para reducir peticiones API redundantes (debounce).

**¿Qué beneficio aporta?**
- Interfaz más clara, responsiva y orientada a los estándares de diseño.
- UX mejorada: el usuario sabe exactamente qué áreas están siendo utilizadas por proyectos.
- Menos carga en el backend al tipear.

**¿Qué funcionalidades quedaron afectadas?**
- Vista del listado de áreas.
- API call de obtención de áreas (ahora retorna `projectCount`).
