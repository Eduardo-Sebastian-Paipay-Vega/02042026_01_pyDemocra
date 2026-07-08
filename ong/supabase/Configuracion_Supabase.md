-- =========================================================
-- 1. STORAGE — BUCKET id_templates
-- =========================================================

insert into storage.buckets (id, name, public)
values ('id_templates', 'id_templates', true)
on conflict (id) do nothing;

-- Limpieza de políticas previas para evitar errores de duplicado
drop policy if exists "Acceso Público Plantillas" on storage.objects;
drop policy if exists "Subida Autenticados" on storage.objects;
drop policy if exists "Actualización Autenticados" on storage.objects;
drop policy if exists "Eliminación Autenticados" on storage.objects;

create policy "Acceso Público Plantillas"
on storage.objects for select
using (bucket_id = 'id_templates');

create policy "Subida Autenticados"
on storage.objects for insert
with check (
  bucket_id = 'id_templates'
  and auth.role() = 'authenticated'
);

create policy "Actualización Autenticados"
on storage.objects for update
using (
  bucket_id = 'id_templates'
  and auth.uid() = owner
);

create policy "Eliminación Autenticados"
on storage.objects for delete
using (
  bucket_id = 'id_templates'
  and auth.uid() = owner
);


-- =========================================================
-- 2. BASE DE DATOS — TABLA ong.id_card_templates
-- =========================================================

-- Aseguramos que el esquema exista (por si acaso)
-- select column_name, data_type from information_schema.columns where table_schema = 'ong' and table_name = 'id_card_templates';

alter table ong.id_card_templates
add column if not exists template_config jsonb;

-- ACTIVAR RLS (Crucial para que las políticas funcionen)
alter table ong.id_card_templates enable row level security;


-- =========================================================
-- 3. RLS — POLÍTICAS PARA ong.id_card_templates
-- =========================================================

drop policy if exists "Templates — leer propio tenant" on ong.id_card_templates;
drop policy if exists "Templates — crear/editar con permiso" on ong.id_card_templates;

create policy "Templates — leer propio tenant"
on ong.id_card_templates for select
using (tenant_id = public.fn_current_tenant_id());

create policy "Templates — crear/editar con permiso"
on ong.id_card_templates for all
using (tenant_id = public.fn_current_tenant_id())
with check (
  tenant_id = public.fn_current_tenant_id()
  and public.fn_has_permission('manage_id_cards')
);