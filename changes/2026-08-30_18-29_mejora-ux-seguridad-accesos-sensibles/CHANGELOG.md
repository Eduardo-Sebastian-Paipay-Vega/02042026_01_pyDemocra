# CHANGELOG

- **Fecha y hora:** 2026-08-30 18:29
- **Objetivo del cambio:** Corregir vulnerabilidad de exposición de datos (data leak de base de datos) y mejorar la UX del panel de Gobernanza: Accesos Sensibles y Restricciones.
- **Contexto del problema:** El banner de error imprimía funciones SQL crudas (public.fn_has_permission()). El layout presentaba competencia de scroll entre tablas muy largas, y los inputs de fecha eran ineficientes. Faltaba validación robusta y cruce de datos visible para enriquecer las fechas.
- **Motivo de la modificación:** Requerimientos de seguridad, UX, y estándares de auditoría clínica (RF1, RF2, RF3).
- **Solución implementada:** 
  1. Ocultamiento de stack traces/errores SQL mediante un mensaje limpio (Empty State).
  2. Uso de <Tabs> para separar Historial de Accesos de Restricciones por Rol.
  3. Cambio de inputs individuales de fecha por <DatePickerWithRange>.
  4. Agregado de tiempo relativo en la columna de fechas.
  5. Adición de esquema zod para validación estricta de formulario cruzado (timeStart vs timeEnd).
- **Riesgos identificados:** Ninguno grave, componente manejado por DatePicker.
- **Impacto esperado:** Mayor seguridad (cero fuga de información interna), mejor UX (Tabs, DatePicker), y consistencia de datos en DB.
- **Módulos afectados:** ong/src/app/pages/SensitiveAccess.tsx
- **Dependencias involucradas:** date-fns, react-day-picker, zod, UI components.
- **Posibles efectos secundarios:** Ninguno significativo.
- **Estado del cambio:** Completado
