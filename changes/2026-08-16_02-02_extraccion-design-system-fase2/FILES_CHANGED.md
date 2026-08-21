# Archivos Afectados

## Creados / Movidos
- Directorio creado: `packages/ui-system/src/components/ui/`
- Todos los componentes (`button.tsx`, `dialog.tsx`, `modal-shell.tsx`, `utils.ts`, `use-mobile.ts`, etc.) movidos desde `ong/src/app/components/ui/` hacia `packages/ui-system/src/components/ui/`.

## Modificados
- `vite.config.js`: Agregado alias `@democra/ui` resolviendo hacia `packages/ui-system/src`.
- `tsconfig.json`: Agregado `packages/ui-system/src` al arreglo de `include`. Agregado alias en `compilerOptions.paths`.
- `packages/ui-system/src/components/ui/*.tsx`: Reescritura interna para resolver `../lib/utils` hacia `./utils`.
- Decenas de archivos de páginas y componentes dentro de `src/modules/ong/` y `ong/src/`: Actualización masiva de importaciones de UI para usar `@democra/ui`.

## Eliminados
- Eliminadas carpetas redundantes: `src/modules/ong/app/components/ui/` y `src/pages/landing/components/ui/`.
