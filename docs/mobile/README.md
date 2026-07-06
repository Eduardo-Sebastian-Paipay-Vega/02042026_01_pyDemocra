# Auditoría Móvil — Democra (React Web → React Native)

> Generado el 2026-07-04. Auditoría **de solo lectura**: no se modificó lógica del proyecto web, ni la base de datos, ni dependencias existentes. Todo lo aquí descrito es documentación y una propuesta de arquitectura para la **fase de implementación posterior**.

## Alcance

Evaluar la viabilidad de una app móvil en **React Native (Expo)** que reutilice al máximo la lógica de negocio, autenticación, backend, APIs, base de datos, permisos, roles, validaciones y modelos de datos del sistema web actual. La UI móvil será **independiente**.

## Índice de documentos

| # | Documento | Contenido |
|---|-----------|-----------|
| 1 | [AUDITORIA_MOVIL.md](./AUDITORIA_MOVIL.md) | Auditoría integral de arquitectura, auth, APIs, DB, storage, realtime, integraciones |
| 2 | [REQUISITOS_MOVIL.md](./REQUISITOS_MOVIL.md) | Requisitos y restricciones del proyecto móvil |
| 3 | [RF_EXISTENTES.md](./RF_EXISTENTES.md) | Inventario de RF existentes + clasificación de reutilización |
| 4 | [RF_NUEVOS.md](./RF_NUEVOS.md) | RF nuevos basados en capacidades nativas (Mobile First) |
| 5 | [REUTILIZACION.md](./REUTILIZACION.md) | Tabla de reutilización (componentes/servicios/hooks/contextos/modelos/APIs) |
| 6 | [ARQUITECTURA_MOVIL.md](./ARQUITECTURA_MOVIL.md) | Arquitectura RN propuesta (carpetas, navegación, estado, providers) |
| 7 | [OFFLINE_FIRST.md](./OFFLINE_FIRST.md) | Estrategia Offline First (caché, cola, sincronización, conflictos) |
| 8 | [BASE_DATOS_MOVIL.md](./BASE_DATOS_MOVIL.md) | Auditoría de Supabase/DB y cambios recomendados para móvil |
| 9 | [MIGRACION_REACT_NATIVE.md](./MIGRACION_REACT_NATIVE.md) | Guía técnica de migración web → RN |
| 10 | [RIESGOS.md](./RIESGOS.md) | Riesgos técnicos y de negocio con mitigaciones |
| 11 | [ROADMAP.md](./ROADMAP.md) | Roadmap por fases |

## Resumen de un vistazo

- **Producto:** SaaS multi-tenant / multi-industria de gestión para ONG (industria activa: `ong`). Plataforma peruana (validación RUC/SUNAT).
- **Stack web:** Vite + React 18 + TypeScript, React Router 7, Supabase JS, MUI + Radix + Tailwind 4, Express 5 (API de seguridad).
- **Capa de datos:** Supabase Postgres con **8+ esquemas** (`public`, `ong`, `rrhh`, `clinico`, `comunicaciones`, `finanzas`, `auditoria`, `academico`) y ACE (Access Control Engine). Acceso gobernado por **RLS** y funciones RPC (`fn_has_permission`, `fn_is_tenant_admin`, `fn_current_tenant_id`).
- **Reutilizable en móvil:** ~**70-80%** de la lógica (servicios, tipos, validaciones, permisos, hooks de datos) es agnóstica de plataforma o adaptable con bajo esfuerzo.
- **No reutilizable:** capa de presentación (100% web: MUI, Radix, HTML/CSS, `recharts`, `motion`) — debe reconstruirse con componentes nativos.
- **Punto crítico:** el acceso directo a Supabase desde el cliente (patrón actual) es viable en RN, pero requiere resolver **persistencia de sesión con `AsyncStorage`/SecureStore** y adaptar la subida de archivos (`File` → `FormData`/base64).
