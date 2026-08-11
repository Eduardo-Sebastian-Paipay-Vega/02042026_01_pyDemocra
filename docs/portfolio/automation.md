# ⚙️ Automatizaciones — Democra

El proyecto delega responsabilidades a la capa de base de datos y a scripts de desarrollo para reducir la complejidad en la lógica de negocio y en el entorno de operaciones, previniendo errores humanos.

## Automatizaciones de Base de Datos (Triggers)

PostgreSQL (Supabase) asume la responsabilidad de la auditoría y de los metadatos temporales de todos los registros del sistema.

### 1. `fn_set_updated_at()`
Un trigger que actualiza automáticamente la columna `updated_at` a `NOW()` cada vez que un registro sufre un `UPDATE`. 
Esto asegura que la capa de la aplicación (el backend Express) no necesite incluir timestamps manuales en las consultas de actualización, evitando que un desarrollador olvide actualizar la fecha de modificación.

### 2. `fn_trigger_audit_universal()`
Un trigger adherido a las tablas críticas del negocio (roles, sedes, perfiles). Cada vez que ocurre un `INSERT`, `UPDATE` o `DELETE`, la función intercepta el evento e inserta automáticamente un registro en la tabla `audit_log`.

Este log contiene:
- Acción realizada.
- Usuario responsable (`auth.uid()`).
- Estado anterior de la fila (`old_data`).
- Estado nuevo de la fila (`new_data`).

Este enfoque es resistente a omisiones en el backend. Incluso si una consulta se ejecuta directamente desde la consola de Supabase, la auditoría se generará.

## Automatizaciones en el Middleware

### Financial State Guard
En lugar de requerir que cada controlador de Express verifique si el cliente (la ONG) está al día en sus pagos, el middleware `requireFinancialWriteAccess()` se inyecta globalmente. Intercepta todas las llamadas HTTP mutativas (`POST`, `PUT`, `DELETE`). Si el plan de la ONG está suspendido, bloquea la petición antes de que llegue a los controladores.

## Scripts de Desarrollo y Mantenimiento

Ubicados en el directorio `/scripts`, se encargan de orquestar el entorno de desarrollo local.

### `scripts/clean-ports.mjs`
En una arquitectura donde coexisten múltiples servicios (Vite en puerto 5173, Express en puerto 8787), los "puertos fantasma" (procesos colgados de sesiones de desarrollo anteriores) son comunes. Este script inspecciona el sistema operativo, identifica los PIDs que ocupan los puertos y los termina limpiamente antes de arrancar `npm run dev`.

### `scripts/validate-env.mjs`
Al levantar el proyecto, verifica la presencia de variables obligatorias en el archivo `.env` y lanza advertencias explícitas en la terminal si faltan claves críticas (como `SUPABASE_SERVICE_ROLE_KEY`), reduciendo horas de debugging por malas configuraciones.
