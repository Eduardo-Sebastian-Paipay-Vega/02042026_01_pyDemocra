# FILES_CHANGED — Hardening de dependencias

## Modificados

- `package.json` — versiones de `react-router`, `vite`, `jspdf` actualizadas.
- `package-lock.json` — lockfile regenerado por `npm install`.

## Creados (auditoría)

- `changes/2026-07-11_15-30_hardening-dependencias-seguridad/CHANGELOG.md`
- `changes/2026-07-11_15-30_hardening-dependencias-seguridad/SUMMARY.md`
- `changes/2026-07-11_15-30_hardening-dependencias-seguridad/FILES_CHANGED.md`

## Temporales (creados y eliminados durante la verificación, no versionados)

- `.tmp-verify-jspdf.mjs`, `.tmp-verify-single-card.pdf`, `.tmp-verify-batch.pdf` — script y PDFs de prueba para validar la superficie de API de `jspdf` 4.2.1; eliminados tras confirmar que los PDFs generados eran válidos.
