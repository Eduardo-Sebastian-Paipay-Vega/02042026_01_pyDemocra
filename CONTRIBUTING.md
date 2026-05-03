# Guía de Contribución — Democra ONG

## Estándares de desarrollo

### API y base de datos

Todos los accesos a Supabase se realizan mediante el cliente SDK de JavaScript (`@supabase/supabase-js`). No se usan clientes HTTP directos ni colecciones de Postman/Insomnia para explorar la API.

**Herramientas recomendadas para inspeccionar la API REST de Supabase:**
- [Thunder Client](https://marketplace.visualstudio.com/items?itemName=rangav.vscode-thunder-client) (extensión VS Code, sin cuenta requerida)
- [Bruno](https://www.usebruno.com/) (cliente offline, colecciones versionadas en git)
- Supabase Studio → SQL Editor (para queries ad-hoc)

> **No añadir colecciones de Postman al repositorio.** Los archivos `.json` de Postman contienen variables de entorno con claves que no deben estar en git.

### Variables de entorno

Copiar `.env.example` a `.env.local` y completar los valores. Nunca commitear `.env`, `.env.local` ni archivos con claves reales.

```
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

### Multi-tenant

Toda query a tablas con `tenant_id` **debe** filtrar por él en el cliente:

```ts
const tenantId = await getRequiredTenantId(); // services/proyectos/shared.ts
const { data } = await ongSchema().from("areas").select("*").eq("tenant_id", tenantId);
```

RLS en Supabase actúa como segunda línea de defensa via `fn_current_tenant_id()`. El filtro en cliente es obligatorio igualmente.

### Subida de archivos

Usar `uploadFileToStorage()` de `services/shared/storage.ts`. No almacenar rutas de archivos como texto libre ingresado por el usuario.

Buckets disponibles:
| Bucket | Acceso | Uso |
|--------|--------|-----|
| `avatars` | público | Fotos de voluntarios, imágenes de proyectos, items, ubicaciones |
| `evidence` | privado (auth) | Evidencias de actividades |

### Tema y estilos

Usar variables CSS del sistema de diseño (`var(--t-*)`) en lugar de clases Tailwind con colores fijos:

```tsx
// ✅ Correcto
<div style={{ color: "var(--t-text)", background: "var(--t-surface)" }}>

// ❌ Evitar
<div className="text-neutral-900 bg-white dark:text-neutral-50 dark:bg-neutral-950">
```

Variables de referencia: `--t-text`, `--t-text-secondary`, `--t-text-dim`, `--t-surface`, `--t-elevated`, `--t-border`, `--t-hover`, `--t-input-bg`.

### Commits

```
feat: descripción corta en presente imperativo
fix: descripción del bug corregido
refactor: descripción del refactor
```

Sin punto final. Máximo 72 caracteres en la primera línea.

## Scripts útiles

```bash
# Instalar dependencias
npm install

# Servidor de desarrollo
npm run dev

# Verificar tipos
npx tsc --noEmit

# Build de producción
npm run build
```
