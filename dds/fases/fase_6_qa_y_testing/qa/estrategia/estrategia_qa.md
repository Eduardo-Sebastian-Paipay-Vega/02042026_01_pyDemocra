# Estrategia Global de QA (Aseguramiento de Calidad)

*Fuente de verdad: `package.json`, `AUDIT_REPORT_S1.md`*

## 1. Cobertura Estática y Linter
El proyecto delega el aseguramiento temprano a:
*   **TypeScript:** `tsc --noEmit` como barrera de integración.
*   **ESLint:** `eslint .` para análisis estático en la raíz del proyecto.
*   **Prettier:** Estandarización de formato.

## 2. Niveles de Pruebas Identificados
*   **Unit/Integration:** `vitest` (frontend) y `jest` (backend).
*   **Database:** `pgTAP`.

## 3. Deuda Técnica en QA Automático
*   **Falta de CI Automático:** Aunque existen los scripts de linter y test, no hay un `github_actions` o archivo `.gitlab-ci.yml` configurado en el repositorio que bloquee fusiones (PRs) cuando el build falla. Esto requiere dependencia manual del desarrollador.
