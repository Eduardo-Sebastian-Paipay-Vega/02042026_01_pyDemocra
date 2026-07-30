-- Migration: 20260302130000_fn_bootstrap_tenant_v2.sql
-- Blueprint v2.0: Onboarding y Creacion de Cuenta Dueno (Tenant Owner)
-- Fecha: 2026-03-02

CREATE OR REPLACE FUNCTION public.fn_bootstrap_tenant_v2(
    p_user_id UUID DEFAULT auth.uid(),
    p_full_name TEXT DEFAULT NULL,
    p_doc_type TEXT DEFAULT 'DNI',
    p_doc_number TEXT DEFAULT NULL,
    p_phone_number TEXT DEFAULT NULL,
    p_avatar_url TEXT DEFAULT NULL,
    p_verify_token_hash TEXT DEFAULT NULL,
    p_tax_id VARCHAR(11) DEFAULT NULL,
    p_razon_social TEXT DEFAULT NULL,
    p_trade_name TEXT DEFAULT NULL,
    p_industry_type_id TEXT DEFAULT 'ONG',
    p_address TEXT DEFAULT 'Sede Matriz Principal',
    p_plan_id TEXT DEFAULT 'basic',
    p_billing_day INT DEFAULT 1,
    p_fingerprint TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_ip_address INET DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_user_id UUID := COALESCE(p_user_id, auth.uid());
    v_existing_tenant_id UUID;
    v_tenant_id UUID := gen_random_uuid();
    v_sede_id UUID := gen_random_uuid();
    v_role_owner_id UUID := gen_random_uuid();
    v_max_licenses INT := 5;
    v_max_sedes INT := 1;
    v_can_use_terminals BOOLEAN := false;
    v_result JSONB;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuario no autenticado' USING ERRCODE = 'INVALID_AUTHORIZATION_SPECULATION';
    END IF;

    IF p_razon_social IS NULL OR trim(p_razon_social) = '' THEN
        RAISE EXCEPTION 'La razon social (p_razon_social) es requerida' USING ERRCODE = 'INVALID_PARAMETER_VALUE';
    END IF;

    IF p_tax_id IS NULL OR p_tax_id !~ '^[0-9]{11}$' THEN
        RAISE EXCEPTION 'El tax_id (RUC) % debe constar de 11 digitos numericos', p_tax_id USING ERRCODE = 'INVALID_PARAMETER_VALUE';
    END IF;

    -- Idempotencia: si el usuario ya posee un tenant_id asignado, lo retorna sin duplicar
    SELECT p.tenant_id INTO v_existing_tenant_id
    FROM public.profiles p
    WHERE p.id = v_user_id
    LIMIT 1;

    IF v_existing_tenant_id IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', true,
            'tenant_id', v_existing_tenant_id,
            'user_id', v_user_id,
            'message', 'El usuario ya cuenta con una organizacion asignada.'
        );
    END IF;

    -- 1. Validar unicidad de RUC registrado previamente
    IF EXISTS (SELECT 1 FROM public.tenants WHERE tax_id = p_tax_id) THEN
        RAISE EXCEPTION 'El RUC % ya se encuentra registrado en la plataforma.', p_tax_id
            USING ERRCODE = 'UNIQUE_VIOLATION';
    END IF;

    -- 2. Crear Organizacion (Tenant)
    INSERT INTO public.tenants (
        id, name, trade_name, tax_id, industry_type_id, 
        plan_id, status_financial_id, billing_day, max_licenses, created_at
    ) VALUES (
        v_tenant_id, p_razon_social, p_trade_name, p_tax_id, p_industry_type_id,
        p_plan_id, 'FIN-ACTIVE', LEAST(GREATEST(COALESCE(p_billing_day, 1), 1), 28), v_max_licenses, NOW()
    );

    -- 3. Crear o Actualizar Perfil del Usuario Dueno
    INSERT INTO public.profiles (
        id, tenant_id, full_name, doc_type, doc_number, phone_number,
        avatar_url, email_verified, verify_token_hash, updated_at
    ) VALUES (
        v_user_id, v_tenant_id, p_full_name, p_doc_type, p_doc_number, p_phone_number,
        p_avatar_url, true, p_verify_token_hash, NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        tenant_id = v_tenant_id,
        full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
        doc_type = COALESCE(EXCLUDED.doc_type, profiles.doc_type),
        doc_number = COALESCE(EXCLUDED.doc_number, profiles.doc_number),
        phone_number = COALESCE(EXCLUDED.phone_number, profiles.phone_number),
        avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
        email_verified = true,
        updated_at = NOW();

    -- 4. Crear Sede Matriz 'Principal'
    INSERT INTO public.sedes (
        id, tenant_id, name, address, is_active, created_at
    ) VALUES (
        v_sede_id, v_tenant_id, 'Principal', COALESCE(p_address, 'Sede Matriz Principal'), true, NOW()
    );

    -- 5. Crear Rol Administrador 'Owner' (Jerarquia 0)
    INSERT INTO public.roles (
        id, tenant_id, name, hierarchy_level, is_system_role, created_at
    ) VALUES (
        v_role_owner_id, v_tenant_id, 'Owner', 0, true, NOW()
    );

    -- 6. Copiar Permisos de Catalogo a Rol Owner
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT v_role_owner_id, id FROM public.cat_permissions
    ON CONFLICT DO NOTHING;

    -- 7. Asignacion Tripartita (Usuario + Rol Owner + Sede Principal + Tenant)
    INSERT INTO public.user_roles_sedes (
        tenant_id, user_id, role_id, sede_id, created_at
    ) VALUES (
        v_tenant_id, v_user_id, v_role_owner_id, v_sede_id, NOW()
    )
    ON CONFLICT DO NOTHING;

    -- 8. Contrato de Suscripcion Inicial
    INSERT INTO public.subscription_contracts (
        id, tenant_id, current_plan_id, status_id, billing_day, grace_days, created_at
    ) VALUES (
        gen_random_uuid(), v_tenant_id, p_plan_id, 'ACTIVE', COALESCE(p_billing_day, 1), 7, NOW()
    )
    ON CONFLICT (tenant_id) DO UPDATE SET
        current_plan_id = EXCLUDED.current_plan_id,
        updated_at = NOW();

    -- 9. Entitlements y Limite del Plan
    INSERT INTO public.entitlements (
        id, tenant_id, max_sedes, max_licenses, can_use_terminals, created_at
    ) VALUES (
        gen_random_uuid(), v_tenant_id, v_max_sedes, v_max_licenses, v_can_use_terminals, NOW()
    )
    ON CONFLICT (tenant_id) DO UPDATE SET
        max_sedes = EXCLUDED.max_sedes,
        max_licenses = EXCLUDED.max_licenses,
        updated_at = NOW();

    -- 10. Construir respuesta JSON de confirmacion
    v_result := jsonb_build_object(
        'success', true,
        'tenant_id', v_tenant_id,
        'user_id', v_user_id,
        'sede_id', v_sede_id,
        'role_id', v_role_owner_id,
        'message', 'Bootstrapping v2.0 de la organizacion completado exitosamente.'
    );

    RETURN v_result;

EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Error durante el onboarding del tenant: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_bootstrap_tenant_v2 TO authenticated, service_role;
