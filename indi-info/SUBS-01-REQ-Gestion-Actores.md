Sistema: Plataforma SaaS Multi-Tenant de Gestión de Accesos y Suscripciones
Enfoque: Gestión de Acceso (IAM avanzado) + Gestión de Suscripciones + Multi-Sede + Multi-Modo
Rubro objetivo: Retail y Servicios (Tiendas, Gimnasios, Consultoras, Operaciones con terminales físicas)
Principio rector: Seguridad estricta, monetización controlada, operación rápida y mejora continua estructural.

1. ANÁLISIS DEL RUBRO (Retail / Servicios Multi-Sede SaaS)
1.1 Problemas Críticos Identificados
1.1.1 Descontrol de Accesos Internos

Usuarios comparten contraseñas.

Supervisores prestan credenciales.

No existe trazabilidad granular de acciones.

Acciones sensibles no están segregadas por rol real.

1.1.2 Licenciamiento mal gestionado

Uso de más terminales que las pagadas.

No existe control de sesiones simultáneas.

Cambios de plan sin prorrateo correcto.

Downgrade borra información o genera caos.

1.1.3 Operación lenta en punto de atención

Login tradicional por contraseña frena turnos.

Cambio de operador requiere logout completo.

Autorizaciones toman demasiado tiempo.

1.1.4 Multi-Sede sin jerarquía clara

Configuración global no diferenciada de la local.

Usuarios con acceso cruzado no controlado.

Inexistencia de aislamiento operativo por sede.

1.1.5 Falta de gobierno SaaS

Sin control formal de estados de cuenta.

Sin período de gracia automatizado.

Sin logs forenses ante incidentes.

1.2 Necesidades Estratégicas del Sector

Autenticación rápida pero segura.

Autorización granular por rol, sede y acción.

Monetización automatizada y verificable.

Auditoría reconstructiva completa.

Arquitectura multi-tenant con aislamiento absoluto.

Capacidad de mejora incremental sin romper contratos funcionales.

2. DEFINICIÓN DE ACTORES
2.1 Actores Humanos
ID	Actor	Rol General	Nivel Global	Objetivo Principal
ACT-01	Super Admin Plataforma	Gobierno SaaS	Máximo global	Administrar tenants, planes y soporte
ACT-02	Admin Titular	Propietario Tenant	Máximo en tenant	Configurar empresa, usuarios, suscripción
ACT-03	Gestor de Sede	Admin local	Alto en sede	Operar sede y supervisar agentes
ACT-04	Supervisor Operativo	Autorizador	Medio-alto	Validar excepciones
ACT-05	Agente Operativo	Usuario terminal	Bajo	Ejecutar operación diaria
ACT-06	Área Finanzas Tenant	Administrativo	Medio	Controlar facturación SaaS
2.2 Actores Externos
ID	Actor	Tipo
EXT-01	API Registro Fiscal	Validación empresa
EXT-02	Pasarela de Pagos	Cobros recurrentes
EXT-03	Servicio de Notificaciones	Email / Alertas
EXT-04	Servicio de Almacenamiento	Logos / Assets
3. REQUISITOS FUNCIONALES (RF)
DOMINIO: TENANT (TEN)


***RF-TEN-001 — Registro de Tenant con Validación Fiscal y Selección de Plantilla de Industria***
Descripción:
El sistema deberá permitir el registro de una nueva empresa (tenant) mediante su RUC o identificador fiscal equivalente. Durante este proceso, el sistema validará la autenticidad del documento mediante una API externa, solicitará la selección del rubro del negocio y el plan de pago, para finalmente crear la entidad e inyectar una configuración base optimizada para su industria.

Flujo del Usuario (Pasos):

Identificación: El cliente ingresa su RUC o Identificación fiscal.

Validación: El sistema verifica el estado fiscal en segundo plano utilizando una API externa. **API VALIDACIÖN RUC** 

Perfilado: El sistema solicita al cliente seleccionar el "Rubro del Negocio" (ej. Retail, Deportes, Educación, Otros).**esto en otroa pagina que saldrá, para que se vea más profesional para seleccionar tipo tarjeta**

Suscripción: El cliente selecciona su plan de pago y finaliza el registro. **La información será a base de los tipos de pago y según sfotware**

Comportamiento del Sistema y Criterios de Aceptación:

Validación Estricta: El sistema bloqueará la creación del tenant si el estado fiscal devuelto por la API externa es inválido.

Manejo de Fallos (Fallback): En caso de que la API externa falle o no responda de manera oportuna, el sistema permitirá un registro provisional, asignando a la cuenta el estado de “validación pendiente”.

Autoconfiguración por Industria: Inmediatamente al completarse el registro, el sistema leerá el rubro seleccionado e inyectará de forma automática la configuración base correspondiente (roles predefinidos, nombres de menús adaptados y módulos encendidos según la industria), reduciendo el tiempo de configuración inicial de horas a segundos.

Trazabilidad: Todo intento de registro (exitoso, fallido por estado inválido o provisional por fallo de API) deberá quedar registrado en los logs de auditoría del sistema.

Prioridad: Alta


como se vería en front:

pedida de datos *check*

--se va a otra seccion y se realiza como un seria de tipo de tarjetas (se busca que sa más visual) donde podrá elegir el tipo de servicio/software, luego se dará acceso a lo que es el tipo de paquete/sub (basica.. etc).

-- recien apreciando eso se adará las configuraciones necesarias.


Actores: ACT-02 (Cliente/Usuario), EXT-01 (API de Validación Fiscal)


***RF-TEN-002 — Gestión de Multi-Sede Jerárquica***

Descripción:
Un tenant podrá crear múltiples sedes asociadas. Cada sede tendrá:

Identidad operativa independiente.

Usuarios asignados.

Terminales asociadas.

Configuración local editable.

Criterios de Aceptación:

Las sedes no pueden acceder a datos de otras sedes sin permiso explícito.

El Admin Titular puede ver consolidado global.

Prioridad: Alta
Actores: ACT-02, ACT-03

RF-TEN-003 — Estados de Ciclo de Vida del Tenant

Estados posibles:

pendiente_pago

activo

gracia

solo_lectura

hibernando

suspendido

cerrado

Criterios:

En solo_lectura no se permiten endpoints de escritura.

Transiciones requieren evento auditado.

Prioridad: Alta
Actores: ACT-01, EXT-02

DOMINIO: IDENTIDAD Y ACCESO (IAM)
RF-IAM-001 — RBAC Dinámico Granular

Permite crear roles personalizados con permisos:

Por módulo

Por acción (crear, leer, actualizar, eliminar)

Por acción sensible (override, exportar, modificar permisos)

Criterios:

Un rol no puede crear otro con privilegios superiores.

Cambios de rol quedan auditados.

Prioridad: Alta
Actores: ACT-02

RF-IAM-002 — Autenticación Rápida en Terminal (PIN/QR)

Descripción:
Permitir inicio y cambio de sesión mediante PIN de 4 dígitos o QR en terminal autenticada.

Criterios:

Máximo 5 intentos fallidos antes de bloqueo temporal.

Cambio de usuario no reinicia sesión del sistema base.

Evento auditado.

Prioridad: Alta
Actores: ACT-05

RF-IAM-003 — Override Supervisado Transaccional

Permitir autorización temporal de acciones restringidas mediante validación supervisor.

Criterios:

Solo válida para esa transacción.

Registro doble (agente + supervisor).

No altera permisos permanentes.

Prioridad: Alta
Actores: ACT-05, ACT-04

RF-IAM-004 — Gestión de Sesiones por Dispositivo

El sistema debe:

Registrar cada dispositivo.

Permitir expulsión remota.

Controlar sesiones simultáneas.

Prioridad: Alta
Actores: ACT-03, ACT-02

DOMINIO: SUSCRIPCIONES (SUB)
RF-SUB-001 — Control de Concurrencia en Tiempo Real

El sistema debe bloquear sesiones que superen límite contratado.

Criterios:

Validación en login.

Validación periódica en sesión.

Opción de cierre remoto con autorización.

Prioridad: Alta
Actores: ACT-02, ACT-04

RF-SUB-002 — Prorrateo Automático

Al agregar licencias/sedes:

Cálculo proporcional automático.

Confirmación previa al cobro.

Activación inmediata tras pago exitoso.

Prioridad: Media
Actores: ACT-02, EXT-02

RF-SUB-003 — Periodo de Gracia Automatizado

Si pago falla:

Estado cambia a gracia.

Tras N días → solo_lectura.

Prioridad: Alta
Actores: EXT-02, ACT-01

RF-SUB-004 — Portal de Facturación Self-Service

Admin Titular podrá:

Ver historial de pagos.

Descargar comprobantes.

Cambiar método de pago.

Prioridad: Alta
Actores: ACT-02, ACT-06

DOMINIO: AUDITORÍA (AUD)
RF-AUD-001 — Auditoría Forense Completa

Debe registrar:

Login/logout.

Cambios de rol.

Overrides.

Cambio de plan.

Creación/modificación/eliminación.

Cada evento incluirá:

Actor

Timestamp

IP

Contexto

Resultado

Prioridad: Alta
Actores: Todos

4. CASOS DE USO EXHAUSTIVOS
CU-01 — Onboarding Empresarial Completo

Propósito: Crear tenant operativo validado y suscrito.

Actores: ACT-02, EXT-01, EXT-02

Precondiciones:

Usuario no tiene tenant activo.

Entradas:

RUC

Email

Contraseña

Plan seleccionado

Medio de pago

Flujo Principal:

Usuario selecciona registro.

Sistema solicita RUC.

Sistema valida RUC vía API.

Sistema solicita datos de acceso.

Usuario selecciona plan.

Sistema procesa pago.

Sistema crea tenant en estado activo.

Sistema crea Admin Titular.

Redirige a configuración inicial.

Flujos Alternativos:

API falla → registro provisional.

Pago falla → estado pendiente_pago.

Salidas:

Tenant activo.

Usuario admin autenticado.

Postcondiciones:

Sistema listo para crear sedes y usuarios.

CU-02 — Cambio de Usuario en Terminal

Actores: ACT-05

Precondiciones:

Terminal autenticada.

Usuario con PIN válido.

Entradas: PIN o QR

Flujo:

Usuario solicita cambio.

Sistema pide PIN.

Usuario ingresa PIN.

Sistema valida.

Sistema activa sesión.

Registra auditoría.

Excepciones:

PIN inválido → contador incrementa.

Usuario bloqueado → denegado.

Postcondición:

Terminal asociada al nuevo usuario.

CU-03 — Autorización de Acción Restringida

Actores: ACT-05, ACT-04

Precondiciones:

Acción bloqueada por rol.

Flujo:

Agente intenta acción.

Sistema solicita supervisor.

Supervisor ingresa PIN.

Sistema valida.

Ejecuta acción.

Registra auditoría doble.

Excepciones:

PIN inválido → acción cancelada.

CU-04 — Exceso de Licencias

Actores: ACT-05, ACT-04

Flujo:

Usuario intenta login.

Sistema detecta límite.

Muestra opciones:

Notificar admin.

Cerrar sesión remota (con supervisor).

Si autorizado → libera sesión y permite login.

5. Principio de Mejora Continua

El sistema deberá:

Permitir versionado interno de reglas.

Mantener compatibilidad hacia atrás.

Registrar métricas de uso para evolución futura.

Soportar activación modular progresiva.