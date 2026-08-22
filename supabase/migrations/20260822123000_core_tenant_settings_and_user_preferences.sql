-- ====================================================================================
-- MIGRATE: Universal Tenant Settings and User Preferences (RF-027, RF-028)
-- ====================================================================================

-- 1. Create public.tenant_settings table
CREATE TABLE IF NOT EXISTS public.tenant_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    language VARCHAR(10) DEFAULT 'es',
    timezone VARCHAR(50) DEFAULT 'America/Lima',
    date_format VARCHAR(20) DEFAULT 'DD/MM/AAAA',
    initial_view VARCHAR(50) DEFAULT 'dashboard',
    colors JSONB DEFAULT '{}'::jsonb,
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(tenant_id)
);

-- RLS para tenant_settings
ALTER TABLE public.tenant_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_settings_isolation_policy" ON public.tenant_settings
    FOR ALL
    USING (tenant_id = fn_current_tenant_id())
    WITH CHECK (tenant_id = fn_current_tenant_id());

-- 2. Añadir campo `preferences` a `public.profiles` si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema='public' AND table_name='profiles' AND column_name='preferences') THEN
        ALTER TABLE public.profiles ADD COLUMN preferences JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- 3. Crear Bucket Storage para assets (avatars y logos) si no existe (Requiere rol de supabase_admin, pero lo intentamos)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('public_assets', 'public_assets', true)
ON CONFLICT (id) DO NOTHING;

-- RLS para storage (Acceso público de lectura, inserción autenticada)
CREATE POLICY "Public Access for assets" ON storage.objects
    FOR SELECT USING (bucket_id = 'public_assets');

CREATE POLICY "Authenticated Uploads" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'public_assets' AND auth.role() = 'authenticated'
    );
