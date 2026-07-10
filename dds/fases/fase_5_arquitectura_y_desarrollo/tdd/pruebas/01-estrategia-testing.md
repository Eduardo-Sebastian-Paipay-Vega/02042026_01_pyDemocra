# Estrategia de Pruebas (Testing Strategy)
> **Fase 5 | Arquitectura y Desarrollo** | Fecha de análisis: 2026-07-09

---

## 1. Estado Actual (Análisis As-Is)

El análisis del repositorio actual revela una **deuda técnica significativa** en el ámbito del aseguramiento de calidad (QA) automatizado. 

- Existe configuración base para `vitest`.
- Existe al menos una prueba identificada a nivel de BD usando `pgTAP`.
- **NO** existe evidencia de cobertura de pruebas E2E (End-to-End).
- **NO** existe evidencia de pruebas de integración automatizadas para la API de Express (rutas de Auth, IAM, Onboarding).

Dado que Democra es una aplicación SaaS B2B que gestiona datos sensibles y operaciones financieras con un modelo de seguridad multi-tenant crítico, es imperativo establecer y ejecutar una estrategia de pruebas sólida.

## 2. Pirámide de Pruebas Propuesta

### 2.1. Pruebas de Base de Datos (pgTAP)
Debido a que gran parte de la seguridad de la aplicación descansa en las políticas RLS y Triggers de PostgreSQL (Enfoque de "DB-Thick"), las pruebas a nivel de base de datos son de **Proridad Crítica**.

- **Objetivo:** Verificar que el aislamiento de tenants es infalible.
- **Casos:** 
  1. Insertar registro con `tenant_id` 'A' usando un rol del tenant 'B' (Debe fallar).
  2. Leer tabla `audit_logs` con `tenant_id` 'A' usando rol del tenant 'B' (Debe retornar 0 filas).
  3. Probar que el trigger de `sensitive_access_logs` se dispara correctamente.

### 2.2. Pruebas de Integración de API (Supertest + Vitest)
La capa de API (Express) contiene la lógica de negocio más riesgosa del sistema.

- **Objetivo:** Validar flujos complejos y la correcta delegación de Supabase Auth.
- **Casos:**
  1. Login con Motor de Riesgo (Forzar IP distinta para verificar que retorna status `REQUIRE_OTP`).
  2. Validación de OTP usando hashes correctos e incorrectos.
  3. Flujo de Onboarding (Mocks de la API SUNAT para simular RUC Activo vs RUC de Baja).

### 2.3. Pruebas End-to-End E2E (Playwright / Cypress)
Al consumir directamente la base de datos desde el frontend, las pruebas E2E son la única forma de garantizar que las vistas (React) consumen correctamente el contrato de datos y reaccionan bien al RLS.

- **Objetivo:** Simular los flujos críticos del usuario de principio a fin.
- **Casos (Camino Feliz):**
  1. Admisión Completa: Autoregistro con código -> Aprobación de Solicitud -> Conversión a Voluntario.
  2. Proyecto: Crear proyecto -> Asignar Voluntario -> Registrar 5 Horas -> Aprobar Horas.
  3. Finanzas: Solicitar Egreso de Caja -> Aprobar Egreso -> Verificar saldo actualizado en Kardex.

## 3. Integración Continua (CI)

Se deberá implementar un pipeline de GitHub Actions (`.github/workflows/test.yml`) que fuerce la ejecución de las suites de prueba descritas (Unit, Integration, DB) en cada Pull Request que afecte a la rama `main` o `develop`. 

Si la cobertura de código es menor al 75% en el backend de Express (rutas de auth/iam/onboarding), el PR deberá ser bloqueado.
