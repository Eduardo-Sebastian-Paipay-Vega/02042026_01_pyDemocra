# CHANGELOG — Fix Theme Sync Global

- **Fecha:** 2026-08-24 18:20 (UTC-5)
- **Objetivo:** Corregir la sincronización global del tema (Modo Claro / Oscuro) en toda la aplicación ONG.
- **Contexto del problema:** Al seleccionar "Modo Claro" en Ajustes (`/ong/app/account/settings`), únicamente la tarjeta de ajustes cambiaba a fondo blanco. El App Shell, Sidebar y Topbar permanecían bloqueados en Modo Oscuro porque:
  1. `SettingsContext.applyAll()` establecía `data-theme` en `<html>` pero **no** toggling la clase `.dark`, que es la que Tailwind v4 y `theme-context.tsx` evalúan para inyectar tokens CSS.
  2. El `AppShell.tsx` tenía un gradiente decorativo con RGBA hardcodeado oscuro (`rgba(16, 14, 12, ...)`) que tintaba la página.
  3. No existía un botón de acceso rápido (Sol/Luna) en el Header para cambiar tema desde cualquier vista.
- **Motivo de la modificación:** Bug visual crítico — la mitad de la interfaz ignoraba la preferencia del usuario.
- **Solución implementada:**
  1. **`SettingsContext.tsx`**: Se añadió `root.classList.toggle('dark', resolved === 'dark')` en `applyAll()` y en el listener de `prefers-color-scheme` para modo "system".
  2. **`Topbar.tsx`**: Se importó `useSettings` y se añadió un botón Sol/Luna que invoca `saveSettings({ theme: 'light' | 'dark' })`, persistiendo en BD y aplicando globalmente.
  3. **`AppShell.tsx`**: Se reemplazó el gradiente RGBA oscuro por `var(--t-hover)` (ya corregido previamente en `BaseTenantShell.tsx`).
  4. **Páginas ONG** (script automatizado): Se refactorizaron clases Tailwind estáticas (`bg-zinc-950`, `text-zinc-400`, etc.) en 8 archivos para incluir variantes `dark:`.
- **Riesgos identificados:** Ninguno significativo — los cambios son aditivos (agregan variantes claras) sin romper el modo oscuro existente.
- **Impacto esperado:** Al seleccionar "Claro" en Ajustes o en el Header, TODA la pantalla (Sidebar, Header, área de contenido, tarjetas, tablas) cambia instantáneamente a fondo claro sin recargar página.
- **Módulos afectados:** `core/context`, `core/shell`, `modules/ong/app/pages`, `ong/src/styles`.
- **Dependencias involucradas:** Ninguna nueva — se reutiliza `useSettings` existente.
- **Posibles efectos secundarios:** Componentes de terceros que no respeten `dark:` podrían quedar con estilos mixtos, pero el sistema de tokens CSS (`--t-*`) cubre todo el shell.
- **Estado del cambio:** ✅ Completado
