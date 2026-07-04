# CHANGELOG — Tema oscuro navy/cyan para Fichas Médicas (ONG/)

**Fecha:** 2026-07-04
**Hora:** 16:21 (America/Lima)
**Autor:** Claude Sonnet 5 (Claude Code)
**Estado:** Completado

## Objetivo del cambio

Aplicar la paleta de colores de la landing page (`localhost:5174/landing`) al sistema de fichas médicas sensibles (`ONG/src/app/pages/MedicalRecords.tsx` y sus modales), **únicamente en modo oscuro**, sin afectar modo claro ni ningún otro módulo del sistema.

## Contexto del problema

El usuario pidió una paleta específica extraída/definida a partir de la landing:
- Fondo principal `#0a0e27`, fondo de cards `#1a1f3a`
- Texto principal `#ffffff`, secundario `#b0b8c8`, labels `#7a8294`
- Acento `#4a9fd8` (cyan), acento secundario `#3d8fc5`
- Bordes `#2a3548`

Con restricciones explícitas: no modificar estructura HTML, no alterar funcionalidad, solo CSS, no afectar modo claro, mantener consistencia entre todos los sub-componentes del módulo.

## Motivo de la modificación

El módulo ONG (puerto 5174) venía de dos rediseños previos: uno que estableció una paleta azul-tech genérica (`#3D6BFF`) para todo el módulo, y otro que convirtió el modo **claro** a una paleta humanizada cálida (`#4A7BA7`). Ninguno de los dos tocó específicamente el modo oscuro del sistema de fichas médicas con esta paleta navy/cyan puntual pedida ahora.

## Solución implementada

1. **Sistema de scope aislado por CSS**: en vez de tocar los tokens globales de modo oscuro (afectaría toda la app) o los componentes compartidos (Sidebar, botones, DataTable — usados por decenas de otras pantallas), se creó una clase de scope `.fichas-medicas-theme` aplicada solo al contenedor raíz de `MedicalRecords.tsx` y, vía el prop `className` de `ModalShell`, a sus 3 modales (que se renderizan por `createPortal` a `document.body`, por lo que también necesitaban la clase para heredar las variables CSS correctamente).
2. Se agregó una regla CSS en `ONG/src/styles/index.css`:
   ```css
   [data-app-theme="oscuro"] .fichas-medicas-theme { --t-bg: #0a0e27; ... }
   ```
   Esta regla solo aplica cuando `<html data-app-theme="oscuro">` (puesto por `ThemeProvider`) **y** el elemento está dentro de `.fichas-medicas-theme`. En modo claro, o fuera de ese scope, no tiene ningún efecto.
3. **Bug encontrado y corregido dentro del mismo alcance**: el componente compartido `StatusDot` tenía un morado hardcodeado (`#9B7AEA`) en su variante "info", ajeno a cualquier paleta del proyecto. Como es compartido por muchos módulos, no se tocó globalmente — se agregó una regla CSS que sobreescribe ese morado específicamente dentro de `.fichas-medicas-theme` en modo oscuro, dejándolo intacto en el resto de la aplicación.
4. `MedicalRecords.tsx` y `MedicalRecordPanels.tsx` ya estaban 100% construidos sobre variables `var(--t-*)` (sin colores hardcodeados propios), lo que permitió que la paleta cascadeara automáticamente a todos sus botones, tablas, inputs y badges sin tocar esos archivos más allá de agregar la clase de scope.

## Riesgos identificados

- **Herencia de CSS custom properties a través de portales**: los modales usan `createPortal(..., document.body)`, lo que los saca del árbol DOM de la página. Se verificó explícitamente (inyectando el atributo/clase vía Playwright y leyendo `getComputedStyle`) que pasar la clase de scope al prop `className` de `ModalShell` sí permite la herencia correcta, ya que el nodo portal-eado sigue siendo descendiente real en el DOM de ese wrapper.
- **Selector CSS frágil para el fix de StatusDot**: la solución usa un selector que depende del nombre exacto de la clase Tailwind generada (`.bg-\[\#9B7AEA\]`). Si el código fuente de `status-dot.tsx` cambia ese literal en el futuro, este override dejaría de aplicar silenciosamente (no rompe nada, solo deja de tener efecto).

## Impacto esperado

- El sistema de fichas médicas se ve con la paleta navy/cyan **solo cuando el usuario tiene activado el modo oscuro**.
- Modo claro: sin cambios (verificado).
- Resto de módulos de la app (Dashboard, Voluntarios, Beneficiarios, etc. fuera de este cambio): sin cambios.

## Módulos afectados

- `ONG/src/app/pages/MedicalRecords.tsx`
- `ONG/src/app/modules/people/components/MedicalRecordPanels.tsx`
- `ONG/src/styles/index.css`

## Dependencias involucradas

Ninguna dependencia nueva. Se apoya en el sistema de theming existente (`ThemeProvider`, atributo `data-app-theme` en `<html>`, variables `--t-*`).

## Posibles efectos secundarios

- Ninguno detectado fuera del alcance. El selector CSS del fix de `StatusDot` está limitado con `.fichas-medicas-theme` como ancestro obligatorio, por lo que no puede "escaparse" a otras pantallas.

## Verificación realizada

- `npm run build` (ONG): exitoso, sin errores nuevos.
- Verificación técnica con Playwright: se inyectó `data-app-theme="oscuro"` + `.fichas-medicas-theme` en un nodo de prueba y se leyó `getComputedStyle` — los tokens resolvieron exactamente a los valores pedidos (`--t-bg: #0a0e27`, `--t-surface: #1a1f3a`, `--t-text: #ffffff`, `--t-primary: #4a9fd8`, `--t-border: #2a3548`). Con `data-app-theme="claro"`, los mismos tokens resolvieron vacíos (sin override), confirmando que el modo claro queda intacto.
- Navegación real en navegador (Playwright headless) por 3 rutas del módulo, sin errores de consola ni de React.

## Cómo revertir

`git revert` del commit `refactor(ong): tema oscuro navy/cyan para fichas médicas`, o restaurar manualmente los 3 archivos listados a su estado anterior (ver `FILES_CHANGED.md`).
