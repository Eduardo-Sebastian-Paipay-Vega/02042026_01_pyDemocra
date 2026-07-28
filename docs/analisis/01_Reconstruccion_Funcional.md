# Reconstrucción Funcional del Sistema Democra

Este documento describe todas las capacidades y funcionalidades del sistema, redactadas en un lenguaje claro y sencillo para que cualquier persona, sin importar su nivel de conocimientos técnicos, pueda comprender exactamente qué hace la plataforma y qué problemas resuelve.

## Módulo de Registro y Configuración Inicial (Onboarding)

### Registro Automático de Organizaciones
El sistema permite que nuevas organizaciones se registren de forma autónoma. Para garantizar la seguridad y legalidad, el usuario solo necesita ingresar el RUC de su organización. La plataforma se conecta de inmediato con la SUNAT para verificar que la organización realmente exista, se encuentre activa y su condición sea "habida". Si todo está en orden, el sistema crea automáticamente el espacio de trabajo privado para esta organización, asignando al creador como el administrador principal y generando la sede matriz. Esto evita la creación de organizaciones falsas y automatiza toda la configuración inicial sin intervención manual.

## Módulo de Seguridad y Accesos

### Acceso Inteligente y Prevención de Fraudes
El sistema protege el acceso a la información mediante un análisis de riesgo en tiempo real. Cada vez que un usuario intenta ingresar, la plataforma evalúa desde dónde se conecta, qué dispositivo está usando y si hay un comportamiento inusual (como intentos fallidos rápidos). Si todo es normal, permite el acceso. Si detecta algo sospechoso, envía automáticamente un código de seguridad de 6 dígitos al correo del usuario para confirmar su identidad. Si el riesgo es muy alto, bloquea el acceso temporalmente.

### Ingreso Rápido en Terminales Físicas
Para situaciones donde el personal opera en campo o en módulos físicos compartidos, el sistema permite configurar "terminales". En estas terminales, el personal puede ingresar rápidamente usando un código PIN numérico en lugar de escribir su correo y contraseña completa, lo cual agiliza la operación manteniendo un alto nivel de seguridad.

## Módulo de Gestión de Personal y Permisos (IAM)

### Control Total de Roles y Permisos
El sistema permite a la organización decidir exactamente qué puede ver y hacer cada empleado. Los administradores pueden crear diferentes "roles" (como Coordinador, Tesorero, Supervisor) y asignarles permisos muy específicos. Además, pueden indicar en qué sedes físicas aplica este rol, asegurando que, por ejemplo, un coordinador de la sede Lima no pueda alterar los datos de la sede Arequipa.

### Supervisión de Accesos y Dispositivos
Los administradores pueden ver en todo momento quién está conectado a la plataforma y desde qué dispositivos. Si notan un acceso sospechoso o si un empleado reporta el robo de su computadora, el administrador puede cerrar esa sesión a distancia y desconectar el dispositivo con un solo clic.

## Módulo de Sedes

### Administración de Sedes Físicas
La plataforma permite registrar y administrar todas las sedes o locales con los que cuenta la organización. Los administradores pueden crear nuevas sedes, cambiarles el nombre o desactivarlas si ya no están en uso. Al desactivar una sede, no se borra la información histórica de lo que ocurrió allí, manteniendo el orden y la total transparencia de los datos históricos.

## Módulo de Personas (Voluntarios y Beneficiarios)

### Directorio Completo de Voluntarios
El sistema ofrece un directorio centralizado para administrar a todos los voluntarios. Permite registrar sus datos personales, información de contacto, documentos de identidad, y las habilidades o talentos que poseen. También permite subir y almacenar documentos importantes de cada voluntario de forma estructurada.

### Registro Detallado de Beneficiarios
La organización puede registrar a las personas a las que ayuda (beneficiarios) utilizando perfiles adaptados. Por ejemplo, si el beneficiario es un niño, el sistema pedirá automáticamente los datos del padre o tutor y la escuela; si es un adulto mayor, pedirá contactos de emergencia y condiciones de salud relevantes.

### Protección de Datos Médicos Sensibles
Cierta información es estrictamente confidencial, como los datos médicos. El sistema oculta estos datos por defecto. Si un usuario autorizado necesita verlos o modificarlos, la plataforma le exigirá escribir el motivo explícito por el cual necesita acceder. El sistema guardará un registro inalterable de quién vio los datos, cuándo y por qué, garantizando la privacidad absoluta de las personas.

### Carnets Digitales de Identificación
La plataforma permite diseñar carnets de identificación digitales personalizados. Los administradores pueden elegir qué campos mostrar, agregar el diseño corporativo de la organización y generar carnets para los voluntarios. Cada carnet incluye un código QR único y seguro que permite validar al instante si el voluntario está activo o si su carnet ha expirado o sido revocado.

## Módulo de Admisión de Voluntarios

### Gestión del Proceso de Selección
El sistema facilita el reclutamiento de nuevos voluntarios a través de un proceso ordenado en etapas. Permite recibir nuevas solicitudes, programar y registrar entrevistas con sus respectivas calificaciones, y finalmente aprobar o rechazar a los candidatos. El sistema muestra estadísticas en tiempo real de cuántos candidatos hay en cada etapa del proceso.

### Invitaciones por Código de Acceso
Para eventos masivos o campañas de inscripción, el coordinador puede crear un "enlace de invitación" con un código especial y un límite máximo de usos. Al compartir este enlace, los interesados pueden registrarse ellos mismos desde sus teléfonos, llenando sus datos básicos. Esto ahorra muchísimo tiempo de digitación al equipo administrativo.

## Módulo de Proyectos y Tareas

### Planificación de Proyectos y Actividades
El sistema permite estructurar el trabajo creando proyectos con fechas de inicio y fin, presupuesto asignado y un área temática. Dentro de cada proyecto, se pueden crear "tareas" específicas, y dentro de cada tarea, "actividades" que cuentan con un horario definido y ubicación física. El sistema permite asignar a los voluntarios exactos que participarán en cada actividad, organizando perfectamente quién debe estar en qué lugar y a qué hora.

## Módulo de Operación de Campo

### Registro de Asistencia y Evidencias
Durante o después de una actividad, los coordinadores o los mismos voluntarios pueden usar el sistema para marcar quiénes asistieron y cuántas horas exactas de trabajo aportaron al proyecto. Además, permite subir fotografías o documentos como "evidencia" de que la actividad se llevó a cabo exitosamente, facilitando la justificación de resultados.

## Módulo de Recursos e Inventario

### Control de Almacenes y Existencias
El sistema permite registrar todos los artículos o materiales tangibles que posee la organización (como herramientas, alimentos, uniformes). Permite crear almacenes o ubicaciones y registrar detalladamente cada vez que ingresa material, sale material para un proyecto o se transfiere de un almacén a otro. El sistema calcula automáticamente cuánto stock queda en tiempo real y mantiene un historial cronológico (kardex) para saber exactamente el movimiento de cada artículo.

## Módulo de Finanzas

### Gestión de Cuentas y Transacciones
La organización puede registrar sus cuentas bancarias o cajas chicas y tener control total del dinero. El sistema permite registrar todos los ingresos y gastos (egresos) monetarios, categorizarlos y adjuntar comprobantes o facturas digitales a cada transacción.

### Proceso de Aprobación de Gastos
Para evitar errores y asegurar el control del presupuesto, los gastos importantes no se descuentan inmediatamente. El sistema cuenta con un flujo de aprobación interno donde un responsable o gerente financiero debe revisar el gasto y aprobarlo, rechazarlo o pedir correcciones. El sistema también genera reportes financieros automáticos para saber en qué categorías o proyectos se invierte el capital.

## Módulo de Notificaciones

### Plantillas y Mensajes Multicanal
La plataforma permite crear "plantillas" de mensajes que se enviarán automáticamente a los usuarios (por ejemplo, correos electrónicos de bienvenida o alertas de seguridad). Los administradores pueden personalizar el texto y el sistema guardará un historial completo de cada mensaje enviado, indicando si llegó correctamente y si fue leído por el destinatario final.

## Módulo de Gobernanza y Auditoría

### Registro Forense de Actividades
El sistema funciona como una caja negra de avión: registra silenciosamente absolutamente todas las acciones que realizan los usuarios (qué modificaron, quién lo hizo, desde qué dirección IP y a qué hora). Un auditor o gerente puede buscar en este registro histórico para investigar cualquier incidente o cambio no autorizado en la información. Además, la plataforma incorpora Inteligencia Artificial capaz de leer los registros técnicos y resumirlos en explicaciones fáciles de entender para los auditores.

### Restricciones de Seguridad Avanzadas
Para una seguridad de nivel corporativo, los administradores pueden imponer restricciones severas a ciertos roles críticos. Por ejemplo, pueden configurar que el rol de "Tesorero" solo pueda ingresar al sistema si está usando la red de internet de la oficina principal, o restringir su acceso para que solo pueda entrar de lunes a viernes en horario laboral. Esto mitiga enormemente los riesgos de accesos malintencionados.
