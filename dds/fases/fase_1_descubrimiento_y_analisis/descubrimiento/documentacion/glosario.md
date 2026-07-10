# Glosario Técnico y de Negocio

*Fuente de verdad: `README.md`, `AUDIT_REPORT_S1.md`*

A continuación se definen los términos clave utilizados en la arquitectura y el dominio del proyecto Democra.

### A
*   **ACE (Access & Context Engine):** Motor interno del sistema encargado de gestionar enlaces de acceso (links) y membresías contextuales de los usuarios a diferentes entidades u ONGs.
*   **Aprovisionamiento Admin:** Acción realizada mediante Edge Functions para configurar usuarios o entidades con privilegios de administración de forma segura.

### B
*   **BaaS (Backend as a Service):** Modelo de servicio en la nube utilizado en el proyecto mediante Supabase, el cual provee la base de datos (PostgreSQL), autenticación básica y almacenamiento.

### E
*   **Edge Functions:** Funciones serverless ejecutadas en la infraestructura de Supabase (Deno), utilizadas para operaciones específicas como aprovisionamiento de administradores, revocación de sesiones y consumo de códigos de registro legacy.

### I
*   **IAM (Identity and Access Management):** Gestión de Identidad y Accesos. En Democra, una parte de esta lógica se maneja a través del backend Express ubicado en la carpeta `server/`, controlando roles y asignaciones.

### M
*   **MFA (Multi-Factor Authentication):** Autenticación de múltiples factores. Democra implementa una capa propia de MFA y evaluación de riesgo ("Risk Engine") gestionada desde el backend Express, además de la provista por Supabase.
*   **Multi-tenant:** Arquitectura de software donde una única instancia de la aplicación sirve a múltiples clientes (organizaciones u ONGs, llamadas "tenants"). En Democra, los datos de cada tenant comparten la misma base de datos pero están aislados lógicamente a través de seguridad a nivel de filas.

### O
*   **OTP (One-Time Password):** Contraseña de un solo uso, enviada típicamente por correo electrónico (usando el proveedor Resend) como parte del flujo de autenticación MFA.

### R
*   **Risk Engine (Motor de Riesgo):** Lógica del backend que evalúa las sesiones y eventos de autenticación, manejando bloqueos temporales por intentos fallidos de PIN y generando desafíos MFA (`mfa_challenges`).
*   **RLS (Row Level Security):** Funcionalidad de PostgreSQL utilizada extensamente en el proyecto para asegurar el modelo multi-tenant. Las políticas RLS garantizan que un usuario solo pueda leer y modificar las filas (registros) que pertenecen a su `tenant_id` actual, calculado mediante la función `fn_current_tenant_id()`.

### S
*   **SaaS (Software as a Service):** Modelo de distribución de software donde Democra se aloja centralmente y se licencia a las ONGs bajo un modelo de suscripción.
*   **SSOT (Single Source of Truth):** Fuente Única de Verdad. Principio rector de la metodología DDS (Document Driven Development) implementada, donde el código fuente y la base de datos dictan la realidad de la documentación.
*   **Supabase:** Plataforma Backend-as-a-Service open source basada en PostgreSQL 16, utilizada como el núcleo de persistencia, auth base y almacenamiento (storage) del proyecto.

### T
*   **Tenant:** Un "inquilino" o cliente dentro de la plataforma SaaS (en este contexto, una ONG u organización específica). Cada entidad tiene su propio `tenant_id` que aísla sus datos.
