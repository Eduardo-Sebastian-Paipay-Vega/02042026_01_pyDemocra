# Changelog - Extracción del Design System (Fase 2)

**Fecha y Hora:** 2026-08-16 02:02
**Objetivo del cambio:**
Consolidar todos los componentes visuales de Radix UI y componentes genéricos compartidos del frontend (que estaban duplicados en las carpetas `ong/src/app/components/ui` y `src/modules/ong/app/components/ui`) hacia un único paquete interno local para favorecer la escalabilidad del SaaS multivertical.

**Contexto del problema:**
La estructura previa provocaba que cada vez que se creara un nuevo vertical (ej: GYM), se tuviera que duplicar el código del Design System, generando alta deuda técnica y dificultando el mantenimiento de componentes base como botones, diálogos o tablas.

**Solución implementada:**
1. Se ha creado la estructura local `packages/ui-system/src/components/ui`.
2. Se movió de forma canónica el contenido duplicado hacia el nuevo paquete.
3. Se actualizó el archivo de configuración `vite.config.js` y `tsconfig.json` para soportar el alias de importación absoluta `"@democra/ui"`.
4. Mediante un script automatizado (`refactor_ui_imports.mjs`), se sustituyeron todas las importaciones relativas (ej. `from "../../components/ui/button"`) en el frontend principal para hacer uso del nuevo alias de paquete, aislando limpiamente los componentes visuales de la lógica de aplicación de cada vertical.

**Riesgos identificados:**
- **Resolución de Dependencias TS/Vite:** Al cambiar radicalmente los paths de UI, es fundamental que el Typechecker y el Bundler reconozcan la carpeta `packages/ui-system`. Para mitigarlo, se agregaron las entradas pertinentes a la matriz de `include` y `paths`.
- Fallos en Node Modules locales podrían impedir la validación del typcheck en ciertos entornos no normalizados.

**Impacto esperado:**
- Mejor mantenibilidad del código visual.
- Preparación del ecosistema para la división de paquetes en workspaces (Fase 3).
- Cero duplicidad de archivos base de interfaz UI.

**Módulos afectados:**
- `vite.config.js`
- `tsconfig.json`
- Archivos `.tsx` en `src/` y `ong/src/`.

**Estado del cambio:** Completado
