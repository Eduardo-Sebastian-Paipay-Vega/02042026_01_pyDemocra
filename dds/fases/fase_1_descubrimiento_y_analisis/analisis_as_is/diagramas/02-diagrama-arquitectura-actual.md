# Diagrama de Arquitectura Actual
> **Fase 1 | Descubrimiento** | Fecha de análisis: 2026-07-09

El siguiente diagrama muestra la arquitectura física y lógica actual del sistema, detallando sus 3 capas principales (Frontend, Backend, y Datos).

```mermaid
flowchart TB
    %% Definición de estilos
    classDef frontend fill:#087f5b,stroke:#099268,stroke-width:2px,color:#fff,rx:5px,ry:5px
    classDef backend fill:#c92a2a,stroke:#e03131,stroke-width:2px,color:#fff,rx:5px,ry:5px
    classDef database fill:#5f3dc4,stroke:#6741d9,stroke-width:2px,color:#fff,rx:5px,ry:5px
    classDef external fill:#868e96,stroke:#adb5bd,stroke-width:2px,color:#fff,rx:5px,ry:5px
    
    %% Actores Externos (Infraestructura de terceros)
    SUNAT(API SUNAT):::external
    Resend(API Resend):::external
    
    subgraph Vercel_Infra [Infraestructura Vercel PaaS]
        %% Capa de Presentación (Frontend)
        subgraph Capa_Presentacion [Capa de Presentación (Frontend)]
            Landing(Landing Page\nReact 18):::frontend
            AppONG(App ONG SPA\nVite + React + TS):::frontend
        end
        
        %% Capa API (Backend)
        subgraph Capa_API [Capa API (Node.js/Express)]
            Router(Express Router\nServerless Functions):::backend
            Security(Middleware Seguridad\nHelmet + RateLimit):::backend
            AuthLogic(Auth & Risk Engine\nStep-Up MFA):::backend
            TenantScope(Tenant Scope\nassertTenantScope):::backend
            
            Security --> Router
            Router --> AuthLogic
            Router --> TenantScope
        end
    end
    
    subgraph Supabase_Infra [Infraestructura Supabase PostgreSQL 16]
        %% Capa de Datos
        subgraph Capa_Datos [Capa de Datos y Autorización]
            Auth(Supabase Auth\nGoTrue):::database
            DB(PostgreSQL BD\nCore Data):::database
            RLS(Row Level Security\nfn_current_tenant_id):::database
            Triggers(Triggers\nAudit & Event Logs):::database
            Storage(Supabase Storage\nArchivos/Evidencias):::database
            EdgeFunctions(Edge Functions\nDeno):::database
            
            DB <--> RLS
            DB <--> Triggers
        end
    end
    
    %% Relaciones
    AppONG -- Autenticación Directa --> Auth
    AppONG -- Consultas directas Módulos ONG (supabase-js) --> DB
    AppONG -- Sube archivos --> Storage
    
    AppONG -- Operaciones Críticas (IAM, Onboarding) --> Security
    Landing -- Navegación pública --> AppONG
    
    AuthLogic -- Envía OTPs / Emails --> Resend
    TenantScope -- Valida RUC externo --> SUNAT
    
    TenantScope -- Operaciones Privilegiadas (service_role) --> DB
    AuthLogic -- Consulta y registra logs forenses --> DB
    
    EdgeFunctions -- Tareas administrativas seguras --> DB
```

## Detalles de la Arquitectura

1. **Dualidad de acceso a Datos:** El Frontend (App ONG) interactúa **directamente** con Supabase PostgreSQL utilizando la librería `@supabase/supabase-js` para operaciones CRUD regulares. El acceso está garantizado por las robustas políticas RLS que aíslan cada Tenant.
2. **Backend como escudo:** El Backend Express se reserva exclusivamente para operaciones de alto riesgo que no pueden o no deben resolverse en el frontend, como: (1) Bootstrap transaccional de un nuevo tenant, (2) Gestión de IAM/Roles, y (3) El motor de evaluación de riesgo y MFA (Auth).
3. **Seguridad delegada y acoplada:** La verificación de identidad es provista por Supabase Auth (JWTs). Express valida estos JWTs y extrae la metadata (Tenant ID), pero no gestiona contraseñas directamente.
