# Catálogo de Entidades y Agregados
> **Fase 3 | Diseño y Definición** | Fecha de análisis: 2026-07-09

---

Este documento detalla las entidades principales, identificando los Aggregate Roots (raíces de agregado), Value Objects y las invariantes de negocio que deben protegerse por Bounded Context.

## 1. Identity & Access (IAM) Context

### `Tenant` (Aggregate Root)
- **Atributos:** `id` (UUID), `name`, `tax_id` (RUC), `industry_type`, `plan_id`, `created_at`, `status`.
- **Invariantes:** El `tax_id` (RUC) debe ser único globalmente en el sistema. Debe estar marcado como "ACTIVO" en SUNAT durante su creación. No puede borrarse físicamente (solo suspenderse).
- **Asociaciones:** Dueño de todas las entidades del sistema (frontera dura de aislamiento).

### `Role` (Entity)
- **Atributos:** `id`, `tenant_id`, `name`, `hierarchy_level`, `is_system_role`.
- **Invariantes:** Si `is_system_role = true`, el rol es inmutable (no puede eliminarse, solo pueden ajustarse sus permisos). Un rol no puede asignarse a alguien de mayor jerarquía.

---

## 2. People Context

### `VolunteerProfile` (Aggregate Root)
- **Atributos:** `id`, `tenant_id`, `documentNumber`, `firstName`, `lastName`, `state`, `skills[]`, `joinDate`.
- **Invariantes:** Un `documentNumber` es único por tenant. El perfil debe estar asociado inmutablemente al `tenant_id` y opcionalmente vinculado a un usuario de autenticación (`auth_user_id`).

### `MedicalProfile` (Value Object / Component)
- **Atributos:** `bloodType`, `allergies`, `disabilities`, `emergencyContact`.
- **Invariantes:** Toda consulta a este objeto en la capa de persistencia debe disparar un trigger de auditoría de datos sensibles (`SensitiveAccessLog`).

---

## 3. Admission Context

### `AdmissionRequest` (Aggregate Root)
- **Atributos:** `id`, `tenant_id`, `stateCode`, `history[]`, `candidateInfo` (JSONB).
- **Invariantes:** El estado (`stateCode`) debe seguir estrictamente la máquina de estados finita (FSM): `NUEVA` → `EN_ENTREVISTA` → `APROBADA` / `RECHAZADA`. Solo solicitudes "Aprobadas" pueden convertirse en `VolunteerProfile`.

### `RegistrationCode` (Entity)
- **Atributos:** `id`, `code`, `tenant_id`, `maxUses`, `currentUses`, `expiresAt`.
- **Invariantes:** `currentUses` nunca puede exceder `maxUses`. El sistema debe rechazar el código si `now() > expiresAt`.

---

## 4. Projects & Operations Context

### `Project` (Aggregate Root)
- **Atributos:** `id`, `tenant_id`, `code`, `name`, `stateKind`, `tasks[]`.
- **Invariantes:** El `code` debe ser único dentro de un mismo `tenant_id`. Las tareas y actividades hijas se eliminan o archivan en cascada si se archiva el proyecto.

### `HourRecord` (Entity)
- **Atributos:** `id`, `tenant_id`, `activity_id`, `volunteer_id`, `hours`, `date`, `status`.
- **Invariantes:** Las horas registradas pasan por defecto a estado 'Pendiente' y requieren aprobación para contabilizarse en el KPI oficial del voluntario.

---

## 5. Resources Context

### `InventoryItem` (Entity)
- **Atributos:** `id`, `tenant_id`, `code`, `name`, `categoryId`.
- **Invariantes:** El stock físico (`derivedStock`) no se guarda estáticamente; siempre se debe calcular como la suma algebraica de los registros inmutables en `InventoryMovement` para ese artículo.

### `FinancialTransaction` (Aggregate Root)
- **Atributos:** `id`, `tenant_id`, `type` (ING / EGR), `amount`, `currency`, `approvalKind`.
- **Invariantes:** Si `type = EGRESO`, la transacción nace obligatoriamente con `approvalKind = PENDING` y no afecta el saldo de la caja chica o banco hasta que un usuario con permisos pase el estado a `APPROVED`.
