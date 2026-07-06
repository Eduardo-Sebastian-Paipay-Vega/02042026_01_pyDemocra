# AUDITORÍA DE REUTILIZACIÓN — Artefactos web → móvil

Fecha: 2026-07-04. Clasificación: **Reutilizable** / **Parcialmente reutilizable** / **No reutilizable**, con motivo.

## 1. Servicios de negocio (`app/services/**`)

| Artefacto | Clase | Motivo |
|-----------|-------|--------|
| `services/personas/*.service.ts` (beneficiaries, volunteers, idCards, form-adapters) | **Reutilizable** | TypeScript sobre cliente Supabase; sin DOM. `idCards.service` parcial por canvas. |
| `services/proyectos/*.service.ts` | **Reutilizable** | CRUD puro sobre esquema `ong`. |
| `services/operacion/*.service.ts` (actividades, horas, asistencias, evidencias, aprobaciones) | **Reutilizable** | Lógica pura. `evidencias.service` depende de `storage.ts` (parcial). |
| `services/recursos/*.service.ts` (items, inventario, cuentas, transacciones, comprobantes, reportes) | **Reutilizable** | `comprobantes` toca Storage (parcial). |
| `services/gobernanza/*.service.ts` (audit, catalogs, retention, sensitiveAccess) | **Reutilizable** | Consultas puras multi-schema. |
| `services/admision/*.service.ts` (solicitudes, volunteerRegistration, form-adapters) | **Parcialmente** | Toca Storage y validación RUC; núcleo reutilizable. |
| `services/academico/cursos.service.ts` | **Reutilizable** | Consultas puras. |
| `services/clinico/*.service.ts` (medicalRecords, form-adapters) | **Reutilizable** | Datos sensibles: reutilizable pero **no cachear offline**. |
| `services/configuracion/*.service.ts` (systemUsers, roles, security) | **Reutilizable** | Puro; parte vía API IAM. |
| `services/notificaciones/*.service.ts` (history, templates, shared) | **Reutilizable** | Puro; realtime aparte. |
| `services/ace/ace.service.ts` | **Reutilizable** | Puro sobre `public`. |
| `services/shared/storage.ts` | **Parcialmente** | Usa `File` (DOM) y `import.meta.env`. Adaptar a picker RN + `EXPO_PUBLIC_*`. |

## 2. Hooks (`app/modules/**/hooks/**`)

| Grupo | Clase | Motivo |
|-------|-------|--------|
| `modules/*/hooks/use*.ts` (people, projects, operation, admission, resources, governance, notifications, settings) | **Reutilizable** | Orquestan servicios con `useState/useEffect`; sin dependencias de DOM. Se recomienda envolver en TanStack Query en móvil. |
| `modules/notifications/hooks/useNotificationsRealtime.ts` | **Reutilizable** | `supabase.channel` funciona en RN. |
| `app/lib/useGlobalShortcuts.ts` | **No reutilizable** | Atajos de teclado (web). |
| `app/lib/use-file-preview.ts` | **Parcialmente** | Preview de `File`/`URL.createObjectURL` (web); reemplazar por `expo-image`/uri. |
| `app/lib/useDebouncedValue.ts` | **Reutilizable** | Utilidad pura. |
| `components/ui/use-mobile.ts` | **No reutilizable** | Media query de breakpoints web. |

## 3. Contextos y providers

| Artefacto | Clase | Motivo |
|-----------|-------|--------|
| `TenantBootstrapProvider.tsx` + `tenant/bootstrap.ts` | **Reutilizable** | Context API + Supabase; solo `localStorage` de "última ruta" (sustituir por AsyncStorage, no crítico). |
| `app/lib/theme-context.tsx` | **Parcialmente** | Lógica de tema reutilizable; los valores CSS no. |
| `core/ui-state/persistence.ts`, `app/lib/session-state.ts` | **Parcialmente** | Depende de `localStorage`; migrar a AsyncStorage. |

## 4. RBAC / navegación / registry

| Artefacto | Clase | Motivo |
|-----------|-------|--------|
| `core/tenant/access.ts` | **Reutilizable** | Lógica pura de permisos. |
| `core/tenant/registry-types.ts` | **Reutilizable** | Tipos. |
| `core/tenant/navigation.ts`, `moduleRegistry.tsx` | **Parcialmente** | Lógica de armado reutilizable; `element: <Page/>` (JSX web) no. Extraer metadata agnóstica. |
| `industries/ong/registry.tsx` | **Parcialmente** | Metadata de módulos/permisos reutilizable; `element` e `icon` (lucide-react web) a reemplazar. |

## 5. Modelos / tipos / validaciones

| Artefacto | Clase | Motivo |
|-----------|-------|--------|
| `lib/db/ong/app-database.ts` (tipos DB) | **Reutilizable** | Tipos generados; agnósticos. Compartir vía paquete. |
| `lib/db/core.ts` | **Reutilizable** | Factory de clientes por prefijo de env (ajustar a env RN). |
| `modules/*/types.ts`, `modules/*/forms.ts` | **Reutilizable** | Tipos y esquemas de formulario (react-hook-form disponible en RN). |
| `services/*/shared.ts` (sanitize*, normalize*, tenant helpers) | **Reutilizable** | Utilidades puras (excepto refs a Storage). |
| `src/shared/error-explainer.js` | **Reutilizable** | Mapa de códigos de error compartido con el server. |

## 6. Cliente Supabase

| Artefacto | Clase | Motivo |
|-----------|-------|--------|
| `supabaseClient.ts` (módulo ong) | **Parcialmente** | `createClient` reutilizable; **cambiar** `auth.storage` a SecureStore y quitar `detectSessionInUrl`. |
| `services/supabase.js` (raíz) | **Parcialmente** | Config vía `import.meta.env` → `EXPO_PUBLIC_*`. |

## 7. Componentes de UI (`components/ui/**`, `components/{shared,layout,figma}`)

| Grupo | Clase | Motivo |
|-------|-------|--------|
| `components/ui/*` (~60: button, dialog, table, select, calendar, chart…) | **No reutilizable** | Basados en Radix + HTML + Tailwind. Reemplazar por RN + design system nativo. |
| `components/shared/DataTable, FilterBar, KpiCard, PageHeader, TableSkeleton` | **No reutilizable** | Presentación web; reconstruir con `FlatList`/`SectionList`. |
| `components/layout/AppShell, Sidebar, Topbar` | **No reutilizable** | Layout web; reemplazar por navegación por tabs/stack. |
| `components/ui/chart.tsx` (recharts) | **No reutilizable** | recharts es web; usar `victory-native`/`react-native-svg`. |
| `pages/*.tsx` (~40) | **No reutilizable** (como UI) | Reescribir como *screens*; **la lógica ya vive en services/hooks reutilizables**. |
| `styles/*.css`, Tailwind, `motion` | **No reutilizable** | CSS/animaciones web. Usar `nativewind` (opcional) + `react-native-reanimated`. |

## 8. API Express (`server/**`)

| Artefacto | Clase | Motivo |
|-----------|-------|--------|
| Endpoints `/api/auth/*`, `/api/iam/*`, `/api/audit/*`, `/api/onboarding/*` | **Reutilizable (sin cambios en server)** | Son REST con Bearer; el móvil los consume igual. Solo cambia el cliente que los llama. |

---

## Resumen

| Capa | Reutilización efectiva |
|------|------------------------|
| Backend (Supabase + API Express) | **100%** (sin cambios) |
| Lógica de negocio (services, hooks, tipos, validaciones, RBAC, bootstrap) | **~80%** (mayoría directa; adaptaciones puntuales en Storage/env/persistencia) |
| Presentación (UI, pages, styles) | **~0%** (reconstrucción nativa) |
| **Global (peso lógica vs UI)** | **~70-80% de la lógica reutilizable** |

**Recomendación estructural:** extraer la lógica compartida (services, tipos `AppDatabase`, RBAC, bootstrap, error-explainer, metadata de registry) a un paquete compartido (`packages/core` en un monorepo pnpm/turborepo) para que web y móvil consuman una sola fuente de verdad y se evite la duplicación que ya existe entre `src/modules/ong` y `ONG/src/app`.
