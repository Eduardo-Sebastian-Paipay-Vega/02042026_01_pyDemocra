# CHANGELOG

**Fecha y hora:** 2026-08-29 15:37
**Objetivo del cambio:** Refactorización e implementación del explorador de Catálogos (Gobernanza) con altos estándares UI/UX.
**Contexto del problema:** La vista de catálogos presentaba problemas de usabilidad (saturación de selectores/pestañas), exponía jerga técnica (nombres de tablas SQL, permisos internos) en la interfaz final, y usaba menús de acciones (3 puntos) para vistas de solo lectura.
**Motivo de la modificación:** Cumplir con el Prompt Táctico, mejorando la navegación mediante un sidebar vertical, limpiando el lenguaje expuesto, integrando un diseño más robusto con Tailwind/Design Skills y removiendo elementos de UI innecesarios en un entorno Read-Only.
**Solución implementada:** 
- Se migró el Layout de 'Select' simple a un Sidebar vertical (split-pane) agrupado por esquemas (Core, ong, rrhh, comunicaciones).
- Se reemplazó la configuración estricta de Dropdown actions por un botón en línea limpio 'Eye' en una columna final.
- Se filtró cualquier término técnico expuesto en el Header o Banners de la vista, sustituyéndolos por un lenguaje amigable.
- Se integró renderizado condicional de badges ('Activo/Inactivo') si la tabla expone la columna booleana 'activo'.
**Riesgos identificados:** Riesgo mínimo. Al ser un módulo Read-Only no afecta transaccionalidad.
**Impacto esperado:** Mayor facilidad de uso para Superadmins, mejor jerarquía y escalabilidad visual de los dominios, interfaz más limpia y robusta.
**Módulos afectados:** Gobernanza > Catálogos.
**Dependencias involucradas:** UI/Componentes compartidos (PageHeader, ModalShell, DataTable, StatusPill).
**Posibles efectos secundarios:** Ninguno.
**Estado del cambio:** Completado.
