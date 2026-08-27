# CHANGELOG

- **Fecha y hora:** 2026-08-27 01:30
- **Objetivo del cambio:** Eliminar datos mocks en el Dashboard Clínico e implementar datos reales para la evolución temporal y la agenda.
- **Contexto del problema:** El dashboard de Ficha Médica (`MedicalRecords.tsx`) utilizaba datos hardcodeados ("mock") para mostrar la "Agenda de Hoy" y el "Gráfico de Evolución", lo cual viola la regla de No Mocks y no cumple con el flujo de datos real.
- **Motivo de la modificación:** Requerimiento del usuario para finalizar la integración del dashboard con el backend existente, conectándolo con `fichas_medicas`, `ficha_sensible_voluntario` y `actividades`.
- **Solución implementada:** 
  1. Se agregó el atributo `createdAt` a las interfaces base en `types.ts`.
  2. Se modificaron los servicios en `medicalRecords.service.ts` para extraer `created_at` y se expuso `getTodayClinicalAgenda()`.
  3. Se adaptó el frontend (`MedicalRecords.tsx` y `useMedicalRecords.ts`) para renderizar un gráfico dinámico con `recharts` y mapear los eventos reales del Tenant.
- **Riesgos identificados:** Riesgo mínimo. Reutilización de tabla `actividades` del Tenant para la agenda.
- **Impacto esperado:** El panel mostrará exclusivamente información validada desde la BD.
- **Módulos afectados:** Módulo `clinico` (Frontend y Servicios) dentro del proyecto `ong`.
- **Dependencias involucradas:** Supabase (BD), Recharts.
- **Posibles efectos secundarios:** Si el formato de `actividades` cambia en el Tenant principal, afectará cómo se listan los turnos clínicos de la agenda.
- **Estado del cambio:** Completado.
