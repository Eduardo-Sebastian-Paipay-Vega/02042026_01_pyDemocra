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
