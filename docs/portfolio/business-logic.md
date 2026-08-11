# 👔 Lógica de Negocio — Democra

Democra no es simplemente un CRUD, sino una plataforma con dominios de conocimiento modelados para soportar el ciclo de vida completo de un Voluntario o Beneficiario dentro de una Organización.

Este documento evidencia la **arquitectura del dominio** que reside en la capa de base de datos y backend de la plataforma.

## 1. El Motor de Vinculación (ACE: Access & Context Engine)

**El Problema**: Los Voluntarios y Staff acceden a la misma plataforma con roles diferentes en distintas sedes, y necesitan un proceso de invitación seguro. Los Beneficiarios, por otro lado, no siempre tienen perfiles digitales pero requieren representación en el sistema.

**La Solución**: ACE (Access & Context Engine).
Se centralizan las invitaciones y los onboarding bajo un modelo unificado en la base de datos:

```sql
-- Motor de vinculación ACE
CREATE TABLE access_links (
  id UUID,
  tenant_id UUID,
  code TEXT UNIQUE,
  type TEXT CHECK (type IN ('VOLUNTEER_JOIN', 'STAFF_JOIN', 'BENEFICIARY_CLAIM')),
  target_role_id UUID,
  max_uses INT,
  expires_at TIMESTAMPTZ
);
```

**Flujo Operativo**:
1. Un coordinador crea un `VOLUNTEER_JOIN` link con usos máximos = 50 para un evento.
2. Los postulantes interactúan con el enlace, el sistema consume un 'uso' y vincula transaccionalmente el usuario (Profiles) a la sede y rol (user_roles_sedes) de manera atómica, garantizando que nadie exceda el cupo (race conditions gestionadas por locks relacionales).

## 2. Gamificación y Reputación (Motor M01)

Las ONGs necesitan métricas de desempeño para promover y premiar voluntarios, y para justificar grants internacionales.

**Lógica Implementada**:
- Tabla `volunteer_reputation` asocia a cada voluntario un `reputation_score`, un título jerárquico (`rank_title`) e insignias (`badge_code`).
- Variables: Asistencia a tiempo, ausencias injustificadas, cantidad de horas aprobadas, calificación promedio otorgada por supervisores de actividades.
- **Validación Asíncrona**: Estos valores no se actualizan en tiempo real por el frontend, previniendo inyección de puntajes. Son recalculados de manera segura en el backend a medida que las horas y asistencias son visadas por roles autorizados.

## 3. Validación Documental (OCR y Scoring M02)

Para evitar registros fraudulentos (ej. bots o suplantación en programas de alto impacto).

**Lógica Implementada**:
Cuando un candidato sube su documento de identidad, el backend procesa las evidencias (tabla `candidate_ocr_scoring`):
1. **Similitud**: El motor backend extrae las cadenas y usa Distancia de Levenshtein (ver `server/services/ocr.js`) para comparar el "Nombre Declarado" vs el "Nombre Extraído" de la imagen.
2. **Scoring Ponderado**:
   - `full_name_similarity` + `ocr_confidence_percentage`.
3. **Recomendación**: La lógica emite un veredicto (`REVISION_MANUAL`, `APROBADO`, `RECHAZADO`). El sistema retira la carga del operador humano automatizando el "Happy Path", dejando las dudas en bandeja de revisión.

## 4. Auditoría Inmutable con Enmascaramiento PII

Para cumplir estándares de privacidad (ej. análogos a HIPAA en el módulo Clínico):

**Lógica Implementada**:
- Al crear un `audit_log`, un trigger relacional toma la instantánea del registro.
- En la capa de aplicación, la lógica de negocio prohíbe que el Frontend consulte logs PII directamente. La API `GET /api/audit/metrics` aplica técnicas de enmascaramiento antes de devolver los payloads (`maskEmail`, `maskIp`), protegiendo datos sensibles incluso frente a administradores con cuentas vulneradas.

## 5. Máquina de Estados: Entidades Core

Las entidades fluyen a través de estados rígidos y validados (State Machine):

**Flujo de Horas de Voluntariado**:
`DRAFT` → `SUBMITTED` → `REVIEWING` → `APPROVED` / `REJECTED`
- *Restricción de Negocio*: Un voluntario no puede editar las horas una vez en `SUBMITTED`. Solo un Coordinador (con `role_permissions = operation.hours.approve`) puede pasarlas a `APPROVED`, detonando la suma en `volunteer_reputation`.

**Flujo Financiero del Tenant**:
`ACTIVE` → `FIN-PENDING` → `FIN-READONLY` → `FIN-SUSPENDED`
- *Restricción de Negocio*: En `FIN-READONLY`, los GETs funcionan, el software no colapsa, pero los middlewares de mutación bloquean todo insert. En `FIN-SUSPENDED`, el acceso se deniega por completo en la ruta de Auth, encapsulando la deuda en un nivel impenetrable.
