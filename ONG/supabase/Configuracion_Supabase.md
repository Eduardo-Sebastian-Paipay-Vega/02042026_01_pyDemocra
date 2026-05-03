# Configuración de Infraestructura: Módulo ID Cards (Democra)

Este documento detalla los pasos necesarios en Supabase para habilitar el
almacenamiento de fondos de plantillas y la lógica de plantillas activas.

---

## 1. Storage — Bucket `id_templates`

Ejecutar en el **SQL Editor** de Supabase:

```sql
-- Crear el bucket para plantillas si no existe
insert into storage.buckets (id, name, public)
values ('id_templates', 'id_templates', true)
on conflict (id) do nothing;

-- Permitir lectura pública (la URL pública no requiere autenticación)
create policy "Acceso Público Plantillas"
  on storage.objects for select
  using ( bucket_id = 'id_templates' );

-- Permitir subida sólo a usuarios autenticados del tenant
create policy "Subida Autenticados"
  on storage.objects for insert
  with check (
    bucket_id = 'id_templates'
    and auth.role() = 'authenticated'
  );

-- Permitir que el mismo usuario que subió pueda actualizar o eliminar
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
```

### Ruta de archivos en el bucket

```
id_templates/
  <tenant_id>/
    <timestamp>-template-bg.<ext>   ← generado por uploadTemplateBackground()
```

---

## 2. Base de Datos — Tabla `ong.id_card_templates`

La tabla ya existe con las columnas core. Verificar / agregar las columnas
opcionales que el módulo utiliza:

```sql
-- Verificar columnas existentes
select column_name, data_type
from information_schema.columns
where table_schema = 'ong'
  and table_name   = 'id_card_templates';

-- Agregar columnas si faltan (idempotente con IF NOT EXISTS)
alter table ong.id_card_templates
  add column if not exists template_config jsonb;
  -- base_image_url text            ← ya existe como base_image_url
  -- activa         boolean         ← ya existe
  -- template_width  integer        ← ya existe (en píxeles a 300 DPI)
  -- template_height integer        ← ya existe (en píxeles a 300 DPI)
```

### Estructura del JSON en `template_config`

El campo `template_config` almacena el esquema completo de capas del editor.
Formato tipado en `idCardTemplateSchema.ts`:

```json
{
  "template_metadata": {
    "name": "Credencial Voluntario 2026",
    "canvas_size": { "width_mm": 85.6, "height_mm": 53.98 },
    "bleed_mm": 3,
    "dpi": 300
  },
  "layers": [
    {
      "id": "layer_nombre",
      "type": "text",
      "content": "{{voluntario.nombre_completo}}",
      "position": { "x_mm": 30, "y_mm": 12 },
      "dimensions": { "w_mm": 50 },
      "style": { "font": "Inter, sans-serif", "size_pt": 12, "color": "#111827", "bold": true },
      "z_index": 3
    },
    {
      "id": "layer_foto",
      "type": "dynamic_image",
      "source": "profile_picture",
      "position": { "x_mm": 4, "y_mm": 8 },
      "dimensions": { "w_mm": 22, "h_mm": 28 },
      "object_fit": "cover",
      "z_index": 2
    },
    {
      "id": "layer_qr",
      "type": "dynamic_image",
      "source": "qr_code",
      "position": { "x_mm": 62, "y_mm": 8 },
      "dimensions": { "w_mm": 20, "h_mm": 20 },
      "z_index": 2
    }
  ]
}
```

> **Nota:** Las posiciones siempre se almacenan en **milímetros** para que sean
> independientes de la resolución. El motor convierte a píxeles en tiempo de
> render usando `mmToPx()` (300 DPI → 1 mm ≈ 11.811 px).

---

## 3. Variables de entorno requeridas

Estas variables deben estar en `.env` del proyecto ONG:

```env
VITE_SUPABASE_URL=https://<proyecto>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

El cliente Supabase (`ONG/src/supabaseClient.ts`) las lee automáticamente.

---

## 4. Flujo de datos del módulo (resumen)

```
Fase 1 — Cimientos
  Usuario escribe 85  → React.useState → <div style={{ width: `${widthPx}px` }}>
  Usuario pulsa CR80  → applyPreset(1011, 638)   (px = mm × 11.811)
  Usuario sube fondo  → uploadTemplateBackground(file)
                      → storage.from('id_templates').upload(path, file)
                      → getPublicUrl(path) → setValue("baseImageUrl", url)
  Confirmar medidas   → setDimensionsLocked(true) → inputs disabled

Fase 2 — Composición
  Drag elemento       → onDragStop → setValue(fields[i].posX/posY)
                        bounds="parent" impide salir del canvas
  Reset coords        → createDefaultIdCardFields(w, h) → setValue("fields", ...)
  Maximizar editor    → editorExpanded=true → displayWidth = 80 % viewport

Inspector
  Cambio X/Y/W/H      → setValue directo a fields[i].posX … inmediato
  Google Fonts URL    → document.head.appendChild(<link rel="stylesheet">)
                      → setValue(fields[i].fontFamily, fontName)

Finalización
  handleSubmit        → normalizeTemplateInput(formValues)
                      → onSubmit → createIdCardTemplate / updateIdCardTemplate
                      → upsert a ong.id_card_templates + id_card_template_fields
                      → si template_config presente → guarda en columna JSONB
```

---

## 5. Permisos RLS recomendados para `ong.id_card_templates`

```sql
-- Lectura: cualquier usuario del tenant
create policy "Templates — leer propio tenant"
  on ong.id_card_templates for select
  using ( tenant_id = public.fn_current_tenant_id() );

-- Escritura: requiere permiso manage_id_cards
create policy "Templates — crear/editar con permiso"
  on ong.id_card_templates for all
  using  ( tenant_id = public.fn_current_tenant_id() )
  with check (
    tenant_id = public.fn_current_tenant_id()
    and public.fn_has_permission('manage_id_cards')
  );
```
