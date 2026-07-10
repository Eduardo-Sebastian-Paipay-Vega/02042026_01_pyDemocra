# Flujo Pipeline CI/CD 
> **Fase 7 | Despliegue y Operaciones** | Fecha de análisis: 2026-07-09

---

## 1. Diseño del Flujo de Integración y Entrega Continua (CI/CD)

El ciclo de despliegue de Democra está diseñado para minimizar el riesgo de regresiones en las reglas de multi-tenancy y asegurar que la lógica de seguridad estricta del backend Express no se vea comprometida por cambios del frontend. 

El repositorio adopta el formato "Monorepo" lógico, donde reside tanto la App Frontend React/Vite como la API Express Node.js.

## 2. Pipeline de Pull Request (CI - Integración Continua)

Cuando un desarrollador abre un Pull Request (PR) hacia las ramas `develop` o `main`, GitHub Actions deberá disparar el flujo de validación. El PR será bloqueado hasta que todas estas fases aprueben (Verde):

### Fase 1: Linting & Type Checking
- Ejecutar ESLint y Prettier.
- Ejecutar `tsc --noEmit` para validar estáticamente la estructura de tipos del módulo de la ONG y los contratos.

### Fase 2: Ejecución de Pruebas Automatizadas
- **Base de Datos:** Inicializar entorno local de Supabase (`supabase start`) y aplicar las migraciones almacenadas en `supabase/migrations`. Ejecutar pruebas pgTAP (validar aislamiento RLS).
- **Backend / Express:** Ejecutar pruebas unitarias / de integración de la lógica del Security Router y Risk Engine usando `vitest`.
- **Análisis de Vulnerabilidades:** Ejecutar `npm audit` para bloquear el merge si se detectan vulnerabilidades severas en las dependencias.

### Fase 3: Preview Deployment (Vercel)
- Disparar un despliegue de Preview Automático usando la integración nativa de Vercel. 
- Retornar el Link generado de vuelta al PR en GitHub para revisión humana.

## 3. Pipeline de Despliegue (CD - Entrega Continua)

Cuando el Pull Request es fusionado (Merged) en la rama `main`, se activan los pipelines de despliegue a producción. Debido a la arquitectura fragmentada, hay dos orquestadores principales:

### Pipeline 3.1: Despliegue de Aplicación a Vercel
1. Vercel detecta automáticamente el commit en `main`.
2. Se compila la SPA React (`npm run build`).
3. Se aprovisionan las funciones Serverless en Node.js 20 basadas en `server/api/server.js`.
4. El despliegue de producción se hace público y se realiza un redireccionamiento atómico de tráfico (Zero-Downtime Deployment).

### Pipeline 3.2: Despliegue de Base de Datos y Edge Functions (Supabase)
Ejecutado por GitHub Actions usando el CLI Oficial de Supabase:
1. `supabase link --project-ref $SUPABASE_PROJECT_ID`
2. `supabase db push`: Aplica (apila) las nuevas migraciones SQL secuencialmente a la base de datos de Producción, respetando el versionado.
3. `supabase functions deploy`: Despliega o actualiza las funciones Edge Deno (ej. el consumidor de códigos de registro) a la infraestructura global de Supabase.

## 4. Rollback y Manejo de Incidentes

En caso de que el sistema en Producción comience a arrojar alertas (e.g. Elevación súbita de errores HTTP 500 en las funciones serverless de Auth), el flujo de reversión procede de la siguiente manera:

1. **Frontend / Backend Serverless:** Rollback instantáneo usando la funcionalidad nativa del Dashboard de Vercel para restaurar el Commit/Deploy previo funcional de forma atómica.
2. **Base de Datos:** Debido a que revertir una migración (Down) de base de datos es riesgoso en un modelo multi-tenant activo, se prefiere la filosofía de *Fix-Forward*: Enviar rápidamente un Hotfix en forma de nueva migración compensatoria, o utilizar las copias de seguridad Point-in-Time (PITR) de Supabase si el esquema ha corrompido datos irrevocables.
