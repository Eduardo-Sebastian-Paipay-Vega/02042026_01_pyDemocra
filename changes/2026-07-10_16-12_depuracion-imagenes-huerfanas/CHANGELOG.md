# Changelog — Depuración de imágenes huérfanas y consolidación de marca

**Fecha y hora:** 2026-07-10, 16:12

## Objetivo del cambio

Eliminar del repositorio las imágenes que no están referenciadas por ningún archivo de código ni documentación (huérfanas), y reemplazar `public/Imagen/Iconos/logo_cua1.png` (en uso, pero fuera de la familia de marca vigente) por `public/brand/d-core-monogram.png`.

## Contexto del problema

La auditoría de imágenes de la sesión anterior (`changes/2026-07-10_15-17_.../`) detectó 47 imágenes en el repo, de las cuales solo 5 estaban referenciadas desde código real. Las otras 42 eran huérfanas: 17 correspondían a una feature completa (`src/styles/about-board.css`, tablero visual "Solaris") cuyo CSS tampoco está importado por ningún componente; el resto eran assets de landing/branding antiguos sin uso ni en código ni en `.md`.

Durante la ejecución de este cambio se detectó además que los 5 archivos de `public/brand/` habían sido renombrados manualmente (prefijo `FamD- `) fuera de esta sesión, lo cual habría roto las 8 referencias existentes a esos archivos (favicon en `index.html`/`ong/index.html`, `Sidebar.tsx`, y 5 componentes del landing) más las 3 nuevas agregadas en este mismo cambio.

## Motivo de la modificación

Reducir peso muerto en el repositorio y consolidar la identidad visual en una sola familia de imágenes activa (`public/brand/`), por indicación explícita del usuario tras revisar la auditoría de imágenes.

## Solución implementada

1. **Reemplazo de `logo_cua1.png`**: las 3 referencias (`src/app/LoginGateway.tsx`, `ong/src/app/tenant/screens.tsx`, `src/pages/nosotros/NosotrosPage.tsx`) ahora apuntan a `/brand/d-core-monogram.png` — mismo rol de ícono/monograma cuadrado que ya cumple en el favicon y el Sidebar de ONG, mismas proporciones de uso (`h-7`/`h-10`/`h-12`, clases `object-contain`/`w-auto`).
2. **Borrado de 41 archivos**: `logo_cua1.png` (reemplazado) + 40 imágenes huérfanas confirmadas sin referencia en código ni docs (detalle completo en `FILES_CHANGED.md`). Se protegió explícitamente `public/brand/` — ninguno de sus 5 archivos se tocó, aun estando 2 de ellos (`mono-core.png`, `democra-pro-identity.png`) sin uso actual.
3. **Incidente de renombrado en `public/brand/`**: se encontraron los 5 archivos con el prefijo `FamD- ` agregado fuera de esta sesión. Se restauraron a sus nombres originales (mismo contenido binario, sin pérdida) para no romper las referencias existentes — renombrar 8+ archivos de código para apuntar a rutas con espacios habría sido más invasivo y frágil que restaurar el nombre canónico. `public/brand/` queda sin ningún diff en git.

## Riesgos identificados

- Ninguna de las 40 imágenes borradas tenía referencias detectables por búsqueda de texto (código, CSS, HTML, Markdown) ni por construcción dinámica de rutas (`import.meta.glob`, template literals hacia esas carpetas) — se verificó explícitamente antes de borrar.
- El tablero "Solaris" (17 imágenes de `assets/nodes/` y `assets/paths/`) se elimina junto con su feature huérfana. Si esa feature se retoma en el futuro, los assets deberán recuperarse desde el historial de git (`git log --diff-filter=D -- public/assets/nodes/`).

## Impacto esperado

- Repositorio más liviano, sin assets muertos.
- Una sola familia de marca activa y consistente (`public/brand/`) en los 8 puntos de uso existentes + los 3 nuevos.
- Sin cambio de comportamiento visible para el usuario final salvo el ícono en Login/loading de tenant/Nosotros, que ahora usa el monograma D- en vez de `logo_cua1.png`.

## Módulos afectados

- `src/app/LoginGateway.tsx`, `src/pages/nosotros/NosotrosPage.tsx`, `ong/src/app/tenant/screens.tsx` (referencia de imagen).
- `public/Imagen/`, `public/assets/`, `docs/diseño/`, `dds/MEJORAS/09072026/` (archivos eliminados).
- `public/brand/` (sin cambios de contenido; incidente de renombrado revertido).

## Dependencias involucradas

Ninguna.

## Posibles efectos secundarios

Ninguno esperado: se verificó `vite build`, `npm test` (Jest) y `npm run test:web` (Vitest) con los mismos totales que antes del cambio.

## Estado del cambio

**Completado.** Verificado con `vite build` exitoso, Jest 280/280, Vitest 79/79 archivos / 268/268 tests — mismos totales que antes de la depuración (cero regresiones).
