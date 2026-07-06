-- =============================================================================
-- seed_ong_gym_link_demo.sql
-- Democra — Simulación de datos: vínculo entre los esquemas `ong` y `gym`
-- =============================================================================
-- Propósito: script de referencia, NO EJECUTADO por el asistente. Inserta datos
-- de prueba mínimos para demostrar que un mismo tenant puede operar módulos
-- ONG y Gym sobre el mismo core compartido (public.tenants/profiles), y que
-- una misma persona (por número de documento) es identificable en ambos
-- esquemas verticales. Debe ejecutarse manualmente en un entorno de prueba
-- (NO en el proyecto Supabase de producción vinculado a este repo).
--
-- PRERREQUISITOS (aplicar en este orden, en un entorno de prueba):
--   1. docs/consolidacion/00000000000000_core_baseline.sql (schemas, tenants,
--      profiles, roles, sedes, catálogos base).
--   2. Las tablas de `ong.beneficiarios` (ver DATABASE_MASTER_SCRIPT_S1.md §827)
--      y de `gym.gimnasios`/`gym.usuarios` (creadas más abajo en la SECCIÓN 0,
--      extraídas literalmente de s2/DATABASE_MASTER_SCRIPT_S2.md §3.1-3.2,
--      porque el repositorio de GYMsos —y por tanto su DDL real— vive fuera
--      de este repo).
--
-- NOTA SOBRE auth.users: en un proyecto Supabase real, los usuarios se crean
-- vía Auth (signup o Admin API), no con INSERT directo. Este script inserta
-- directamente en auth.users SOLO porque está pensado para un Postgres de
-- prueba aislado (o un proyecto Supabase de staging vacío) — NUNCA contra un
-- proyecto con Auth/GoTrue reales en uso, donde eso rompería la integridad de
-- Auth. Está marcado [SOLO-TEST] en cada punto relevante.
--
-- QUÉ DEMUESTRA:
--   (a) Un tenant con módulos 'ong' y 'gym' activos simultáneamente
--       (public.tenant_modules).
--   (b) ong.beneficiarios y gym.usuarios comparten tenant_id (vía
--       gym.gimnasios.tenant_id) — el core los reconoce como el mismo cliente.
--   (c) La misma persona real (mismo numero_documento/documento) es
--       localizable cruzando ambos esquemas con una sola consulta JOIN.
-- =============================================================================

begin;

-- =============================================================================
-- 0. Slice mínimo del esquema `gym` (referencia — DDL real vive en GYMsos)
-- =============================================================================
-- [AUDIT-OK] Extraído literal de s2/DATABASE_MASTER_SCRIPT_S2.md §3.1-3.2,
-- reducido a las columnas necesarias para esta demo (se omiten columnas no
-- usadas aquí como logo_url/codigo_acceso/foto_url/cargo, sin afectar el
-- vínculo con el core que es lo que se quiere probar).
create table if not exists gym.gimnasios (
  id_gimnasio uuid primary key default gen_random_uuid(),
  nombre      varchar(150) not null,
  tenant_id   uuid references public.tenants(id) on delete set null
);

create table if not exists gym.usuarios (
  id_usuario  uuid primary key references auth.users(id) on delete cascade,
  email       varchar(255) unique not null,
  nombre      varchar(100) not null,
  documento   varchar(20) unique,
  id_gimnasio uuid not null references gym.gimnasios(id_gimnasio),
  rol         varchar(20) not null default 'miembro'
                check (rol in ('miembro','cliente','entrenador','recepcionista','gerente','nutricionista','admin')),
  estado      varchar(20) not null default 'activo'
                check (estado in ('activo','inactivo','suspendido')),
  created_at  timestamptz not null default now()
);

-- =============================================================================
-- 0b. Seed mínimo de public.system_modules (FK requerida por tenant_modules)
-- =============================================================================
-- [AUDIT-DOUBT] Igual que los catálogos del baseline: valores no confirmados
-- contra un seed versionado único, se agregan aquí solo para que el INSERT en
-- tenant_modules (sección 1) no falle por FK en un entorno de prueba vacío.
insert into public.system_modules (codigo, nombre, schema_name, current_version, is_core, is_transversal)
values
  ('ong', 'Modulo ONG', 'ong', '1.0.0', false, false),
  ('gym', 'Modulo Gimnasio', 'gym', '1.0.0', false, false)
on conflict (codigo) do nothing;

-- =============================================================================
-- 1. Tenant de prueba con ambos módulos activos
-- =============================================================================
-- Ajustar 'ong'/'gym' aquí solo si esos códigos de cat_industry_types no
-- existen todavía en el entorno de prueba (ver seeds del baseline, §12).
insert into public.tenants (id, name, tax_id, industry_type_id, plan_id, status_financial_id)
values (
  '00000000-0000-4000-8000-000000000d01',
  'Fundación Demo Ong+Gym',
  '20999999999',
  'ong',
  'basic',
  'FIN-ACTIVE'
)
on conflict (id) do nothing;

insert into public.tenant_modules (tenant_id, module_code, activated_at)
values
  ('00000000-0000-4000-8000-000000000d01', 'ong', now()),
  ('00000000-0000-4000-8000-000000000d01', 'gym', now())
on conflict (tenant_id, module_code) do nothing;

-- =============================================================================
-- 2. [SOLO-TEST] Usuario de Auth de prueba + profile
-- =============================================================================
-- En un proyecto Supabase real, reemplazar este INSERT por la creación del
-- usuario vía supabase.auth.admin.createUser({ email, password }) y usar el
-- UUID devuelto en vez del literal de abajo.
insert into auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values (
  '00000000-0000-4000-8000-000000000d02',
  'demo.persona@ejemplo.test',
  crypt('demo-password-not-for-prod', gen_salt('bf')),
  now(),
  now(),
  now()
)
on conflict (id) do nothing;

insert into public.profiles (id, tenant_id, full_name, tipo_documento, numero_documento)
values (
  '00000000-0000-4000-8000-000000000d02',
  '00000000-0000-4000-8000-000000000d01',
  'Persona Demo Ong-Gym',
  'DNI',
  '87654321'
)
on conflict (id) do update
  set tenant_id = excluded.tenant_id;

-- =============================================================================
-- 3. Registro operativo en `ong` — beneficiario
-- =============================================================================
insert into ong.beneficiarios (
  tenant_id, numero_documento, tipo_documento, codigo_pais, nombre, apellido
)
values (
  '00000000-0000-4000-8000-000000000d01',
  '87654321',
  'DNI',
  'PE',
  'Persona',
  'Demo Ong-Gym'
)
on conflict (tenant_id, tipo_documento, numero_documento) do nothing;

-- =============================================================================
-- 4. Registro operativo en `gym` — gimnasio + usuario
-- =============================================================================
insert into gym.gimnasios (id_gimnasio, nombre, tenant_id)
values (
  '00000000-0000-4000-8000-000000000d03',
  'Sede Demo del Gimnasio',
  '00000000-0000-4000-8000-000000000d01'
)
on conflict (id_gimnasio) do nothing;

insert into gym.usuarios (id_usuario, email, nombre, documento, id_gimnasio, rol)
values (
  '00000000-0000-4000-8000-000000000d02',
  'demo.persona@ejemplo.test',
  'Persona Demo Ong-Gym',
  '87654321',
  '00000000-0000-4000-8000-000000000d03',
  'miembro'
)
on conflict (id_usuario) do nothing;

commit;

-- =============================================================================
-- 5. VERIFICACIÓN — confirmar que ong y gym "se comunican" vía el core
-- =============================================================================

-- 5a. El tenant tiene ambos módulos activos.
select tenant_id, module_code, activated_at
from public.tenant_modules
where tenant_id = '00000000-0000-4000-8000-000000000d01'
order by module_code;
-- Esperado: 2 filas ('gym', 'ong').

-- 5b. La misma persona (mismo numero_documento) existe en ambos esquemas,
--     y ambos registros comparten tenant_id a través de gym.gimnasios.
select
  b.tenant_id                as ong_tenant_id,
  b.numero_documento         as documento,
  b.nombre || ' ' || b.apellido as nombre_en_ong,
  u.nombre                   as nombre_en_gym,
  u.rol                      as rol_en_gym,
  g.tenant_id                as gym_tenant_id,
  (b.tenant_id = g.tenant_id) as mismo_tenant
from ong.beneficiarios b
join gym.usuarios u   on u.documento = b.numero_documento
join gym.gimnasios g  on g.id_gimnasio = u.id_gimnasio
where b.tenant_id = '00000000-0000-4000-8000-000000000d01';
-- Esperado: 1 fila, con mismo_tenant = true — confirma que el beneficiario de
-- la ONG y el usuario del gimnasio son la misma persona, en el mismo tenant.

-- =============================================================================
-- 6. LIMPIEZA (opcional, ejecutar aparte tras verificar)
-- =============================================================================
-- delete from gym.usuarios where id_usuario = '00000000-0000-4000-8000-000000000d02';
-- delete from gym.gimnasios where id_gimnasio = '00000000-0000-4000-8000-000000000d03';
-- delete from ong.beneficiarios where tenant_id = '00000000-0000-4000-8000-000000000d01';
-- delete from public.profiles where id = '00000000-0000-4000-8000-000000000d02';
-- delete from auth.users where id = '00000000-0000-4000-8000-000000000d02';
-- delete from public.tenant_modules where tenant_id = '00000000-0000-4000-8000-000000000d01';
-- delete from public.tenants where id = '00000000-0000-4000-8000-000000000d01';
