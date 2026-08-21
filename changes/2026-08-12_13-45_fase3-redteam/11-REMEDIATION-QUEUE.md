# 11 - REMEDIATION QUEUE & ACTION PLAN

## 1. Acciones Manuales Externas Requeridas (Prioridad P0)

1. **Rotación de `SUPABASE_SERVICE_ROLE_KEY`:**
   - **Plataforma:** Console Cloud de Supabase (`https://supabase.com/dashboard/project/qafvnjoqvdtnrdvlnwco/settings/api`).
   - **Instrucción:** Hacer clic en "Rotate API Key" para `service_role`.
   - **Paso Secundario:** Reemplazar el secreto en `.env` local y en el dashboard de despliegue de Vercel.

2. **Rotación de `RESEND_API_KEY`:**
   - **Plataforma:** Panel de Resend (`https://resend.com/api-keys`).
   - **Instrucción:** Revocar el token actual y generar una nueva API Key.
   - **Paso Secundario:** Actualizar `.env` y Vercel.

---

## 2. Recomendaciones de Arquitectura Futura (Prioridad P2)
- **Cookies `HttpOnly` para SPA:** Evaluar la migración a un esquema Backend-For-Frontend (BFF) o cookies HttpOnly para eliminar el almacenamiento del token JWT en `localStorage`.
