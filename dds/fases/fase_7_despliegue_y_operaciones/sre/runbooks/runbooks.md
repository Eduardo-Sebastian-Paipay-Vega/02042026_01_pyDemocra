# Site Reliability Engineering (SRE): Runbooks de Emergencia

*Fuente de verdad: Prácticas de operaciones inferidas del stack Vercel/Supabase/Resend*

Los siguientes *Playbooks* están diseñados para el equipo de infraestructura (Tier 2/3) con el objetivo de mitigar incidentes críticos en producción (Democra Platform).

## Runbook SRE-01: Caída de Entrega de Correos OTP (Bloqueo de Login)
**Síntoma:** Múltiples usuarios de múltiples ONGs reportan que no pueden iniciar sesión porque el correo con el código de 6 dígitos no llega, resultando en el error en consola de `Failed to send MFA challenge`.
**Severidad:** SEV-1 (Bloqueo total de sistema).
**Pasos de Mitigación:**
1.  **Verificación de Dependencia:** Ingresar al dashboard de Resend (`resend.com`) y verificar si el dominio `democra.pro` está marcado como suspendido o si se alcanzó la cuota mensual.
2.  **Mitigación de Emergencia (Degradación Graciosa):** Si Resend está caído globalmente, modificar la variable de entorno `MFA_REQUIRED_SCORE_THRESHOLD` en Vercel a un nivel imposiblemente alto (e.g. `999`) y hacer un redespliegue (Redeploy). *Advertencia: Esto desactiva el MFA dinámico temporalmente, permitiendo que las credenciales base sean suficientes.*
3.  **Auditoría Post-Mortem:** Restablecer el umbral de riesgo normal una vez que Resend recupere operatividad.

## Runbook SRE-02: Lentitud Crítica en la Base de Datos (Timeout Supabase)
**Síntoma:** El frontend de las ONGs reporta pantallas de carga infinitas y las llamadas al cliente `@supabase/supabase-js` regresan `timeout`.
**Severidad:** SEV-1.
**Pasos de Mitigación:**
1.  **Análisis de Recursos:** Acceder al dashboard de Supabase (Database -> Reports). Verificar el consumo de Memoria (RAM) y CPU de la instancia de PostgreSQL.
2.  **Detección de Cuellos de Botella:** Consultar `pg_stat_statements` para identificar *Slow Queries*. Frecuentemente, búsquedas de texto sobre la tabla `voluntarios` sin índices trigram (pg_trgm) o bloqueos en la tabla `audit_log` causan esto.
3.  **Acción:** Si es un problema de escalamiento, ejecutar un "Restart" de la instancia desde la consola de Supabase (causará 1 minuto de downtime pero limpiará conexiones colgadas). Si el consumo de CPU regresa al 100%, evaluar *Compute Upgrade* (escalar instancia).

## Runbook SRE-03: Regeneración del Caché de Vite por Despliegue Corrupto
**Síntoma:** Los usuarios ven una pantalla blanca o errores de `chunk not found` en consola tras un despliegue.
**Severidad:** SEV-2.
**Pasos de Mitigación:**
1.  Esto ocurre porque el navegador tiene en caché un `index.html` que apunta a un `vendor-[hash].js` que Vercel ya borró en un nuevo despliegue.
2.  **Acción Frontend:** Instruir a soporte técnico para que indique a los usuarios realizar un "Hard Refresh" (`Ctrl + F5` / `Cmd + Shift + R`).
3.  **Acción Backend:** Para prevenirlo a futuro, no purgar los artefactos estáticos viejos en Vercel de forma inmediata.
