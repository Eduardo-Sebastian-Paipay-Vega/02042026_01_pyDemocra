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