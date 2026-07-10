# Modelos de Dominio (Domain Driven Design - DDD)

*Fuente de verdad: `DATABASE_DICTIONARY_S1.md`, `AUDIT_REPORT_S1.md`*

A partir de la ingeniería inversa aplicada al esquema relacional de la plataforma Democra, se identifican los siguientes **Bounded Contexts (Contextos Delimitados)** y sus **Aggregates (Agregados)** principales.

## 1. Bounded Context: Identity & Access (IAM & ACE)

Este contexto se encarga de aislar la información por organización (Multi-tenant), gestionar las identidades y controlar los permisos granulares.

*   **Aggregate: Tenant (Organización)**
    *   **Root:** `Tenant` (Organización cliente).
    *   **Entidades:** `Sede`, `SubscriptionContract`, `Entitlement`, `PlanPolicy`.
    *   **Responsabilidad:** Establecer la frontera de datos. Un usuario no puede cruzar fronteras de Tenant.
*   **Aggregate: Profile & Security**
    *   **Root:** `Profile` (conectado al auth subyacente).
    *   **Entidades:** `Device`, `Session`, `AuthEvent`, `MfaChallenge`.
    *   **Responsabilidad:** Control de autenticación complementaria, evaluación de riesgo (Risk Engine), gestión de MFA y manejo de bloqueos por seguridad.
*   **Aggregate: Access & Context Engine (ACE)**
    *   **Root:** `Membership` (relación polimórfica usuario-entidad).
    *   **Entidades:** `AccessLink` (Invitaciones), `Role`, `RolePermission`, `UserRolesSedes` (en proceso de sincronización/reemplazo por ACE).
    *   **Responsabilidad:** Asignación de contexto, distribución de invitaciones temporales con límites de uso, resolución de autorización en consultas.

## 2. Bounded Context: Operaciones ONG (Core)

Maneja el día a día y la estructura de trabajo de una organización sin fines de lucro.

*   **Aggregate: Voluntariado y Beneficiarios**
    *   **Root:** `Voluntario`.
    *   **Entidades:** `Beneficiario`, `IdCard` (Credencial QR).
    *   **Responsabilidad:** Mantener el estado maestro de los participantes de las ONGs.
*   **Aggregate: Ejecución de Proyectos**
    *   **Root:** `Proyecto`.
    *   **Entidades Hijas:** `Actividad` (pertenece a Proyecto), `Tarea` (pertenece a Actividad). *(Basado en jerarquía invertida post-migración 20260501).*
    *   **Responsabilidad:** Estructurar el esfuerzo de la ONG. Define presupuestos, locaciones (`Ubicacion`) y requerimientos.
*   **Aggregate: Participación y Evidencia**
    *   **Root:** `Asistencia` y `Aprobaciones` (bandeja polimórfica).
    *   **Entidades:** `HorasActividad`, `EvidenciasActividad`, `TransaccionesInventario`.
    *   **Responsabilidad:** Registrar el esfuerzo real (check-ins, horas donadas, movimientos logísticos).

## 3. Bounded Context: Recursos Humanos (RRHH)

Encargado del ciclo de vida del voluntario antes y durante su ingreso.

*   **Aggregate: Admisión**
    *   **Root:** `SolicitudAdmision` (Máquina de estados: nueva -> entrevista -> aprobada/rechazada).
    *   **Entidades:** `EntrevistaAdmision`, `DocumentosAdmision`, `OnboardingVoluntario`.
    *   **Responsabilidad:** Filtrar, entrevistar y capacitar (onboarding) a los nuevos ingresos.

## 4. Bounded Context: Gestión Clínica (Datos Sensibles)

Contexto de máxima seguridad para organizaciones con intervención de salud o atención a vulnerables.

*   **Aggregate: Expediente Clínico**
    *   **Root:** `FichaMedica`.
    *   **Entidades:** `PerfilNino`, `PerfilAdultoMayor`, `FichaSensibleVoluntario`.
    *   **Regla de Negocio Crítica:** Las consultas a estos datos no solo deben estar aisladas por Tenant, sino rigurosamente protegidas por verificación de permisos granulares debido a la sensibilidad extrema de los datos (HIPAA/GDPR compliance). Todas las consultas se auditan obligatoriamente en `accesos_sensibles_log`.

## 5. Bounded Context: Finanzas y Facturación

Controla el flujo de caja operativo de la ONG.

*   **Aggregate: Tesorería**
    *   **Root:** `Cuenta`.
    *   **Entidades:** `Transaccion`, `ComprobanteFinanciero`, `AprobacionTransaccion`.
    *   **Responsabilidad:** Registrar los movimientos de dinero, garantizar consistencia del saldo (`saldo_actual`) y someter transacciones grandes a un flujo de aprobación.

## 6. Contextos Obsoletos (Para Depuración)

*   `Donaciones`, `Impacto` (KPIs/ODS), `Gamificacion` (Insignias/Puntos): Se identifican como dominios conceptualmente separados que actualmente carecen de implementación activa en el código, categorizándose como deuda técnica a resolver.
