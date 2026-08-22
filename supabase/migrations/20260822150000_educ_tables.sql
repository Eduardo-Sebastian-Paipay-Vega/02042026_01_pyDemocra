-- Fase 2: Implementación de Tablas Académicas y RLS

-- 1. Tabla profesores
CREATE TABLE IF NOT EXISTS public.profesores (
    profesor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    especialidad VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Tabla estudiantes
CREATE TABLE IF NOT EXISTS public.estudiantes (
    estudiante_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    matricula_codigo VARCHAR(100) NOT NULL,
    grado_actual VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Tabla cursos
CREATE TABLE IF NOT EXISTS public.cursos (
    curso_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    creditos INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_profesores_tenant_id ON public.profesores(tenant_id);
CREATE INDEX IF NOT EXISTS idx_estudiantes_tenant_id ON public.estudiantes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cursos_tenant_id ON public.cursos(tenant_id);

-- RLS Enable
ALTER TABLE public.profesores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estudiantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cursos ENABLE ROW LEVEL SECURITY;

-- Base Policies for profesores
CREATE POLICY "Tenant isolation for profesores select" ON public.profesores
    FOR SELECT USING (tenant_id = public.fn_current_tenant_id());
    
CREATE POLICY "Tenant isolation for profesores insert" ON public.profesores
    FOR INSERT WITH CHECK (tenant_id = public.fn_current_tenant_id());

CREATE POLICY "Tenant isolation for profesores update" ON public.profesores
    FOR UPDATE USING (tenant_id = public.fn_current_tenant_id())
    WITH CHECK (tenant_id = public.fn_current_tenant_id());

CREATE POLICY "Tenant isolation for profesores delete" ON public.profesores
    FOR DELETE USING (tenant_id = public.fn_current_tenant_id());

-- Base Policies for estudiantes
CREATE POLICY "Tenant isolation for estudiantes select" ON public.estudiantes
    FOR SELECT USING (tenant_id = public.fn_current_tenant_id());
    
CREATE POLICY "Tenant isolation for estudiantes insert" ON public.estudiantes
    FOR INSERT WITH CHECK (tenant_id = public.fn_current_tenant_id());

CREATE POLICY "Tenant isolation for estudiantes update" ON public.estudiantes
    FOR UPDATE USING (tenant_id = public.fn_current_tenant_id())
    WITH CHECK (tenant_id = public.fn_current_tenant_id());

CREATE POLICY "Tenant isolation for estudiantes delete" ON public.estudiantes
    FOR DELETE USING (tenant_id = public.fn_current_tenant_id());

-- Base Policies for cursos
CREATE POLICY "Tenant isolation for cursos select" ON public.cursos
    FOR SELECT USING (tenant_id = public.fn_current_tenant_id());
    
CREATE POLICY "Tenant isolation for cursos insert" ON public.cursos
    FOR INSERT WITH CHECK (tenant_id = public.fn_current_tenant_id());

CREATE POLICY "Tenant isolation for cursos update" ON public.cursos
    FOR UPDATE USING (tenant_id = public.fn_current_tenant_id())
    WITH CHECK (tenant_id = public.fn_current_tenant_id());

CREATE POLICY "Tenant isolation for cursos delete" ON public.cursos
    FOR DELETE USING (tenant_id = public.fn_current_tenant_id());
