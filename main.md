:::: titlepage
**[ESPECIFICACIÓN TÉCNICA]{style="color: primarycolor"}**\
**Sistema Integral de Gestión de Voluntariado,\
Donaciones y Asistencia QR**\

------------------------------------------------------------------------

\
**Documento de Requisitos Software**\
Según Estándar IEEE 830-1998\

------------------------------------------------------------------------

\

::: minipage
  -------------------- -----------------------------
  **Versión:**         1.0
  **Fecha:**           22 de noviembre de 2025
  **Estado:**          Aprobado
  **Clasificación:**   Confidencial - Uso Interno
  **Base de Datos:**   Microsoft SQL Server 2019+
  **Arquitectura:**    Cliente-Servidor / API REST
  -------------------- -----------------------------
:::

\

Organización Social de Voluntariado\
Área de Tecnología e Innovación\
2026-07-28
::::

# Control de Versiones {#control-de-versiones .unnumbered}

  **Versión**   **Fecha**    **Descripción de Cambios**                                                                                                                                                                                   **Autor**
  ------------- ------------ ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ --------------------
  **Versión**   **Fecha**    **Descripción de Cambios**                                                                                                                                                                                   **Autor**
  1.0           22/11/2025   Versión final con esquema completo de base de datos SQL Server, 107 requerimientos funcionales detallados, 14 requerimientos no funcionales, 13 casos de uso completos, arquitectura, índices y seguridad.   Equipo Técnico
  0.9           20/11/2025   Incorporación módulo donaciones y apadrinamiento con sistema tipo World Vision.                                                                                                                              Analista Senior
  0.8           15/11/2025   Adición de app externa de asistencia QR con modo offline.                                                                                                                                                    Arquitecto SW
  0.7           10/11/2025   Definición esquema relacional SQL Server con 30+ tablas.                                                                                                                                                     DBA Senior
  0.5           01/11/2025   Documento base con módulos principales.                                                                                                                                                                      Analista Funcional

# Resumen Ejecutivo {#resumen-ejecutivo .unnumbered}

El **Sistema Integral de Gestión de Voluntariado, Donaciones y
Asistencia QR** (código: `SIGV-2025`) es una plataforma digital
empresarial diseñada para organizaciones sociales sin fines de lucro.

## Objetivo del Sistema {#objetivo-del-sistema .unnumbered}

Digitalizar y optimizar todos los procesos operativos de una
organización de voluntariado mediante:

- Gestión completa del ciclo de vida de voluntarios

- Sistema de asistencia mediante códigos QR dinámicos con app móvil

- Plataforma de donaciones únicas y apadrinamiento recurrente

- Control de inventario, finanzas y certificaciones

- Inteligencia de negocio con dashboards en tiempo real

## Alcance {#alcance .unnumbered}

El sistema comprende **16 módulos funcionales**, **107 requerimientos
funcionales**, **14 requerimientos no funcionales** y más de **30
tablas** en el modelo de datos.

# Introducción

## Propósito del Documento

El presente documento constituye la **Especificación de Requisitos
Software (ERS)** del *Sistema Integral de Gestión de Voluntariado*,
desarrollado según el estándar IEEE 830-1998.

## Alcance del Sistema

El sistema permite gestionar de forma integral todos los procesos
operativos, administrativos y financieros de una organización social
dedicada al voluntariado.

### Módulos Principales

1.  **M01:** Gestión de Voluntarios

2.  **M02:** Gestión de Candidatos y Validación Documental

3.  **M03:** Beneficiarios y Perfiles Sensibles

4.  **M04:** Proyectos y Eventos

5.  **M05:** Asistencias y Supervisiones

6.  **M06:** Inventario y Recursos

7.  **M07:** Finanzas y Transacciones

8.  **M08:** Cursos, Capacitación y Certificación

9.  **M09:** Notificaciones y Comunicación

10. **M10:** Usuarios, Roles y Seguridad (RBAC)

11. **M11:** Reportes, BI y Dashboards

12. **M12:** API Gateway e Integraciones

13. **M13:** Aplicación Externa: Asistencia QR

14. **M14:** Donaciones y Patrocinio (Apadrinamiento)

15. **M15:** Plataforma de Contenido/CMS

16. **M16:** Auditoría y Compliance

## Referencias

1.  IEEE Std 830-1998: IEEE Recommended Practice for Software
    Requirements Specifications

2.  ISO/IEC 25010:2011 - Systems and software Quality Requirements

3.  Microsoft SQL Server 2019 Documentation - Best Practices

4.  GDPR - Reglamento General de Protección de Datos (UE) 2016/679

5.  PCI-DSS v4.0 - Payment Card Industry Data Security Standard

6.  OWASP Top 10 2021 - Web Application Security Risks

7.  RFC 7519 - JSON Web Token (JWT)

8.  ISO 27001:2013 - Information Security Management

9.  Ley N° 29733 - Ley de Protección de Datos Personales (Perú)

# Catálogo de Módulos del Sistema

## Descripción de Módulos

  **ID**    **Módulo**               **Descripción**
  --------- ------------------------ -----------------------------------------------------------------------------------------------------------------------------------------
  **ID**    **Módulo**               **Descripción**
  **M01**   Gestión de Voluntarios   Administración completa del ciclo de vida de voluntarios: registro, actualización, estados, habilidades, roles, historial y reputación.
  **M02**   Gestión de Candidatos    Postulación de candidatos, carga de documentos, validación automática mediante OCR/ML, revisión por Talento Humano.
  **M03**   Beneficiarios            Registro de beneficiarios (niños, adultos mayores), perfiles específicos, fichas médicas, logros.
  **M04**   Proyectos y Eventos      Creación de proyectos sociales, asignación de coordinadores, recursos, voluntarios, seguimiento de avances.
  **M05**   Asistencias              Registro de asistencia de voluntarios, justificaciones, cálculo automático de horas, supervisión.
  **M06**   Inventario               Control de stock de materiales, transacciones de entrada/salida, ubicaciones y alertas.
  **M07**   Finanzas                 Gestión de cuentas financieras, transacciones, comprobantes, reportes fiscales.
  **M08**   Cursos y Certificación   Plataforma LMS con cursos, evaluaciones automáticas y emisión de certificados digitales.
  **M09**   Notificaciones           Sistema multicanal (email, WhatsApp, SMS, push), plantillas y recordatorios.
  **M10**   Usuarios y Seguridad     Gestión de usuarios, roles jerárquicos, permisos granulares, autenticación JWT.
  **M11**   Reportes y BI            Dashboards interactivos con KPIs, reportes exportables y análisis predictivo.
  **M12**   API Gateway              API REST pública, webhooks, integraciones con sistemas externos.
  **M13**   App Asistencia QR        App móvil para registro de asistencia mediante QR dinámico y modo offline.
  **M14**   Donaciones               Donaciones únicas y recurrentes, suscripciones, apadrinamiento tipo World Vision.
  **M15**   CMS                      Gestión de contenido multimedia para comunicación con donantes.
  **M16**   Auditoría                Bitácora de operaciones, logs inalterables, cumplimiento GDPR.

# Requerimientos Funcionales

Los requerimientos funcionales (RF) describen las capacidades que el
sistema debe proporcionar. Cada RF tiene identificador único `RF-XXX`.

## Módulo M01: Gestión de Voluntarios

### RF-001: Registrar Voluntarios

**Prioridad:** Alta\
**Descripción:** El sistema debe permitir registrar voluntarios con
datos completos (nombres, apellidos, DNI/pasaporte, fecha de nacimiento,
dirección, teléfono, email, género).\
**Entradas:** Formulario con campos obligatorios: Nombre, Apellido, DNI,
Email.\
**Procesamiento:**

- Validar formato de email

- Verificar unicidad de DNI y Email

- Generar UUID v4 automáticamente

- Asignar estado inicial \"Activo\"

**Salidas:** Voluntario creado con ID_Voluntario único, notificación por
email.\
**Precondición:** Usuario con rol Administrador o Talento Humano
autenticado.\
**Poscondición:** Voluntario registrado en tabla Voluntarios, log en
auditoría.

### RF-002: Generar UUID Único

**Prioridad:** Alta\
**Descripción:** El sistema debe generar automáticamente un UUID v4 para
cada voluntario al momento del registro.\
**Procesamiento:** Utilizar algoritmo RFC 4122 UUID versión 4.\
**Salidas:** UUID almacenado en campo UUID_Credencial.\
**Poscondición:** UUID único, no duplicado, formato estándar.

### RF-003: Actualizar Datos de Voluntario

**Prioridad:** Alta\
**Descripción:** El sistema debe permitir actualizar datos personales de
voluntarios existentes.\
**Precondición:** Voluntario registrado, usuario autorizado.\
**Procesamiento:**

- Validar permisos del usuario

- Registrar datos anteriores en tabla de auditoría

- Actualizar campos modificados

- Timestamp de última actualización

**Poscondición:** Datos actualizados, historial de cambios registrado.

### RF-004: Cargar Documentos Personales

**Prioridad:** Alta\
**Descripción:** El sistema debe permitir cargar fotografía de perfil y
documentos personales en formatos JPG, PNG, PDF.\
**Entradas:** Archivo hasta 10 MB.\
**Procesamiento:**

- Validar formato y tamaño

- Escanear virus

- Almacenar en Azure Blob/AWS S3

- Registrar URL en DocumentosVoluntario

**Salidas:** URL del documento, mensaje de confirmación.\
**Poscondición:** Documento accesible mediante URL segura.

### RF-005: Gestionar Estados de Voluntario

**Prioridad:** Alta\
**Descripción:** El sistema debe permitir gestionar el estado del
voluntario: Activo, Inactivo, Suspendido, Retirado.\
**Procesamiento:**

- Validar transición de estado válida

- Requerir justificación obligatoria

- Registrar en historial con timestamp

- Enviar notificación al voluntario si aplica

**Poscondición:** Estado actualizado, registro en auditoría.

### RF-006: Registrar Habilidades

**Prioridad:** Media\
**Descripción:** El sistema debe permitir registrar habilidades del
voluntario con nivel de dominio (Básico, Intermedio, Avanzado).\
**Procesamiento:** Inserción en tabla Voluntario_Habilidades.\
**Poscondición:** Habilidades disponibles para matching con proyectos.

### RF-007: Asignar Roles Funcionales

**Prioridad:** Alta\
**Descripción:** El sistema debe permitir asignar roles funcionales a
voluntarios (voluntario base, líder de equipo, coordinador).\
**Procesamiento:**

- Validar jerarquía de roles

- Registrar fecha inicio y fin

- Permitir múltiples roles simultáneos

**Poscondición:** Rol registrado en AsignacionesRol con vigencia.

### RF-008: Registrar Fichas Sensibles

**Prioridad:** Media\
**Descripción:** El sistema debe permitir registrar información sensible
del voluntario con acceso restringido.\
**Precondición:** Usuario con permiso \"ver_datos_sensibles\".\
**Procesamiento:** Cifrado AES-256 en columnas sensibles.\
**Poscondición:** Datos almacenados en FichaSensibleVoluntario con
cifrado.

### RF-009: Prevenir Duplicados

**Prioridad:** Alta\
**Descripción:** El sistema debe impedir registro duplicado por DNI o
Email.\
**Procesamiento:** Constraint UNIQUE en BD, validación en aplicación.\
**Salidas:** Mensaje de error si existe duplicado.

### RF-010: Ver Historial de Roles

**Prioridad:** Media\
**Descripción:** El sistema debe permitir visualizar historial completo
de roles asignados.\
**Salidas:** Lista cronológica con fechas de inicio/fin.

### RF-011: Buscar Voluntarios con Filtros

**Prioridad:** Alta\
**Descripción:** El sistema debe permitir buscar voluntarios con
filtros: rol, estado, nombre, habilidades, edad, género.\
**Procesamiento:** Consulta SQL optimizada con índices.\
**Salidas:** Lista paginada de voluntarios que cumplen criterios.

### RF-012: Validar Documentos Obligatorios

**Prioridad:** Alta\
**Descripción:** El sistema debe validar que voluntario tenga documentos
obligatorios completos antes de activación.\
**Poscondición:** Voluntario no puede estar \"Activo\" sin documentos
obligatorios.

## Módulo M02: Gestión de Candidatos

### RF-013: Registrar Candidatos

**Prioridad:** Alta\
**Descripción:** El sistema debe permitir registrar candidatos a
voluntariado mediante formulario público.\
**Salidas:** Candidato en estado \"Pendiente\".

### RF-014: Subir Documentos Obligatorios

**Prioridad:** Alta\
**Descripción:** El sistema debe permitir al candidato subir documentos
definidos por TH.\
**Procesamiento:** Multipart file upload, almacenamiento seguro.

### RF-015: Validación Automática con OCR

**Prioridad:** Media\
**Descripción:** El sistema debe validar documentos automáticamente
usando OCR y ML.\
**Procesamiento:**

- Pipeline asíncrono: OCR → extracción → comparación

- Scoring de confianza 0-100

- Aprobación automática si score \> 95%

- Revisión manual si 70-95%

- Rechazo automático si \< 70%

### RF-016: Alertar Documentos Faltantes

**Prioridad:** Alta\
**Descripción:** El sistema debe alertar a TH sobre documentos
faltantes.\
**Procesamiento:** Job diario que verifica completitud.\
**Salidas:** Notificación por email y panel de tareas.

### RF-017: Aprobar/Rechazar Candidatos

**Prioridad:** Alta\
**Descripción:** TH debe poder aprobar o rechazar candidatos con
comentarios.\
**Procesamiento:** Cambio de estado, registro de justificación.\
**Salidas:** Notificación al candidato.

### RF-018: Conversión Automática a Voluntario

**Prioridad:** Alta\
**Descripción:** El sistema debe convertir candidatos aprobados en
voluntarios automáticamente.\
**Procesamiento:** Migración de datos, creación de usuario.\
**Poscondición:** Voluntario creado, email de bienvenida enviado.

## Módulo M03: Beneficiarios

### RF-019: Registrar Beneficiarios

**Prioridad:** Alta\
**Descripción:** El sistema debe permitir registrar beneficiarios con
datos personales.

### RF-020: Asignar Tipo de Beneficiario

**Prioridad:** Alta\
**Descripción:** El sistema debe permitir asignar tipo: Niño, Adulto
Mayor, Otro.

### RF-021: Registrar Perfiles Específicos

**Prioridad:** Media\
**Descripción:** El sistema debe permitir perfiles específicos según
tipo (colegio para niños, autonomía para adultos mayores).

### RF-022: Registrar Ficha Médica

**Prioridad:** Alta\
**Descripción:** El sistema debe permitir ficha médica única por
beneficiario con acceso restringido.\
**Precondición:** Usuario con permiso \"ver_datos_medicos\".\
**Poscondición:** Datos cifrados en reposo.

### RF-023: Buscar Beneficiarios

**Prioridad:** Alta\
**Descripción:** El sistema debe permitir buscar beneficiarios por
nombre, edad, tipo o proyecto.

### RF-024: Registrar Logros

**Prioridad:** Baja\
**Descripción:** El sistema debe permitir registrar logros del
beneficiario.

### RF-025: Asociar a Proyectos

**Prioridad:** Alta\
**Descripción:** El sistema debe permitir asociar beneficiarios a
proyectos.\
**Poscondición:** Registro en ParticipacionesProyecto.

## Módulo M04: Proyectos y Eventos

### RF-026: Registrar Proyectos

**Prioridad:** Alta\
**Descripción:** El sistema debe permitir registrar proyectos con:
nombre, descripción, área, objetivos, fechas, presupuesto.

### RF-027: Asignar Coordinador

**Prioridad:** Alta\
**Descripción:** El sistema debe permitir asignar coordinador
responsable.

### RF-028: Establecer Área

**Prioridad:** Media\
**Descripción:** El sistema debe asociar proyecto a área: Salud,
Educación, Asistencia Social, Medio Ambiente.

### RF-029: Asignar Voluntarios

**Prioridad:** Alta\
**Descripción:** El sistema debe permitir asignar voluntarios al
proyecto.

### RF-030: Registrar Participación Beneficiarios

**Prioridad:** Alta\
**Descripción:** El sistema debe registrar beneficiarios que participan.

### RF-031: Registrar Recursos

**Prioridad:** Media\
**Descripción:** El sistema debe permitir adjuntar recursos físicos y
documentos.

### RF-032: Registrar Avances

**Prioridad:** Media\
**Descripción:** El sistema debe permitir registrar avances y
actividades.

### RF-033: Cambiar Estado Proyecto

**Prioridad:** Alta\
**Descripción:** El sistema debe permitir cambiar estado: Planificado,
En curso, Pausado, Finalizado, Cancelado.

### RF-034: Ver Estadísticas

**Prioridad:** Media\
**Descripción:** El sistema debe mostrar estadísticas: asistencia
promedio, beneficiarios atendidos, voluntarios activos.

## Módulo M05: Asistencias

### RF-035: Registrar Asistencia Manual

**Prioridad:** Alta\
**Descripción:** El sistema debe permitir registro manual con entrada y
salida.

### RF-036: Justificar Inasistencias

**Prioridad:** Media\
**Descripción:** El sistema debe permitir justificar inasistencias con
documentos.

### RF-037: Registrar Supervisión

**Prioridad:** Media\
**Descripción:** El sistema debe registrar relación supervisión
coordinador-voluntario.

### RF-038: Calcular Horas Automáticamente

**Prioridad:** Alta\
**Descripción:** El sistema debe calcular horas totales automáticamente.

## Módulo M06: Inventario

### RF-039: Registrar Items

**Prioridad:** Alta\
**Descripción:** El sistema debe permitir registrar items con
descripción y tipo.

### RF-040: Registrar Transacciones

**Prioridad:** Alta\
**Descripción:** El sistema debe registrar entradas y salidas de
inventario.

### RF-041: Asociar a Proyectos

**Prioridad:** Media\
**Descripción:** El sistema debe asociar transacciones a proyectos.

### RF-042: Alertas de Stock Mínimo

**Prioridad:** Media\
**Descripción:** El sistema debe generar alertas cuando stock \< mínimo
definido.

## Módulo M07: Finanzas

### RF-043: Registrar Transacciones Financieras

**Prioridad:** Alta\
**Descripción:** El sistema debe registrar ingresos y egresos con
comprobantes.

### RF-044: Asociar a Proyectos

**Prioridad:** Alta\
**Descripción:** El sistema debe asociar transacciones a proyectos.

### RF-045: Generar Reportes Fiscales

**Prioridad:** Alta\
**Descripción:** El sistema debe generar reportes fiscales para
auditoría.

## Módulo M08: Cursos y Certificación

### RF-046: Registrar Cursos

**Prioridad:** Alta\
**Descripción:** El sistema debe permitir crear cursos con contenido
multimedia.

### RF-047: Inscribir Voluntarios

**Prioridad:** Alta\
**Descripción:** El sistema debe permitir inscripción a cursos.

### RF-048: Registrar Avance

**Prioridad:** Alta\
**Descripción:** El sistema debe registrar avance: lecciones
completadas, exámenes.

### RF-049: Emitir Certificados

**Prioridad:** Alta\
**Descripción:** El sistema debe emitir certificados digitales con
código QR de verificación.\
**Procesamiento:** Generación PDF con plantilla, firma digital, código
único.\
**Salidas:** PDF descargable, código verificable en portal público.

### RF-050: Validar Requisitos

**Prioridad:** Media\
**Descripción:** El sistema debe validar automáticamente si voluntario
cumple requisitos para certificado.

## Módulo M09: Notificaciones

### RF-051: Enviar Emails

**Prioridad:** Alta\
**Descripción:** El sistema debe enviar emails usando plantillas
predefinidas.

### RF-052: Enviar WhatsApp

**Prioridad:** Media\
**Descripción:** El sistema debe enviar mensajes vía WhatsApp Business
API.

### RF-053: Enviar SMS

**Prioridad:** Media\
**Descripción:** El sistema debe enviar SMS vía Twilio/Infobip.

### RF-054: Notificaciones Push

**Prioridad:** Media\
**Descripción:** El sistema debe enviar notificaciones push a app móvil.

### RF-055: Historial de Notificaciones

**Prioridad:** Baja\
**Descripción:** El sistema debe mantener historial de notificaciones
enviadas.

## Módulo M10: Usuarios y Seguridad

### RF-056: Registrar Usuarios

**Prioridad:** Alta\
**Descripción:** El sistema debe permitir crear usuarios con roles
asignados.

### RF-057: Autenticación JWT

**Prioridad:** Alta\
**Descripción:** El sistema debe autenticar usuarios usando JWT con
refresh tokens.

### RF-058: Gestionar Roles RBAC

**Prioridad:** Alta\
**Descripción:** El sistema debe implementar control de acceso basado en
roles.

### RF-059: Permisos Granulares

**Prioridad:** Alta\
**Descripción:** El sistema debe permitir permisos a nivel de operación
(crear, leer, actualizar, eliminar).

### RF-060: Auditoría de Accesos

**Prioridad:** Alta\
**Descripción:** El sistema debe registrar todos los accesos y
operaciones críticas.

## Módulo M11: Reportes y BI

### RF-061: Dashboard KPIs

**Prioridad:** Alta\
**Descripción:** El sistema debe mostrar dashboard con KPIs en tiempo
real.

### RF-062: Exportar Reportes

**Prioridad:** Alta\
**Descripción:** El sistema debe permitir exportar reportes en PDF,
Excel, CSV.

### RF-063: Reportes Personalizables

**Prioridad:** Media\
**Descripción:** El sistema debe permitir crear reportes personalizados
con filtros.

## Módulo M13: App Asistencia QR

### RF-064: Generar QR Dinámico

**Prioridad:** Alta\
**Descripción:** El sistema debe generar códigos QR con token HMAC
rotativo cada 30-60 segundos.\
**Procesamiento:** `HMAC-SHA256(secret, event_id|timestamp|nonce)`

### RF-065: Escanear QR en App

**Prioridad:** Alta\
**Descripción:** La app móvil debe escanear QR y decodificar token.

### RF-066: Modo Offline

**Prioridad:** Alta\
**Descripción:** La app debe funcionar sin conexión y sincronizar al
reconectar.\
**Procesamiento:** Almacenamiento local en SQLite, sincronización
automática.

### RF-067: Validar Asignación

**Prioridad:** Alta\
**Descripción:** El sistema debe validar que voluntario esté asignado al
evento.

### RF-068: Registrar GPS

**Prioridad:** Media\
**Descripción:** La app debe capturar coordenadas GPS en cada marcación.

### RF-069: API Asistencia

**Prioridad:** Alta\
**Descripción:** El sistema debe proveer endpoint
`POST /api/v1/qr/attendance`.

### RF-070: Panel Control QR

**Prioridad:** Media\
**Descripción:** El sistema debe proveer panel para revisar asistencias
por QR.

## Módulo M14: Donaciones y Apadrinamiento

### RF-071: Donaciones Únicas

**Prioridad:** Alta\
**Descripción:** El sistema debe permitir donaciones con múltiples
métodos de pago.

### RF-072: Suscripciones Recurrentes

**Prioridad:** Alta\
**Descripción:** El sistema debe permitir suscripciones con cobro
automático.

### RF-073: Crear Perfiles Apadrinables

**Prioridad:** Alta\
**Descripción:** El sistema debe permitir crear perfiles con foto,
historia y necesidades.

### RF-074: Apadrinar Beneficiario

**Prioridad:** Alta\
**Descripción:** El donante debe poder apadrinar un beneficiario
específico.

### RF-075: Trazabilidad de Fondos

**Prioridad:** Alta\
**Descripción:** El sistema debe permitir trazabilidad completa del uso
de fondos.

### RF-076: Panel de Donante

**Prioridad:** Alta\
**Descripción:** El sistema debe proveer panel personal para donantes
con historial.

### RF-077: Mensajería Controlada

**Prioridad:** Media\
**Descripción:** El sistema debe permitir envío de actualizaciones con
aprobación previa.

### RF-078: Comprobantes Automáticos

**Prioridad:** Alta\
**Descripción:** El sistema debe generar comprobantes digitales
automáticamente.

### RF-079: Integración Pasarelas

**Prioridad:** Alta\
**Descripción:** El sistema debe integrarse con Culqi, Niubiz, PayPal,
Stripe mediante webhooks.

### RF-080: Gestionar Suscripciones

**Prioridad:** Alta\
**Descripción:** El sistema debe permitir crear, pausar, reanudar y
cancelar suscripciones.

## Requerimientos Funcionales Adicionales (RF-081 a RF-107)

### RF-081 a RF-090: Funciones Avanzadas

**RF-081:** Matching automático voluntario-proyecto usando IA\
**RF-082:** Sistema de gamificación con badges y puntos\
**RF-083:** Predicción de asistencia con ML\
**RF-084:** Análisis de retención de voluntarios\
**RF-085:** Calendario sincronizable con Google/Outlook\
**RF-086:** Chat interno entre voluntarios\
**RF-087:** Foro comunitario\
**RF-088:** Galería de fotos de proyectos\
**RF-089:** Blog de noticias y actualizaciones\
**RF-090:** Newsletter automático

### RF-091 a RF-100: Integraciones

**RF-091:** Integración con software contable externo\
**RF-092:** Integración con CRM\
**RF-093:** Integración con plataforma de e-learning\
**RF-094:** API pública con rate limiting\
**RF-095:** Webhooks configurables\
**RF-096:** Exportación masiva de datos\
**RF-097:** Importación desde Excel/CSV\
**RF-098:** Backup automático diario\
**RF-099:** Restore de backup\
**RF-100:** Migración de datos desde sistema legacy

### RF-101 a RF-107: Administración

**RF-101:** Configuración de parámetros del sistema\
**RF-102:** Gestión de plantillas de documentos\
**RF-103:** Gestión de catálogos (estados, tipos, categorías)\
**RF-104:** Log de errores y excepciones\
**RF-105:** Monitor de salud del sistema\
**RF-106:** Gestión de versiones de app móvil\
**RF-107:** Centro de ayuda con FAQ

# Requerimientos No Funcionales

Los requerimientos no funcionales (RNF) definen criterios de calidad,
restricciones y atributos del sistema.

## RNF-01: Seguridad - Comunicación Cifrada

**Categoría:** Seguridad\
**Descripción:** Todas las comunicaciones deben usar HTTPS con TLS 1.2+
(TLS 1.3 preferido).\
**Medición:** Auditoría con SSLLabs debe obtener calificación A o A+.\
**Prioridad:** Crítica

## RNF-02: Seguridad - Cifrado en Reposo

**Categoría:** Seguridad\
**Descripción:** Datos sensibles (fichas médicas, datos financieros)
deben cifrarse en reposo con AES-256.\
**Prioridad:** Crítica

## RNF-03: Seguridad - Hash de Contraseñas

**Categoría:** Seguridad\
**Descripción:** Contraseñas deben hashearse con Argon2id o bcrypt (cost
factor 12+) con salt único.\
**Prioridad:** Crítica

## RNF-04: Seguridad - Rate Limiting

**Categoría:** Seguridad\
**Descripción:** APIs deben protegerse con rate limiting de 100 req/min
por API key estándar y WAF.\
**Prioridad:** Alta

## RNF-05: Auditoría Inmutable

**Categoría:** Seguridad\
**Descripción:** Logs de auditoría deben ser write-only con retención
mínima 3 años.\
**Prioridad:** Alta

## RNF-06: Cumplimiento GDPR

**Categoría:** Legal\
**Descripción:** Sistema debe cumplir GDPR: consentimiento explícito,
derecho al olvido, portabilidad de datos.\
**Prioridad:** Crítica

## RNF-07: Tokenización de Pagos

**Categoría:** Seguridad\
**Descripción:** No almacenar datos de tarjeta; usar tokenización
(PCI-DSS compliant).\
**Prioridad:** Crítica

## RNF-08: Autenticación Multifactor

**Categoría:** Seguridad\
**Descripción:** Sistema debe soportar MFA opcional con TOTP.\
**Prioridad:** Media

## RNF-09: Latencia de API

**Categoría:** Rendimiento\
**Descripción:** Latencia p95 de APIs \< 200ms; p99 \< 500ms.\
**Medición:** Monitoreo con Prometheus + Grafana.\
**Prioridad:** Alta

## RNF-10: Tiempo de Respuesta UI

**Categoría:** Rendimiento\
**Descripción:** Carga inicial de páginas \< 2 segundos; interacciones
\< 500ms.\
**Medición:** Lighthouse score \> 90.\
**Prioridad:** Alta

## RNF-11: Concurrencia

**Categoría:** Rendimiento\
**Descripción:** Sistema debe soportar mínimo 5,000 usuarios
concurrentes con degradación \< 10%.\
**Prioridad:** Alta

## RNF-12: Disponibilidad

**Categoría:** Confiabilidad\
**Descripción:** Uptime 99.5% mensual (excluyendo mantenimiento
programado).\
**Medición:** Monitoreo 24/7 con pingdom.\
**Prioridad:** Alta

## RNF-13: Backups

**Categoría:** Confiabilidad\
**Descripción:** Backups automáticos diarios con retención 30 días;
semanales con retención 1 año.\
**Prueba:** Restore drill trimestral.\
**Prioridad:** Crítica

## RNF-14: Compatibilidad

**Categoría:** Usabilidad\
**Descripción:** Sistema debe funcionar en Chrome 90+, Firefox 88+,
Safari 14+, Edge 90+. App móvil: iOS 13+ y Android 8.0+.\
**Prioridad:** Alta

# Casos de Uso Detallados

Los casos de uso (CU) describen interacciones entre actores y el sistema
para lograr objetivos específicos.

## CU-01: Registrar Voluntario

**ID:** CU-01\
**Actor Principal:** Administrador / Talento Humano\
**Nivel:** Usuario\
**Precondiciones:** Usuario autenticado con permisos de gestión de
voluntarios.\
**Garantías de Éxito:** Voluntario registrado en base de datos,
notificación enviada.

### Flujo Principal

1.  Usuario accede al módulo de voluntarios

2.  Sistema muestra formulario de registro

3.  Usuario completa campos obligatorios (nombre, DNI, email, teléfono,
    fecha nacimiento)

4.  Usuario carga foto de perfil (opcional)

5.  Usuario hace clic en \"Registrar\"

6.  Sistema valida formato de datos

7.  Sistema verifica unicidad de DNI y email

8.  Sistema genera UUID único

9.  Sistema crea voluntario en estado \"Activo\"

10. Sistema envía email de bienvenida

11. Sistema muestra mensaje de éxito con ID_Voluntario generado

### Flujos Alternativos

**6a. Datos inválidos:**

1.  Sistema muestra errores de validación (email mal formado, DNI
    inválido)

2.  Usuario corrige datos

3.  Continúa en paso 5

**7a. DNI o email duplicado:**

1.  Sistema muestra error \"Voluntario ya existe\"

2.  Sistema sugiere actualizar voluntario existente

3.  Caso de uso termina

### Poscondiciones

- Voluntario registrado en tabla Voluntarios

- UUID generado y almacenado

- Registro en tabla de auditoría

- Email de bienvenida enviado

## CU-02: Validar Candidato con OCR

**ID:** CU-02\
**Actor Principal:** Sistema (automático)\
**Actor Secundario:** Talento Humano\
**Nivel:** Subfunción\
**Precondiciones:** Candidato ha subido documentos obligatorios.

### Flujo Principal

1.  Sistema detecta nuevo documento subido

2.  Sistema extrae texto con OCR (Azure Computer Vision / AWS Textract)

3.  Sistema parsea datos relevantes (nombre, DNI, fecha nacimiento)

4.  Sistema compara con datos del formulario

5.  Sistema calcula score de confianza (0-100)

6.  **IF** score \> 95%: Sistema marca documento como \"Aprobado
    Automático\"

7.  **ELSE IF** 70 ≤ score ≤ 95: Sistema marca como \"Revisión Manual\"
    y notifica TH

8.  **ELSE:** Sistema marca como \"Rechazado\" y notifica candidato

9.  Sistema registra resultado en tabla DocumentosVoluntario

### Flujos Alternativos

**2a. OCR falla:**

1.  Sistema marca documento como \"Revisión Manual\"

2.  Sistema notifica a TH

3.  Caso de uso termina

## CU-03: Registrar Asistencia por QR

**ID:** CU-03\
**Actor Principal:** Encargado de Campo (App Externa)\
**Nivel:** Usuario\
**Precondiciones:** Evento activo, voluntario asignado al evento, app
autenticada.

### Flujo Principal

1.  Encargado abre app móvil de asistencia

2.  App solicita seleccionar evento activo

3.  Encargado selecciona evento del día

4.  App carga lista de voluntarios asignados desde servidor

5.  Encargado escanea código QR del voluntario

6.  App decodifica QR y extrae UUID + token HMAC + timestamp

7.  App valida token con clave secreta local

8.  App verifica que timestamp no haya expirado (\< 60 segundos)

9.  App busca voluntario en lista de asignados

10. App registra marcación (entrada/salida) con timestamp, GPS, device
    ID

11. **IF** online: App envía log al backend inmediatamente

12. **ELSE:** App almacena log en SQLite local

13. App muestra confirmación visual (pantalla verde) con nombre del
    voluntario

14. App reproduce sonido de confirmación

### Flujos Alternativos

**7a. Token HMAC inválido:**

1.  App muestra error \"Código QR inválido\"

2.  App registra intento fallido

3.  Caso de uso termina

**8a. Token expirado:**

1.  App muestra error \"Código QR expirado, solicite nuevo\"

2.  Caso de uso termina

**9a. Voluntario no asignado:**

1.  App muestra alerta \"Voluntario no autorizado para este evento\"

2.  App registra intento como \"No autorizado\"

3.  App envía alerta al coordinador

4.  Caso de uso termina

**Sincronización offline:**

1.  Cuando app recupera conexión, detecta logs pendientes

2.  App envía todos los logs en batch al endpoint

3.  Backend valida y registra cada log

4.  Backend responde con confirmaciones

5.  App elimina logs locales sincronizados

### Poscondiciones

- Asistencia registrada en tabla QR_AttendanceLogs

- Metadatos capturados (GPS, device ID, timestamp)

- Coordinador puede ver asistencia en dashboard

- Horas acumuladas actualizadas

## CU-04: Realizar Donación Única

**ID:** CU-04\
**Actor Principal:** Donante\
**Nivel:** Usuario\
**Precondiciones:** Donante accede al portal público.

### Flujo Principal

1.  Donante navega a página de donaciones

2.  Sistema muestra campañas disponibles con descripción e imágenes

3.  Donante selecciona campaña o fondo general

4.  Donante ingresa monto a donar (o selecciona monto sugerido)

5.  Donante ingresa datos personales (nombre, email, teléfono)

6.  Donante acepta términos y condiciones

7.  Donante selecciona método de pago (tarjeta, Yape, PayPal)

8.  Sistema crea registro de donación en estado \"Pendiente\"

9.  Sistema redirige a pasarela de pago con token único

10. Donante completa pago en página de pasarela

11. Pasarela procesa pago

12. Pasarela envía webhook de confirmación a backend

13. Sistema actualiza donación a estado \"Completado\"

14. Sistema genera comprobante PDF con número único

15. Sistema registra transacción financiera

16. Sistema envía email con comprobante adjunto

17. Sistema muestra página de agradecimiento al donante

### Flujos Alternativos

**11a. Pago fallido:**

1.  Pasarela envía webhook de fallo con código de error

2.  Sistema actualiza donación a estado \"Fallido\"

3.  Sistema registra motivo del fallo

4.  Sistema envía email al donante explicando error

5.  Sistema sugiere reintentar o contactar soporte

6.  Caso de uso termina

**11b. Pago timeout:**

1.  Pasarela no responde en 10 minutos

2.  Sistema marca donación como \"Timeout\"

3.  Sistema programa job para verificar estado en 1 hora

4.  Caso de uso termina

### Poscondiciones

- Donación registrada en tabla Donaciones

- Comprobante generado y almacenado

- Entrada contable creada en TransaccionesFinancieras

- Email de agradecimiento enviado

- Donante registrado en tabla Donantes si no existía

## CU-05: Apadrinar Beneficiario

**ID:** CU-05\
**Actor Principal:** Donante\
**Nivel:** Usuario\
**Precondiciones:** Existen perfiles apadrinables disponibles.

### Flujo Principal

1.  Donante navega a sección \"Apadrina un Niño/Abuelo\"

2.  Sistema muestra galería de perfiles apadrinables con fotos

3.  Donante aplica filtros opcionales (edad, género, ubicación)

4.  Sistema actualiza galería según filtros

5.  Donante selecciona un perfil

6.  Sistema muestra historia completa, foto de alta calidad, necesidades
    específicas

7.  Donante hace clic en \"Apadrinar\"

8.  Sistema muestra términos y condiciones de apadrinamiento

9.  Donante lee y acepta términos

10. Sistema solicita crear suscripción mensual

11. Sistema muestra monto sugerido (personalizable)

12. Donante ingresa datos de pago y autoriza cobros recurrentes

13. Sistema crea suscripción vinculada al perfil

14. Sistema procesa primer cobro

15. Sistema crea registro de apadrinamiento

16. Sistema marca perfil como \"Apadrinado\"

17. Sistema genera certificado de apadrinamiento

18. Sistema envía email de bienvenida con foto y certificado

19. Sistema programa envío de actualizaciones trimestrales

### Flujos Alternativos

**14a. Primer pago fallido:**

1.  Sistema cancela apadrinamiento

2.  Sistema libera perfil (marca como \"Disponible\")

3.  Sistema elimina suscripción

4.  Sistema notifica al donante del error

5.  Caso de uso termina

**Perfil recién apadrinado por otro donante:**

1.  Al intentar crear apadrinamiento, sistema detecta que perfil ya no
    está disponible

2.  Sistema muestra mensaje \"Este beneficiario ya fue apadrinado,
    seleccione otro\"

3.  Sistema redirige a galería

4.  Continúa en paso 5

### Poscondiciones

- Apadrinamiento activo en tabla Apadrinamientos

- Suscripción creada y primer cobro procesado

- Perfil marcado como \"Apadrinado\"

- Donante recibe actualizaciones periódicas

- Relación trazable para reportes de impacto

## CU-06: Emitir Certificado

**ID:** CU-06\
**Actor Principal:** Sistema (automático)\
**Actor Secundario:** Coordinador\
**Nivel:** Subfunción\
**Precondiciones:** Voluntario cumple requisitos para certificado.

### Flujo Principal

1.  Sistema ejecuta job nocturno de validación de certificados

2.  Sistema consulta voluntarios con cursos completados o horas
    acumuladas

3.  Para cada voluntario, sistema verifica requisitos de cada tipo de
    certificado

4.  **IF** requisitos cumplidos: Sistema genera certificado

5.  Sistema consulta plantilla de certificado (diseño preconfigurado)

6.  Sistema rellena plantilla con datos del voluntario

7.  Sistema genera código QR de verificación único

8.  Sistema genera PDF con firma digital opcional

9.  Sistema almacena PDF en storage

10. Sistema registra certificado en tabla Certificados

11. Sistema envía notificación al voluntario con link de descarga

### Emisión Manual

1.  Coordinador accede a perfil de voluntario

2.  Coordinador hace clic en \"Emitir Certificado\"

3.  Sistema muestra tipos de certificados disponibles

4.  Coordinador selecciona tipo

5.  Sistema valida requisitos

6.  **IF** requisitos no cumplidos: Sistema muestra advertencia

7.  Coordinador puede forzar emisión con justificación

8.  Sistema genera certificado (pasos 5-10 del flujo anterior)

9.  Sistema registra emisión manual en auditoría

### Poscondiciones

- Certificado registrado con código único

- PDF disponible para descarga

- Código QR verificable en portal público

- Voluntario notificado por email

## Casos de Uso Adicionales (CU-07 a CU-13)

### CU-07: Gestionar Suscripción

Actor: Donante\
Descripción: Donante puede pausar, reanudar o cancelar su suscripción
desde panel personal.

### CU-08: Aprobar Contenido para Donantes

Actor: Talento Humano\
Descripción: TH revisa y aprueba fotos/videos antes de enviar a donantes
apadrinadores.

### CU-09: Sincronizar Calendario

Actor: Voluntario\
Descripción: Voluntario puede sincronizar eventos asignados con Google
Calendar o Outlook.

### CU-10: Generar Reporte Fiscal

Actor: Contador\
Descripción: Contador genera reporte fiscal mensual/anual con todas las
transacciones.

### CU-11: Configurar Alertas de Stock

Actor: Encargado de Inventario\
Descripción: Configurar niveles mínimos de stock y destinatarios de
alertas.

### CU-12: Exportar Datos de Voluntarios

Actor: Administrador\
Descripción: Exportar datos de voluntarios en formato Excel/CSV para
análisis externo.

### CU-13: Derecho al Olvido (GDPR)

Actor: Voluntario\
Descripción: Voluntario solicita eliminación de sus datos personales.
Sistema anonimiza datos manteniendo trazabilidad operacional.

# Modelo de Datos - Resumen

El modelo de datos completo se encuentra documentado en el capítulo
anterior. A continuación un resumen de las tablas principales:

## Tablas de Entidades Principales

- **Voluntarios:** Registro de voluntarios con UUID único

- **Beneficiarios:** Registro de beneficiarios

- **Proyectos:** Proyectos sociales con coordinador y recursos

- **Donantes:** Registro de donantes individuales y empresas

## Total de Tablas por Categoría

  **Categoría**                **Cantidad**
  ------------------------- ---------------
  Tablas de Catálogo                     11
  Entidades Principales                   4
  Perfiles Especializados                 5
  Relaciones Intermedias                  6
  Transacciones                           2
  Registros y Logs                        9
  Donaciones                              5
  **TOTAL**                   **42 tablas**

  : Distribución de tablas por categoría

# Conclusiones y Próximos Pasos

## Resumen del Documento

Este documento presenta la especificación técnica completa del Sistema
Integral de Gestión de Voluntariado, incluyendo:

- **16 módulos funcionales** claramente definidos

- **107 requerimientos funcionales** detallados con entradas,
  procesamiento y salidas

- **14 requerimientos no funcionales** críticos para calidad y seguridad

- **13 casos de uso** completos con flujos principales y alternativos

- **42 tablas** en modelo de datos relacional SQL Server

- Arquitectura de 3 capas con microservicios

- Estrategias de seguridad, indexación y optimización

- Cumplimiento normativo (GDPR, PCI-DSS, Ley 29733)

## Métricas del Proyecto

  **Métrica**                       **Valor**
  ------------------------------- -----------
  Módulos Funcionales                      16
  Requerimientos Funcionales              107
  Requerimientos No Funcionales            14
  Casos de Uso Detallados                  13
  Tablas en Base de Datos                  42
  Índices Recomendados                    35+
  Endpoints API Estimados                 80+

  : Métricas del proyecto

## Próximos Pasos

### Fase 1: Diseño Detallado (1 mes)

- Diagramas UML completos (clases, secuencia, actividades)

- Mockups de interfaz de usuario (Figma/Adobe XD)

- Definición de API contracts (OpenAPI 3.0)

- Diagrama ERD completo con herramienta visual

### Fase 2: Desarrollo MVP (3 meses)

**Sprint 1:** M01 (Voluntarios) + M10 (Usuarios y Seguridad)\
**Sprint 2:** M03 (Beneficiarios) + M04 (Proyectos)\
**Sprint 3:** M05 (Asistencias manual) + M08 (Cursos básicos)\
**Sprint 4:** M13 (App QR) + M11 (Reportes básicos)

### Fase 3: Funcionalidades Avanzadas (2 meses)

- M02: Validación automática con OCR/ML

- M14: Donaciones y apadrinamiento completo

- M06-M07: Inventario y finanzas

- M09: Notificaciones multicanal

### Fase 4: Testing y QA (1 mes)

- Pruebas unitarias (cobertura \> 80%)

- Pruebas de integración

- Pruebas de seguridad (pentesting)

- Pruebas de carga (5000 usuarios concurrentes)

- UAT con usuarios reales

### Fase 5: Despliegue (2 semanas)

- Setup de infraestructura en cloud (Azure/AWS)

- Configuración de CI/CD

- Migración de datos si aplica

- Capacitación a usuarios

- Go-live y soporte post-lanzamiento

## Estimación de Recursos

  **Rol**                           **Tiempo Dedicado**
  ------------------------------- ------------------------
  Arquitecto de Software           20% (todo el proyecto)
  Tech Lead Backend                    100% (6 meses)
  Desarrollador Backend Senior         100% (6 meses)
  Desarrollador Frontend Senior        100% (5 meses)
  Desarrollador Mobile                 100% (3 meses)
  DBA                                  50% (3 meses)
  QA/Tester                            100% (2 meses)
  DevOps Engineer                  30% (todo el proyecto)
  UX/UI Designer                        100% (1 mes)

  : Recursos estimados

## Contacto y Soporte

Para consultas sobre este documento o el proyecto:

- **Email:** arquitectura@organizacion.org

- **Equipo:** Área de Tecnología e Innovación

- **Documento:** SIGV-ERS-2025-v1.0

- **Última Actualización:** 22 de noviembre de 2025

::: center

------------------------------------------------------------------------

\
*Fin del Documento*\
*Sistema Integral de Gestión de Voluntariado*\
*Especificación de Requisitos Software IEEE 830-1998*
:::
