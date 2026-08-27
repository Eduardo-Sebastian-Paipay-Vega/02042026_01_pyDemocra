# Changelog

- **Fecha y hora:** 2026-08-26 23:50
- **Objetivo del cambio:** Mejorar la interfaz del dashboard, la búsqueda global y componentes core visuales (Sidebar, Topbar).
- **Contexto del problema:** Era necesario refinar la presentación visual del Sidebar y Topbar (tamaños de fuente, espaciado, comportamiento del botón de búsqueda según la ruta) y añadir nuevos componentes de filtros, métricas (KPIs) y timeline al dashboard del módulo ONG.
- **Motivo de la modificación:** Mejorar la experiencia de usuario (UX) general en la plataforma y estructurar mejor los componentes del dashboard ONG.
- **Solución implementada:** 
  - Ajustes de estilos en `src/core/shell/Sidebar.tsx` y `src/core/shell/Topbar.tsx`.
  - Creación de componentes modulares para el Dashboard de ONG (`DashboardFilters.tsx`, `DashboardKpiGrid.tsx`, `DashboardTimeline.tsx`).
  - Actualizaciones a los servicios de búsqueda global y dashboard data.
- **Riesgos identificados:** Bajo riesgo. Los cambios en el core son visuales (padding, margin, condicionales de renderizado de UI).
- **Impacto esperado:** Una interfaz de usuario más pulida y un dashboard de ONG más interactivo con mejores capacidades de filtrado y visualización.
- **Módulos afectados:** Core (`src/core/shell`), ONG (`src/modules/ong` y `ong/`).
- **Dependencias involucradas:** React, Tailwind CSS (clases utilitarias).
- **Posibles efectos secundarios:** Ninguno significativo, a menos que otras industrias dependan estrictamente de los tamaños exactos de fuente en Topbar/Sidebar (pero el uso de clases estándar debería adaptarse).
- **Estado del cambio:** Completado.
