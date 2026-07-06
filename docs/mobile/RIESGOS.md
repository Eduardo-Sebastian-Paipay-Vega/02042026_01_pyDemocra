# REGISTRO DE RIESGOS — Migración a React Native

Fecha: 2026-07-04. Escala: Probabilidad (B/M/A) × Impacto (B/M/A).

## 1. Técnicos

| ID | Riesgo | Prob | Impacto | Mitigación |
|----|--------|------|---------|-----------|
| R-01 | **Duplicación de código** entre `src/modules/ong` y `ONG/src/app` ya existe; añadir móvil triplica el drift | A | A | Extraer lógica a `packages/core` (monorepo) antes de escalar; una sola fuente de verdad. |
| R-02 | Acoplamiento a `File`/DOM en Storage y previews | A | M | Adaptadores de picker RN documentados (MIGRACION §2.2). |
| R-03 | Persistencia de sesión insegura si se usa AsyncStorage plano | M | A | SecureStore como storage de Supabase Auth. |
| R-04 | Ausencia de caché normalizada (hooks con `useState/useEffect`) | A | M | Introducir TanStack Query en móvil; no portar el patrón actual. |
| R-05 | Offline/sync: conflictos y duplicados | M | A | Outbox idempotente (`client_operation_id`), backoff, bandeja de conflictos (OFFLINE_FIRST). |
| R-06 | Falta de `updated_at/deleted_at` uniforme para delta sync | M | M | Auditoría por tabla; añadir columnas aditivas (BASE_DATOS_MOVIL §6.2). |
| R-07 | Datos sensibles (clínico/financiero) cacheados en dispositivo | B | A | Política de no-caché + cifrado si aplica; purga en logout. |
| R-08 | Push requiere infra nueva (tabla tokens + Edge Function) | M | M | Planificar como fase con su migración; usar Expo Push. |
| R-09 | `device_fingerprint`/UA distintos en móvil pueden alterar el motor de riesgo | M | M | Definir fingerprint estable (`expo-device`); coordinar reglas con el server. |
| R-10 | Login por PIN de terminal no mapea a móvil de usuario | B | B | Rediseñar o excluir del MVP (RF-AUTH-05). |
| R-11 | Credencial ID por canvas (web) no portable | M | M | Rehacer con `react-native-svg`/QR (RF-NEW-06). |
| R-12 | recharts/motion sin equivalente directo | M | B | `victory-native` + `reanimated`. |
| R-13 | Deriva de tipos `AppDatabase` si la DB cambia | M | M | Regenerar tipos en CI; compartir en `packages/core`. |

## 2. Proceso / proyecto

| ID | Riesgo | Prob | Impacto | Mitigación |
|----|--------|------|---------|-----------|
| R-14 | **Sin suite de tests** en el repo actual | A | A | Añadir tests al menos en `packages/core` antes de compartir; smoke E2E móvil. |
| R-15 | Extracción a monorepo rompe el web | M | A | Migración incremental + `tsc --noEmit` verde + revisión; no cambiar comportamiento. |
| R-16 | Regla `CLAUDE.md` (auditoría + push por cambio) no seguida en fase de implementación | M | M | Cada cambio importante crea `changes/` + Conventional Commit + push tras verificación. |
| R-17 | Alcance del MVP se dispara (40 pantallas) | A | M | MoSCoW: MVP = operación de campo (RF_NUEVOS §prioridad). |
| R-18 | Publicación en stores (revisión App Store/Play, permisos) | M | M | Preparar declaraciones de permisos, privacidad y build EAS con antelación. |

## 3. Seguridad / cumplimiento

| ID | Riesgo | Prob | Impacto | Mitigación |
|----|--------|------|---------|-----------|
| R-19 | Fuga de PII entre tenants por caché mal purgada | B | A | Purga total en logout y cambio de tenant; claves de query con `tenantId`. |
| R-20 | Bypass de política financiera offline | B | M | Respetar último `financialPolicy` conocido; bloquear captura si suspendido. |
| R-21 | Registro de acceso sensible no generado en móvil | M | A | Reusar el mismo flujo server-side; no cachear lo sensible. |

## 4. Top 5 a vigilar

1. **R-01 / R-15** — deuda de duplicación y extracción segura a monorepo.
2. **R-05** — corrección del motor offline/sync.
3. **R-14** — cobertura de pruebas antes de compartir lógica.
4. **R-07 / R-19 / R-21** — manejo de datos sensibles y aislamiento por tenant.
5. **R-08 / R-09** — infra de push y compatibilidad con el motor de riesgo.
