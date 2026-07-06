# Democra Mobile (React Native) — Estructura inicial

> **Estado:** scaffolding de Fase 0 (auditoría). **No contiene implementación.** Solo define la arquitectura de carpetas recomendada en `docs/mobile/ARQUITECTURA_MOVIL.md`. No afecta al proyecto web.

## Cómo se inicializará (fase posterior)

Este directorio albergará una app **Expo + React Native + TypeScript**. La inicialización real (Fase 1) ejecutará el bootstrap de Expo y añadirá dependencias. Aquí solo se documentan las carpetas y su propósito.

## Estructura

```
mobile/
├── app/          # Rutas (Expo Router). Grupos (auth) y (tabs).
└── src/
    ├── components/   # UI atómica nativa
    ├── screens/      # Pantallas complejas
    ├── navigation/   # Config de navegación, guards, deep links
    ├── services/     # Adaptadores/reexport de la capa de negocio compartida
    ├── hooks/        # Hooks móviles (TanStack Query sobre servicios)
    ├── contexts/     # Tenant, Theme, Sync
    ├── providers/    # Query, Supabase, AuthGuard
    ├── storage/      # SecureStore (tokens), MMKV/AsyncStorage, file cache
    ├── offline/      # Cola de operaciones, motor de sync, conflictos
    ├── database/     # Esquema SQLite local, repositorios
    ├── config/       # env EXPO_PUBLIC_*, endpoints, buckets
    ├── constants/    # permisos, claves de query, rutas
    ├── types/        # tipos móviles + reexport AppDatabase
    ├── theme/        # tokens de diseño, light/dark
    └── utils/        # helpers puros
└── assets/       # íconos, fuentes, imágenes
```

## Principios (ver `docs/mobile/`)

1. Reutilizar backend (Supabase + API Express) sin duplicar seguridad.
2. Reutilizar lógica (services/tipos/RBAC/bootstrap) idealmente vía `packages/core`.
3. UI nativa independiente.
4. Offline First y notificaciones push.
5. Tokens en almacenamiento seguro; datos sensibles nunca en caché local.

Documentación completa: [`../docs/mobile/README.md`](../docs/mobile/README.md).
