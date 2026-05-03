# QA Checklist: Auth + Onboarding Wizard + Risk Gate

Fecha de referencia: 2026-03-02

## 0) Precondiciones

1. Variables de entorno configuradas (`.env`):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VITE_RUC_API_URL`
- `RUC_API_TOKEN`

2. Migraciones aplicadas (incluyendo `mfa_challenges` y columnas de PIN en `profiles`).

3. Servicios arriba:
- API: `npm run dev:api`
- Frontend: `npm run dev`

4. URLs:
- Register: `/register.html`
- Login: `/login.html`
- Wizard: `/onboarding.html`

## 1) Auth simple (registro)

### Caso QA-AUTH-01: registro exitoso
1. Ir a `/register.html`.
2. Ingresar email valido y password >= 8.
3. Click en `Crear cuenta`.

Resultado esperado:
- Se ejecuta `supabase.auth.signUp()`.
- Mensaje de exito.
- Redireccion a `/onboarding.html` si hay sesion activa.

### Caso QA-AUTH-02: validacion email
1. Usar email invalido (ej: `a@`).
2. Click `Crear cuenta`.

Esperado:
- Error en UI: correo invalido.
- No se llama a registro.

### Caso QA-AUTH-03: validacion password
1. Password de 7 caracteres.
2. Click `Crear cuenta`.

Esperado:
- Error en UI: minimo 8 caracteres.

## 2) Wizard 4 pasos (bloqueo por paso)

### Caso QA-WIZ-01: Paso 1 bloquea avance sin RUC valido
1. Ir a `/onboarding.html` con sesion.
2. Completar telefono pero no validar RUC.
3. Intentar `Siguiente`.

Esperado:
- Boton `Siguiente` deshabilitado o error de bloqueo.
- No avanza a Paso 2.

### Caso QA-WIZ-02: RUC no existe
1. Ingresar RUC invalido/no existente.
2. Click `Validar RUC`.

Esperado:
- Error UX claro: `RUC no existe`.
- `Razon Social` vacia.
- `Siguiente` deshabilitado.

### Caso QA-WIZ-03: empresa inactiva/no habida
1. Ingresar RUC cuyo estado no sea `ACTIVO` o condicion no sea `HABIDO`.
2. Validar.

Esperado:
- Error UX claro: `Empresa inactiva` o `Empresa no habida`.
- Sin avance.

### Caso QA-WIZ-04: RUC valido
1. Ingresar RUC valido (`ACTIVO/HABIDO`).
2. Validar.
3. Completar telefono.

Esperado:
- `Razon Social` autocompletada.
- Campo `Razon Social` readonly.
- `Siguiente` habilitado.

### Caso QA-WIZ-05: Paso 2 seleccion sector
1. En Paso 2, click en una card sector.

Esperado:
- Estado visual seleccionado.
- Autoavance a Paso 3.

### Caso QA-WIZ-06: Paso 3 seleccion plan
1. En Paso 3, click en una card de plan (Basico/Pro).

Esperado:
- Estado visual seleccionado.
- Autoavance a Paso 4.

### Caso QA-WIZ-07: Paso 4 seleccion billing day
1. En Paso 4, seleccionar `Dia 1`/`15`/`28`.

Esperado:
- Tile seleccionado.
- Se habilita `Crear empresa`.

### Caso QA-WIZ-08: finalize onboarding
1. Click `Crear empresa`.

Esperado:
- Loading en boton final.
- RPC `fn_bootstrap_tenant` ejecutada.
- Redireccion a `/studio.html`.

## 3) Persistencia del wizard

### Caso QA-WIZ-09: refresh sin perder progreso
1. Completar paso 1 y parte de paso 2.
2. Refrescar navegador.

Esperado:
- Estado restaurado desde `localStorage`.
- Se muestra el paso correcto.

## 4) Risk gate heuristico (sin IA)

### Caso QA-RISK-01: dispositivo/IP nueva -> OTP
1. Hacer login desde navegador/dispositivo no conocido.

Esperado:
- `/api/auth/risk-evaluate` retorna `MEDIUM` + `REQUIRE_OTP`.
- Se crea registro en `mfa_challenges`.
- UI redirige a `/otp-challenge.html`.

### Caso QA-RISK-02: dispositivo/IP conocida -> ALLOW
1. Repetir login desde el mismo entorno ya reconocido.

Esperado:
- `/api/auth/risk-evaluate` retorna `LOW` + `ALLOW`.
- Entra a `/studio.html` sin OTP.

### Caso QA-RISK-03: pin_failed_attempts >= 5 -> TEMP_BLOCK
Precondicion SQL (usar user/tenant objetivo):
```sql
update public.profiles
set pin_failed_attempts = 5
where id = '<USER_ID>' and tenant_id = '<TENANT_ID>';
```

1. Iniciar login.

Esperado:
- `/api/auth/risk-evaluate` retorna `TEMP_BLOCK`.
- Mensaje de bloqueo temporal.

## 5) Queries de verificacion en Supabase

Reemplaza `<TENANT_ID>` y `<USER_ID>`.

### Verificar tenant creado por RPC
```sql
select id, name, tax_id, industry_type_id, plan_id, billing_day, status_financial_id, created_at
from public.tenants
where tax_id = '<RUC>'
order by created_at desc;
```

### Verificar profile asociado
```sql
select id, tenant_id, full_name, pin_failed_attempts, pin_blocked_until, risk_blocked_until
from public.profiles
where id = '<USER_ID>';
```

### Verificar contratos y entitlements
```sql
select tenant_id, current_plan_id, status_id, billing_day, created_at
from public.subscription_contracts
where tenant_id = '<TENANT_ID>';

select tenant_id, plan_id, max_sedes, max_licenses, can_use_terminals, updated_at
from public.entitlements
where tenant_id = '<TENANT_ID>';
```

### Verificar MFA challenge
```sql
select id, tenant_id, user_id, channel, risk_level, expires_at, verified_at, created_at
from public.mfa_challenges
where tenant_id = '<TENANT_ID>' and user_id = '<USER_ID>'
order by created_at desc
limit 10;
```

### Verificar dispositivos
```sql
select id, tenant_id, user_id, device_fingerprint, is_trusted, last_ip, last_seen_at
from public.devices
where tenant_id = '<TENANT_ID>' and user_id = '<USER_ID>'
order by last_seen_at desc;
```

### Verificar sesiones
```sql
select id, tenant_id, user_id, session_type, ip, created_at, expires_at, revoked_at
from public.sessions
where tenant_id = '<TENANT_ID>' and user_id = '<USER_ID>'
order by created_at desc
limit 20;
```

### Verificar auditoria auth/risk
```sql
select id, tenant_id, actor_id, event_type, resource_name, result, error_code, criticality, created_at
from public.audit_logs
where tenant_id = '<TENANT_ID>'
  and resource_name in ('auth.risk', 'auth.mfa', 'auth.terminal')
order by created_at desc
limit 30;
```

### Verificar auth_events
```sql
select id, tenant_id, user_id, event_type, result, error_code, created_at
from public.auth_events
where tenant_id = '<TENANT_ID>' and user_id = '<USER_ID>'
order by created_at desc
limit 30;
```

## 6) Criterio final de aprobacion

Checklist minimo para dar PASS:
- Auth simple solo email/password funcional.
- Wizard 4 pasos con bloqueo de avance por paso.
- RUC valida contra endpoint backend y autocompleta razon social readonly.
- `fn_bootstrap_tenant` ejecuta correctamente al finalizar.
- Riesgo heuristico aplica: `TEMP_BLOCK`, `REQUIRE_OTP`, `ALLOW` segun reglas.
- Evidencia en tablas (`tenants`, `mfa_challenges`, `devices`, `sessions`, `auth_events`, `audit_logs`).