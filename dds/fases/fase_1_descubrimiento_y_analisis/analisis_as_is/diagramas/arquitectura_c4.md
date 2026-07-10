# Diagrama C4 (Nivel 2: Contenedores) - Arquitectura As-Is

*Fuente de verdad: `README.md`, `vite.config.js`, `server/index.js`*

A continuación se presenta el modelo C4 a nivel de contenedores de la plataforma SaaS Democra, reflejando su estado de despliegue y separación de responsabilidades actual.

```mermaid
C4Context
    title Diagrama C4 (Nivel de Contenedores) - Democra ONG Platform

    Person(admin_ong, "Administrador / Staff ONG", "Gestiona la ONG, voluntarios y finanzas.")
    Person(voluntario, "Voluntario", "Participa en proyectos y registra su asistencia.")
    Person(beneficiario, "Beneficiario", "Recibe el servicio de la ONG.")

    System_Boundary(democra_saas, "Democra SaaS") {
        
        Container(app_landing, "Aplicación Principal (Landing/Admin)", "React 18 + Vite", "Punto de entrada de la plataforma (/) y gestión corporativa. Sirve recursos estáticos.")
        
        Container(app_ong, "Módulo ONG Integrado", "React 18 + Vite", "Aplicación servida bajo (/ong). Frontend principal para la operatividad de las ONGs con soporte ACE.")
        
        Container(api_express, "API Backend (IAM / Riesgo)", "Node.js + Express 5", "Maneja IAM, MFA, Motor de Riesgo (Risk Engine) y enrutamiento de auditoría (/api/auth, /api/iam).")
        
        System_Boundary(supabase_baas, "Infraestructura Supabase") {
            ContainerDb(postgres_db, "Base de Datos", "PostgreSQL 16", "Almacenamiento multi-tenant. Aplica seguridad RLS por tenant_id.")
            Container(auth_service, "Supabase Auth", "Go (GoTrue)", "Gestión de identidad base (JWTs, Sesiones).")
            Container(storage, "Supabase Storage", "S3 Compatible", "Buckets: avatars, evidence, id_templates.")
            Container(edge_functions, "Edge Functions", "Deno", "Operaciones atómicas: aprovisionamiento, consumo de códigos.")
        }
    }

    System_Ext(resend, "Resend API", "Proveedor de envío de correos (MFA / OTP).")
    System_Ext(sunat, "RUC API", "Validación de RUC de las ONGs peruanas.")

    Rel(admin_ong, app_landing, "Visita", "HTTPS")
    Rel(admin_ong, app_ong, "Administra tenant", "HTTPS")
    Rel(voluntario, app_ong, "Gestiona cuenta", "HTTPS")
    
    Rel(app_landing, api_express, "API calls", "JSON/HTTPS")
    Rel(app_ong, api_express, "API calls (MFA/Riesgo)", "JSON/HTTPS")
    
    Rel(app_landing, postgres_db, "Lee/Escribe directamente", "@supabase/supabase-js")
    Rel(app_ong, postgres_db, "Lee/Escribe directamente", "@supabase/supabase-js")
    
    Rel(api_express, postgres_db, "Bypass RLS para Auditoría/IAM", "Service Role Key")
    Rel(api_express, resend, "Envía OTPs", "API Key")
    
    Rel(app_landing, auth_service, "Autenticación", "JWT")
    Rel(app_ong, auth_service, "Autenticación", "JWT")
    Rel(app_landing, sunat, "Valida RUC", "HTTPS")

    UpdateElementStyle(postgres_db, $fontColor="white", $bgColor="#336699", $borderColor="#1D3E5E")
    UpdateElementStyle(api_express, $fontColor="white", $bgColor="#68A063", $borderColor="#446E40")
    UpdateElementStyle(app_ong, $fontColor="black", $bgColor="#61DAFB", $borderColor="#3A8A9E")
```

## Notas del Diagrama

*   **Desacoplamiento Frontend/BaaS:** El diagrama ilustra una decisión arquitectónica fundamental; el frontend se comunica directamente con PostgreSQL para operaciones estándar delegando la seguridad a las políticas RLS, sin pasar por la API Express.
*   **Rol del API Express:** El API de Node.js actúa como un middleware especializado. No es un intermediario de CRUD general, sino un orquestador para flujos críticos (Risk Engine, OTP, Auditoría privilegiada).
*   **Enrutamiento Frontend:** A nivel de infraestructura (Vite/Vercel), ambas aplicaciones React (`app_landing` y `app_ong`) coexisten en el mismo dominio pero bajo diferentes "SPA Fallbacks" (`/` y `/ong`).
