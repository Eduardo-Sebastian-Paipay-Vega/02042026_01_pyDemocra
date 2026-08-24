# FILES_CHANGED — Fix Theme Sync Global

## Archivos modificados

### `src/core/context/SettingsContext.tsx`
- `applyAll()`: añadido `root.classList.toggle('dark', resolved === 'dark')` para que al cambiar tema la clase `.dark` se aplique/remueva en `<html>`.
- Listener de `prefers-color-scheme` (modo "system"): actualizado para también toggle `.dark`.

### `src/core/shell/Topbar.tsx`
- Importado `useSettings` de `@/core/context/SettingsContext`.
- Añadido hook `const { theme: globalTheme, saveSettings } = useSettings()`.
- Insertado botón Sol/Luna entre control de intensidad y notificaciones. Llama `saveSettings({ theme: next })` para persistir y aplicar globalmente.

### `src/core/shell/AppShell.tsx`
- Reemplazado gradiente decorativo `rgba(16, 14, 12, 0.12/0.18)` por `var(--t-hover)`.

### `src/modules/ong/app/pages/Attendance.tsx`
- Refactorizadas clases Tailwind hardcodeadas oscuras a formato `light dark:dark` (ej. `bg-zinc-950` → `bg-white dark:bg-zinc-950`).

### `src/modules/ong/app/pages/Dashboard.tsx`
- Misma refactorización de colores.

### `src/modules/ong/app/pages/Evidence.tsx`
- Misma refactorización de colores.

### `src/modules/ong/app/pages/Hours.tsx`
- Misma refactorización de colores.

### `src/modules/ong/app/pages/MyProfile.tsx`
- Misma refactorización de colores.

### `src/modules/ong/app/pages/MyAccountSettings.tsx`
- Misma refactorización de colores.

### `src/modules/ong/app/pages/SystemUsers.tsx`
- Misma refactorización de colores.

### `src/modules/ong/app/pages/landing/CreateTenantPage.tsx`
- Misma refactorización de colores.

## Archivos creados
- `changes/2026-08-24_18-20_fix-theme-sync-global/CHANGELOG.md`
- `changes/2026-08-24_18-20_fix-theme-sync-global/SUMMARY.md`
- `changes/2026-08-24_18-20_fix-theme-sync-global/FILES_CHANGED.md` (este archivo)
