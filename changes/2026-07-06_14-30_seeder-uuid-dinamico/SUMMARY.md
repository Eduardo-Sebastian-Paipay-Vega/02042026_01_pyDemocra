# SUMMARY — Seeder ong-gym: UUID dinámico en vez de INSERT directo en auth.users

## Qué se hizo

Se eliminó el `INSERT INTO auth.users` del seeder de demostración ong↔gym y se reemplazó por una variable `v_existing_user_id` que el usuario reemplaza con el UUID de un usuario real ya existente, con validación explícita si ese usuario no existe.

## Por qué se hizo

Insertar directamente en `auth.users` rompe la integridad de Auth/GoTrue en cualquier proyecto Supabase real con Auth en uso — el usuario pidió esta adaptación tras la advertencia dada en un intercambio anterior de esta misma sesión.

## Qué beneficio aporta

El seeder ahora puede probarse contra un proyecto Supabase real (no solo un Postgres aislado), usando un usuario de prueba genuino, sin riesgo para Auth.

## Qué funcionalidades quedaron afectadas

Ninguna. Es un script de referencia no ejecutado; no afecta código de la aplicación.
