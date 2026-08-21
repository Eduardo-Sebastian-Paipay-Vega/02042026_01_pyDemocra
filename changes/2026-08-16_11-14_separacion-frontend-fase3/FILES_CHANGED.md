# Archivos Afectados

## Creados / Movidos
- Directorio creado: `apps/web-core/`
- Directorio creado: `apps/web-ong/`
- `src/` (raíz) -> Movido a `apps/web-core/src/`
- `index.html` (raíz) -> Movido a `apps/web-core/index.html`
- `ong/src/` -> Movido a `apps/web-ong/src/`
- `ong/index.html` -> Movido a `apps/web-ong/index.html`
- `apps/web-core/vite.config.js`: Creado para aislar la compilación.
- `apps/web-core/package.json`: Creado para declarar dependencias base y scripts.
- `apps/web-core/tsconfig.json`: Creado para extender root config.
- `apps/web-ong/vite.config.js`: Creado.
- `apps/web-ong/package.json`: Creado.
- `apps/web-ong/tsconfig.json`: Creado.
- `packages/ui-system/package.json`: Creado para formalizar el paquete interno `@democra/ui`.

## Modificados
- `package.json` (raíz): Se inyectó `"workspaces": ["apps/*", "packages/*"]`.
- `tsconfig.json` (raíz): Se abstrajo como archivo base global; se eliminaron alias duros y se reemplazaron por comodines `apps/*/src`.

## Eliminados
- `vite.config.js` (raíz): Eliminado, ya no es válido un build monolítico genérico.
