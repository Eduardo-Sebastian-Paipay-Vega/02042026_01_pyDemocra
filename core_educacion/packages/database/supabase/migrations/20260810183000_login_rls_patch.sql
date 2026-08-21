-- Parche de Seguridad RLS: Permiso para lectura del propio perfil
-- Esto resuelve el problema del "Huevo y la Gallina" al hacer Login.

-- Borramos la política anterior si existe (por seguridad)
DROP POLICY IF EXISTS "usuarios_read_owner" ON core.usuarios;

-- Creamos la política que dice:
-- "Un usuario puede hacer SELECT a core.usuarios siempre y cuando su auth.uid() coincida con el usuario_id"
CREATE POLICY "usuarios_read_owner" ON core.usuarios
    FOR SELECT
    USING (
        usuario_id = auth.uid()
    );

-- Nota: Recordar que ya existe una política que dice:
-- USING (tenant_id = current_setting('app.current_tenant', true)::uuid);
-- Las políticas en Supabase (PostgreSQL) son OR por defecto si son del mismo tipo (SELECT, permissives).
-- Por lo que si el usuario no tiene tenant seteado, pasará por esta nueva política "usuarios_read_owner".
