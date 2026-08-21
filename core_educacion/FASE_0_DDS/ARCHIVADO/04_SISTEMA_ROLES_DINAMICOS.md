# FASE 0 — Metodología DDS: Etapa 4 — Sistema de Roles Dinámicos & Autorización Híbrida (RBAC + ABAC + PBAC)

> **Proyecto**: EDUCACION OS — Sistema Operativo e Infraestructura Educativa
> **Fase**: Fase 0 — Metodología DDS (Desarrollo Dirigido por Sistemas)
> **Etapa**: Etapa 4 — Sistema de Roles Dinámicos
> **Versión**: 1.0
> **Fecha**: 2026-08-01
> **Autor**: Eduardo Sebastian Paipay Vega

---

## 🏛️ 1. Arquitectura de Autorización Híbrida Dinámica

El ecosistema **EDUCACION OS** abandona el modelo rígido de roles estáticos para implementar un motor de autorización tridimensional que combina **RBAC** (Role-Based Access Control), **ABAC** (Attribute-Based Access Control) y **PBAC** (Policy-Based Access Control).

```mermaid
graph TD
    Sub[Sujeto / Usuario + Claims] --> Engine[Motor PDP - Policy Decision Point]
    Res[Recurso + Atributos] --> Engine
    Env[Contexto / Entorno - GPS, Hora, IP] --> Engine
    Pol[Políticas & Reglas Dinámicas] --> Engine
    Engine -->|PERMIT / DENY| Result[Acceso Autorizado / Denegado]
```

---

## 🧩 2. Componentes del Modelo de Autorización

### 2.1 Elementos del Dominio de Seguridad
1. **Sujeto ($S$)**: Usuario autenticado con atributos (ID, Tenant, Rol Base, Departamento, Asignación Académica).
2. **Acción ($A$)**: Operación intentada (`read`, `write`, `delete`, `approve`, `override`, `export`, `grade`).
3. **Recurso ($R$)**: Entidad destino con atributos (`student_profile`, `grade_sheet`, `assessment_item`, `digital_contract`).
4. **Contexto ($C$)**: Variables de entorno dinámicas (Hora del día, IP de origen, Estado del periodo académico, Matrícula activa).
5. **Políticas ($P$)**: Reglas lógicas booleanas evaluadas dinámicamente en tiempo real:
   $$\text{Decision} = f(S, A, R, C)$$

---

## 📐 3. Especificación del Modelo Dinámico (Pseudocódigo & Reglas)

### 3.1 Estructura de Claims y Permisos Dinámicos

```json
{
  "sub": "usr_99812039",
  "tenant_id": "tnt_school_unsch",
  "base_roles": ["TEACHER_USER", "ACADEMIC_COORDINATOR"],
  "dynamic_capabilities": [
    "course:create",
    "grade:submit:assigned_courses",
    "student:read:assigned_only"
  ],
  "temporary_grants": [
    {
      "capability": "grade_sheet:override_approval",
      "valid_from": "2026-08-01T06:00:00Z",
      "valid_until": "2026-08-01T18:00:00Z",
      "granted_by": "usr_director_01",
      "reason": "Revisión extraordinaria de actas de fin de bimestre"
    }
  ]
}
```

---

### 3.2 Evaluación de Políticas ABAC / PBAC en Pseudocódigo

```pseudocode
FUNCION evaluar_acceso(sujeto, accion, recurso, contexto) -> BOOLEANO:
    
    // 1. Verificación de Aislamiento Tenant (Regla Inviolable)
    SI recurso.tenant_id != sujeto.tenant_id Y sujeto.global_role != 'SUPER_ADMIN':
        RETORNAR FALSO // Denegación inmediata por violación de Tenant

    // 2. Evaluador de Permisos Temporales Explicitos (Grant Temporal)
    PARA CADA permiso IN sujeto.temporary_grants:
        SI permiso.capability == accion.id Y 
           contexto.current_time >= permiso.valid_from Y 
           contexto.current_time <= permiso.valid_until:
            REGISTRAR_AUDITORIA("PERMISO_TEMPORAL_CONCEDIDO", sujeto, recurso)
            RETORNAR VERDADERO

    // 3. Evaluación de Política ABAC (Contexto y Atributos de Recurso Académico)
    SI accion.id == "student:view_ews_alerts":
        SI sujeto.has_role("TEACHER") Y recurso.assigned_teacher_id == sujeto.id:
            RETORNAR VERDADERO
        SINO SI sujeto.has_role("ACADEMIC_ADMIN") O sujeto.has_role("TUTOR_USER"):
            RETORNAR VERDADERO
        SINO:
            RETORNAR FALSO // Un docente no asignado no puede ver alertas de deserción ajenas

    // 4. Regla Restrictiva por Contexto Geográfico / Red Institucional
    SI accion.is_sensitive_financial_operation:
        SI NO contexto.ip_address.is_in_subnet(sujeto.allowed_office_ips):
            REGISTRAR_ALERTA_SEGURIDAD("ACCESO_FINANCIERO_RED_NO_AUTORIZADA", sujeto)
            RETORNAR FALSO

    // 5. Fallback a RBAC Convencional
    RETORNAR sujeto.has_capability_for_action(accion)
FIN FUNCION
```

---

## 🔀 4. Herencia, Jerarquía y Delegación de Permisos

```mermaid
graph TD
    SuperAdmin[Super Admin Global] --> TenantOwner[Director General / Sostenedor]
    TenantOwner --> AcademicAdmin[Director Académico]
    AcademicAdmin --> Coordinator[Coordinador de Nivel]
    AcademicAdmin --> FinanceAdmin[Administrador Financiero]
    Coordinator --> Teacher[Docente Staff]
    Teacher --> Student[Estudiante]
    
    subgraph Delegacion_Temporal["Mecanismo de Delegación"]
        AcademicAdmin -.->|Delegación Temporal de 24h| Coordinator
    end
```

### 4.1 Reglas de Delegación Temporal
* Un directivo o coordinador puede delegar temporalmente un subconjunto de sus capacidades académicas a un reemplazante.
* Toda delegación requiere una estmapa de expiración obligatoria (máximo 72 horas) y justificación registrada en auditoría.
* Revocación automática e instantánea al expirar el temporizador en Redis.

---

## 📈 5. Escalabilidad del Sistema para Cientos de Roles y Miles de Permisos

Conforme EDUCACION OS escale a cientos de instituciones educativas y miles de atributos de permisos, la evaluación de permisos se optimiza mediante:

1. **Compilación de Políticas OPA (Open Policy Agent)**: Las reglas de acceso escritas en lenguaje **Rego** se compilan a **WebAssembly (WASM)** y se ejecutan en el microsegundo directamente en el API Gateway NestJS.
2. **Caché Bitmask de Permisos en Redis**: Los miles de permisos posibles se convierten en un vector de bits binarios (*Bitmask*). La comprobación de pertenencia se realiza con operaciones a nivel de bit (`AND` / `OR`) en tiempo $O(1)$.

---

*Fin de la Etapa 4 — Sistema de Roles Dinámicos Metodología DDS v1.0.*
