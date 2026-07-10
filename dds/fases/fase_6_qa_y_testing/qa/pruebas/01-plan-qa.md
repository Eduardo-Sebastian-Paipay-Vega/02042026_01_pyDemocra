# Plan de Aseguramiento de Calidad (QA)
> **Fase 6 | QA y Testing** | Fecha de análisis: 2026-07-09

---

## 1. Alcance del Aseguramiento de Calidad

Dado que el sistema Democra administra datos de extrema sensibilidad (información médica de voluntarios y beneficiarios, registros financieros y autorizaciones jerárquicas en ONGs), el plan de QA está enfocado primordialmente en la validación del cumplimiento de reglas de seguridad (RLS) y en asegurar que la información nunca escape de su contexto de multi-tenancy.

El plan de QA cubrirá tres niveles principales:
1. Validaciones Funcionales (Reglas de Negocio Centrales).
2. Validaciones de Seguridad (Aislamiento de Tenant y Motor de Riesgo).
3. Validaciones de Flujo de Trabajo (Experiencia de Usuario en Frontend).

## 2. Definición de Criterios de Aceptación (DoD)

Para que una nueva funcionalidad o Feature se considere "Lista" (Done), deberá superar los siguientes criterios de calidad:

- **Cobertura de Pruebas Unitarias:** La lógica de backend en Express (`server/`) debe estar probada para los caminos de error y escenarios felices.
- **Validación de Políticas RLS:** Toda nueva tabla de negocio debe acompañarse de sus pruebas pgTAP para verificar que `fn_current_tenant_id()` bloquea el acceso inter-tenant.
- **Auditoría Activa:** Se debe verificar mediante pruebas que cualquier modificación a tablas maestras dispara efectivamente los triggers que alimentan `audit_logs`.
- **Accesibilidad UI:** Todos los nuevos componentes de frontend construidos con Radix UI deben conservar sus atributos ARIA para permitir navegación por teclado y lectores de pantalla (Nivel de conformidad AA).

## 3. Matriz de Pruebas Críticas (Test Cases)

El equipo de QA deberá automatizar progresivamente y ejecutar manualmente de forma inicial los siguientes Test Cases (TC):

| ID Test | Caso de Prueba | Tipo de Prueba | Criterio de Pase |
|---------|----------------|----------------|------------------|
| **TC-SEC-01** | Multi-tenant Leak Test | Backend / DB | Intentar leer/escribir registros inyectando un `tenant_id` diferente al extraído del JWT. El servidor/DB debe rechazar la solicitud con error 403 / Violación RLS. |
| **TC-SEC-02** | Risk Engine Lockout | Backend / API | Enviar 6 peticiones consecutivas fallidas de PIN al endpoint de terminal. La 6ta petición debe retornar error 429 / Lockout y el usuario no debe poder autenticarse por X minutos. |
| **TC-SEC-03** | Step-Up MFA Challenge | Backend / API | Simular login válido desde IP categorizada como "desconocida". El servidor debe omitir el JWT final y retornar `{"action": "REQUIRE_OTP", "challenge_id": "uuid"}`. |
| **TC-FUN-01** | Flujo FSM Admisión | E2E | Crear candidato, mover a entrevista, aprobar y convertir a voluntario. El estado del candidato debe actualizarse linealmente, el registro final en `VolunteerProfile` debe existir. |
| **TC-FUN-02** | Stock Inmutable (Kardex) | E2E | Generar entrada de 10 ítems, salida de 5. El componente frontend debe mostrar Stock Derivado = 5, y la BD debe registrar dos filas distintas en `InventoryMovement`. |
| **TC-FUN-03** | Aprobación Financiera | E2E | Crear Egreso de Caja Chica. Debe iniciar en `pending`. Un rol distinto debe aprobarlo. El saldo solo se descuenta cuando el estado es `approved`. |

## 4. Gestión de Defectos (Bug Tracking)

Cualquier defecto o regresión identificada en los Test Cases anteriores debe categorizarse usando la siguiente escala de prioridad:

- **P0 (Crítico):** Fugas de datos entre tenants (Violaciones de RLS), fallos en evaluación de motor de riesgo, bypass de autenticación MFA. Parada inmediata de despliegue.
- **P1 (Alto):** Corrupción en registros inmutables (kardex o finanzas), fallos en triggers de auditoría, indisponibilidad completa del frontend de la ONG.
- **P2 (Medio):** Funcionalidades defectuosas que no comprometen la seguridad y que cuentan con workarounds operativos.
- **P3 (Bajo):** Defectos de UI/UX, textos erróneos (typos) en notificaciones, desalineación de componentes.
