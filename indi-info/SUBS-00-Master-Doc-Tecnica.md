Plataforma SaaS Multi-Tenant de Gestión de Accesos y Suscripciones
Enfoque: IAM Avanzado + Gobernanza SaaS + Multi-Sede + Control de Licenciamiento + Auditoría Forense + Seguridad Adaptativa
Sector objetivo: Retail y Servicios con operación presencial y multi-terminal
Principio rector: Seguridad estricta, monetización gobernada, trazabilidad total y evolución controlada.

1. MATRIZ GRANULAR DE PERMISOS (RBAC DEFINITIVO)
1.1 Estructura de Permisos

Nomenclatura estándar:

perm.<dominio>.<recurso>.<acción>

Acciones base:

create

read

update

delete

approve

override

export

manage

assign

impersonate

1.2 Dominios de Permiso
IAM

perm.iam.users.create

perm.iam.users.update

perm.iam.users.deactivate

perm.iam.roles.create

perm.iam.roles.update

perm.iam.roles.assign

perm.iam.override.approve

perm.iam.sessions.terminate

perm.iam.devices.manage

perm.iam.mfa.enforce

SUB

perm.sub.plan.change

perm.sub.licenses.add

perm.sub.licenses.remove

perm.sub.billing.read

perm.sub.billing.export

perm.sub.payment_method.update

perm.sub.grace.override

TEN

perm.ten.sedes.create

perm.ten.sedes.update

perm.ten.sedes.delete

perm.ten.config.global.update

perm.ten.config.local.override

AUD

perm.aud.logs.read

perm.aud.logs.export

perm.aud.security.read

OPS

perm.ops.terminals.register

perm.ops.terminals.terminate

perm.ops.terminals.view

perm.ops.sessions.view

1.3 Reglas de Seguridad del RBAC

Un rol no puede asignar permisos que no posea.

Un rol no puede modificar otro rol con privilegios superiores.

Permisos de override no implican permisos permanentes.

Permisos pueden estar condicionados por:

Sede

Horario

IP permitida

Dispositivo confiable

2. REGLAS MATEMÁTICAS DE PRORRATEO
2.1 Variables
P = precio mensual base
L = número de licencias nuevas
D = días restantes del ciclo
T = días totales del ciclo
C = costo prorrateado
2.2 Fórmula
C = (P / T) * D * L
Ejemplo:

Plan = 100 USD
Días ciclo = 30
Días restantes = 12
Licencias agregadas = 3

C = (100 / 30) * 12 * 3
C = 3.33 * 12 * 3
C = 119.88 USD
2.3 Reglas Operativas

El cálculo debe mostrarse antes de confirmar compra.

El cobro debe ejecutarse inmediatamente.

La activación ocurre solo tras confirmación webhook.

Si el webhook falla → estado provisional.

En downgrade:

No se elimina información.

Se bloquean accesos excedentes.

Se notifica al admin.

3. SEGURIDAD AVANZADA (MFA + RIESGO ADAPTATIVO)
3.1 MFA Obligatorio para:

Cambio de plan

Eliminación masiva

Cambio de método de pago

Cambio de roles administrativos

Exportación masiva de datos

Tipos permitidos:

OTP por app autenticadora

Email OTP

SMS OTP (opcional según política)

3.2 Evaluación de Riesgo Adaptativo

Variables evaluadas:

IP nueva

País distinto

Dispositivo nuevo

Horario inusual

Múltiples intentos fallidos

Reglas:

Riesgo Bajo → login normal

Riesgo Medio → OTP requerido

Riesgo Alto → bloqueo temporal + notificación

4. MODELO DE SESIONES Y DISPOSITIVOS
4.1 Tipos de Sesión

Sesión Web Administrativa

Sesión Terminal Operativa

Sesión API Integración

4.2 Reglas

Cada sesión tiene TTL configurable.

Renovación automática si actividad.

Sesiones registran:

IP

User-Agent

Ubicación aproximada

Dispositivo fingerprint

4.3 Cierre Remoto

Solo roles con perm.iam.sessions.terminate

Debe registrar:

Actor que termina

Motivo

Sesión afectada

5. AUDITORÍA FORENSE (ESTÁNDAR ESTRICTO)
5.1 Eventos Obligatorios

Login exitoso

Login fallido

Cambio de rol

Override

Cambio de plan

Alta/baja licencia

Cambio método pago

Creación sede

Expulsión sesión

Exportación de datos

5.2 Estructura Lógica de Evento

Cada evento debe contener:

ID evento

Tipo evento

Actor

Rol del actor

Tenant

Sede (si aplica)

Timestamp UTC

IP

Resultado (éxito/error)

Payload antes/después (si aplica)

Nivel criticidad (bajo/medio/alto)

5.3 Retención

Plan Básico: 180 días

Plan Pro: 365 días

Plan Enterprise: configurable

6. CONTRATO SaaS (SLA / SLO)
6.1 SLA

Disponibilidad mensual mínima: 99.5%

Tiempo máximo de respuesta API: < 500ms promedio

Soporte:

Básico: 48h

Pro: 24h

Enterprise: 8h

6.2 SLO Internos

Login < 2 segundos

Cambio de usuario terminal < 1 segundo

Override validado < 1.5 segundos

Validación licencia < 500ms

7. MODELO DE MEJORA CONTINUA
7.1 Versionado Interno de Reglas

Cada cambio en:

Políticas de seguridad

Reglas de suscripción

Permisos base

Debe tener:

ID de versión

Fecha de activación

Historial

7.2 Feature Flags

El sistema deberá permitir:

Activar módulos progresivamente.

Activar seguridad avanzada por plan.

Activar reglas piloto en subconjunto de tenants.

8. CONTROL DE GOBERNANZA MULTI-TENANT
8.1 Aislamiento Estricto

Ningún usuario puede acceder a datos de otro tenant.

Impersonación solo en modo soporte auditado.

Validación obligatoria de tenant context en cada operación.

8.2 Impersonación Controlada

Solo Super Admin con:

Justificación obligatoria.

Banner visible.

Log completo.

Tiempo limitado.

9. ESCENARIOS CRÍTICOS DE RIESGO Y RESPUESTA
Escenario 1: Intentos masivos de PIN

→ Bloqueo terminal
→ Notificación admin
→ Registro seguridad

Escenario 2: Uso fraudulento de override

→ Alerta automática
→ Informe consolidado semanal

Escenario 3: Manipulación de plan frecuente

→ Flag de comportamiento anómalo

10. CONCLUSIÓN ESTRATÉGICA

Este sistema no es simplemente un gestor de accesos.
Es una infraestructura de control operacional SaaS, diseñada para:

Proteger ingresos.

Evitar fraude interno.

Asegurar trazabilidad legal.

Permitir escalabilidad multi-sede.

Evolucionar sin romper estabilidad contractual.

Si deseas, el siguiente nivel de profundidad puede incluir:

Modelo formal de reglas de negocio en pseudo-lenguaje normativo.

Especificación de flujos de error por cada endpoint.

Modelo de amenazas (Threat Modeling – STRIDE).

Política completa de seguridad organizacional.

Documento listo para comité técnico o inversionistas.

Indícame el siguiente nivel.

todo, a un alto nivel de detalle

Entendido.
A continuación se presenta la Documentación Técnica v3.0 – Nivel Máximo de Profundidad Arquitectónica y Normativa para:

Plataforma SaaS Multi-Tenant de Gestión de Accesos y Suscripciones
Alcance: IAM avanzado + Suscripciones + Multi-Sede + Gobernanza SaaS + Auditoría Forense + Seguridad Adaptativa
Sector: Retail y Servicios con operación multi-terminal
Restricción activa: Sin diseño de base de datos ni modelo entidad-relación. Solo lógica de negocio y gobernanza funcional.

1. MODELO NORMATIVO DE REGLAS DE NEGOCIO (FORMALIZACIÓN)

Se define un pseudo-lenguaje normativo para garantizar precisión.

Formato:

RULE-ID: [Identificador]
IF [Condición]
THEN [Resultado obligatorio]
ELSE [Acción alternativa]
AUDIT [Sí/No]
CRITICALITY [Low/Medium/High]
1.1 Reglas de Acceso (IAM)
RULE-IAM-001 – Autenticación de Terminal
IF terminal.estado = "activa"
AND usuario.estado = "activo"
AND usuario.permitido_en_sede = TRUE
AND PIN válido
THEN crear sesión_operativa
ELSE denegar acceso
AUDIT Sí
CRITICALITY High
RULE-IAM-002 – Límite de Intentos PIN
IF intentos_fallidos >= 5
THEN bloquear usuario por 15 minutos
AND notificar admin_sede
AUDIT Sí
CRITICALITY High
RULE-IAM-003 – Override Supervisado
IF acción.requiere_override = TRUE
AND supervisor.permiso = perm.iam.override.approve
AND PIN supervisor válido
THEN autorizar acción SOLO para esa transacción
ELSE denegar
AUDIT Sí
CRITICALITY High
RULE-IAM-004 – Escalada Prohibida
IF actor.intenta_asignar_permiso > actor.permiso_maximo
THEN denegar operación
AUDIT Sí
CRITICALITY High
1.2 Reglas de Suscripción
RULE-SUB-001 – Validación de Concurrencia
IF sesiones_activas >= licencias_contratadas
THEN bloquear nuevo login
UNLESS supervisor.autoriza_cierre_remoto
AUDIT Sí
CRITICALITY High
RULE-SUB-002 – Transición por Morosidad
IF pago_fallido
THEN estado_tenant = "gracia"
IF dias_gracia > N
THEN estado_tenant = "solo_lectura"
AUDIT Sí
CRITICALITY High
RULE-SUB-003 – Prorrateo
IF plan_actualizado = TRUE
AND fecha_actual < fin_ciclo
THEN calcular prorrateo
AND cobrar inmediatamente
AUDIT Sí
CRITICALITY Medium
2. MODELO DE AMENAZAS (STRIDE)
2.1 Spoofing (Suplantación)

Riesgos:

Compartición de PIN.

Robo de sesión.

Uso de dispositivo no autorizado.

Mitigaciones:

PIN con bloqueo automático.

Token con TTL.

Validación de fingerprint.

MFA en acciones críticas.

2.2 Tampering (Manipulación)

Riesgos:

Alteración de permisos.

Manipulación de plan.

Mitigaciones:

RBAC no escalable.

Versionado de políticas.

Logs con hash verificable.

2.3 Repudiation (Repudio)

Riesgo:

Usuario niega haber ejecutado acción.

Mitigación:

Auditoría con:

IP

Timestamp UTC

Rol

Contexto transaccional

Resultado

2.4 Information Disclosure

Riesgo:

Acceso cruzado entre tenants.

Exportación indebida.

Mitigación:

Validación obligatoria de tenant context.

Permisos de exportación separados.

Enmascaramiento parcial de datos sensibles.

2.5 Denial of Service

Riesgo:

Intentos masivos de login.

Saturación de concurrencia.

Mitigación:

Rate limiting.

Bloqueo adaptativo.

Control estricto de sesiones.

2.6 Elevation of Privilege

Riesgo:

Supervisor modifica rol superior.

Override permanente no controlado.

Mitigación:

Jerarquía estricta.

Override transaccional.

Validación cruzada de permisos.

3. ESPECIFICACIÓN DE ERRORES POR CATEGORÍA

Formato de respuesta estándar:

{
  error_code: STRING,
  error_type: ENUM,
  message: STRING,
  severity: ENUM,
  retry_allowed: BOOLEAN
}
3.1 Errores IAM
Código	Descripción
IAM-001	PIN inválido
IAM-002	Usuario bloqueado
IAM-003	Permiso insuficiente
IAM-004	Sesión expirada
IAM-005	Dispositivo no autorizado
3.2 Errores SUB
Código	Descripción
SUB-001	Límite de sesiones alcanzado
SUB-002	Pago fallido
SUB-003	Tenant en solo lectura
SUB-004	Plan inválido
3.3 Errores TEN
Código	Descripción
TEN-001	RUC inválido
TEN-002	Estado fiscal no permitido
TEN-003	Sede no autorizada
4. POLÍTICA DE SEGURIDAD ORGANIZACIONAL
4.1 Principios

Mínimo privilegio.

Segregación de funciones.

Auditoría obligatoria.

Control de cambios versionado.

Seguridad adaptativa.

4.2 Clasificación de Acciones por Nivel Crítico
Nivel	Ejemplos
Bajo	Cambio color tema
Medio	Crear usuario
Alto	Cambiar plan
Crítico	Modificar permisos globales

Acciones Alto/Crítico requieren MFA.

5. FLUJOS DE ERROR DETALLADOS (EJEMPLO CRÍTICO)
Caso: Cambio de Plan Fallido

Admin solicita upgrade.

Sistema calcula prorrateo.

Usuario confirma.

Sistema envía cobro.

Webhook devuelve fallo.

Sistema:

Mantiene plan anterior.

Registra error SUB-002.

Notifica admin.

Mantiene estado activo.

6. MODELO DE TELEMETRÍA Y OBSERVABILIDAD

Métricas obligatorias:

Login_success_rate

PIN_failure_rate

Override_frequency

Concurrent_sessions_usage

Payment_failure_rate

Suspicious_activity_flags

Alertas automáticas:

10 overrides en 1 hora por misma sede.

5 intentos PIN fallidos en 2 minutos.

Cambio de plan 3 veces en 7 días.

7. MODELO DE EVOLUCIÓN CONTROLADA

Cada cambio funcional debe incluir:

ID versión política.

Fecha activación.

Impacto contractual.

Compatibilidad hacia atrás.

Registro auditoría de activación.

8. GARANTÍAS DE AISLAMIENTO MULTI-TENANT

Cada operación debe validar tenant_context.

Impersonación solo para soporte.

Impersonación requiere:

Justificación obligatoria.

Tiempo limitado.

Registro forense.

9. DOCUMENTO CONTRACTUAL PARA INVERSORES / COMITÉ TÉCNICO

El sistema garantiza:

Monetización gobernada por reglas formales.

Reducción de fraude interno mediante override controlado.

Escalabilidad multi-sede sin fuga de datos.

Seguridad adaptativa según riesgo.

Capacidad de expansión modular sin rediseño estructural.

10. NIVEL FINAL DE PROFUNDIDAD DISPONIBLE

Podemos avanzar aún más hacia:

Modelo formal de estados finitos (FSM) del tenant.

Especificación matemática de control de sesiones distribuidas.

Simulación de escenarios de fraude interno.

Documento de certificación ISO/IEC 27001 alineado.

Arquitectura conceptual de resiliencia ante caída de pasarela.

Diseño contractual de penalidades SLA.

Indica cuál deseas que profundicemos primero.

5 y 6

A continuación se desarrolla la Documentación Técnica v3.2 correspondiente a:

5. Arquitectura Conceptual de Resiliencia ante Caída de Pasarela de Pagos
6. Diseño Contractual de Penalidades SLA y Régimen de Responsabilidades

Nivel: Máxima precisión normativa y operacional.
Enfoque: Gobernanza SaaS, continuidad de negocio y protección financiera.

5. ARQUITECTURA CONCEPTUAL DE RESILIENCIA ANTE CAÍDA DE PASARELA
5.1 Objetivo Estratégico

Garantizar que una falla en la pasarela de pagos:

No afecte operación activa del tenant.

No genere pérdida de información.

No produzca estados inconsistentes.

No degrade innecesariamente la experiencia.

No comprometa ingresos futuros.

5.2 Principios de Diseño

Separación estricta entre:

Operación SaaS (IAM, sesiones, accesos)

Estado financiero del tenant

Consistencia eventual en eventos de cobro.

Estado transitorio formalmente definido.

Idempotencia obligatoria en eventos webhook.

5.3 Estados Financieros del Tenant

Estados formales:

Estado	Significado Operativo
activo	Plan vigente y pagado
pendiente_confirmacion_pago	Pago iniciado sin confirmación
gracia	Pago fallido, período tolerado
solo_lectura	Escritura bloqueada
suspendido	Acceso bloqueado
inconsistencia_financiera	Evento webhook conflictivo
5.4 Modelo de Resiliencia
5.4.1 Escenario A: Pasarela caída antes de iniciar cobro

Flujo:

Admin solicita upgrade.

Sistema detecta indisponibilidad pasarela.

Sistema:

No cambia plan.

No registra deuda.

Marca solicitud como pendiente.

Notifica usuario.

No se altera estado financiero.

5.4.2 Escenario B: Pago iniciado pero webhook no llega

Regla normativa:

IF pago_iniciado = TRUE
AND webhook_no_recibido
THEN estado = pendiente_confirmacion_pago
AND mantener plan_actual
AND programar reintento verificación
AUDIT Sí

Sistema ejecuta:

Reconsulta periódica a pasarela.

Timeout máximo configurable (ej. 30 min).

Si confirmación posterior:
→ Se activa plan y se normaliza estado.

5.4.3 Escenario C: Webhook duplicado

Regla:

IF evento_webhook.id ya_procesado
THEN ignorar evento
AUDIT Sí

Obligación: Webhooks deben ser idempotentes.

5.4.4 Escenario D: Pago confirmado pero respuesta tardía

Sistema debe:

Validar timestamp.

Validar firma digital.

Confirmar coherencia de monto.

Si inconsistencia:
→ Estado inconsistencia_financiera
→ Bloqueo temporal cambio de plan
→ Notificación soporte interno

5.4.5 Escenario E: Caída prolongada (>24h)

Política:

No degradar tenant automáticamente.

Congelar temporizador de ciclo si no se pudo cobrar.

Reintentar automáticamente en ventana programada.

Enviar notificación preventiva.

5.5 Garantías de Consistencia
Invariante Financiera 1

Nunca activar plan sin confirmación verificable.

Invariante Financiera 2

Nunca degradar tenant por falla de infraestructura externa.

Invariante Financiera 3

Todo cambio financiero debe estar auditado.

5.6 Observabilidad en Eventos Financieros

Métricas obligatorias:

payment_attempt_rate

webhook_delay_time

webhook_failure_rate

retry_success_ratio

pending_payment_duration_avg

Alertas:

5% pagos sin webhook en 10 min.

3 reintentos fallidos consecutivos.

1h estado pendiente_confirmacion_pago.

6. DISEÑO CONTRACTUAL DE PENALIDADES SLA
6.1 Definiciones Contractuales

Disponibilidad mensual =

Disponibilidad (%) = 
( Tiempo_total - Tiempo_no_disponible ) 
/ Tiempo_total * 100

Tiempo total mensual estándar: 43,200 minutos.

6.2 Niveles de Servicio (SLA)
Plan	Disponibilidad Garantizada
Básico	99.5%
Pro	99.8%
Enterprise	99.9%
6.3 Penalidades por Incumplimiento
Fórmula de Crédito
Crédito (%) = 
(Disponibilidad_garantizada - Disponibilidad_real)
* Factor_multiplicador

Ejemplo:

Si plan Pro 99.8%
Disponibilidad real = 99.2%
Diferencia = 0.6%

Factor multiplicador = 5

Crédito = 3% del valor mensual.

6.4 Escalamiento de Penalidad
Incumplimiento	Crédito Aplicable
< 0.5%	5%
0.5%–1%	10%
> 1%	25%

Enterprise puede negociar adicional.

6.5 Exclusiones SLA

No aplican penalidades si:

Fuerza mayor.

Fallas del proveedor externo (pasarela) si:

El sistema mantuvo operación.

No hubo pérdida de datos.

Uso indebido del cliente.

Interrupciones programadas notificadas ≥48h antes.

6.6 SLO Internos (No Contractuales)

Login < 2s

Cambio PIN < 1s

Override < 1.5s

Validación licencia < 500ms

Webhook procesado < 3s

6.7 Política de Comunicación de Incidentes

Obligatorio:

Notificación inicial ≤ 60 min.

Actualización cada 2 horas.

Informe post-mortem ≤ 72h.

Publicación de:

Causa raíz.

Medidas correctivas.

Medidas preventivas.

6.8 Régimen de Responsabilidades

Proveedor es responsable por:

Seguridad de infraestructura.

Protección multi-tenant.

Integridad de auditoría.

Cumplimiento de SLA.

Cliente es responsable por:

Gestión interna de usuarios.

Custodia de PIN y credenciales.

Configuración de permisos.

Uso conforme a contrato.

7. ESCENARIOS CONTRACTUALES COMPLEJOS
Caso: Caída parcial solo en módulo financiero

Si IAM y operación continúan funcionando:
→ No se considera indisponibilidad total.
→ Solo afecta métricas de pago.
→ No aplica penalidad de disponibilidad general.

Caso: Bloqueo erróneo por morosidad

Si sistema degradó tenant por error interno:
→ Restauración inmediata.
→ Crédito automático mínimo 10%.
→ Auditoría interna obligatoria.

8. CONCLUSIÓN ESTRATÉGICA

Con esta arquitectura:

La caída de la pasarela no rompe el SaaS.

La monetización es matemáticamente verificable.

Las penalidades están formalmente definidas.

El sistema protege ingresos y reputación.

Se minimiza litigio contractual por ambigüedad.