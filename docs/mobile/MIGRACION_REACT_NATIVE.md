# GUÍA DE MIGRACIÓN — Web (React) → React Native

Fecha: 2026-07-04. Guía técnica de traducción, punto por punto de acoplamiento.

## 1. Estrategia general

No es una "conversión" 1:1: es **reutilizar la lógica** (services, tipos, RBAC, bootstrap) y **reconstruir la UI**. Enfoque recomendado: **monorepo con paquete compartido**.

```
repo/
├── packages/core/     # (NUEVO, fase posterior) lógica agnóstica compartida
│   ├── services/      # movido/reexportado desde ONG/src/app/services
│   ├── types/         # AppDatabase + tipos de dominio
│   ├── rbac/          # core/tenant/access + registry metadata
│   ├── tenant/        # bootstrapTenantContext (con storage inyectable)
│   └── errors/        # error-explainer
├── web/               # app web actual (sin cambios de comportamiento)
└── mobile/            # app RN (consume packages/core)
```

> Alternativa sin monorepo (más rápida, menos limpia): en `mobile/src/services` reexportar desde el web e inyectar cliente + adaptadores. Deuda técnica: duplicación y drift.

## 2. Puntos de acoplamiento a resolver (los 3 críticos)

### 2.1 Persistencia de sesión
**Web:** `createClient(url, key, { auth: { persistSession, autoRefreshToken, detectSessionInUrl: true } })` → tokens en `localStorage`.

**RN:**
```ts
import * as SecureStore from 'expo-secure-store';
const ExpoSecureStoreAdapter = {
  getItem: (k) => SecureStore.getItemAsync(k),
  setItem: (k, v) => SecureStore.setItemAsync(k, v),
  removeItem: (k) => SecureStore.deleteItemAsync(k),
};
createClient(url, key, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,   // no hay URL callback en móvil
  },
});
```
Añadir `AppState` listener → `supabase.auth.startAutoRefresh()/stopAutoRefresh()`.

### 2.2 Subida de archivos (`services/shared/storage.ts`)
**Web:** recibe `File` del DOM.

**RN:** crear adaptador que recibe `{ uri, name, type }` (de `expo-image-picker`/`expo-document-picker`) y sube:
```ts
const form = new FormData();
form.append('file', { uri, name, type } as any);
await supabase.storage.from(bucket).upload(path, form, { contentType: type, upsert });
// alternativa: base64 → ArrayBuffer con decode
```
Conservar del web: saneamiento de rutas, `tenantScoped` vía `fn_current_tenant_id`, nombres con timestamp.

### 2.3 Variables de entorno
**Web:** `import.meta.env.VITE_*`.

**RN:** `process.env.EXPO_PUBLIC_*` + `expo-constants`. Crear `mobile/src/config/env.ts` que exporte las claves y **falle temprano** si faltan (equivalente a `validate-env`).

## 3. Tabla de equivalencias de UI/API

| Web | React Native |
|-----|--------------|
| `div`, `span` | `View`, `Text` |
| HTML `<button>` / Radix Button | `Pressable` + componente propio |
| Radix Dialog/Sheet/Popover | `@gorhom/bottom-sheet`, Modal RN |
| `DataTable` (tabla HTML) | `FlatList`/`SectionList` |
| `recharts` | `victory-native` / `react-native-svg` |
| `motion` (framer) | `react-native-reanimated` |
| Tailwind classes | `StyleSheet` o `nativewind` |
| `lucide-react` | `lucide-react-native` |
| `react-router` | Expo Router / React Navigation |
| `localStorage` | SecureStore (tokens) / MMKV / AsyncStorage |
| `window`, `document`, `URL.createObjectURL` | APIs Expo equivalentes / eliminar |
| `input type=file` | `expo-image-picker` / `expo-document-picker` |
| CSS media query (`use-mobile`) | `useWindowDimensions` |

## 4. Reutilizable directo (copiar/compartir sin reescribir)

- `core/tenant/access.ts` (RBAC).
- `services/**/*.service.ts` (excepto refs a Storage/`File`).
- `services/**/shared.ts` (sanitize/normalize/tenant helpers).
- `modules/**/types.ts`, `modules/**/forms.ts`.
- `tenant/bootstrap.ts` (parametrizar el storage de "última ruta").
- `lib/db/ong/app-database.ts` (tipos).
- `src/shared/error-explainer.js`.
- Hooks `use*` de datos (envolver con TanStack Query).

## 5. Reescribir como pantallas nativas (lógica ya disponible)

Las ~40 `pages/*.tsx` se reconstruyen como *screens*; consumen los hooks/servicios reutilizados. Orden sugerido por valor de campo: Home → Operación (asistencia/horas/evidencias) → Personas → Notificaciones → Aprobaciones → Admisión → Recursos → Gobernanza/Ajustes.

## 6. Autenticación y seguridad avanzada

- Login: `signInWithPassword` + SecureStore.
- Riesgo/MFA: consumir `/api/auth/risk-evaluate`, `/step-up/verify-otp`, `/resend-otp` con Bearer. `device_fingerprint` = hash estable de `expo-device`/`expo-application`.
- Biometría (RF-NEW-05) como capa local y step-up alternativo.

## 7. Testing de la migración

- **Unit:** servicios y RBAC (Jest) — reutilizables desde `packages/core`.
- **Componentes:** React Native Testing Library.
- **E2E:** Maestro o Detox (login, asistencia offline→sync, subida de evidencia).
- **Contrato de API:** pruebas contra endpoints Express con token de prueba.
- **Regresión web:** `npm run typecheck` + smoke manual para confirmar que el web no se ve afectado por la extracción a `packages/core`.

## 8. Qué NO hacer

- No embarcar `SERVICE_ROLE_KEY`.
- No reimplementar reglas de permisos en el cliente (usar RLS + `fn_has_permission`).
- No cachear datos clínicos/financieros sensibles offline.
- No modificar el comportamiento del web durante la extracción compartida (solo mover/reexportar con equivalencia verificada por typecheck).
