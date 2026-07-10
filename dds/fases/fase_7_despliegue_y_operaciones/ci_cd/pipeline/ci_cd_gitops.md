# CI/CD y Estrategia GitOps

*Fuente de verdad: `package.json`, Archivos del Repositorio*

## 1. Integración y Entrega Continua (CI/CD)
El proyecto confía en despliegues automatizados estilo *Platform as a Service* (PaaS), específicamente **Vercel**, según la mención de `vercel.json` y los endpoints del servidor (`process.env.VERCEL`).
*   **Vercel:** Despliega automáticamente frente a nuevos commits en las ramas principales, orquestando el frontend (Vite) y el backend (Serverless Functions) simultáneamente.
*   **Scripts de Construcción:** `npm run build:all` ejecuta `vite build && npm run build --prefix ong`, asegurando que ambas aplicaciones React se construyan.
*   **Validación Local:** El script `npm run clean:build` asegura una instalación fresca borrando `node_modules` (`rm -rf node_modules package-lock.json`) antes de compilar.

## 2. GitOps
La gestión declarativa de la infraestructura mediante Git existe parcialmente en la carpeta `supabase/migrations`. Sin embargo, tal como apuntó la auditoría, la ausencia de un Baseline inicial corrompe la fiabilidad del GitOps de base de datos.
No existen directorios `github/workflows/` para bloquear Pull Requests que fallen el tipado o linter.

> [!WARNING]
> **Trazabilidad:** La carencia de pipelines estrictos de GitOps identificada aquí repercute directamente en la [Estrategia QA](../../../fase_6_qa_y_testing/qa/estrategia/estrategia_qa.md), donde se señala que no hay un bloqueo automático en las fusiones de ramas en caso de fallo de tests.
