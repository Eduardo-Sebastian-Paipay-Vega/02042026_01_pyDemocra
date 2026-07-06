# CHANGELOG — Auditoría móvil (React Web → React Native)

- **Fecha y hora:** 2026-07-04
- **Autor:** Claude (Cowork)
- **Tipo de cambio:** Documentación + scaffolding (sin cambios de lógica ni de base de datos)

## Objetivo del cambio
Auditar de forma integral el sistema web actual para evaluar la viabilidad de una app móvil en React Native con máxima reutilización de lógica, y preparar la estructura inicial del proyecto móvil sin implementar funcionalidades.

## Contexto del problema
El producto (SaaS multi-tenant de gestión para ONG) existe solo como aplicación web (Vite + React + Supabase + API Express de seguridad). Se requiere una versión móvil con UI independiente que comparta backend, autenticación, APIs, base de datos, permisos, roles, validaciones y modelos de datos.

## Motivo de la modificación
Disponer de una base técnica documentada (auditoría, RF, reutilización, offline, arquitectura, riesgos, roadmap) y del esqueleto de carpetas `/mobile` para iniciar la implementación en una fase posterior con criterios claros.

## Solución implementada
- 11 documentos de auditoría en `docs/mobile/` + índice `README.md`.
- Estructura inicial `mobile/` (Expo Router `app/` + `src/**` con 14 subcarpetas) con placeholders auto-documentados. Sin lógica.
- Sin tocar el proyecto web, la base de datos ni las dependencias.

## Riesgos identificados
- Deuda de duplicación ya existente (`src/modules/ong` vs `ONG/src/app`); se recomienda `packages/core`.
- Acoplamientos web a resolver en implementación: sesión (`localStorage`→SecureStore), Storage (`File`→picker RN), env (`VITE_*`→`EXPO_PUBLIC_*`).
- Ausencia de suite de tests en el repo.
Detalle completo en `docs/mobile/RIESGOS.md`.

## Impacto esperado
Nulo sobre el sistema web en ejecución (solo se añaden archivos de documentación y un directorio `mobile/` sin build). Habilita la planificación e implementación móvil.

## Módulos afectados
Ninguno del código web. Se añaden: `docs/mobile/`, `mobile/`, `changes/2026-07-04_auditoria-movil-react-native/`.

## Dependencias involucradas
Ninguna nueva instalada. Se documentan dependencias futuras (Expo, TanStack Query, expo-secure-store, expo-sqlite, expo-notifications, etc.) para fases posteriores.

## Posibles efectos secundarios
Ninguno en runtime. `tsc`/`vite build` no incluyen `mobile/` ni `docs/`.

## Estado del cambio
**Completado** (fase de auditoría). La implementación móvil corresponde a fases posteriores del roadmap.
