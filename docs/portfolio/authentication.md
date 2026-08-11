# 🔐 Autenticación y Autorización — Democra

## Flujo completo de autenticación

```
┌──────────────────────────────────────────────────────────┐
│ 1. INICIO DE SESIÓN                                       │
│                                                          │
│ Usuario → email + contraseña                             │
│     ↓                                                    │
│ Frontend → supabase.auth.signInWithPassword()            │
│     ↓                                                    │
│ Supabase Auth → verifica credenciales                    │
│     ↓                                                    │
│ JWT (access_token) → almacenado en localStorage          │
│ con storageKey: 'sb-democra-auth-token'                  │
└──────────────────────────────────────────────────────────┘
         ↓
┌──────────────────────────────────────────────────────────┐
│ 2. EVALUACIÓN DE RIESGO (Zero-Trust)                      │
│                                                          │
│ Frontend → POST /api/auth/risk-evaluate                  │
│ Headers: Authorization: Bearer <jwt>                     │
│ Body: { event, context_signals }                         │
│     ↓                                                    │
│ API: resolveAuthContext(token)                           │
│     → user (de auth.users)                               │
│     → profile (de public.profiles)                       │
│     → tenant_id                                          │
│     ↓                                                    │
│ Risk Engine evalúa:                                      │
│     IP + geolocalización                                 │
│     User-Agent                                           │
│     Horario                                              │
│     Historial de intentos                                │
│     Permisos requeridos                                  │
│     Ajuste de IA (GPT-4.1-mini)                         │
│     ↓                                                    │
│ Decisión: ALLOW | REQUIRE_OTP | BLOCK                    │
└──────────────────────────────────────────────────────────┘
         ↓
┌──────────────────────────────────────────────────────────┐
│ 3. MFA / OTP (si REQUIRE_OTP)                             │
│                                                          │
│ API genera código 6 dígitos                              │
│     → HMAC con MFA_OTP_PEPPER                            │
│     → Almacena hash en BD (nunca plaintext)              │
│     → TTL configurable (default 10 min)                  │
│     ↓                                                    │
│ Resend API envía email con código                        │
│     ↓                                                    │
│ Usuario ingresa código en frontend                       │
│     ↓                                                    │
│ Frontend → POST /api/auth/step-up/verify-otp            │
│     ↓                                                    │
│ API verifica:                                            │
│     → safeCompare() (timing-safe, previene timing attack)│
│     → TTL no expirado                                    │
│     → Intentos no excedidos (MAX_PIN_ATTEMPTS)           │
│     ↓                                                    │
│ Éxito → createSessionFromVerifiedChallenge()             │
│ Fallo → incrementa contador, posible bloqueo temporal    │
└──────────────────────────────────────────────────────────┘
         ↓
┌──────────────────────────────────────────────────────────┐
│ 4. SESIÓN ESTABLECIDA                                     │
│                                                          │
│ JWT con tenant_id activo                                 │
│ Cada request:                                            │
│     → Frontend envía Bearer token                        │
│     → Backend: resolveAuthContext()                       │
│     → PostgreSQL: fn_current_tenant_id() vía auth.uid()  │
│     → RLS filtra automáticamente por tenant              │
└──────────────────────────────────────────────────────────┘
```

## Login por terminal (código de acceso)

Para operaciones presenciales en sedes:

```
1. Admin genera código de acceso de 8 caracteres
2. Operador de sede ingresa código + PIN de seguridad
3. POST /api/auth/terminal-login
4. API verifica:
   → Código existe y no expirado
   → PIN verificado con verifyPinHash()
   → Risk Engine evalúa contexto
5. Sesión creada para el usuario vinculado al código
```

## Modelo RBAC

```
Usuario
  └── user_roles_sedes
        ├── role_id    → roles → role_permissions → permission
        └── sede_id    → sedes (scope geográfico)

Verificación:
  fn_has_permission('modulo.accion', sede_id)
    → Consulta user_roles_sedes del usuario
    → Para cada role_id, verifica role_permissions
    → Si algún rol tiene el permiso → true
    → Si sede_id especificado, filtra por sede
```

### Permisos granulares (ejemplos reales)

| Permiso | Descripción |
|---|---|
| `settings.users.manage` | Gestionar usuarios del sistema |
| `settings.roles.manage` | Gestionar roles y permisos |
| `iam.users.manage` | Administrar identidades |
| `ace.links.manage` | Gestionar links de acceso |
| `operation.attendance.manage` | Gestionar asistencia |

## Reenvío de OTP

```
POST /api/auth/step-up/resend-otp
  → Invalida código anterior
  → Genera nuevo código
  → Envía por email
  → Rate limited (5/15min)
```

## Auditoría de autenticación

Cada evento de auth queda registrado:

```javascript
insertAuthEvent({
    event_type: 'login_success' | 'login_failed' | 'otp_sent' | 'otp_verified' | ...,
    user_id,
    ip_address: maskIp(ip),      // PII enmascarada
    user_agent: sanitizeUserAgent(ua),
    risk_score,
    decision,
    tenant_id,
})
```
