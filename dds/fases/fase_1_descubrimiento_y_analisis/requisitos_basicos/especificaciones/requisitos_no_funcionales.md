# Requisitos No Funcionales (Atributos de Calidad)

*Fuente de verdad: `README.md`, `AUDIT_REPORT_S1.md`*

Basado en la inspección de la arquitectura y el modelo de despliegue actual de Democra, se identifican los siguientes requisitos no funcionales críticos:

## 1. Seguridad y Aislamiento de Datos

*   **Aislamiento Lógico (Multi-tenancy):** Los datos de todos los tenants coexisten en la misma base de datos física (PostgreSQL), por lo tanto, es mandatorio asegurar el aislamiento mediante políticas de Row Level Security (RLS) estrictas que utilicen el contexto actual (`fn_current_tenant_id()`).
*   **Protección contra Ataques de Fuerza Bruta:** El motor de riesgo (Risk Engine) del backend debe mitigar ataques limitando el número de intentos fallidos de PIN/OTP y aplicando bloqueos temporales (propiedades `PIN_BLOCK_MINUTES`, `RISK_TEMP_BLOCK_MINUTES`).
*   **Gestión Privilegiada:** Las operaciones a nivel de base de datos que requieren saltarse la validación RLS deben realizarse estrictamente en el Backend Express (o en Edge Functions) empleando la `SERVICE_ROLE_KEY`.

## 2. Arquitectura y Tecnología

*   **Paradigma Serverless y BaaS:** El sistema debe apalancarse en servicios gestionados de Supabase para la persistencia, la autenticación base y las funciones en el borde (Edge Functions), minimizando el peso de las APIs tradicionales.
*   **Acceso a Base de Datos sin ORM:** El desarrollo backend no debe utilizar ORMs pesados (como Prisma, TypeORM). Todo acceso se realizará con clientes directos (`@supabase/supabase-js`) y consultas nativas de base de datos para mantener un control granular sobre las políticas de seguridad.
*   **Separación de Preocupaciones:** La interfaz de usuario (React/Vite) se desarrollará de forma independiente (desacoplada) a los servicios de Backend (API Node.js) y podrá ser servida como contenido estático mediante CDNs.

## 3. Trazabilidad y Mantenibilidad

*   **Trazabilidad Forense:** La retención y auditoría universal debe implementarse preferentemente mediante Triggers a nivel de base de datos (`fn_trigger_audit_universal`) para garantizar la captura de los cambios independientemente del cliente u origen de la petición (incluso desde el API o interfaces directas).
*   **Estandarización de Infraestructura:** Toda modificación al esquema de la base de datos debe ser versionada a través de un rastro de migraciones formal (`supabase/migrations/`), prohibiéndose los cambios manuales en producción.
