# SUMMARY

- **Qué se hizo:** Se rediseñó la UI de la página principal del explorador de Catálogos (`Catalogs.tsx`), reemplazando la selección basada en "píldoras" (Tabs) por un componente `<Select>` (Combobox) nativo del design system. Se eliminó el texto técnico del banner, se quitó la columna redundante de la tabla y se removió la "fuente documental" técnica del modal.
- **Por qué se hizo:** Para reducir la saturación cognitiva del usuario al tener demasiados catálogos, y para cumplir con las directrices estrictas de UX de no exponer jerga técnica, nombres de tablas SQL o ubicaciones de scripts internos al usuario final.
- **Qué beneficio aporta:** La UI es ahora mucho más limpia, profesional y escalable a más catálogos sin romper el layout. Se resguarda la información estructural (AppSec y UX).
- **Qué funcionalidades quedaron afectadas:** Únicamente la visualización y navegación del explorador de catálogos en el módulo Gobernanza. La interacción con los servicios de base de datos (`useGovernanceCatalogs` y `catalogs.service.ts`) permanece idéntica.
