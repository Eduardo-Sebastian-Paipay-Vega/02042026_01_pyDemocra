# Diccionario de Eventos de Dominio (Event Storming)

*Fuente de verdad: Casos de uso inferidos del modelo de base de datos*

Este diccionario categoriza los eventos de estado mutables que ocurren en Democra. Cada evento representa un hecho inmutable en el pasado que tiene relevancia para el negocio de las ONGs.

## 1. Dominio: Identidad y Acceso (IAM / ACE)

*   `TenantProvisioned`: Emitido cuando el sistema completa el bootstrapping de una nueva organización (`fn_bootstrap_tenant`).
*   `AccessLinkGenerated`: Se ha creado una invitación con límite de usos para un rol específico.
*   `UserOnboardedToTenant`: Un usuario ha consumido exitosamente un enlace y se ha materializado su `membership` en la organización.
*   `HighRiskLoginDetected`: El Risk Engine ha interceptado un intento de inicio de sesión sospechoso y ha pausado el flujo.
*   `MfaChallengeIssued`: Se ha enviado un código OTP al correo del usuario en respuesta a un riesgo elevado.

## 2. Dominio: Operaciones (ONG)

*   `ActividadCreated`: Una ONG ha agendado una nueva actividad dentro de un Proyecto.
*   `VoluntarioAssigned`: Un voluntario ha sido vinculado a una Actividad.
*   `AttendanceRegistered`: Se ha escaneado exitosamente el QR de un voluntario (`id_cards`) generando una inserción en `asistencias`.

## 3. Dominio: Recursos Humanos (RRHH)

*   `AdmissionRequested`: Un postulante ha llenado el formulario de registro (`solicitudes_admision`).
*   `AdmissionInterviewScheduled`: El coordinador de RRHH ha programado una fecha de entrevista.
*   `VolunteerApproved`: La solicitud transicionó de estado a aprobada; el individuo es formalmente un voluntario.

## 4. Dominio: Finanzas

*   `TransactionProposed`: Se ingresó un movimiento contable (gasto/ingreso) que requiere confirmación.
*   `TransactionApproved`: Se alcanzó el quorum de aprobadores (`aprobaciones_transaccion`) y el saldo de la cuenta fue impactado.
