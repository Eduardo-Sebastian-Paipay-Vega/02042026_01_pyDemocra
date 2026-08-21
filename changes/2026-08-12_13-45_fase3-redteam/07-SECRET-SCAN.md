# 07 - SECRET SCANNING & EXPOSURE AUDIT (SECRET-SCAN)

## 1. Escaneo en Bundles del Frontend (`ong/src/`)
- **Herramienta:** Búsqueda recursiva de patrones de claves y variables de entorno.
- **Resultado:**
  - `VITE_SUPABASE_URL` -> Presente (Pública por diseño).
  - `VITE_SUPABASE_ANON_KEY` -> Presente (Pública por diseño, protegida por RLS).
  - `SUPABASE_SERVICE_ROLE_KEY` -> **0 apariciones en `ong/src/`**.
  - `RESEND_API_KEY` -> **0 apariciones en `ong/src/`**.
  - `RUC_API_TOKEN` -> **0 apariciones en `ong/src/`**.
  - `MFA_OTP_PEPPER` -> **0 apariciones en `ong/src/`**.

---

## 2. Escaneo en Repuestas HTTP y Logs
- Se verificó que los controladores Express no retornan las variables de entorno `config` en respuestas de error.
- En `server/routes/onboarding.js` (Línea 254), los logs de error ocultan información sensible.

---

## 3. Estado de Rotación Externa
- `SUPABASE_SERVICE_ROLE_KEY`: **PENDING EXTERNAL ACTION** (Requiere rotación manual en el Dashboard Cloud de Supabase).
- `RESEND_API_KEY`: **PENDING EXTERNAL ACTION**.
