# Archivos modificados

## Creados

- `changes/2026-07-10_16-12_depuracion-imagenes-huerfanas/` — esta carpeta de auditoría.

## Modificados

- `src/app/LoginGateway.tsx` — `src` de imagen: `/Imagen/Iconos/logo_cua1.png` → `/brand/d-core-monogram.png`.
- `src/pages/nosotros/NosotrosPage.tsx` — ídem.
- `ong/src/app/tenant/screens.tsx` — ídem.

## Eliminados (41 archivos)

**Reemplazado (1):**
- `public/Imagen/Iconos/logo_cua1.png`

**Huérfanos — sin referencia en código ni docs (40):**

Fuente de diseño duplicada en `docs/` (5):
- `docs/diseño/Core Vector black.png`
- `docs/diseño/D-Core Monogram.png`
- `docs/diseño/D-Core Neon.png`
- `docs/diseño/Democra Pro Identity.png`
- `docs/diseño/Mono Core.png`

Íconos antiguos (6):
- `public/Imagen/Iconos/logo_blanco_1.png`
- `public/Imagen/Iconos/logo_blanco_2.png`
- `public/Imagen/Iconos/logo_cobre.png`
- `public/Imagen/Iconos/logo_negro.png`
- `public/Imagen/Iconos/logo_trazo.png`
- `public/Imagen/Iconos/path45-8.png`

Assets de landing sin uso (11):
- `public/Imagen/brands/brand_diseño.png`
- `public/Imagen/nosotros/quienes-somos.png`
- `public/Imagen/use/14.png`
- `public/Imagen/use/enfoque.png`
- `public/Imagen/use/ensenar.png`
- `public/Imagen/use/ensenar1.png`
- `public/Imagen/use/forma (1).png`
- `public/Imagen/use/forma-abstracta.png`
- `public/Imagen/use/forma.png`
- `public/Imagen/use/g262214.png`
- `public/Imagen/use/logo_wa.png`

Feature "tablero Solaris" huérfana — CSS (`src/styles/about-board.css`) no importado por ningún componente (17):
- `public/assets/nodes/design-off.png`, `design-on.png`
- `public/assets/nodes/grow-off.png`, `grow-on.png`
- `public/assets/nodes/labs-off.png`, `labs-on.png`
- `public/assets/nodes/seed-off.png`, `seed-on.png`
- `public/assets/nodes/solaris-off.png`, `solaris-on.png`
- `public/assets/nodes/ventures-off.png`, `ventures-on.png`
- `public/assets/paths/path-solaris-design-on.png`
- `public/assets/paths/path-solaris-labs-on.png`
- `public/assets/paths/path-solaris-ventures-on.png`
- `public/assets/paths/path-ventures-grow-on.png`
- `public/assets/paths/path-ventures-seed-on.png`

Captura suelta en documentación de mejoras (1):
- `dds/MEJORAS/09072026/image.png`

## No modificados (protegidos explícitamente)

- `public/brand/core-vector.png`
- `public/brand/d-core-monogram.png`
- `public/brand/d-core-neon.png`
- `public/brand/democra-pro-identity.png`
- `public/brand/mono-core.png`

Nota: estos 5 archivos fueron encontrados renombrados en disco con el prefijo `FamD- ` (acción externa a esta sesión, no reflejada en git). Se restauraron a su nombre original antes de este commit para no romper las referencias existentes — el contenido de los archivos no cambió, solo el nombre físico se revirtió al que ya usa el código.

## No tocados (fuera de alcance, no versionados)

- `.claude/scheduled_tasks.lock`, `.env`, `.vercel/`, `node_modules/`, `dist/`.
