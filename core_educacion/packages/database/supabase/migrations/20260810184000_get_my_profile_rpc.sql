-- Migración para crear función segura de obtención de perfil
-- Permite al frontend obtener el perfil del usuario sin necesidad de exponer el esquema 'core'

CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- Ejecuta con permisos del creador para saltar el schema exposure
SET search_path = public
AS $$
DECLARE
    profile_data json;
BEGIN
    SELECT json_build_object(
        'rol_id', rol_id,
        'nombres', nombres,
        'apellidos', apellidos,
        'tenant_id', tenant_id
    ) INTO profile_data
    FROM core.usuarios
    WHERE usuario_id = auth.uid();
    
    RETURN profile_data;
END;
$$;
