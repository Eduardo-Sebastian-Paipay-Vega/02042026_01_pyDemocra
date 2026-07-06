# FILES_CHANGED — Auditoría móvil React Native

Solo **archivos nuevos**. No se modificó ni eliminó ningún archivo existente.

## Documentación (`docs/mobile/`)
- `README.md` — índice y resumen ejecutivo de la auditoría.
- `AUDITORIA_MOVIL.md` — auditoría integral (arquitectura, auth, APIs, DB, storage, realtime, integraciones, veredicto).
- `REQUISITOS_MOVIL.md` — requisitos, RNF, restricciones y stack objetivo.
- `RF_EXISTENTES.md` — inventario de 42 RF existentes con metadatos y clasificación de reutilización.
- `RF_NUEVOS.md` — 15 RF nuevos por capacidades nativas (Mobile First) + priorización MoSCoW.
- `REUTILIZACION.md` — tabla de reutilización de servicios/hooks/contextos/RBAC/tipos/UI/API.
- `ARQUITECTURA_MOVIL.md` — arquitectura RN propuesta (stack, carpetas, providers, navegación, datos, diagrama).
- `OFFLINE_FIRST.md` — estrategia offline (caché, outbox, sync, conflictos, seguridad, librerías).
- `BASE_DATOS_MOVIL.md` — auditoría de Supabase/DB y cambios aditivos recomendados (push, delta sync, idempotencia).
- `MIGRACION_REACT_NATIVE.md` — guía de migración web→RN (puntos de acoplamiento, equivalencias, testing).
- `RIESGOS.md` — registro de riesgos técnicos/proceso/seguridad con mitigaciones.
- `ROADMAP.md` — roadmap por fases (0–7) con dependencias e hitos.

## Scaffolding proyecto móvil (`mobile/`)
- `README.md` — descripción del scaffold y estructura.
- `app/README.md` — rutas Expo Router (placeholder).
- `assets/.gitkeep`
- `src/components/.gitkeep`, `src/screens/.gitkeep`, `src/navigation/.gitkeep`, `src/services/.gitkeep`,
  `src/hooks/.gitkeep`, `src/contexts/.gitkeep`, `src/providers/.gitkeep`, `src/storage/.gitkeep`,
  `src/offline/.gitkeep`, `src/database/.gitkeep`, `src/config/.gitkeep`, `src/constants/.gitkeep`,
  `src/types/.gitkeep`, `src/theme/.gitkeep`, `src/utils/.gitkeep`
  — cada uno con una línea describiendo el propósito de la carpeta. Sin implementación.

## Auditoría de cambio (`changes/2026-07-04_auditoria-movil-react-native/`)
- `CHANGELOG.md`, `SUMMARY.md`, `FILES_CHANGED.md`

## Carpetas afectadas (creadas)
- `docs/mobile/`
- `mobile/`, `mobile/app/`, `mobile/assets/`, `mobile/src/**` (14 subcarpetas)
- `changes/2026-07-04_auditoria-movil-react-native/`
