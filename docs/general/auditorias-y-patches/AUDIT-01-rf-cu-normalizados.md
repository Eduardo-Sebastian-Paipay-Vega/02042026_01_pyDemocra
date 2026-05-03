# AUDIT-01 RF/CU Normalizados

- Fecha: 2026-03-04 (America/Lima)
- Commit auditado: `fde837c`
- Alcance: extracción y normalización de Requisitos Funcionales (RF) y Casos de Uso (CU) desde documentación Markdown del repositorio.

## 1) Convenciones de normalización

- Se respetan IDs originales cuando existen.
- Duplicidad detectada en `RF-TEN-001`; se separa en dos variantes para trazabilidad sin perder ID fuente:
  - `RF-TEN-001-A` = variante “Actualizado / plantilla de industria” (fuente original `RF-TEN-001`).
  - `RF-TEN-001-B` = variante “Validación fiscal” (fuente original `RF-TEN-001`).
- CU de pagos se mantienen como `CU-PAY-01..08`.

## 2) Requisitos Funcionales (RF)

### RF-TEN-001-A (fuente original: RF-TEN-001)

- Nombre: Registro de Tenant con selección de plantilla de industria.
- Descripción: durante onboarding, seleccionar rubro y aplicar configuración base automática por industria.
- Actores: implícito ACT-02 (onboarding).
- Precondición: usuario en proceso de registro/onboarding.
- Entradas: RUC/fiscal ID, rubro, plan.
- Salidas: tenant creado con configuración base por industria.
- Reglas de negocio: inyección automática de roles/módulos por industria.
- Validaciones: selección de rubro obligatoria.
- Permisos: creación de tenant por actor administrador del tenant.
- Multi-tenant: sí, crea nuevo tenant.
- Auditoría/trazas: implícita en registro.
- Reportes: no explícito.
- Fuentes: `indi-info/SUBS-01-REQ-Gestion-Actores.md:85-93`.

### RF-TEN-001-B (fuente original: RF-TEN-001)

- Nombre: Registro de tenant con validación fiscal.
- Descripción: validar RUC/fiscal ID con API externa antes de crear tenant operativo.
- Actores: ACT-02, EXT-01.
- Precondición: identificación fiscal proporcionada.
- Entradas: RUC/ID fiscal.
- Salidas: tenant creado o rechazo; si API falla, registro provisional pendiente (requerido por documento).
- Reglas de negocio: no crear tenant con estado fiscal inválido; auditar todo intento.
- Validaciones: estado fiscal válido.
- Permisos: actor con capacidad de onboarding.
- Multi-tenant: sí.
- Auditoría/trazas: obligatoria para cada intento.
- Reportes: no explícito.
- Fuentes: `indi-info/SUBS-01-REQ-Gestion-Actores.md:96-110`.

### RF-TEN-002

- Nombre: Gestión de multi-sede jerárquica.
- Descripción: tenant con múltiples sedes, identidad operativa propia y configuración local.
- Actores: ACT-02, ACT-03.
- Precondición: tenant existente.
- Entradas: datos de sede.
- Salidas: sedes creadas/gestionadas.
- Reglas de negocio: aislamiento entre sedes; Admin Titular con vista consolidada.
- Validaciones: unicidad lógica por sede/tenant.
- Permisos: administración de sedes.
- Multi-tenant: sí.
- Auditoría/trazas: esperada por cambios de estructura.
- Reportes: vista consolidada global.
- Fuentes: `indi-info/SUBS-01-REQ-Gestion-Actores.md:112-132`.

### RF-TEN-003

- Nombre: Estados de ciclo de vida del tenant.
- Descripción: FSM financiera/operativa (`pendiente_pago`, `activo`, `gracia`, `solo_lectura`, `hibernando`, `suspendido`, `cerrado`).
- Actores: ACT-01, EXT-02.
- Precondición: tenant creado.
- Entradas: eventos de facturación/operación.
- Salidas: transición de estado.
- Reglas de negocio: en `solo_lectura` no hay endpoints de escritura.
- Validaciones: transición solo por eventos válidos.
- Permisos: gobierno de plataforma/sistema de pagos.
- Multi-tenant: sí.
- Auditoría/trazas: transición auditada obligatoria.
- Reportes: no explícito.
- Fuentes: `indi-info/SUBS-01-REQ-Gestion-Actores.md:134-159`.

### RF-IAM-001

- Nombre: RBAC dinámico granular.
- Descripción: crear roles personalizados por módulo/acción/acción sensible.
- Actores: ACT-02.
- Precondición: tenant operativo.
- Entradas: definición de rol y permisos.
- Salidas: rol y asignaciones efectivas.
- Reglas de negocio: no crear roles con privilegio superior al actor; auditar cambios.
- Validaciones: jerarquía de privilegios.
- Permisos: gestión de roles/permisos.
- Multi-tenant: sí.
- Auditoría/trazas: obligatoria en cambios de rol.
- Reportes: no explícito.
- Fuentes: `indi-info/SUBS-01-REQ-Gestion-Actores.md:162-179`.

### RF-IAM-002

- Nombre: Autenticación rápida en terminal (PIN/QR).
- Descripción: login/cambio de sesión en terminal con PIN 4 dígitos o QR.
- Actores: ACT-05.
- Precondición: terminal autenticada y usuario habilitado.
- Entradas: PIN o QR.
- Salidas: sesión terminal activa o bloqueo.
- Reglas de negocio: máximo 5 intentos; bloqueo temporal; auditoría del evento.
- Validaciones: credencial válida, estado usuario.
- Permisos: acceso operativo por rol/sede.
- Multi-tenant: sí.
- Auditoría/trazas: obligatoria.
- Reportes: no explícito.
- Fuentes: `indi-info/SUBS-01-REQ-Gestion-Actores.md:181-195`.

### RF-IAM-003

- Nombre: Override supervisado transaccional.
- Descripción: autorización temporal de acción restringida con supervisor.
- Actores: ACT-05, ACT-04.
- Precondición: acción bloqueada por rol.
- Entradas: credencial de supervisor + contexto de transacción.
- Salidas: acción aprobada/rechazada.
- Reglas de negocio: validez por una sola transacción; doble registro (agente + supervisor); no altera permisos permanentes.
- Validaciones: supervisor autorizado.
- Permisos: `override.approve` equivalente.
- Multi-tenant: sí.
- Auditoría/trazas: obligatoria y dual.
- Reportes: no explícito.
- Fuentes: `indi-info/SUBS-01-REQ-Gestion-Actores.md:197-210`, `indi-info/SUBS-03-RN-Reglas-Riesgos.md:34-41`.

### RF-IAM-004

- Nombre: Gestión de sesiones por dispositivo.
- Descripción: registrar dispositivos, expulsión remota y control de sesiones simultáneas.
- Actores: ACT-03, ACT-02.
- Precondición: usuarios y sesiones activas.
- Entradas: dispositivo/sesión objetivo.
- Salidas: sesión mantenida o revocada.
- Reglas de negocio: control de concurrencia por plan.
- Validaciones: identificación de dispositivo/sesión.
- Permisos: gestión de sesiones/dispositivos.
- Multi-tenant: sí.
- Auditoría/trazas: esperada por revocaciones.
- Reportes: métricas de sesiones concurrentes.
- Fuentes: `indi-info/SUBS-01-REQ-Gestion-Actores.md:212-223`, `indi-info/SUBS-03-RN-Reglas-Riesgos.md:257`.

### RF-SUB-001

- Nombre: Control de concurrencia en tiempo real.
- Descripción: bloquear sesiones cuando exceden límite contratado.
- Actores: ACT-02, ACT-04.
- Precondición: plan con límites activos.
- Entradas: intento de login/estado de sesiones.
- Salidas: acceso permitido/bloqueado.
- Reglas de negocio: validar en login y periódicamente; opción de cierre remoto autorizado.
- Validaciones: conteo de sesiones vs contrato.
- Permisos: override/cierre remoto según rol.
- Multi-tenant: sí.
- Auditoría/trazas: esperada.
- Reportes: uso concurrente.
- Fuentes: `indi-info/SUBS-01-REQ-Gestion-Actores.md:226-239`.

### RF-SUB-002

- Nombre: Prorrateo automático.
- Descripción: cálculo proporcional y activación tras pago exitoso en cambios de licencias/sedes.
- Actores: ACT-02, EXT-02.
- Precondición: tenant activo y operación de cambio.
- Entradas: tipo de cambio + cantidad + método de pago.
- Salidas: cargo prorrateado y activación.
- Reglas de negocio: confirmación previa al cobro.
- Validaciones: consistencia de monto/cambio.
- Permisos: gestión de suscripción.
- Multi-tenant: sí.
- Auditoría/trazas: requerida.
- Reportes: implícito en facturación.
- Fuentes: `indi-info/SUBS-01-REQ-Gestion-Actores.md:241-252`, `indi-info/SUBS-04-CU-Pagos-Facturacion.md:1-82`.

### RF-SUB-003

- Nombre: Periodo de gracia automatizado.
- Descripción: ante fallo de pago, pasar a `gracia`; luego a `solo_lectura` tras N días.
- Actores: EXT-02, ACT-01.
- Precondición: renovación/fallo real de pago.
- Entradas: resultado de cobro + configuración de gracia.
- Salidas: transición de estado del tenant.
- Reglas de negocio: transición temporal controlada.
- Validaciones: diferenciar caída externa vs rechazo real.
- Permisos: gobernanza de estados financieros.
- Multi-tenant: sí.
- Auditoría/trazas: obligatoria.
- Reportes: estado financiero del tenant.
- Fuentes: `indi-info/SUBS-01-REQ-Gestion-Actores.md:254-263`, `indi-info/SUBS-04-CU-Pagos-Facturacion.md:333-402`.

### RF-SUB-004

- Nombre: Portal de facturación self-service.
- Descripción: ver historial de pagos, descargar comprobantes, cambiar método de pago.
- Actores: ACT-02, ACT-06.
- Precondición: tenant autenticado con permisos de billing.
- Entradas: filtros/acciones de facturación.
- Salidas: historial/exportes/actualización de método.
- Reglas de negocio: acceso por permisos de billing.
- Validaciones: integridad de datos de pago.
- Permisos: `sub.billing.*` y `sub.payment_method.update` (nomenclatura documental).
- Multi-tenant: sí.
- Auditoría/trazas: requerida.
- Reportes: sí (historial/exportables).
- Fuentes: `indi-info/SUBS-01-REQ-Gestion-Actores.md:265-276`, `indi-info/SUBS-02-SEC-Matriz-Permisos.md:61-67`.

### RF-AUD-001

- Nombre: Auditoría forense completa.
- Descripción: registrar eventos críticos IAM/SUB/TEN con contexto completo.
- Actores: todos.
- Precondición: ejecución de cualquier acción auditable.
- Entradas: evento + actor + contexto + resultado.
- Salidas: evidencia auditable.
- Reglas de negocio: incluir actor, timestamp, IP, contexto y resultado.
- Validaciones: completitud de payload de auditoría.
- Permisos: lectura/export por permisos de auditoría.
- Multi-tenant: sí.
- Auditoría/trazas: núcleo del requisito.
- Reportes: métricas de seguridad/forense.
- Fuentes: `indi-info/SUBS-01-REQ-Gestion-Actores.md:279-306`, `indi-info/SUBS-02-SEC-Matriz-Permisos.md:83-87`.

## 3) Casos de Uso (CU)

### CU-01

- Nombre: Onboarding empresarial completo.
- Actores: ACT-02, EXT-01, EXT-02.
- Precondición: usuario sin tenant activo.
- Entradas: RUC, email, contraseña, plan, medio de pago.
- Salidas: tenant operativo activo y suscrito.
- Reglas/validaciones: validación fiscal previa; suscripción/plan inicial.
- Permisos: actor de onboarding.
- Multi-tenant: crea contexto de tenant.
- Auditoría: registro del proceso de alta.
- Reportes: no explícito.
- Fuentes: `indi-info/SUBS-01-REQ-Gestion-Actores.md:309-366`.

### CU-02

- Nombre: Cambio de usuario en terminal.
- Actores: ACT-05.
- Precondición: terminal autenticada, usuario con PIN válido.
- Entradas: PIN o QR.
- Salidas: sesión de usuario activada.
- Reglas/validaciones: validación credencial; auditoría.
- Permisos: acceso terminal habilitado por rol/sede.
- Multi-tenant: operación aislada por tenant/sede.
- Auditoría: evento obligatorio.
- Reportes: no explícito.
- Fuentes: `indi-info/SUBS-01-REQ-Gestion-Actores.md:367-402`.

### CU-03

- Nombre: Autorización de acción restringida.
- Actores: ACT-05, ACT-04.
- Precondición: acción bloqueada por rol.
- Entradas: autenticación supervisor.
- Salidas: aprobación/rechazo de acción puntual.
- Reglas/validaciones: override transaccional; no permanencia de privilegio.
- Permisos: aprobación override.
- Multi-tenant: sí.
- Auditoría: doble registro.
- Reportes: no explícito.
- Fuentes: `indi-info/SUBS-01-REQ-Gestion-Actores.md:403-428`.

### CU-04

- Nombre: Exceso de licencias.
- Actores: ACT-05, ACT-04.
- Precondición: límite de licencias alcanzado.
- Entradas: intento de login adicional.
- Salidas: bloqueo, notificación o cierre remoto autorizado.
- Reglas/validaciones: liberar sesión solo con autorización.
- Permisos: cierre remoto/override.
- Multi-tenant: sí.
- Auditoría: esperada.
- Reportes: utilización de licencias.
- Fuentes: `indi-info/SUBS-01-REQ-Gestion-Actores.md:429-446`.

### CU-PAY-01

- Nombre: Upgrade/add-on con confirmación normal.
- Actores: ACT-02, EXT-02, EXT-03.
- Precondición: tenant `FIN-ACTIVE`, sin inconsistencia financiera.
- Entradas: cambio solicitado, cantidad, método, confirmación explícita.
- Salidas: `CHG-APPLIED`, tenant vuelve/permanece en `FIN-ACTIVE`, entitlements aplicados.
- Reglas/validaciones: no activar antes de webhook válido; idempotencia de intento.
- Permisos: `perm.sub.plan.change` / `perm.sub.licenses.add`.
- Multi-tenant: sí.
- Auditoría: mínima de 5 eventos.
- Reportes: trazabilidad por cambio.
- Fuentes: `indi-info/SUBS-04-CU-Pagos-Facturacion.md:1-82`, `:661-672`, `:734-738`.

### CU-PAY-02

- Nombre: Fallo proveedor antes de crear intento.
- Actores: ACT-02, EXT-02.
- Precondición: tenant `FIN-ACTIVE`; proveedor caído.
- Entradas: solicitud de cambio.
- Salidas: cambio fallido sin cobro, estado financiero estable.
- Reglas/validaciones: no registrar cargo ni activar cambios.
- Permisos: administración de suscripción.
- Multi-tenant: sí.
- Auditoría: eventos de fallo externo.
- Reportes: no explícito.
- Fuentes: `indi-info/SUBS-04-CU-Pagos-Facturacion.md:83-142`, `:673-680`, `:742-746`.

### CU-PAY-03

- Nombre: Timeout sin webhook + verificación activa.
- Actores: ACT-02, EXT-02, EXT-03.
- Precondición: cambio en `CHG-AWAITING-CONFIRMATION` y TTL vencido.
- Entradas: identificador de intento + TTL.
- Salidas: aplicar o rechazar cambio tras reconciliación activa.
- Reglas/validaciones: ejecutar verificación activa tras timeout.
- Permisos: gestión de suscripción.
- Multi-tenant: sí.
- Auditoría: eventos de timeout y reconciliación.
- Reportes: estado de conciliación.
- Fuentes: `indi-info/SUBS-04-CU-Pagos-Facturacion.md:143-214`, `:681-690`, `:750-754`.

### CU-PAY-04

- Nombre: Webhook duplicado (idempotencia estricta).
- Actores: EXT-02, sistema interno.
- Precondición: evento ya procesado.
- Entradas: webhook repetido.
- Salidas: sin cambios de negocio adicionales.
- Reglas/validaciones: deduplicación por `event_id`/idempotencia.
- Permisos: interno.
- Multi-tenant: sí.
- Auditoría: `duplicate_event`.
- Reportes: no explícito.
- Fuentes: `indi-info/SUBS-04-CU-Pagos-Facturacion.md:215-262`, `:691-694`, `:758-760`.

### CU-PAY-05

- Nombre: Evento conflictivo (monto/moneda/tenant) → `FIN-INCONSISTENT`.
- Actores: EXT-02, ACT-01, ACT-02.
- Precondición: pago/cambio esperado en curso.
- Entradas: webhook con discrepancia.
- Salidas: marca inconsistencia, bloquea cambios financieros, inicia reconciliación.
- Reglas/validaciones: correlación estricta de tenant/monto/moneda.
- Permisos: control financiero privilegiado.
- Multi-tenant: sí.
- Auditoría: inconsistencia + cambios de estado.
- Reportes: reconciliación.
- Fuentes: `indi-info/SUBS-04-CU-Pagos-Facturacion.md:263-332`, `:695-704`, `:764-768`.

### CU-PAY-06

- Nombre: Renovación fallida → gracia → read-only.
- Actores: EXT-02, ACT-02, EXT-03.
- Precondición: renovación automática programada.
- Entradas: fallo real de cobro + días de gracia.
- Salidas: `FIN-GRACE`, luego `FIN-READ-ONLY` si no se regulariza; retorno a activo si paga.
- Reglas/validaciones: diferenciar rechazo real de caída externa.
- Permisos: gobierno de estado financiero.
- Multi-tenant: sí.
- Auditoría: transición de estados.
- Reportes: seguimiento de gracia.
- Fuentes: `indi-info/SUBS-04-CU-Pagos-Facturacion.md:333-402`, `:705-714`, `:772-776`.

### CU-PAY-07

- Nombre: Chargeback/reverso confirmado.
- Actores: EXT-02, ACT-01, ACT-02.
- Precondición: pago confirmado previo.
- Entradas: evento de chargeback.
- Salidas: revocación de entitlements y estado restringido/suspendido.
- Reglas/validaciones: correlación con transacción original.
- Permisos: operación de alto privilegio financiero.
- Multi-tenant: sí.
- Auditoría: chargeback + revocación + cambio de estado.
- Reportes: no explícito.
- Fuentes: `indi-info/SUBS-04-CU-Pagos-Facturacion.md:403-456`, `:715-722`, `:780-782`.

### CU-PAY-08

- Nombre: Reconciliación masiva tras caída prolongada.
- Actores: sistema interno, ACT-01, EXT-02.
- Precondición: outage prolongado; backlog en `CHG-AWAITING-CONFIRMATION` / `FIN-PENDING-PAYMENT` / `FIN-INCONSISTENT`.
- Entradas: señal de recuperación + lista de pendientes.
- Salidas: normalización masiva de estados.
- Reglas/validaciones: proceso batch idempotente y completo.
- Permisos: operación interna/administración global.
- Multi-tenant: sí (batch multitenant con aislamiento por tenant).
- Auditoría: batch started/item result/completed.
- Reportes: reporte consolidado obligatorio.
- Fuentes: `indi-info/SUBS-04-CU-Pagos-Facturacion.md:457-589`, `:723-731`, `:786-790`.

## 4) Observaciones de normalización

- Las matrices QA (`QA-01..22`) se mantienen como criterios de aceptación anexos a `CU-PAY-*`, no como CU independientes (`indi-info/SUBS-04-CU-Pagos-Facturacion.md:732-790`).
- Los `RULE-*` de `SUBS-03` se usan como reglas de negocio transversales para RF/CU, no como RF/CU adicionales.
