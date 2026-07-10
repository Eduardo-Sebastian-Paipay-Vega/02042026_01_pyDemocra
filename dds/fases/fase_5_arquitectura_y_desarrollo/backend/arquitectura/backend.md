# Arquitectura de Backend (Node.js + Edge Functions)

*Fuente de verdad: `server/index.js`, `package.json`*

La arquitectura de backend de Democra es deliberadamente espartana, delegando el peso del CRUD a PostgREST. Lo que sí reside en el backend se divide en dos componentes diferenciados:

## 1. Servidor Express (API Security Copilot)
*   **Rol:** Guardián de seguridad (IAM), evaluación de riesgos y orquestador de flujos privilegiados.
*   **Infraestructura:** Vercel Serverless Functions (`server.js`). Confía en un solo proxy de Vercel (`app.set("trust proxy", 1)`) para resolución de IPs reales.
*   **Middlewares Críticos:**
    *   `helmet`: Políticas de seguridad de cabeceras HTTP.
    *   `cors`: Estrictamente limitado a `*.democra.pro` y `localhost:5173`.
    *   `express-rate-limit`: Reglas estrictas contra fuerza bruta en `/api/auth` y un paraguas general para el resto de endpoints.

## 2. Edge Functions (Deno / Supabase)
*   **Rol:** Hooks y disparadores automáticos que requieren ejecución atómica cercana a la base de datos (por ejemplo, en aprovisionamientos).
*   *Ausencia de ORM:* Ambos backends interactúan con la base de datos a través de `@supabase/supabase-js`, inyectando la Service Role Key para saltarse el RLS cuando ejecutan tareas administrativas (como leer el log inmutable de auditoría).

> [!NOTE]
> **Trazabilidad:** La decisión fundamental de omitir un ORM pesado en esta capa y limitar el API Node.js a solo funciones críticas está rigurosamente justificada en el registro de [Anti-ADRs](decisiones_arquitectonicas/anti_ADRs.md).
