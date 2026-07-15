# Reporte de Pruebas Unitarias y Cobertura de Código

## Información General

* **Proyecto:** `vanilla-migrated`
* **Versión:** `1.0.0`
* **Directorio de Trabajo:** `D:\espelo`
* **Entorno de Ejecución:** PowerShell (PS)
* **Framework de Pruebas:** Jest (con soporte TypeScript)

---

## Comando Ejecutado

```bash
PS D:\espelo> npm run test:coverage

> vanilla-migrated@1.0.0 test:coverage
> jest --coverage --runInBand

```

---

## Resumen de Ejecución

| Métrica | Resultado | Detalles |
| --- | --- | --- |
| **Suites de Pruebas** | **16 / 16 pasadas** | 100% completado |
| **Pruebas (Tests)** | **334 / 334 pasadas** | 100% completado |
| **Snapshots** | **0** | No se utilizan snapshots en esta ejecución |
| **Tiempo de Ejecución** | **17.237 s** | Tiempo estimado de Jest: 288 s |

---

## Suites de Pruebas Ejecutadas

A continuación se listan los archivos de prueba que se ejecutaron exitosamente de forma secuencial (`--runInBand`):

* `PASS` `server/routes/iam.test.js` (7.847 s)
* `PASS` `server/routes/audit.test.js`
* `PASS` `server/routes/sedes.test.js`
* `PASS` `server/routes/onboarding.test.js`
* `PASS` `server/routes/auth.test.js`
* `PASS` `server/services/email/email.service.test.ts`
* `PASS` `server/security/risk-engine.test.js`
* `PASS` `server/services/email/utils.test.ts`
* `PASS` `server/utils/http.test.js`
* `PASS` `server/utils/security.test.js`
* `PASS` `server/services/email/config/email.config.test.ts`
* `PASS` `server/security/audit.test.js`
* `PASS` `server/services/otp-mailer.test.js`
* `PASS` `server/security/ai-client.test.js`
* `PASS` `server/middleware/financial-state.test.js`
* `PASS` `server/utils/tenant-scope.test.js`

---

## Resumen de Cobertura Global

| Métrica | Porcentaje | Cobertura Absoluta |
| --- | --- | --- |
| **Sentencias (Statements)** | `92.44%` | 1052 / 1138 |
| **Ramas (Branches)** | `89.70%` | 1072 / 1195 |
| **Funciones (Functions)** | `89.47%` | 136 / 152 |
| **Líneas (Lines)** | `93.87%` | 981 / 1045 |

---

## Desglose de Cobertura por Archivo

| Archivo / Directorio | % Sentencias | % Ramas | % Funciones | % Líneas | Líneas No Cubiertas |
| --- | --- | --- | --- | --- | --- |
| **All files** | **92.44** | **89.70** | **89.47** | **93.87** |  |
| **`server`** | **63.79** | **80.95** | **37.50** | **67.27** |  |
| ├─ `config.js` | 66.66 | 90.56 | 100.00 | 88.88 | 40 |
| ├─ `index.js` | 63.04 | 30.00 | 16.66 | 63.04 | 69-71, 81, 99-100, 159, 176-192, 205-209 |
| **`server/middleware`** | **100.00** | **95.65** | **100.00** | **100.00** |  |
| ├─ `financial-state.js` | 100.00 | 95.65 | 100.00 | 100.00 | 15 |
| **`server/routes`** | **94.90** | **89.24** | **97.50** | **97.61** |  |
| ├─ `audit.js` | 98.24 | 91.37 | 100.00 | 100.00 | 71, 89, 113-150, 167 |
| ├─ `auth.js` | 97.97 | 88.77 | 88.88 | 99.29 | 549 |
| ├─ `iam.js` | 90.41 | 84.92 | 100.00 | 95.20 | 113, 123, 152, 162, 181, 211, 221 |
| ├─ `onboarding.js` | 98.94 | 91.53 | 100.00 | 100.00 | 17-24, 34, 65, 101, 156, 162, 224, 226 |
| ├─ `sedes.js` | 91.56 | 93.75 | 100.00 | 94.52 | 65, 99, 147, 178 |
| **`server/security`** | **99.01** | **98.39** | **100.00** | **100.00** |  |
| ├─ `ai-client.js` | 100.00 | 100.00 | 100.00 | 100.00 |  |
| ├─ `audit.js` | 100.00 | 100.00 | 100.00 | 100.00 |  |
| ├─ `risk-engine.js` | 98.54 | 97.78 | 100.00 | 100.00 | 21, 205, 348-352, 730 |
| **`server/services`** | **100.00** | **81.81** | **100.00** | **100.00** |  |
| ├─ `otp-mailer.js` | 100.00 | 81.81 | 100.00 | 100.00 | 18, 46-57 |
| **`server/services/email`** | **73.58** | **69.84** | **77.77** | **72.54** |  |
| ├─ `email.service.js` | 64.70 | 43.47 | 80.00 | 64.70 | 23-68 |
| ├─ `index.js` | 0.00 | 0.00 | 0.00 | 0.00 | *Todo el archivo sin cobertura* |
| ├─ `resend.client.js` | 16.66 | 0.00 | 0.00 | 16.66 | 12-21 |
| ├─ `utils.js` | 89.79 | 89.47 | 90.00 | 88.88 | 116, 125-133 |
| **`server/services/email/config`** | **100.00** | **100.00** | **100.00** | **100.00** |  |
| ├─ `email.config.js` | 100.00 | 100.00 | 100.00 | 100.00 |  |
| **`server/services/email/templates`** | **97.56** | **63.41** | **100.00** | **100.00** |  |
| ├─ `alert.js` | 100.00 | 50.00 | 100.00 | 100.00 | 17-40 |
| ├─ `audit.js` | 85.71 | 62.50 | 100.00 | 100.00 | 5, 33-57 |
| ├─ `invitation.js` | 100.00 | 66.66 | 100.00 | 100.00 | 6-18 |
| ├─ `layout.js` | 100.00 | 100.00 | 100.00 | 100.00 |  |
| ├─ `notification.js` | 100.00 | 50.00 | 100.00 | 100.00 | 8-14 |
| ├─ `otp.js` | 100.00 | 50.00 | 100.00 | 100.00 | 5-6 |
| ├─ `resetPassword.js` | 100.00 | 75.00 | 100.00 | 100.00 | 5 |
| ├─ `verification.js` | 100.00 | 75.00 | 100.00 | 100.00 | 5 |
| ├─ `welcome.js` | 100.00 | 100.00 | 100.00 | 100.00 |  |
| **`server/test-utils`** | **71.42** | **41.66** | **73.33** | **71.42** |  |
| ├─ `mockSupabase.js` | 71.42 | 41.66 | 73.33 | 71.42 | 14, 18, 43-49 |
| **`server/utils`** | **100.00** | **100.00** | **100.00** | **100.00** |  |
| ├─ `http.js` | 100.00 | 100.00 | 100.00 | 100.00 |  |
| ├─ `security.js` | 100.00 | 100.00 | 100.00 | 100.00 |  |
| ├─ `tenant-scope.js` | 100.00 | 100.00 | 100.00 | 100.00 |  |

---

## Análisis y Puntos de Mejora

### 🌟 Fortalezas del Proyecto

1. **Excelente cobertura global:** Supera el umbral del **92%** en Sentencias y Líneas generales, indicando una suite de pruebas madura y robusta.
2. **Capas críticas totalmente cubiertas:** Los módulos de **Seguridad** (`server/security`) y **Utilerías** (`server/utils`) se encuentran al **100% de cobertura**, garantizando la estabilidad en el núcleo del sistema.
3. **Controladores de Rutas sólidos:** La carpeta `server/routes` mantiene niveles excelentes de cobertura por encima del **94%**.

### ⚠️ Áreas de Atención Prioritaria (Deuda de Pruebas)

1. **Módulo de Correo Desatendido (`server/services/email`):**
* `server/services/email/index.js` tiene **0%** de cobertura en todas las métricas. Es necesario asegurar la exportación de módulos.
* `resend.client.js` cuenta con apenas un **16.66%** de cobertura. Las líneas de la `12-21` requieren pruebas mockeando las llamadas a la API de Resend.
* `email.service.js` tiene un **64.70%** de cobertura. El rango de líneas `23-68` no se está ejecutando en los tests unitarios.


2. **Punto de Entrada Principal del Servidor (`server/index.js`):**
* Registra una cobertura baja del **63.04%** con múltiples líneas descubiertas (rutas de inicialización, manejo de errores finales del proceso, etc.).


3. **Condicionales en Plantillas (`templates`):**
* Varios archivos de plantillas (`alert.js`, `notification.js`, `otp.js`, entre otros) tienen un **50.00%** de cobertura en Ramas (*Branches*), sugiriendo la falta de escenarios de prueba para los caminos alternativos de renderizado.