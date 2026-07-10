# Requerimientos del Usuario
> **Fase 1 | Descubrimiento** | Fecha de análisis: 2026-07-09

---

## Catálogo de Requerimientos del Usuario (RU)

El sistema soporta 37 requerimientos de usuario inferidos de la implementación actual.

| ID | Área | Requerimiento (Nombre/Breve) | Actor Principal | Prioridad | RF Asociado |
|----|------|------------------------------|-----------------|-----------|-------------|
| **RU-001** | Registro | Registrar nueva organización validando RUC. | Administrador | Alta | RF-01 |
| **RU-002** | Acceso | Iniciar sesión con validación de seguridad de riesgo. | Todos (Primarios) | Alta | RF-02 |
| **RU-003** | Acceso | Verificar identidad con código temporal (OTP/MFA). | Todos (Primarios) | Alta | RF-03 |
| **RU-004** | Acceso | Usar terminal rápido con código PIN. | Op. de Terminal | Media | RF-04 |
| **RU-005** | Personas | Registrar y editar perfiles completos de voluntarios. | Coordinador | Alta | RF-05 |
| **RU-006** | Personas | Registrar datos de beneficiarios según su tipo (infantil, adulto). | Coordinador | Alta | RF-06 |
| **RU-007** | Personas | Registrar y consultar historial médico (con justificación). | Coordinador/Médico | Alta | RF-07 |
| **RU-008** | Personas | Registrar habilidades, documentos y certificaciones del personal. | Coordinador | Media | RF-08 |
| **RU-009** | Personas | Generar y visualizar carnet digital con código QR. | Voluntario/Coord. | Media | RF-09 |
| **RU-010** | Admisión | Registrar manualmente a un candidato a voluntario. | Coordinador | Alta | RF-10 |
| **RU-011** | Admisión | Crear enlaces de autoregistro masivo con códigos. | Administrador | Media | RF-11 |
| **RU-012** | Admisión | Autoregistrarse como candidato mediante enlace público. | Visitante/Candidato | Alta | RF-12 |
| **RU-013** | Admisión | Gestionar el estado de las solicitudes (FSM de admisión). | Coordinador | Alta | RF-13 |
| **RU-014** | Admisión | Aprobar candidato y convertir su perfil a Voluntario activo. | Coordinador | Alta | RF-14 |
| **RU-015** | Proyectos | Crear y estructurar proyectos con tareas y actividades. | Coordinador | Alta | RF-15 |
| **RU-016** | Proyectos | Asignar voluntarios a proyectos o tareas específicas. | Coordinador | Alta | RF-16 |
| **RU-017** | Proyectos | Consultar las actividades a las que estoy asignado. | Voluntario | Alta | RF-17 |
| **RU-018** | Operación | Registrar asistencia a actividades presenciales. | Voluntario/Coord. | Alta | RF-18 |
| **RU-019** | Operación | Declarar y aprobar horas trabajadas (efectivas). | Voluntario/Coord. | Alta | RF-19 |
| **RU-020** | Operación | Subir fotografías y documentos como evidencia de labor. | Voluntario | Media | RF-20 |
| **RU-021** | Recursos | Administrar catálogo de artículos del inventario. | Coordinador | Alta | RF-21 |
| **RU-022** | Recursos | Registrar movimientos (ingreso, salida, transferencia) de inventario. | Coordinador | Alta | RF-22 |
| **RU-023** | Recursos | Visualizar kardex y saldo en tiempo real de recursos. | Coordinador | Alta | RF-23 |
| **RU-024** | Recursos | Administrar cuentas bancarias y caja chica (Finanzas). | Administrador | Alta | RF-24 |
| **RU-025** | Recursos | Registrar ingresos y egresos (con flujo de aprobación previo). | Coord./Admin | Alta | RF-25 |
| **RU-026** | Notificac. | Crear plantillas de comunicación institucional. | Administrador | Baja | RF-26 |
| **RU-027** | Notificac. | Enviar comunicaciones y consultar el historial de envíos. | Coordinador | Baja | RF-26 |
| **RU-028** | Gobernanza | Revisar el registro de todos los cambios críticos en el sistema. | Auditor/Admin | Alta | RF-27 |
| **RU-029** | Gobernanza | Leer resumen generado por IA sobre anomalías de seguridad. | Administrador | Media | RF-28 |
| **RU-030** | Gobernanza | Restringir el acceso a ciertos módulos u horas de operación. | Administrador | Media | RF-29 |
| **RU-031** | Config. | Crear roles personalizados con permisos a nivel de campo (ACE). | Administrador | Alta | RF-30 |
| **RU-032** | Config. | Asignar roles a usuarios limitados a una sede específica. | Administrador | Alta | RF-31 |
| **RU-033** | Config. | Administrar las sedes físicas o unidades orgánicas del tenant. | Administrador | Alta | RF-32 |
| **RU-034** | Config. | Configurar catálogos globales (tipos de doc, profesiones). | Administrador | Baja | RF-33 |
| **RU-035** | Config. | Ver y cerrar mis sesiones activas o las de mi equipo. | Todos | Media | RF-34 |
| **RU-036** | General | Utilizar el sistema desde mi celular (interfaz responsive). | Todos | Alta | RNF-01 |
| **RU-037** | General | Operar en el sistema sin que otra ONG vea mis datos (aislamiento). | Todos | Crítica | RNF-02 |

---

*Referencia de origen: Documento maestro de requerimientos en [`docs/analisis/03-requerimientos-del-usuario.md`](../../../../../docs/analisis/03-requerimientos-del-usuario.md).*
