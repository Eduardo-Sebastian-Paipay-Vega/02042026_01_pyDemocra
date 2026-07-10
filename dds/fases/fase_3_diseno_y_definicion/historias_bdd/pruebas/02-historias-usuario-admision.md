# Historias BDD y Criterios de Aceptación: Admisión
> **Fase 3 | Diseño y Definición** | Fecha de análisis: 2026-07-09

---

## Épica: Admisión Digital de Voluntarios

Como Coordinador de la ONG, quiero gestionar el proceso de selección e incorporación de nuevos candidatos de manera estructurada, para asegurar que los postulantes cumplan con los requisitos antes de otorgarles acceso al sistema interno.

### Feature: Gestión del Proceso de Admisión (FSM)

**Background:** 
Dado que el coordinador tiene el permiso `admission.manage` en su rol activo.

**Scenario:** Creación manual de solicitud de admisión
```gherkin
Given que el coordinador está autenticado en el tenant 'tenant-001'
When el coordinador accede al módulo de admisión
And crea una nueva solicitud con nombres 'Ana', apellidos 'García', email 'ana@example.com'
Then la solicitud de admisión se guarda en la base de datos
And el estado inicial de la solicitud (`stateCode`) es 'NUEVA'
And se registra un log inmutable de la acción en `audit_logs`
And las métricas del dashboard incrementan el contador 'total de solicitudes' en 1
```

**Scenario:** Flujo completo de evaluación y conversión (Final Féliz)
```gherkin
Given una solicitud existente en estado 'NUEVA' con id 'req-001'
When el coordinador revisa el perfil y cambia el estado a 'EN_ENTREVISTA'
Then la solicitud actualiza su estado y registra el cambio en el historial
When el coordinador programa y registra los resultados de la entrevista con resultado 'aprobado' y puntaje 85
And el coordinador cambia el estado de la solicitud a 'APROBADA'
Then la solicitud queda formalmente en estado 'APROBADA'
When el coordinador hace clic en "Comenzar Onboarding"
And verifica y marca todos los pasos obligatorios (Ej. Firma Código Ética) como completados
And hace clic en "Convertir a Voluntario" proporcionando el Documento de Identidad '12345678'
Then el sistema crea automáticamente un nuevo `VolunteerProfile` asociado a ese tenant
And copia los datos del candidato (Nombres, Email) al nuevo perfil
And la solicitud original queda marcada definitivamente como 'CONVERTIDA'
```

### Feature: Autoregistro Público de Candidatos

Como Candidato a Voluntario, quiero poder inscribirme a una convocatoria desde un enlace público, sin necesidad de que el coordinador ingrese mis datos manualmente, para agilizar mi postulación.

**Scenario:** Registro exitoso mediante código con límite de uso
```gherkin
Given que el coordinador ha generado un código de registro 'DEMO2026'
And el código está configurado con 5 usos disponibles (`maxUses = 5`, `currentUses = 0`)
And el código tiene fecha de expiración configurada para dentro de 48 horas
When el candidato 'Luis Torres' accede al enlace público (Landing Page) que contiene el código
And completa el formulario dinámico obligatorio: email 'luis@example.com', password 'Secure123!', DNI '87654321'
And envía el formulario
Then el sistema backend consume el código 'DEMO2026'
And crea una cuenta segura en Supabase Auth
And crea una Solicitud de Admisión en estado 'NUEVA'
And incrementa `currentUses` a 1
And la operación es exitosa
```

**Scenario:** Rechazo por consumo total del código de acceso
```gherkin
Given que el código 'DEMO2026' ha sido usado previamente 5 veces (`currentUses = 5`)
And el cupo máximo es 5 (`maxUses = 5`)
When un nuevo candidato intenta enviar el formulario de autoregistro usando ese código
Then el servidor, mediante la Edge Function, rechaza la solicitud
And devuelve un error 403 Forbidden "El código de acceso ha alcanzado su límite de usos"
And no se crea ninguna cuenta ni solicitud en base de datos
```
