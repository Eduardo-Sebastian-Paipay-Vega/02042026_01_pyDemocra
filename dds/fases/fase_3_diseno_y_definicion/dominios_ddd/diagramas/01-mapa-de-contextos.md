# Mapa de Contextos (Context Map)
> **Fase 3 | Diseño y Definición** | Fecha de análisis: 2026-07-09

---

Este diagrama ilustra cómo los diferentes Bounded Contexts de Democra se integran y comunican entre sí. Las flechas indican la dependencia (quién consume datos de quién).

```mermaid
flowchart TD
    %% Estilos de Nodos
    classDef core fill:#2b8a3e,stroke:#1971c2,stroke-width:2px,color:#fff
    classDef support fill:#f08c00,stroke:#d9480f,stroke-width:2px,color:#fff
    classDef security fill:#c92a2a,stroke:#a61e4d,stroke-width:2px,color:#fff
    
    %% Bounded Contexts
    IAM[Identity & Access\nIAM Context]:::core
    Sec[Security & Risk\nContext]:::security
    ACE[Access & Context\nEngine (ACE)]:::security
    People[People\nContext]:::core
    Admission[Admission\nContext]:::support
    Projects[Projects &\nOperations Context]:::core
    Resources[Resources\nContext]:::support
    Gov[Governance\nContext]:::security
    
    %% Relaciones / Patrones de Integración
    
    IAM -- "Shared Kernel\n(Provee Autenticación y\nTenant ID a todos)" --> Sec
    IAM -- "Customer/Supplier\n(Provee Datos de Rol)" --> ACE
    
    Sec -- "Shared Kernel\n(Evalúa accesos\ny MFA)" --> IAM
    
    ACE -- "Anticorruption Layer\n(Filtra permisos dinámicos\npor Módulo y Campo)" --> People
    ACE -- "Filtra acceso" --> Projects
    ACE -- "Filtra acceso" --> Resources
    
    Admission -- "Customer/Supplier\n(Transforma 'Candidate'\nen 'Volunteer')" --> People
    
    Projects -- "Customer/Supplier\n(Asignación de\nVoluntarios a Tareas)" --> People
    Projects -- "Customer/Supplier\n(Asignación de\nRecursos a Actividades)" --> Resources
    
    People -- "Auditoría Universal\n(Logs Triggers)" --> Gov
    Projects -- "Auditoría Universal" --> Gov
    Resources -- "Auditoría Universal\n(Egresos/Inventario)" --> Gov
    Admission -- "Auditoría Universal" --> Gov
    IAM -- "Auditoría Universal" --> Gov
```

### Explicación de Relaciones

1. **IAM (Identidad)** actúa como el *Shared Kernel* fundamental de todo el sistema. Provee la identidad del usuario y, lo más crítico, el `tenant_id` aislado que todo el resto de los módulos requiere para funcionar (RN-001).
2. **ACE Engine** actúa como una capa transversal de autorización (Autorización contextual). Intercepta peticiones hacia People, Projects y Resources para inyectar reglas complejas ("Este rol solo puede ver X campos en Y módulo").
3. **Security & Risk** provee protección en tiempo de ejecución para el módulo IAM, interrumpiendo el flujo de login si las anomalías requieren Step-Up MFA.
4. **Governance (Auditoría)** recibe flujos unidireccionales (Eventos/Triggers) de *todos* los demás contextos. Su función es registrar de forma inmutable quién alteró qué en el sistema.
5. **Admission a People:** Relación clásica de productor/consumidor, donde una `AdmissionRequest` (candidato) aprobada desencadena la creación de un `VolunteerProfile` oficial en el contexto de Personas.
