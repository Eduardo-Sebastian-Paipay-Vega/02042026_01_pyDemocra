# SUMMARY — Fix Theme Sync Global

## Qué se hizo
Se corrigió la sincronización global del tema claro/oscuro para que al cambiar la preferencia de apariencia, **toda** la interfaz (Shell, Sidebar, Topbar y contenido) se actualice instantáneamente. Se añadió un botón de acceso rápido (Sol/Luna) en el Header.

## Por qué se hizo
El `SettingsContext` guardaba la preferencia en la BD y establecía `data-theme` en `<html>`, pero no toggling la clase CSS `.dark` que Tailwind v4 y el `ThemeProvider` de ONG requieren para evaluar tokens y variantes. Además, gradientes con RGBA oscuro hardcodeado impedían que el fondo claro fuera visible.

## Qué beneficio aporta
- **UX consistente:** Cero parches oscuros residuales al elegir Modo Claro.
- **Acceso rápido:** Botón Sol/Luna en el Header para cambiar tema sin ir a Ajustes.
- **Persistencia real:** El cambio se guarda en `profiles.preferences` vía Supabase.

## Funcionalidades afectadas
- Cambio de tema desde Settings (`/ong/app/account/settings`)
- Cambio de tema desde el Header (nuevo botón)
- Visualización de todas las páginas del módulo ONG (Dashboard, Asistencias, Evidencias, Horas, Usuarios, Perfil)
