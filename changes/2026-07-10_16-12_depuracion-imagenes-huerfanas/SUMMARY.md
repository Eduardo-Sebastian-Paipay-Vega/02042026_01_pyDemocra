# Resumen ejecutivo

## Qué se hizo

Se borraron 41 imágenes del repositorio: 40 huérfanas (sin ninguna referencia en código ni documentación) y `logo_cua1.png`, que sí estaba en uso pero se reemplazó por `public/brand/d-core-monogram.png` en sus 3 puntos de uso. `public/brand/` se dejó intacto por instrucción explícita, incluyendo 2 archivos que hoy no están en uso (`mono-core.png`, `democra-pro-identity.png`). Además, se detectó y revirtió un renombrado manual de los 5 archivos de `public/brand/` (prefijo `FamD- `) que habría roto 8+ referencias existentes.

## Por qué se hizo

Para eliminar peso muerto detectado en la auditoría de imágenes previa y consolidar toda la identidad visual del producto en una sola familia de assets (`public/brand/`), a pedido explícito del usuario.

## Qué beneficio aporta

- Repositorio más limpio y liviano (41 archivos binarios menos).
- Una sola fuente de verdad para el logo/monograma de la marca.
- Se evitó una regresión visual (favicon e íconos rotos) causada por un renombrado accidental fuera de esta sesión, detectada antes de que llegara a producción.

## Qué funcionalidades quedaron afectadas

- **Login, pantalla de carga de tenant, header de "Nosotros"**: el ícono que antes era `logo_cua1.png` ahora es `d-core-monogram.png` (mismo tamaño y rol visual).
- **Ninguna otra funcionalidad** se vio afectada. `vite build`, Jest y Vitest confirman los mismos totales que antes del cambio.
