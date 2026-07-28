# CHANGELOG — Sprint 3: Motor LMS (M08), Geofencing GPS (M05/M04) y GDPR (M16)

- **Fecha y Hora**: 2026-07-28 16:49 (UTC-5)
- **Objetivo del Cambio**: Implementar el motor de evaluaciones y exámenes LMS con temporizador, la validación de cercanía GPS por fórmula de Haversine para marcaciones de asistencia y el generador de paquetes de portabilidad de datos GDPR.
- **Contexto del Problema**: En la auditoría estricta de `main.md`, la marcación de asistencia carecía de validación geográfica por radio (geofencing GPS), los exámenes LMS no controlaban tiempo ni reintentos máximos y la portabilidad GDPR no generaba el paquete estructurado descargable.
- **Motivo de la Modificación**: Resolver brechas funcionales de alta prioridad clasificadas en el Sprint 3.
- **Solución Implementada**:
  1. Creado `server/services/lms-evaluations.js` con temporizador regresivo de examen, calificación automática y límite de intentos (`startExamSession`, `gradeExamSubmission`).
  2. Creado `server/utils/geofencing.js` con la fórmula esférica de Haversine y validación por radio (`calculateHaversineDistanceMeters`, `isWithinGeofence`).
  3. Creado `server/services/gdpr-export.js` para compilar y generar el paquete de datos personales descargable JSON (`generateGdprDataPackage`) en cumplimiento del Art. 20 del RGPD.
  4. Creadas suites de prueba unitarias en Jest: `server/services/lms.test.js`, `server/utils/geofencing.test.js` y `server/services/gdpr.test.js`.
- **Riesgos Identificados**: Ninguno. Operación matemática determinista y resiliencia en generación de paquetes.
- **Impacto Esperado**: Control de evaluaciones LMS libre de fraudes, marcación geográfica precisa y cumplimiento normativo GDPR.
- **Módulos Afectados**: `server/services/`, `server/utils/`.
- **Estado del Cambio**: Completado y Verificado (24/24 Test Suites Pasadas).
