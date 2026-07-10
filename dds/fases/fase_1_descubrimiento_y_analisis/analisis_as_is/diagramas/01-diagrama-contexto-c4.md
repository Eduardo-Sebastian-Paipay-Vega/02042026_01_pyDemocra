# Diagrama de Contexto (C4 Nivel 1)
> **Fase 1 | Descubrimiento** | Fecha de análisis: 2026-07-09

El siguiente diagrama muestra el sistema Democra en su contexto general, interactuando con actores y sistemas externos de terceros.

```mermaid
flowchart LR
    %% Definición de estilos
    classDef actor fill:#08427b,stroke:#052e56,stroke-width:2px,color:#fff,rx:5px,ry:5px
    classDef system fill:#1168bd,stroke:#0b4884,stroke-width:2px,color:#fff,rx:5px,ry:5px
    classDef external_system fill:#999999,stroke:#666666,stroke-width:2px,color:#fff,rx:5px,ry:5px
    
    %% Actores
    Administrador(Administrador/Owner):::actor
    Coordinador(Coordinador/Gestor):::actor
    Voluntario(Voluntario con Acceso):::actor
    Candidato(Candidato a Voluntario):::actor
    Auditor(Auditor/Gobernanza):::actor
    
    %% Sistema Principal
    subgraph Democra[Sistema Principal]
        DemocraSystem(Sistema Democra\n[SaaS Multi-tenant]):::system
    end
    
    %% Sistemas Externos
    SUNAT(API SUNAT / RUC\n[Sistema Externo]):::external_system
    Resend(Resend API\n[Sistema Externo]):::external_system
    Supabase(Supabase PaaS\n[Base de Datos & Auth]):::external_system
    Vercel(Vercel PaaS\n[Infraestructura]):::external_system
    
    %% Relaciones Actores -> Sistema
    Administrador -- Configura organización, roles y seguridad --> DemocraSystem
    Coordinador -- Gestiona personas, proyectos, y recursos --> DemocraSystem
    Voluntario -- Registra horas, asistencia y evidencias --> DemocraSystem
    Candidato -- Completa formulario de autoregistro --> DemocraSystem
    Auditor -- Revisa logs y métricas forenses --> DemocraSystem
    
    %% Relaciones Sistema -> Externos
    DemocraSystem -- Valida estado y condición fiscal (RUC) --> SUNAT
    DemocraSystem -- Envía emails transaccionales y OTPs --> Resend
    DemocraSystem -- Delega autenticación, RLS y almacenamiento --> Supabase
    DemocraSystem -- Aloja frontend SPA y API serverless --> Vercel
```

## Leyenda
- **Azul oscuro:** Actores humanos (Usuarios del sistema).
- **Azul claro:** El sistema de software principal (Democra).
- **Gris:** Sistemas de software e infraestructuras de terceros que no están bajo el control directo de la organización, pero son vitales para el funcionamiento.
