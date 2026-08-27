# Archivos Modificados

- `ong/src/app/modules/people/types.ts`: Se añadió el atributo `createdAt` a las interfaces de `SensitiveMedicalListRow`.
- `ong/src/app/services/clinico/medicalRecords.service.ts`: 
  - Se modificaron las queries en `listSensitiveMedicalRecords` para solicitar `created_at`.
  - Se añadió la función `getTodayClinicalAgenda` que consulta la tabla `ong.actividades` filtrando por la fecha de hoy.
- `ong/src/app/modules/people/hooks/useMedicalRecords.ts`: Se actualizó el hook para obtener simultáneamente `getTodayClinicalAgenda` e inyectarlo en el estado exportado.
- `ong/src/app/pages/MedicalRecords.tsx`: 
  - Se eliminaron los mocks del Gráfico de Evolución y la Agenda.
  - Se implementó lógica `useMemo` para agrupar los registros por mes/año y graficar con `recharts`.
  - Se renderizó la lista de agenda en base al estado proporcionado por el hook.
