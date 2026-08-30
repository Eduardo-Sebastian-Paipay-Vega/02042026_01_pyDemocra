# SUMMARY

- **Qué se hizo:** Se parchó una fuga de información sensible donde la interfaz imprimía errores SQL. Se refactorizó la vista SensitiveAccess.tsx utilizando pestañas (Tabs) en vez de secciones apiladas. Se reemplazó la búsqueda por fechas con un DateRangePicker popover, se incluyeron tiempos relativos en las columnas de fechas y se agregó validación con Zod al formulario de Restricciones por Rol.
- **Por qué se hizo:** Para cumplir estrictamente con los requisitos funcionales RF1 (seguridad), RF2 (listado enriquecido) y RF3 (validación de restricciones), así como para mejorar la usabilidad (UX Layout) evitando el scroll infinito.
- **Qué beneficio aporta:** Cumplimiento de estándares de seguridad al no exponer esquemas de BD, una experiencia de usuario limpia y validaciones front-end consistentes que evitan envíos de datos conflictivos.
- **Qué funcionalidades quedaron afectadas:** El módulo completo de Gobernanza > Accesos Sensibles y Restricciones.
