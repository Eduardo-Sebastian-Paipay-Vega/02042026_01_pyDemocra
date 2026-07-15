# Reporte de Pruebas Unitarias y Cobertura de Código

## 1. Información General del Proceso

| Parámetro | Detalle |
| --- | --- |
| **Proyecto** | `vanilla-migrated` |
| **Versión** | `1.0.0` |
| **Framework de Pruebas** | Jest |
| **Modo de Ejecución** | `--runInBand` (Secuencial) |
| **Estado de la Suite** | 🟢 **PASS** (Exitoso) |
| **Tiempo de Ejecución** | `19.375 s` |

---

## 2. Comando Ejecutado

```bash
PS D:\espelo> npm run test

> vanilla-migrated@1.0.0 test
> jest --runInBand

```

---

## 3. Detalle de Ejecución de Test Suites

Se ejecutaron un total de **16 test suites** con éxito. A continuación se detalla el listado de archivos de prueba validados:

| Estado | Ruta de la Suite de Pruebas | Duración / Notas |
| --- | --- | --- |
| 🟢 PASS | `server/routes/iam.test.js` | 8.21 s |
| 🟢 PASS | `server/routes/sedes.test.js` | - |
| 🟢 PASS | `server/routes/audit.test.js` | - |
| 🟢 PASS | `server/routes/auth.test.js` | - |
| 🟢 PASS | `server/routes/onboarding.test.js` | - |
| 🟢 PASS | `server/services/email/utils.test.ts` | - |
| 🟢 PASS | `server/utils/http.test.js` | - |
| 🟢 PASS | `server/utils/security.test.js` | - |
| 🟢 PASS | `server/security/risk-engine.test.js` | - |
| 🟢 PASS | `server/services/email/email.service.test.ts` | - |
| 🟢 PASS | `server/security/ai-client.test.js` | - |
| 🟢 PASS | `server/middleware/financial-state.test.js` | - |
| 🟢 PASS | `server/security/audit.test.js` | - |
| 🟢 PASS | `server/services/email/config/email.config.test.ts` | - |
| 🟢 PASS | `server/utils/tenant-scope.test.js` | - |
| 🟢 PASS | `server/services/otp-mailer.test.js` | - |

---

## 4. Resumen Global de Cobertura (Coverage Summary)

El proyecto cuenta con un excelente nivel general de cobertura de código, superando el umbral del **89%** en todos los aspectos clave.

| Métrica | Cobertura | Detalle Cuantitativo | Estado |
| --- | --- | --- | --- |
| **Sentencias (Statements)** | 92.44% | 1052 / 1138 | Excelente (🟢) |
| **Ramas (Branches)** | 89.70% | 1072 / 1195 | Excelente (🟢) |
| **Funciones (Functions)** | 89.47% | 136 / 152 | Excelente (🟢) |
| **Líneas (Lines)** | 93.87% | 981 / 1045 | Excelente (🟢) |

---

## 5. Reporte Detallado de Cobertura por Directorio y Archivo

> **Leyenda de Cobertura:** 🟢 `90% - 100%` (Excelente) | 🟡 `70% - 89%` (Aceptable) | 🔴 `0% - 69%` (Requiere Atención urgente)

| Ruta de Archivo / Directorio | % Sentencias | % Ramas | % Funciones | % Líneas | Líneas No Cubiertas |
| --- | --- | --- | --- | --- | --- |
| **`All files`** | **92.44%** | **89.70%** | **89.47%** | **93.87%** |  |
| 📂 **`server`** | **63.79%** | **80.95%** | **37.50%** | **67.27%** |  |
| 📄     `config.js` | 66.66% | 90.56% | 100.00% | 88.88% | 40 |
| 📄     `index.js` | 63.04% | 30.00% | 16.66% | 63.04% | 69-71, 81, 99-100, 159, 176-192, 205-209 |
| 📂 **`server/middleware`** | **100.00%** | **95.65%** | **100.00%** | **100.00%** |  |
| 📄     `financial-state.js` | 100.00% | 95.65% | 100.00% | 100.00% | 15 |
| 📂 **`server/routes`** | **94.90%** | **89.24%** | **97.50%** | **97.61%** |  |
| 📄     `audit.js` | 98.24% | 91.37% | 100.00% | 100.00% | 71, 89, 113-150, 167 |
| 📄     `auth.js` | 97.97% | 88.77% | 88.88% | 99.29% | 549 |
| 📄     `iam.js` | 90.41% | 84.92% | 100.00% | 95.20% | 113, 123, 152, 162, 181, 211, 221 |
| 📄     `onboarding.js` | 98.94% | 91.53% | 100.00% | 100.00% | 17-24, 34, 65, 101, 156, 162, 224, 226 |
| 📄     `sedes.js` | 91.56% | 93.75% | 100.00% | 94.52% | 65, 99, 147, 178 |
| 📂 **`server/security`** | **99.01%** | **98.39%** | **100.00%** | **100.00%** |  |
| 📄     `ai-client.js` | 100.00% | 100.00% | 100.00% | 100.00% |  |
| 📄     `audit.js` | 100.00% | 100.00% | 100.00% | 100.00% |  |
| 📄     `risk-engine.js` | 98.54% | 97.78% | 100.00% | 100.00% | 21, 205, 348-352, 730 |
| 📂 **`server/services`** | **100.00%** | **81.81%** | **100.00%** | **100.00%** |  |
| 📄     `otp-mailer.js` | 100.00% | 81.81% | 100.00% | 100.00% | 18, 46-57 |
| 📂 **`server/services/email`** | **73.58%** | **69.84%** | **77.77%** | **72.54%** |  |
| 📄     `email.service.js` | 64.70% | 43.47% | 80.00% | 64.70% | 23-68 |
| 📄     `index.js` | 0.00% | 0.00% | 0.00% | 0.00% | *Todo el archivo* |
| 📄     `resend.client.js` | 16.66% | 0.00% | 0.00% | 16.66% | 12-21 |
| 📄     `utils.js` | 89.79% | 89.47% | 90.00% | 88.88% | 116, 125-133 |
| 📂 **`server/services/email/config`** | **100.00%** | **100.00%** | **100.00%** | **100.00%** |  |
| 📄     `email.config.js` | 100.00% | 100.00% | 100.00% | 100.00% |  |
| 📂 **`server/services/email/templates`** | **97.56%** | **63.41%** | **100.00%** | **100.00%** |  |
| 📄     `alert.js` | 100.00% | 50.00% | 100.00% | 100.00% | 17-40 |
| 📄     `audit.js` | 85.71% | 62.50% | 100.00% | 100.00% | 5, 33-57 |
| 📄     `invitation.js` | 100.00% | 66.66% | 100.00% | 100.00% | 6-18 |
| 📄     `layout.js` | 100.00% | 100.00% | 100.00% | 100.00% |  |
| 📄     `notification.js` | 100.00% | 50.00% | 100.00% | 100.00% | 8-14 |
| 📄     `otp.js` | 100.00% | 50.00% | 100.00% | 100.00% | 5-6 |
| 📄     `resetPassword.js` | 100.00% | 75.00% | 100.00% | 100.00% | 5 |
| 📄     `verification.js` | 100.00% | 75.00% | 100.00% | 100.00% | 5 |
| 📄     `welcome.js` | 100.00% | 100.00% | 100.00% | 100.00% |  |
| 📂 **`server/test-utils`** | **71.42%** | **41.66%** | **73.33%** | **71.42%** |  |
| 📄     `mockSupabase.js` | 71.42% | 41.66% | 73.33% | 71.42% | 14, 18, 43-49 |
| 📂 **`server/utils`** | **100.00%** | **100.00%** | **100.00%** | **100.00%** |  |
| 📄     `http.js` | 100.00% | 100.00% | 100.00% | 100.00% |  |
| 📄     `security.js` | 100.00% | 100.00% | 100.00% | 100.00% |  |
| 📄     `tenant-scope.js` | 100.00% | 100.00% | 100.00% | 100.00% |  |

---

## 6. Estadísticas y Resumen de Ejecución

```
Test Suites: 16 passed, 16 total
Tests:       334 passed, 334 total
Snapshots:   0 total
Time:        19.375 s
Ran all test suites.

```

---

## 7. Análisis de Cobertura y Puntos Críticos a Resolver

A pesar de que el indicador global (`All files`) refleja una cobertura excelente del **92.44%**, existen archivos con baja o nula cobertura que representan áreas críticas de riesgo:

### 🔴 Cobertura Nula o Muy Baja

1. **`server/services/email/index.js` (0% Cobertura)**
* **Problema:** No tiene ningún test asociado.
* **Acción:** Escribir pruebas de integración/importación para verificar que expone los clientes y servicios correctamente.


2. **`server/services/email/resend.client.js` (16.66% Cobertura)**
* **Problema:** Falta cobertura en las líneas `12-21`. Las llamadas a la API de Resend o la inicialización del cliente no están cubiertas.
* **Acción:** Crear mocks para la API de `resend` y probar los escenarios de éxito y error al instanciar e invocar el cliente.


3. **`server/services/email/email.service.js` (64.70% Cobertura)**
* **Problema:** Falta cobertura en la lógica principal de envío de correos (líneas `23-68`).
* **Acción:** Asegurar la cobertura de flujos condicionales y capturas de excepciones para el envío de diferentes tipos de plantillas.


4. **`server/index.js` (63.04% Cobertura)**
* **Problema:** Muestra baja cobertura en sentencias y una cobertura crítica de ramas del **30.00%** (líneas `69-71`, `81`, `99-100`, `159`, `176-192`, `205-209`).
* **Acción:** Configurar pruebas de inicialización del servidor (Bootstrap) evaluando diferentes variables de entorno para cubrir ramas condicionales.



### 🟡 Cobertura Media (Oportunidades de Refactorización)

* **`server/test-utils/mockSupabase.js` (71.42% Cobertura):**
* Falta cubrir líneas `14, 18, 43-49`. Al ser un utilitario de pruebas, es importante que todos sus mocks devuelvan los estados esperados para dar certidumbre a los tests reales.