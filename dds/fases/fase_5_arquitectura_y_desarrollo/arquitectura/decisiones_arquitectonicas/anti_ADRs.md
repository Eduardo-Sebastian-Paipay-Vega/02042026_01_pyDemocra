# Decisiones Descartadas (Anti-ADRs)

*Fuente de verdad: Histórico de Arquitectura*

Este documento (Anti-ADR) explica las decisiones arquitectónicas que **NO** tomamos o herramientas que decidimos **NO** usar, para proveer contexto a futuros desarrolladores sobre los compromisos (trade-offs) aceptados.

## 1. Por qué NO usamos un Meta-Framework (Next.js / Remix)
**Propuesta Descartada:** Migrar la SPA de Vite a Next.js (App Router) para mejorar SEO y Server-Side Rendering (SSR).
**Razón del Rechazo:**
*   Democra es un SaaS transaccional (`/ong`), no un blog de contenido. El SEO solo importa para la landing page corporativa (`/`), la cual es lo suficientemente liviana para indexarse.
*   Next.js requiere computación en servidor (Node.js) para renderizar, lo cual elevaría los costos de hosting. Al usar Vite, las aplicaciones de ONG son archivos estáticos servidos gratuitamente en el Edge (CDNs), manteniendo el backend reservado solo para flujos de alta seguridad.

## 2. Por qué NO usamos un ORM pesado (Prisma / TypeORM)
**Propuesta Descartada:** Usar Prisma como capa de abstracción de datos para el API de Express.
**Razón del Rechazo:**
*   El 90% de las consultas a la base de datos (lectura de proyectos, voluntarios) se hacen directamente desde el navegador (React) vía la API REST generada automáticamente por Supabase (PostgREST). 
*   Si introdujéramos Prisma, tendríamos que duplicar la lógica de seguridad: las políticas RLS en la base de datos (para proteger el acceso web) y la capa Prisma en Node.js, creando una fricción insostenible. Mantenemos el patrón *Zero-ORM*.

## 3. Por qué NO se usa Redis para el Rate Limiting
**Propuesta Descartada:** Instalar un clúster de Redis (Upstash) para llevar el control de IP rate limits del servidor Express.
**Razón del Rechazo:**
*   Aumenta la superficie de ataque y los costos de infraestructura (`vendor lock-in`). Actualmente, `express-rate-limit` guarda el estado en la memoria local del contenedor sin servidor de Vercel. 
*   *Trade-off Aceptado:* Sabemos que en entornos Serverless (donde Vercel levanta múltiples instancias concurrentes del API), el límite de "5 intentos" es aproximado y no global, pero es suficiente mitigación para scripts automatizados tontos sin requerir la latencia de una red Redis externa.
