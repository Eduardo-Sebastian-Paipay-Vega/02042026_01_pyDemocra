# ROADMAP — App móvil React Native

Fecha: 2026-07-04. Fases incrementales; cada fase entrega valor verificable. Estimaciones orientativas (equipo pequeño), a ajustar en planificación.

## Fase 0 — Auditoría ✅ (esta entrega)
- Auditoría integral, RF existentes/nuevos, reutilización, DB, offline, arquitectura, riesgos.
- Estructura inicial `/mobile` (scaffolding).
- **Salida:** `docs/mobile/**` + `mobile/**` (sin lógica).

## Fase 1 — Preparación y base compartida (1–2 semanas)
- Decidir monorepo (pnpm/turborepo) vs. puente rápido.
- Extraer `packages/core` (services, tipos, RBAC, bootstrap, errores) sin cambiar el web; `tsc` verde.
- Inicializar proyecto Expo + TypeScript en `/mobile`; configurar `EXPO_PUBLIC_*` y validación de env.
- Cliente Supabase RN con SecureStore; probar `signInWithPassword` + `bootstrapTenantContext`.
- **Salida:** login funcional + contexto de tenant en móvil.

## Fase 2 — Arquitectura y navegación (1–2 semanas)
- Providers (Query, Supabase, Auth guard, Tenant, Theme, Sync).
- Navegación por tabs/stacks con guards por permiso (reutilizando metadata del registry).
- Design system nativo base (theme, componentes atómicos, listas).
- Pantalla Home con KPIs (RF-HOME-01) en modo online.
- **Salida:** navegación completa + una vertical de lectura online.

## Fase 3 — Verticales de campo (2–4 semanas)
- Operación: Actividades, Asistencias, Horas, Evidencias (online).
- Personas: Voluntarios y Beneficiarios (lectura + alta básica).
- Notificaciones: historial + realtime.
- Adaptador de Storage nativo (evidencias/avatares).
- **Salida:** MVP operativo online.

## Fase 4 — Migración de módulos restantes (2–4 semanas)
- Aprobaciones, Admisión, Recursos (inventario/finanzas), Gobernanza, Ajustes/ACE.
- MFA/riesgo integrados con la API Express; biometría (RF-NEW-05).
- **Salida:** paridad funcional priorizada con el web.

## Fase 5 — Offline First (3–5 semanas)
- SQLite + TanStack Query persistida; outbox idempotente.
- Sync automática/manual, estado de sync, bandeja de conflictos (RF-NEW-04/11).
- Cambios DB aditivos (`updated_at/deleted_at`, `client_operation_id`, delta) con su migración/auditoría.
- **Salida:** captura de campo sin conexión con sincronización confiable.

## Fase 6 — Mobile First + Testing (2–4 semanas)
- QR asistencia (RF-NEW-01), cámara+GPS en evidencias (RF-NEW-02), push (RF-NEW-03), deep links (RF-NEW-07), galería/caché de imágenes.
- Tests: unit (core), componentes (RNTL), E2E (Maestro/Detox), contrato API.
- Telemetría (Sentry) y hardening.
- **Salida:** app pulida, medible y probada.

## Fase 7 — Publicación (1–2 semanas)
- Build EAS (iOS/Android), íconos/splash, permisos y política de privacidad.
- Beta (TestFlight / Play Internal), correcciones.
- Publicación en App Store y Google Play; OTA para iteración.
- **Salida:** app en tiendas + proceso de release.

---

## Dependencias entre fases

```
F0 ─► F1 ─► F2 ─► F3 ─► F4 ─► F6 ─► F7
                   └────► F5 ─────►┘   (F5 puede solaparse con F4; requerida antes de F7 para RF-NEW-04)
```

## Hitos de verificación (por `CLAUDE.md`)

Cada fase importante: carpeta `changes/YYYY-MM-DD_HH-MM_*` con `CHANGELOG.md`/`SUMMARY.md`/`FILES_CHANGED.md`, compilación verde, pruebas disponibles ejecutadas, Conventional Commit y push a `origin/main`.
