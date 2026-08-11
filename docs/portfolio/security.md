# 🛡️ Seguridad — Democra

## Modelo de seguridad Zero-Trust

Democra implementa un modelo de seguridad **Zero-Trust** donde ninguna petición se considera segura por defecto. Cada acción se evalúa en función de señales contextuales en tiempo real.

## Capas de protección

```
┌───────────────────────────────────────────┐
│ 1. TRANSPORTE                             │
│    HSTS (31536000s, includeSubDomains)    │
│    Vercel Edge → HTTPS obligatorio        │
├───────────────────────────────────────────┤
│ 2. HTTP HEADERS (Helmet)                  │
│    Content-Security-Policy (estricto)     │
│    X-Frame-Options: DENY                  │
│    X-Content-Type-Options: nosniff        │
│    Referrer-Policy: strict-origin-when-   │
│      cross-origin                         │
│    Permissions-Policy: camera=(),         │
│      microphone=(), geolocation=()        │
│    X-Permitted-Cross-Domain-Policies: none│
├───────────────────────────────────────────┤
│ 3. CORS                                   │
│    Allowlist explícita (no wildcard *)    │
│    Default: democra.pro, localhost:5173   │
│    Extensible via ALLOWED_ORIGINS env     │
├───────────────────────────────────────────┤
│ 4. RATE LIMITING                           │
│    General: 100 req / 15 min / IP         │
│    Auth:    5 intentos / 15 min / IP      │
│    skipSuccessfulRequests: true (auth)    │
├───────────────────────────────────────────┤
│ 5. RISK ENGINE (767 líneas)               │
│    Señales: IP, UA, geo, horario, historial│
│    IA: ajuste dinámico de score           │
│    Decisión: ALLOW | REQUIRE_OTP | BLOCK  │
├───────────────────────────────────────────┤
│ 6. MFA / OTP                              │
│    Código 6 dígitos (HMAC + pepper)       │
│    TTL configurable (default 10 min)      │
│    Timing-safe comparison (safeCompare)   │
│    Max intentos + bloqueo temporal        │
├───────────────────────────────────────────┤
│ 7. FINANCIAL STATE GUARD                   │
│    Middleware bloquea escrituras en        │
│    tenants suspendidos (FIN-001/FIN-002)  │
├───────────────────────────────────────────┤
│ 8. RLS (PostgreSQL)                        │
│    Aislamiento por tenant_id              │
│    fn_current_tenant_id() + policies      │
│    Última línea de defensa                │
├───────────────────────────────────────────┤
│ 9. AUDITORÍA                               │
│    Log inmutable de eventos               │
│    PII enmascarada (maskEmail, maskIp)    │
│    Resumen forense asistido por IA        │
└───────────────────────────────────────────┘
```

## Risk Engine — `server/security/risk-engine.js`

El motor de riesgo es el componente central de seguridad con **767 líneas** de lógica defensiva.

### Señales evaluadas

| Señal | Cómo se obtiene | Impacto en score |
|---|---|---|
| IP del cliente | `getClientIp()` via X-Forwarded-For + trust proxy | IP conocida = bajo riesgo |
| User-Agent | `sanitizeUserAgent()` — limpieza y normalización | UA sospechoso = +riesgo |
| País | `getClientCountry()` via headers de Vercel/Cloudflare | País inesperado = +riesgo |
| Horario | Comparación con horario laboral configurado | Fuera de horario = +riesgo |
| Historial | Queries a audit_log / auth_events | Intentos fallidos recientes = +riesgo |
| Permisos | `hasRequiredPermission()` via RPC o query directa | Sin permiso = BLOCK |

### Flujo de decisión

```
evaluateRiskEngine(signals)
    ↓
Calcular baseScore (reglas determinísticas)
    ↓
Si OPENAI_API_KEY configurada:
    explainRiskDecisionWithAi(event, baseScore, reasonCodes, rawSignals)
    → adjustment [-10, +10] (clamped)
    → user_message contextual
    → extra_reason_codes
    ↓
score = baseScore + adjustment
    ↓
score >= THRESHOLD_BLOCK  → BLOCK
score >= THRESHOLD_OTP    → REQUIRE_OTP
score < THRESHOLD_OTP     → ALLOW
```

### Fallback determinístico

Si la IA no responde (API key no configurada, error de red, timeout):

```javascript
return {
    adjustment: 0,
    user_message: "Detectamos señales de seguridad y aplicaremos validaciones adicionales...",
    extra_reason_codes: [],
};
```

El sistema **nunca** depende exclusivamente de la IA para decisiones de seguridad.

## MFA / OTP

### Generación segura

```javascript
// server/utils/security.js
generateOtpCode()     // Código de 6 dígitos criptográficamente seguro
hashOtp(code, pepper) // HMAC con pepper configurado (MFA_OTP_PEPPER)
```

### Verificación timing-safe

```javascript
safeCompare(a, b) // Comparación en tiempo constante para prevenir timing attacks
```

### Configuración

| Variable | Default | Descripción |
|---|---|---|
| `MFA_OTP_PEPPER` | `dev-local-pepper` | Salt para HMAC del OTP |
| `MFA_OTP_TTL_MINUTES` | 10 | Tiempo de vida del código |
| `MAX_PIN_ATTEMPTS` | 5 | Intentos antes de bloqueo |
| `PIN_BLOCK_MINUTES` | 15 | Duración del bloqueo temporal |
| `RISK_TEMP_BLOCK_MINUTES` | 15 | Bloqueo por riesgo alto |
| `EXPOSE_DEBUG_OTP` | false | Solo en desarrollo local |

## Auditoría forense

### Registro de eventos

```javascript
// server/security/audit.js
insertAuditLog({
    tenant_id,
    user_id,
    action,
    entity_type,
    entity_id,
    details,        // Contexto del evento
    criticality,    // low | medium | high
})

insertAuthEvent({
    event_type,     // login_success, login_failed, otp_sent, ...
    user_id,
    ip_address,     // Enmascarada con maskIp()
    user_agent,     // Sanitizado
    risk_score,
    decision,
})
```

### Enmascaramiento de PII

```javascript
maskEmail("usuario@example.com") → "u****o@e****e.com"
maskIp("192.168.1.100")          → "192.168.xxx.xxx"
```

Los logs de auditoría nunca almacenan PII en texto plano.

## Error handling seguro

### En producción

```javascript
// server/index.js — Error handler global
app.use((err, req, res, next) => {
    // NUNCA expone stack traces
    // Retorna códigos tipificados: SEC-429, IAM-004, TEN-003, FIN-001...
    res.status(500).json({
        error_code: "SEC-500",
        error_type: "internal",
        message: "Error interno del servidor.",
    });
});
```

### Códigos de error

| Código | Significado |
|---|---|
| `SEC-429` | Rate limit excedido |
| `SEC-429-AUTH` | Rate limit de autenticación |
| `SEC-403-CORS` | Origen no permitido |
| `SEC-500` | Error interno |
| `IAM-004` | No autenticado / token inválido |
| `TEN-003` | Tenant no encontrado o no coincide |
| `FIN-001` | Tenant suspendido (sin escritura) |
| `FIN-002` | Tenant en solo-lectura |

## Protección de roles de sistema

Los roles marcados como `is_system_role: true` no pueden ser:
- Eliminados
- Despojados de su nivel jerárquico base
- Modificados por usuarios no-admin

Esto previene escalación de privilegios por manipulación de roles.
