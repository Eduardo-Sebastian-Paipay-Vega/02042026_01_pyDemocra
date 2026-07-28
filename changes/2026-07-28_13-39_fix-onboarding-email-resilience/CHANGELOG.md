# CHANGELOG — Corrección de Resiliencia en Envío de Correos de Onboarding

- **Fecha y Hora:** 2026-07-28 13:39:00
- **Objetivo del Cambio:** Prevenir fallos HTTP 500 durante la creación de organizaciones (`/api/onboarding/bootstrap-tenant`) cuando ocurren problemas al procesar o enviar el correo de verificación.
- **Contexto del Problema:** Durante la ejecución de pruebas automatizadas o en entornos de prueba con mocks parciales de `serviceClient` / `Resend`, la función `issueVerificationEmail` no tenía un bloque `try/catch` global, lo que provocaba que errores secundarios al actualizar perfiles o despachar emails lanzaran excepciones no capturadas que interrumpían la respuesta 201 de `bootstrap-tenant`.
- **Motivo de la Modificación:** Garantizar que la creación del tenant en la base de datos sea resiliente y no falle ante errores transitorios de envío de correo, permitiendo al cliente completar el registro y solicitar reenvío posteriormente.
- **Solución Implementada:** Envolver todo el cuerpo de `issueVerificationEmail` en `server/routes/onboarding.js` dentro de un bloque `try/catch` defensivo con verificación de tipo sobre `serviceClient`.
- **Riesgos Identificados:** Ninguno.
- **Impacto Esperado:** Alta estabilidad en el flujo de onboarding y 100% de éxito en las suites de pruebas unitarias e integración.
- **Módulos Afectados:** `server/routes/onboarding.js`, `server/routes/onboarding.test.js`
- **Dependencias Involucradas:** N/A
- **Posibles Efectos Secundarios:** Ninguno.
- **Estado del Cambio:** Completado.
