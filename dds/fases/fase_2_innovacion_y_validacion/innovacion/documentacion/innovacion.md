# Características de Innovación Tecnológica

*Fuente de verdad: Arquitectura y stack documentados en `package.json` y base de datos*

Democra introduce los siguientes patrones de innovación técnica en su desarrollo:

## 1. Patrón "Zero-ORM" con RLS Dinámico

En lugar de utilizar un ORM pesado que gestione el estado en la capa de aplicación, el proyecto utiliza el patrón "Zero-ORM" consumiendo el cliente directo `@supabase/supabase-js`. 
**Innovación:** La lógica de negocio pesada (sincronización de membresías, aprobaciones, auditoría) reside en el motor transaccional de PostgreSQL mediante funciones `SECURITY DEFINER` y `Row Level Security`. Esto garantiza que la seguridad no dependa de la perfección del código en el frontend o del backend Node.js.

## 2. Arquitectura Híbrida (Serverless + Stateful)

Mientras que las lecturas y escrituras estándar del CRUD de las ONGs apuntan directamente a la API PostgREST (Serverless), los flujos de alta criticidad pasan por un servidor Express Stateful (`server/index.js`).
**Innovación:** Esta hibridación minimiza los costos de infraestructura (el 90% del tráfico no pasa por Node.js) mientras mantiene el control sobre los cuellos de botella de seguridad, como el `rate-limit` por IP en el *Risk Engine* y el envío de MFA mediante Resend.

## 3. MPA Moderno (Multi-Page Application nativo)

El proyecto adopta un enfoque MPA nativo utilizando las capacidades de enrutamiento de Vite (`spaFallback`).
**Innovación:** Permite la coexistencia en un solo repositorio y un solo dominio de la aplicación corporativa (`/`) y la aplicación pesada de la ONG (`/ong`). Al configurar chunks separados (`vendor-charts`, `vendor-radix`) en `vite.config.js`, el sistema reduce dramáticamente el First Contentful Paint (FCP) sin requerir meta-frameworks como Next.js, logrando un rendimiento óptimo de SPA en cada ruta raíz.
