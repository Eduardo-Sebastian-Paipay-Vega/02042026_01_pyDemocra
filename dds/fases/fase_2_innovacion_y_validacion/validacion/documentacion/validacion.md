# Estrategia de Validación y Pruebas Iniciales

*Fuente de verdad: `supabase/tests/`, `package.json`*

La validación temprana (Fase 2) de los supuestos arquitectónicos de Democra se documenta mediante la configuración actual del repositorio en términos de pruebas automatizadas y validaciones manuales.

## 1. Validación de Base de Datos (pgTAP)

El proyecto valida la integridad de su núcleo más crítico (Multi-tenant y RLS) a través de pruebas de base de datos directas.
*   **Herramienta:** pgTAP.
*   **Evidencia:** Archivo `supabase/tests/fase1_onboarding_test.sql`
*   **Propósito:** Asegura que las funciones de creación atómica (como el onboarding de administradores y la inyección de `tenant_id`) funcionen correctamente y que las restricciones ON CONFLICT prevengan datos corruptos, validando que el aislamiento entre tenants sea impenetrable antes de tocar cualquier código de frontend.

## 2. Validación de Lógica de Aplicación (Unit Testing)

La lógica de negocio aislada en TypeScript y los componentes de React se validan usando el ecosistema Vitest/Jest.
*   **Frontend (Vitest):** Configurado en `vitest.config.ts` empleando un entorno simulado de DOM (`jsdom`) para ejecutar pruebas rápidas de componentes React bajo la carpeta `src/` y `ong/src/`.
*   **Backend (Jest):** El API Express usa Jest (`jest.config.js` y `babel.config.cjs`) para validar la lógica del motor de riesgo y las rutas de autenticación, simulando peticiones HTTP (probablemente con `supertest`, listado en `package.json`).

## 3. Estado de la Validación

Actualmente el repositorio posee el andamiaje necesario (Configuraciones de tests unitarios y pgTAP) para respaldar la integridad, sin embargo, como indica el reporte de auditoría (ausencia de CI/CD automatizado documentado), la validación requiere ejecución manual local por los desarrolladores mediante `npm run test` y `npm run test:web`.
