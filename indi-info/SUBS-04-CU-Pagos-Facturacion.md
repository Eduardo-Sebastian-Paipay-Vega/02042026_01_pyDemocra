CU-PAY-01 — Upgrade/Compra de Add-on con Confirmación Normal (Happy Path)

Propósito: Activar un cambio de plan/licencias/add-on únicamente con confirmación verificable del proveedor.

Actores involucrados:

Primario: ACT-02 Admin Titular

Secundarios: EXT-02 Pasarela de Pagos, EXT-03 Notificaciones

Internos (lógicos): Billing Orchestrator, Entitlement Engine, Webhook Validator, Audit & Evidence

Precondiciones (estado exacto):

Tenant en FIN-ACTIVE.

Admin Titular autenticado con permisos perm.sub.plan.change o perm.sub.licenses.add.

No existen inconsistencias financieras activas (FIN-INCONSISTENT = false).

Proveedor de pagos disponible.

Entradas:

Tipo de cambio: {upgrade_plan | add_license | add_addon}

Cantidad (si aplica): licencias/sedes

Método de pago vigente o nuevo

Confirmación explícita del usuario (aceptación del cobro)

Motivo opcional (campo para auditoría)

Flujo principal (paso a paso):

Admin solicita cambio (upgrade/licencias/add-on).

Sistema calcula monto final (incluye prorrateo si corresponde) y muestra resumen.

Admin confirma la operación.

Sistema crea solicitud de cambio y la marca CHG-SUBMITTED.

Sistema solicita creación de intento de pago al proveedor.

Sistema marca CHG-AWAITING-CONFIRMATION y FIN-PENDING-PAYMENT.

Sistema inicia TTL de confirmación.

Proveedor confirma pago y envía webhook.

Sistema valida firma, correlación y coherencia (monto/moneda/tenant).

Sistema marca CHG-APPLIED.

Entitlement Engine activa capacidades nuevas.

Sistema retorna FIN-ACTIVE.

Sistema notifica confirmación al admin.

Sistema registra auditoría forense de todo el proceso.

Flujos alternativos / excepciones:

A1: Webhook duplicado → se ignora por idempotencia y se audita como duplicado.

A2: Webhook llega sin firma válida → se descarta, se alerta, queda en awaiting confirmation.

Salidas:

Plan/entitlements nuevos activos.

Evidencias auditadas: solicitud, intento, confirmación, activación.

Postcondiciones:

Tenant sigue FIN-ACTIVE con nuevas capacidades.

No existe cambio pendiente.

CU-PAY-02 — Upgrade Fallido por Caída del Proveedor Antes de Crear Intento

Propósito: Evitar cambios parciales cuando el proveedor no permite iniciar el cobro.

Actores:

ACT-02 Admin Titular

EXT-02 Pasarela de Pagos

Precondiciones:

Tenant FIN-ACTIVE.

Proveedor inaccesible (timeout/error) al momento de crear intento.

Entradas:

Tipo de cambio solicitado.

Confirmación del usuario.

Flujo principal:

Admin solicita cambio.

Sistema calcula monto y solicita confirmación.

Admin confirma.

Sistema intenta crear intento de pago.

Proveedor responde con error de indisponibilidad.

Sistema NO activa entitlements.

Sistema marca el cambio como CHG-FAILED (no iniciado) o “retryable” según política (en esta versión: FAILED).

Sistema mantiene FIN-ACTIVE.

Sistema notifica: “Proveedor no disponible, intenta luego”.

Sistema audita la falla con causa “external outage”.

Flujos alternativos / excepciones:

A1: Si el admin decide reintentar inmediatamente, inicia un nuevo flujo desde paso 1 (nuevo cambio).

Salidas:

No hay cambio aplicado.

Mensaje claro de indisponibilidad.

Postcondiciones:

Estado financiero intacto.

Registro de incidente (operativo/auditoría).

CU-PAY-03 — Pago Iniciado pero Webhook No Llega (Timeout + Verificación Activa)

Propósito: Resolver incertidumbre “pagó o no pagó” sin intervención manual.

Actores:

ACT-02 Admin Titular

EXT-02 Pasarela de Pagos

EXT-03 Notificaciones

Precondiciones:

Tenant FIN-ACTIVE.

Cambio en CHG-AWAITING-CONFIRMATION.

TTL de confirmación configurado (ej. 30 min).

Proveedor puede ser consultado (si se recupera).

Entradas:

Identificador del intento de pago (interno del flujo)

TTL expirado

Flujo principal:

Admin confirma cambio → sistema inicia intento → queda en awaiting confirmation.

No llega webhook dentro del TTL.

Sistema dispara evento CONFIRMATION_TIMEOUT.

Sistema ejecuta verificación activa con proveedor (consulta de estado).

Si proveedor responde “pagado confirmado”:

Sistema marca CHG-APPLIED.

Activa entitlements.

Retorna FIN-ACTIVE.

Notifica éxito tardío.

Sistema audita el timeout + verificación + decisión.

Flujos alternativos / excepciones:

A1: Proveedor aún caído → sistema mantiene awaiting confirmation, programa reintentos (según política de reintento) y notifica “en verificación”.

A2: Proveedor responde “no pagado / rechazado”:

Sistema marca CHG-FAILED,

mantiene plan anterior,

FIN vuelve a ACTIVE (si era upgrade), o pasa a GRACE (si era renovación).

Salidas:

Resolución determinística: aplicado o fallido.

Evidencia de reconciliación.

Postcondiciones:

No existe estado ambiguo indefinido; el caso termina en APPLIED/FAILED o se mantiene en verificación con reintentos controlados.

CU-PAY-04 — Webhook Duplicado (Idempotencia Estricta)

Propósito: Evitar activación doble o cobro doble por eventos repetidos.

Actores:

EXT-02 Pasarela de Pagos (emisor)

Sistema (Webhook Validator + Orchestrator)

Precondiciones:

Ya se procesó un webhook con event_id X.

Llega nuevamente el mismo webhook o uno equivalente.

Entradas:

Webhook: payload + event_id + firma

Flujo principal:

Sistema recibe webhook.

Valida firma y extrae event_id.

Sistema detecta que event_id ya fue procesado.

Sistema no aplica cambios ni re-ejecuta activaciones.

Registra auditoría: “duplicate_event”.

Responde al proveedor con confirmación de recepción (para que deje de reintentar).

Flujos alternativos / excepciones:

A1: Firma inválida → descarta y registra evento inválido (no idempotencia, sino seguridad).

Salidas:

Ningún efecto adicional.

Evidencia de duplicidad.

Postcondiciones:

Estado del tenant sin cambios.

CU-PAY-05 — Evento Conflictivo: Monto/Moneda/Tenant No Coinciden (FIN-INCONSISTENT)

Propósito: Proteger al sistema de eventos mal correlacionados, ataques o errores de proveedor.

Actores:

EXT-02 Pasarela de Pagos

ACT-01 Super Admin (posible intervención)

ACT-02 Admin Titular (notificado)

Precondiciones:

Existe un cambio en proceso o un pago esperado.

Llega un webhook con:

monto distinto,

moneda distinta,

tenant_reference distinta,

o correlación imposible.

Entradas:

Webhook con discrepancia.

Flujo principal:

Sistema recibe webhook.

Valida firma (si falla → evento inválido, otro CU de seguridad).

Compara: tenant esperado, monto esperado, moneda esperada.

Detecta discrepancia.

Sistema marca tenant como FIN-INCONSISTENT.

Congela cambios financieros nuevos (no upgrades, no licencias nuevas).

Mantiene operación bajo plan anterior confirmado.

Ejecuta reconciliación activa con el proveedor.

Notifica a Admin Titular: “Incidencia financiera detectada. En revisión.”

Notifica a soporte interno/Super Admin.

Audita el evento conflictivo con criticidad crítica.

Flujos alternativos / excepciones:

A1: Reconciliación confirma que el evento era de otro tenant o fraude → se cierra con reporte; permanece ACTIVE si no afecta.

A2: Reconciliación confirma un pago real asociado pero mal formado → se gestiona como CONFLICT y se resuelve.

Salidas:

Tenant en estado protegido.

Cambio congelado hasta resolución.

Postcondiciones:

Estado final solo se normaliza mediante reconciliación (EV-CHG-008/009).

CU-PAY-06 — Renovación Fallida: Entrada a Gracia y Posterior Read-Only

Propósito: Mantener continuidad controlada y aplicar cobro sin cortar operación abruptamente.

Actores:

EXT-02 Pasarela de Pagos

ACT-02 Admin Titular

EXT-03 Notificaciones

Precondiciones:

Tenant con plan activo próximo a renovar.

Renovación automática programada.

Política de gracia habilitada.

Entradas:

Resultado de cobro (fallo real vs caída externa)

Configuración N días de gracia

Flujo principal:

Sistema intenta renovar.

Proveedor responde “pago fallido” (rechazo real).

Sistema marca FIN-GRACE y activa contador.

Sistema notifica: “Pago fallido. Tienes N días para regularizar”.

Durante gracia, el tenant opera normalmente (según política estándar).

Si admin regulariza y pago se confirma:

sistema vuelve a FIN-ACTIVE.

Si expira gracia:

sistema transiciona a FIN-READ-ONLY,

bloquea escrituras,

mantiene lectura y portal de pago.

Flujos alternativos / excepciones:

A1: Fallo por “outage proveedor” (no rechazo):

no entrar a GRACE automáticamente,

mantener ACTIVE/PENDING,

reintentar.

Salidas:

Tenant en GRACE o READ-ONLY según tiempo.

Notificaciones y auditoría.

Postcondiciones:

En READ-ONLY, solo un pago confirmado restaura a ACTIVE.

CU-PAY-07 — Chargeback/Reverso Confirmado (Revocación de Entitlements)

Propósito: Responder a contracargos protegiendo el negocio y evitando fraude.

Actores:

EXT-02 Pasarela de Pagos

ACT-01 Super Admin

ACT-02 Admin Titular

Precondiciones:

Existió un pago confirmado que habilitó entitlements.

Llega evento de chargeback confirmado.

Entradas:

Evento chargeback + referencia al pago.

Flujo principal:

Sistema recibe evento chargeback.

Valida firma y correlación.

Marca estado según política:

FIN-READ-ONLY o FIN-SUSPENDED (si severidad alta).

Revoca entitlements otorgados por ese pago (si aplica).

Notifica al Admin Titular con instrucciones.

Notifica a Super Admin para seguimiento.

Audita todo con criticidad crítica.

Flujos alternativos / excepciones:

A1: Chargeback mal correlacionado → FIN-INCONSISTENT y reconciliación.

Salidas:

Tenant limitado o suspendido.

Evidencia completa.

Postcondiciones:

Solo se restaura mediante intervención/pago válido según política.

CU-PAY-08 — Reconciliación Masiva tras Caída Prolongada del Proveedor

Propósito: Normalizar cientos/miles de tenants en incertidumbre sin inconsistencia.

Actores:

Sistema (orquestación interna)

ACT-01 Super Admin (monitor)

EXT-02 Pasarela de Pagos

Precondiciones:

Se detectó outage prolongado.

Existen múltiples cambios en:

CHG-AWAITING-CONFIRMATION

tenants en FIN-PENDING-PAYMENT o FIN-INCONSISTENT

Proveedor vuelve (PAYMENT_PROVIDER_RECOVERED).

Entradas:

Señal de recuperación

Lista lógica de casos pendientes (conceptual)

Flujo principal:

Sistema detecta recuperación del proveedor.

Super Admin visualiza panel de “pendientes de reconciliación” (a nivel lógico).

Sistema procesa reconciliación por lotes:

consulta estado de cada intento,

confirma o niega,

aplica o falla cambios,

normaliza FIN.

Sistema genera reporte de reconciliación:

cantidad confirmada,

cantidad negada,

cantidad conflictiva.

Sistema notifica a admins de tenants que requieran acción.

Auditoría de ejecución masiva.

Flujos alternativos / excepciones:

A1: Proveedor intermitente → el proceso pausa y reintenta sin aplicar cambios parciales.

Salidas:

Estados convergentes y consistentes.

Reporte interno trazable.

Postcondiciones:

Mínimo posible de FIN-INCONSISTENT residual.

Checklist de cobertura (punto 5)

Caída antes de intento: CU-PAY-02

Timeout sin webhook: CU-PAY-03

Duplicados: CU-PAY-04

Conflictos: CU-PAY-05

Renovación fallida, gracia y read-only: CU-PAY-06

Chargeback: CU-PAY-07

Recuperación y reconciliación masiva: CU-PAY-08

Happy path: CU-PAY-01



A continuación se anexan a los CU-PAY-01 a CU-PAY-08 los siguientes elementos formales obligatorios:

Códigos de error normalizados (PAY-XXX / SUB-XXX / FIN-XXX)

Mensajes UX obligatorios (texto normativo mínimo)

Eventos de auditoría mínimos por paso

Criterios de aceptación QA verificables

Nivel: Máxima formalidad operativa.

I. CATÁLOGO NORMALIZADO DE ERRORES (PAY / FIN / SUB)
1.1 Errores PAY (Procesamiento de Pago)
Código	Tipo	Descripción	Severidad	Retry
PAY-001	External	Proveedor no disponible	Alta	Sí
PAY-002	Financial	Pago rechazado por banco	Alta	Sí
PAY-003	Integrity	Monto no coincide	Crítica	No
PAY-004	Integrity	Moneda no coincide	Crítica	No
PAY-005	Integrity	Tenant no coincide	Crítica	No
PAY-006	Security	Firma webhook inválida	Crítica	No
PAY-007	Timeout	Webhook no recibido en TTL	Alta	Sí
PAY-008	Duplicate	Evento duplicado	Media	No
PAY-009	Chargeback	Contracargo confirmado	Crítica	No
1.2 Errores FIN
Código	Tipo	Descripción
FIN-001	State	Tenant en estado READ-ONLY
FIN-002	State	Tenant SUSPENDED
FIN-003	State	Tenant INCONSISTENT
FIN-004	State	Tenant GRACE
FIN-005	State	Cambio financiero bloqueado
1.3 Errores SUB
Código	Tipo
SUB-001	Límite de sesiones
SUB-002	Licencias excedidas
SUB-003	Plan inválido
SUB-004	Downgrade no permitido
II. MENSAJES UX OBLIGATORIOS (NORMATIVOS)

Estos mensajes no son sugerencias. Son textos mínimos contractuales que deben aparecer.

CU-PAY-01 (Happy Path)

Durante verificación:

“Estamos verificando tu pago. Esto puede tardar unos segundos.”

Confirmación exitosa:

“Pago confirmado. Tu plan ha sido actualizado correctamente.”

CU-PAY-02 (Proveedor no disponible)

“El proveedor de pagos no está disponible en este momento. No se realizó ningún cobro. Intenta nuevamente más tarde.”

CU-PAY-03 (Timeout en verificación)

“Tu pago está siendo verificado. Si ya fue debitado, se aplicará automáticamente en breve.”

Si se confirma:

“Pago confirmado tras verificación. Tu plan ya está activo.”

Si se rechaza:

“El pago no pudo confirmarse. No se realizaron cambios en tu plan.”

CU-PAY-04 (Duplicado)

No visible al usuario.
Interno:

“Evento duplicado recibido. Sin cambios aplicados.”

CU-PAY-05 (Inconsistencia)

“Se detectó una inconsistencia en tu transacción. Estamos verificando el estado. Tus operaciones continúan con tu plan actual.”

CU-PAY-06 (Gracia)

“Tu pago no pudo procesarse. Tienes X días para regularizar tu cuenta antes de que se limite el acceso.”

En READ-ONLY:

“Tu cuenta está en modo solo lectura. Regulariza tu pago para restaurar la operación completa.”

CU-PAY-07 (Chargeback)

“Se ha recibido un contracargo asociado a tu cuenta. El acceso puede estar temporalmente limitado. Contacta soporte.”

CU-PAY-08 (Reconciliación masiva)

Solo notificación si afectado:

“Tu cuenta fue actualizada tras una verificación de pagos. No se requiere acción adicional.”

III. EVENTOS DE AUDITORÍA MÍNIMOS POR CU

Cada evento debe incluir:

Actor

Tenant

Timestamp UTC

Contexto

Resultado

Severidad

CU-PAY-01

audit.payment.change_submitted

audit.payment.intent_created

audit.payment.webhook_received

audit.payment.confirmed

audit.entitlement.applied

CU-PAY-02

audit.payment.change_submitted

audit.payment.intent_failed_external

audit.payment.change_failed

CU-PAY-03

audit.payment.timeout_triggered

audit.payment.reconciliation_started

audit.payment.reconciliation_result

audit.entitlement.applied_or_not

CU-PAY-04

audit.payment.webhook_duplicate

CU-PAY-05

audit.payment.inconsistency_detected

audit.tenant.state_changed_to_inconsistent

audit.reconciliation_started

audit.reconciliation_result

CU-PAY-06

audit.payment.renewal_attempt

audit.payment.failed

audit.tenant.state_changed_to_grace

audit.tenant.state_changed_to_readonly (si aplica)

CU-PAY-07

audit.payment.chargeback_received

audit.entitlement.revoked

audit.tenant.state_changed

CU-PAY-08

audit.reconciliation.batch_started

audit.reconciliation.batch_item_result

audit.reconciliation.batch_completed

IV. CRITERIOS DE ACEPTACIÓN QA (FORMAL)
CU-PAY-01 QA

QA-01: No se activan entitlements antes de webhook válido.

QA-02: Webhook duplicado no duplica activación.

QA-03: Auditoría contiene mínimo 5 eventos.

CU-PAY-02 QA

QA-04: Si proveedor falla antes de intento, estado financiero permanece ACTIVE.

QA-05: No existe cargo registrado.

QA-06: Cambio termina en CHG-FAILED.

CU-PAY-03 QA

QA-07: Tras TTL, sistema ejecuta verificación activa.

QA-08: Si proveedor confirma tardíamente, cambio se aplica.

QA-09: Si proveedor niega, cambio no se aplica.

CU-PAY-04 QA

QA-10: Múltiples webhooks idénticos generan un solo CHG-APPLIED.

QA-11: Evento duplicado queda auditado.

CU-PAY-05 QA

QA-12: Inconsistencia mueve tenant a FIN-INCONSISTENT.

QA-13: Cambios financieros quedan bloqueados.

QA-14: Reconciliación restaura estado correcto.

CU-PAY-06 QA

QA-15: Renovación fallida real mueve a FIN-GRACE.

QA-16: Tras expirar gracia, se aplica FIN-READ-ONLY.

QA-17: Pago confirmado restaura ACTIVE.

CU-PAY-07 QA

QA-18: Chargeback confirmado limita o suspende tenant.

QA-19: Entitlements otorgados por ese pago se revocan.

CU-PAY-08 QA

QA-20: Reconciliación masiva procesa todos los cambios pendientes.

QA-21: No quedan tenants en estado indeterminado.

QA-22: Se genera reporte consolidado.

V. MATRIZ DE TRAZABILIDAD (Resumen)
CU	FSM FIN	FSM CHG	Errores	Auditoría	QA
PAY-01	ACTIVE → PENDING → ACTIVE	DRAFT → APPLIED	PAY-xxx	Sí	QA-01-03
PAY-02	ACTIVE	DRAFT → FAILED	PAY-001	Sí	QA-04-06
PAY-03	PENDING → ACTIVE/GRACE	AWAITING → APPLIED/FAILED	PAY-007	Sí	QA-07-09
PAY-04	Sin cambio	Sin cambio	PAY-008	Sí	QA-10-11
PAY-05	→ INCONSISTENT	→ CONFLICT	PAY-003/4/5	Sí	QA-12-14
PAY-06	ACTIVE → GRACE → READONLY	N/A	PAY-002	Sí	QA-15-17
PAY-07	ACTIVE → SUSPENDED	N/A	PAY-009	Sí	QA-18-19
PAY-08	VARIOS → NORMALIZADO	VARIOS	N/A	Sí	QA-20-22

Con esto, el punto 5 queda formalizado a nivel:

FSM completo

Casos de uso exhaustivos

Errores normalizados

Mensajes contractuales UX

Auditoría obligatoria

Criterios QA verificables