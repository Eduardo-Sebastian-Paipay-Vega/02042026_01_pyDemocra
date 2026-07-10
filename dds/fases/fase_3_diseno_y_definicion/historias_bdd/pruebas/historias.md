# Historias de Usuario (BDD - Behavior Driven Development)

*Fuente de verdad: Inferido a partir de Casos de Uso y Schema de BD*

Aunque no se han detectado archivos `.feature` de Cucumber (Gherkin) explícitos en el repositorio, la estructura de la base de datos dicta historias de usuario innegables.

## Épica: Gestión de Identidad y Riesgo

**Historia:** Limitación de fuerza bruta en inicio de sesión.
*   **Dado** que un atacante intenta adivinar un OTP múltiples veces en el portal de terminales,
*   **Cuando** supera los 5 intentos en una ventana de 15 minutos,
*   **Entonces** el sistema (Backend Express `rate-limit`) responde con un error `SEC-429-AUTH` y bloquea la IP.

## Épica: Onboarding y ACE (Access & Context Engine)

**Historia:** Consumo de enlace de invitación.
*   **Dado** que un usuario recibe un enlace de invitación único (Access Link),
*   **Cuando** hace clic y completa su registro,
*   **Entonces** la función `fn_complete_access_onboarding` actualiza su `tenant_id` y le asigna la membresía correcta, invalidando el enlace si este alcanzó su límite de usos.

## Épica: Operativa ONG (Asistencia)

**Historia:** Registro de Asistencia por Escaneo QR.
*   **Dado** un voluntario con una credencial válida (`id_cards`),
*   **Cuando** el coordinador escanea el código en el punto de evento de un Proyecto Activo,
*   **Entonces** la función `fn_register_attendance_scan` inyecta un registro en `asistencias` validando que pertenezca a la actividad y tenant correctos.
