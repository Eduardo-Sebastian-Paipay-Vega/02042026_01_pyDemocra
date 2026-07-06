# REQUISITOS DEL PROYECTO MÓVIL

Fecha: 2026-07-04.

## 1. Objetivo del producto móvil

App nativa (iOS + Android) para operar en campo la gestión de la ONG: registro/consulta de voluntarios y beneficiarios, asistencia, horas, evidencias, aprobaciones, notificaciones y credenciales — con **experiencia móvil independiente** y aprovechamiento de capacidades nativas.

## 2. Requisitos no funcionales (RNF)

| ID | Requisito | Detalle |
|----|-----------|---------|
| RNF-01 | Reutilización de backend | 100% del backend (Supabase + API Express) sin duplicar reglas de seguridad. |
| RNF-02 | Reutilización de lógica | ≥70% de servicios/tipos/validaciones/permisos compartidos con web. |
| RNF-03 | Seguridad | Sesión en almacenamiento seguro (SecureStore/Keychain/Keystore). RLS + MFA OTP + motor de riesgo aplicados igual que en web. |
| RNF-04 | Multi-tenant | Aislamiento por tenant garantizado por RLS; el cliente nunca decide el aislamiento. |
| RNF-05 | Offline First | Lectura y captura de datos sin conexión, con cola de sincronización y resolución de conflictos. |
| RNF-06 | Rendimiento | Arranque < 3 s; listas virtualizadas; navegación fluida (60 fps). |
| RNF-07 | Compatibilidad | iOS 15+ / Android 8+ (API 26+). |
| RNF-08 | Observabilidad | Logs de error + telemetría (Sentry) y trazas de sincronización. |
| RNF-09 | Accesibilidad | Escalado de fuente, contraste, labels de accesibilidad. |
| RNF-10 | i18n | Español (base), preparado para más idiomas. |

## 3. Restricciones (del enunciado y del proyecto)

- **NO** modificar la lógica del proyecto web.
- **NO** romper compatibilidad.
- **NO** eliminar archivos existentes.
- **NO** cambiar la base de datos en esta fase (solo documentar cambios recomendados).
- **NO** actualizar dependencias salvo que sea estrictamente necesario y documentado.
- Todo cambio propuesto queda documentado antes de implementarse.

## 4. Stack objetivo recomendado (a confirmar en implementación)

| Área | Elección recomendada | Motivo |
|------|----------------------|--------|
| Framework | **Expo (SDK reciente) + React Native** | DX, OTA, módulos nativos listos (cámara, biometría, notificaciones). |
| Lenguaje | TypeScript | Consistencia con web; reutilizar tipos `AppDatabase`. |
| Navegación | **Expo Router** (file-based) o React Navigation | Análogo a rutas web; deep links. |
| Estado servidor | **TanStack Query** | Caché, reintentos, persistencia offline. |
| Estado cliente | Context API (reutilizado) + Zustand si hace falta | Bajo boilerplate. |
| Datos backend | `@supabase/supabase-js` (ya en el repo) | Mismo SDK que web. |
| Sesión segura | `expo-secure-store` como storage de Supabase Auth | Tokens fuera de AsyncStorage plano. |
| Offline DB | **SQLite** (`expo-sqlite` / OP-SQLite / WatermelonDB) | Persistencia local estructurada. |
| Formularios | `react-hook-form` (ya en el repo) | Reutilizable en RN. |
| Fechas | `date-fns` (ya en el repo) | Reutilizable. |
| Push | `expo-notifications` (FCM/APNs) | Notificaciones reales. |

## 5. Criterios de aceptación de la fase de auditoría (esta entrega)

- [x] Auditoría integral de arquitectura, auth, APIs, DB, storage, realtime e integraciones.
- [x] Inventario de RF existentes con clasificación de reutilización.
- [x] Catálogo de RF nuevos (Mobile First) con metadatos.
- [x] Tabla de reutilización de artefactos.
- [x] Estrategia Offline First.
- [x] Auditoría de base de datos para móvil.
- [x] Arquitectura RN propuesta y estructura `/mobile` inicial (sin implementación).
- [x] Roadmap por fases y registro de riesgos.
