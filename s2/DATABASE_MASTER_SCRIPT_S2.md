# DATABASE_MASTER_SCRIPT.md
## Reconstrucción única y ordenada de la estructura de base de datos — Proyecto GIMNASIO / GYMsos

> **Auditoría técnica individual — Solo estructura (no datos, no registros, no producción).**
> Reconstruido íntegramente a partir de los archivos SQL, migraciones y código fuente del repositorio.
> Fecha de auditoría: 2026-07-02. Auditor: reconstrucción automatizada asistida.
>
> **REGLA APLICADA:** No se elimina ningún objeto. Todo elemento potencialmente obsoleto se conserva y se marca con `-- [AUDITORÍA]`.

---

## 0. NOTA ARQUITECTÓNICA CRÍTICA (leer antes de todo)

Este proyecto **NO es una base de datos autocontenida**. Es un **módulo ("lego") montado sobre una "BD Maestra" externa compartida** (el mismo proyecto Supabase donde ya operaba un sistema "ONG"/multi-sede). Esto genera **dos categorías de objetos**:

1. **Objetos DEFINIDOS en este repositorio** (reconstruibles al 100% — este documento).
2. **Objetos REFERENCIADOS pero NO definidos aquí** (pertenecen a la BD Maestra externa; se documentan como *contratos de dependencia* en la sección 9). Ejemplos: `public.tenants`, `public.profiles`, `public.roles`, `public.role_permissions`, `public.cat_permissions`, `public.sedes`, `public.user_roles_sedes`, catálogos financieros, trigger `fn_trigger_audit_universal()`, overload `fn_has_permission(text,uuid)`.

Existen además **tres esquemas lógicos** coexistiendo:

| Esquema | Propósito | Cliente frontend |
|---|---|---|
| `auth` | Identidad Supabase (`auth.users`) — intocable | Supabase Auth |
| `gym` | Dominio GYMsos (tablas de negocio del gimnasio) | `supabase` (db.schema = `gym`) |
| `public` | Núcleo compartido BD Maestra + sistema de códigos/roles GYMsos | `supabasePublic` (db.schema = `public`) |

> **ADVERTENCIA DE HISTORIAL:** El archivo `supabase-schema.sql` (v2.0) define las 30 tablas en `public`. La migración `009` las MUEVE a `gym` mediante `ALTER TABLE ... SET SCHEMA gym`. Por tanto, **el estado final vigente tiene el dominio en `gym`, no en `public`**. Este documento reconstruye el **estado final** y anota el origen.

---

## 1. EXTENSIONES

```sql
-- Origen: supabase-schema.sql (líneas 9-10)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";   -- provee uuid_generate_v4()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";    -- provee gen_random_uuid()

-- [AUDITORÍA] Coexisten dos generadores de UUID:
--   * uuid_generate_v4()  → usado por schema base y schema gym
--   * gen_random_uuid()   → usado por migraciones 010/015b/016/020 (public)
-- No es un error, pero es una inconsistencia de estilo. Ver AUDIT_REPORT (Prioridad Baja).
```

---

## 2. ESQUEMAS Y PRIVILEGIOS

```sql
-- Origen: migración 009 (líneas 24-32) — también en archive/006 (superseded)
CREATE SCHEMA IF NOT EXISTS gym;

GRANT USAGE ON SCHEMA gym TO postgres, anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA gym
  GRANT ALL ON TABLES TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA gym
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA gym
  GRANT SELECT ON TABLES TO anon;

-- Grants masivos aplicados al final de 009 (líneas 610-615)
GRANT ALL ON ALL TABLES IN SCHEMA gym TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA gym TO authenticated;
GRANT SELECT ON gym.codigos_acceso TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA gym TO authenticated;
```

> **[AUDITORÍA — RIESGO SEGURIDAD]** `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA gym TO authenticated` es muy amplio; la contención real depende exclusivamente de RLS. Cualquier tabla `gym.*` sin políticas RLS completas queda expuesta a escritura por cualquier usuario autenticado. Ver AUDIT_REPORT.

---

## 3. TABLAS — ESQUEMA `gym` (dominio del gimnasio)

> Todas se **crean originalmente en `public`** (supabase-schema.sql) y se **mueven a `gym`** en la migración 009 (PASO 0). Se reconstruyen aquí con su definición efectiva final (incluyendo columnas añadidas por migraciones posteriores).

### 3.1 `gym.gimnasios` — El gimnasio (nivel tenant local)

```sql
CREATE TABLE gym.gimnasios (
  id_gimnasio              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre                   VARCHAR(150)  NOT NULL,
  direccion                VARCHAR(255),
  ciudad                   VARCHAR(100),
  pais                     VARCHAR(100)  DEFAULT 'Perú',
  telefono                 VARCHAR(20),
  email                    VARCHAR(255),
  plan_suscripcion         VARCHAR(20)   NOT NULL DEFAULT 'mediano'
                             CHECK (plan_suscripcion IN ('pequeno','mediano','grande','enterprise')),
  fecha_inicio_suscripcion DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_renovacion         DATE,
  estado                   VARCHAR(20)   NOT NULL DEFAULT 'activo'
                             CHECK (estado IN ('activo','pausado','cancelado')),
  created_at               TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  -- Columnas añadidas por migración 009 (PASO 0b):
  ruc                      VARCHAR(11)   UNIQUE,
  logo_url                 TEXT,
  codigo_acceso            VARCHAR(20)   UNIQUE,
  -- Columna añadida por migración 015b (PASO 1b) — puente a BD Maestra:
  tenant_id                UUID          REFERENCES public.tenants(id) ON DELETE SET NULL
);
CREATE INDEX idx_gimnasios_codigo ON gym.gimnasios(codigo_acceso);   -- 009
CREATE INDEX idx_gimnasios_tenant ON gym.gimnasios(tenant_id);       -- 015b
```
> **[AUDITORÍA]** `codigo_acceso` (columna en gimnasios) fue parcialmente sustituido por la tabla `gym.codigos_acceso` (009) y luego por el sistema `public.codes` (010). Es un vestigio; se conserva. `tenant_id` conecta el gym con la BD Maestra externa.

### 3.2 `gym.usuarios` — Perfil de usuario del gimnasio (extiende `auth.users`)

```sql
CREATE TABLE gym.usuarios (
  id_usuario       UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email            VARCHAR(255) UNIQUE NOT NULL,
  nombre           VARCHAR(100) NOT NULL,
  telefono         VARCHAR(20),
  fecha_nacimiento DATE,
  documento        VARCHAR(20)  UNIQUE,
  genero           VARCHAR(10)  CHECK (genero IN ('M','F','Otro')),
  id_gimnasio      UUID NOT NULL REFERENCES gym.gimnasios(id_gimnasio),
  rol              VARCHAR(20)  NOT NULL DEFAULT 'miembro'
                     CHECK (rol IN ('miembro','cliente','entrenador','recepcionista','gerente','nutricionista','admin')),
  estado           VARCHAR(20)  NOT NULL DEFAULT 'activo'
                     CHECK (estado IN ('activo','inactivo','suspendido')),
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ,
  -- Columnas añadidas por migración 009 (PASO 0b):
  foto_url         TEXT,
  cargo            VARCHAR(100)
);
```
> **[AUDITORÍA — INCONSISTENCIA DE MODELO DE ROLES]** Existen DOS sistemas de rol paralelos: (a) la columna `gym.usuarios.rol` (enum de texto, modelo viejo "standalone"), y (b) el RBAC granular `public.user_roles`/`public.roles`/`public.role_permissions` (modelo BD Maestra, migración 016). Ambos coexisten y `handle_new_user` escribe en los dos. Requiere decisión: consolidar o mantener sincronía explícita.

### 3.3 `gym.planes` — Planes de membresía

```sql
CREATE TABLE gym.planes (
  id_plan              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_gimnasio          UUID REFERENCES gym.gimnasios(id_gimnasio),
  nombre               VARCHAR(100) NOT NULL,
  precio_mensual       DECIMAL(10,2) NOT NULL CHECK (precio_mensual >= 0),
  precio_trimestral    DECIMAL(10,2) CHECK (precio_trimestral >= 0),
  precio_anual         DECIMAL(10,2) CHECK (precio_anual >= 0),
  duracion_dias        INT NOT NULL DEFAULT 30,
  clases_incluidas     INT DEFAULT -1,               -- -1 = ilimitadas
  horarios_acceso      VARCHAR(100) DEFAULT '6-22',
  sucursales_incluidas VARCHAR(10) NOT NULL DEFAULT 'una'
                         CHECK (sucursales_incluidas IN ('una','todas')),
  descripcion          TEXT,
  activo               BOOLEAN NOT NULL DEFAULT TRUE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 3.4 `gym.membresias` — Membresías activas

```sql
CREATE TABLE gym.membresias (
  id_membresia       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_usuario         UUID NOT NULL REFERENCES gym.usuarios(id_usuario),
  id_plan            UUID NOT NULL REFERENCES gym.planes(id_plan),
  fecha_inicio       DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_vencimiento  DATE NOT NULL,
  estado             VARCHAR(20) NOT NULL DEFAULT 'activa'
                       CHECK (estado IN ('activa','vencida','cancelada','suspendida')),
  motivo_cancelacion VARCHAR(255),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_fecha_membresia CHECK (fecha_vencimiento > fecha_inicio)
);
```

### 3.5 `gym.pagos` — Pagos

```sql
CREATE TABLE gym.pagos (
  id_pago               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_usuario            UUID NOT NULL REFERENCES gym.usuarios(id_usuario),
  id_membresia          UUID REFERENCES gym.membresias(id_membresia),
  monto                 DECIMAL(10,2) NOT NULL CHECK (monto > 0),
  moneda                VARCHAR(3) NOT NULL DEFAULT 'PEN',
  metodo_pago           VARCHAR(20) NOT NULL DEFAULT 'efectivo'
                          CHECK (metodo_pago IN ('tarjeta','transferencia','efectivo','yape','plin')),
  id_transaccion_stripe VARCHAR(100),
  estado                VARCHAR(20) NOT NULL DEFAULT 'pendiente'
                          CHECK (estado IN ('pendiente','completado','fallido','reembolsado')),
  fecha_pago            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  proxima_renovacion    DATE,
  descripcion           VARCHAR(255),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 3.6 `gym.espacios` — Espacios físicos

```sql
CREATE TABLE gym.espacios (
  id_espacio               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_gimnasio              UUID NOT NULL REFERENCES gym.gimnasios(id_gimnasio),
  nombre                   VARCHAR(100) NOT NULL,
  tipo                     VARCHAR(30) NOT NULL DEFAULT 'salon'
                             CHECK (tipo IN ('salon','area_pesas','cardio','yoga','funcional','otros')),
  capacidad_maxima         INT NOT NULL DEFAULT 20,
  tiene_aire_acondicionado BOOLEAN DEFAULT FALSE,
  horario_disponibilidad   VARCHAR(100) DEFAULT '6-22',
  estado                   VARCHAR(30) NOT NULL DEFAULT 'disponible'
                             CHECK (estado IN ('disponible','en_uso','en_mantenimiento'))
);
```

### 3.7 `gym.maquinas` — Máquinas / equipamiento

```sql
CREATE TABLE gym.maquinas (
  id_maquina                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_espacio                  UUID NOT NULL REFERENCES gym.espacios(id_espacio),
  codigo_qr                   VARCHAR(100) UNIQUE,
  nombre                      VARCHAR(100) NOT NULL,
  marca                       VARCHAR(100),
  modelo                      VARCHAR(100),
  fecha_compra                DATE,
  fecha_mantenimiento_ultimo  DATE,
  fecha_mantenimiento_proximo DATE,
  estado                      VARCHAR(30) NOT NULL DEFAULT 'operativa'
                                CHECK (estado IN ('operativa','en_mantenimiento','dañada','fuera_de_servicio')),
  url_video_tutorial          VARCHAR(255),
  notas_seguridad             TEXT
);
```

### 3.8 `gym.entrenadores` — Entrenadores (extiende usuarios)

```sql
CREATE TABLE gym.entrenadores (
  id_entrenador          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_usuario             UUID UNIQUE REFERENCES gym.usuarios(id_usuario),
  especialidades         VARCHAR(255),
  certificaciones        TEXT,
  biografia              TEXT,
  rating_promedio        DECIMAL(3,2) DEFAULT 0.00,
  total_clientes_activos INT DEFAULT 0,
  total_clases_dictadas  INT DEFAULT 0
);
```

### 3.9 `gym.clases` — Clases programadas

```sql
CREATE TABLE gym.clases (
  id_clase          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_gimnasio       UUID NOT NULL REFERENCES gym.gimnasios(id_gimnasio),
  id_entrenador     UUID REFERENCES gym.entrenadores(id_entrenador),
  id_espacio        UUID REFERENCES gym.espacios(id_espacio),
  nombre            VARCHAR(100) NOT NULL,
  descripcion       TEXT,
  capacidad_maxima  INT NOT NULL DEFAULT 15,
  nivel             VARCHAR(20) CHECK (nivel IN ('principiante','intermedio','avanzado')),
  fecha_hora_inicio TIMESTAMPTZ NOT NULL,
  duracion_minutos  INT NOT NULL DEFAULT 60,
  recurrencia       VARCHAR(20) CHECK (recurrencia IN ('unica','diaria','semanal','mensual')),
  dias_semana       VARCHAR(50),
  estado            VARCHAR(20) NOT NULL DEFAULT 'programada'
                      CHECK (estado IN ('programada','en_curso','finalizada','cancelada')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```
> **[AUDITORÍA]** El tipo TS `DbClase` (frontend) declara `id_entrenador`, `id_espacio` como NOT NULL, pero la BD los permite NULL. Discrepancia de contrato tipo↔schema.

### 3.10 `gym.inscripciones` — Inscripciones a clases

```sql
CREATE TABLE gym.inscripciones (
  id_inscripcion       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_usuario           UUID NOT NULL REFERENCES gym.usuarios(id_usuario),
  id_clase             UUID NOT NULL REFERENCES gym.clases(id_clase),
  fecha_inscripcion    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  estado               VARCHAR(20) NOT NULL DEFAULT 'inscrito'
                         CHECK (estado IN ('inscrito','asistio','ausente','cancelado')),
  notificacion_enviada BOOLEAN DEFAULT FALSE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (id_usuario, id_clase)
);
```

### 3.11 `gym.asistencias` — Asistencias

```sql
CREATE TABLE gym.asistencias (
  id_asistencia     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_usuario        UUID NOT NULL REFERENCES gym.usuarios(id_usuario),
  id_clase          UUID REFERENCES gym.clases(id_clase),
  fecha_asistencia  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  estado_asistencia VARCHAR(20) NOT NULL DEFAULT 'presente'
                      CHECK (estado_asistencia IN ('presente','ausente','llegada_tarde')),
  minutos_asistidos INT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 3.12 `gym.accesos` — Control de accesos (torniquete/QR)

```sql
CREATE TABLE gym.accesos (
  id_acceso          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_usuario         UUID NOT NULL REFERENCES gym.usuarios(id_usuario),
  id_gimnasio        UUID NOT NULL REFERENCES gym.gimnasios(id_gimnasio),
  fecha_hora_entrada TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fecha_hora_salida  TIMESTAMPTZ,
  tipo_acceso        VARCHAR(20) NOT NULL DEFAULT 'qr'
                       CHECK (tipo_acceso IN ('qr','biometria','manual')),
  estado_acceso      VARCHAR(20) NOT NULL DEFAULT 'permitido'
                       CHECK (estado_acceso IN ('permitido','denegado')),
  razon_denegacion   VARCHAR(255),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 3.13 `gym.promociones` — Promociones / cupones locales

```sql
CREATE TABLE gym.promociones (
  id_promocion    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_gimnasio     UUID NOT NULL REFERENCES gym.gimnasios(id_gimnasio),
  codigo          VARCHAR(50) UNIQUE NOT NULL,
  tipo_descuento  VARCHAR(20) NOT NULL CHECK (tipo_descuento IN ('porcentaje','monto_fijo')),
  valor_descuento DECIMAL(10,2) NOT NULL CHECK (valor_descuento > 0),
  descripcion     VARCHAR(255),
  fecha_inicio    DATE NOT NULL,
  fecha_fin       DATE NOT NULL,
  limite_uso      INT,
  usos_realizados INT DEFAULT 0,
  estado          VARCHAR(20) NOT NULL DEFAULT 'activa'
                    CHECK (estado IN ('activa','pausada','finalizada'))
);
```
> **[AUDITORÍA]** Solapamiento funcional con `public.codes` (tipo GYM_PROMO) y con `gym.codigos_acceso`. Tres mecanismos de códigos coexisten. Ver AUDIT_REPORT.

### 3.14 Tablas de INNOVACIÓN movidas a `gym` (RF-019 a RF-038)

Estas SÍ están en la lista de movimiento de 009 y por tanto residen en `gym`:

```sql
CREATE TABLE gym.churn_predictions (
  id_prediction      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_usuario         UUID NOT NULL REFERENCES gym.usuarios(id_usuario),
  probability_churn  DECIMAL(5,4) NOT NULL,
  score_riesgo       INT NOT NULL CHECK (score_riesgo BETWEEN 0 AND 100),
  dias_para_abandono INT,
  razon_principal    VARCHAR(255),
  ultima_sesion      DATE,
  fecha_prediccion   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accion_ejecutada   VARCHAR(255),
  resultado          VARCHAR(20) CHECK (resultado IN ('abandono','retenido','desconocido'))
);

CREATE TABLE gym.churn_interventions (
  id_intervencion   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_usuario        UUID NOT NULL REFERENCES gym.usuarios(id_usuario),
  id_prediction     UUID REFERENCES gym.churn_predictions(id_prediction),
  tipo_intervencion VARCHAR(50) NOT NULL,
  oferta_valor      VARCHAR(255),
  fecha_oferta      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resultado         VARCHAR(20) CHECK (resultado IN ('aceptada','rechazada','sin_respuesta')),
  fecha_respuesta   TIMESTAMPTZ
);

CREATE TABLE gym.gamification_xp (
  id_xp        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_usuario   UUID NOT NULL REFERENCES gym.usuarios(id_usuario),
  tipo_evento  VARCHAR(50) NOT NULL,
  cantidad_xp  INT NOT NULL CHECK (cantidad_xp > 0),
  descripcion  VARCHAR(255),
  id_referencia UUID,
  fecha_evento TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE gym.gamification_levels (
  id_usuario          UUID PRIMARY KEY REFERENCES gym.usuarios(id_usuario),
  xp_total            INT NOT NULL DEFAULT 0,
  nivel_actual        INT NOT NULL DEFAULT 1,
  xp_proximo_nivel    INT NOT NULL DEFAULT 500,
  fecha_ultimo_nivel  TIMESTAMPTZ,
  fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE gym.digital_twin (
  id_usuario           UUID PRIMARY KEY REFERENCES gym.usuarios(id_usuario),
  altura_cm            INT,
  peso_kg              DECIMAL(5,2),
  peso_kg_inicial      DECIMAL(5,2),
  porcentaje_grasa     DECIMAL(5,2),
  configuracion_avatar JSONB DEFAULT '{"color":"#00D084","estilo":"athletic"}',
  prediccion_12w       TEXT,
  fecha_actualizacion  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE gym.ai_recommendations (
  id_recomendacion  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_usuario        UUID NOT NULL REFERENCES gym.usuarios(id_usuario),
  tipo              VARCHAR(50) NOT NULL,
  contenido_json    JSONB NOT NULL DEFAULT '{}',
  score_relevancia  DECIMAL(3,2) DEFAULT 0.80,
  mostrada          BOOLEAN DEFAULT FALSE,
  aceptada          BOOLEAN,
  fecha_generacion  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE gym.wearable_sync (
  id_sync               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_usuario            UUID NOT NULL REFERENCES gym.usuarios(id_usuario),
  tipo_wearable         VARCHAR(50) NOT NULL,
  token_autenticacion   TEXT,
  ultima_sincronizacion TIMESTAMPTZ,
  datos_salud_json      JSONB DEFAULT '{}',
  fecha_actualizacion   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE gym.health_alerts (
  id_alerta          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_usuario         UUID NOT NULL REFERENCES gym.usuarios(id_usuario),
  tipo_alerta        VARCHAR(50) NOT NULL,
  descripcion        VARCHAR(255) NOT NULL,
  severidad          VARCHAR(10) NOT NULL CHECK (severidad IN ('baja','media','alta')),
  fecha_alerta       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  leida              BOOLEAN DEFAULT FALSE,
  accion_recomendada VARCHAR(255)
);
```

### 3.16 [AUDITORÍA] 9 TABLAS DE INNOVACIÓN NO MOVIDAS — quedan en `public` (HUÉRFANAS)

El schema base (`supabase-schema.sql`) crea **30** tablas en `public`. La migración 009 mueve **21** a `gym`. Las **9 restantes NO están en la lista de movimiento** y por tanto **permanecen en `public`** (si `000_ROLLBACK` las restauró tras el `DROP` de archive/003):

```sql
-- Ubicación final: public (NO gym). Sin RLS, sin uso en frontend (0 refs), sin migraciones posteriores.
public.battle_pass_progression   -- RF-022 Battle Pass
public.clanes                    -- RF-023 Clanes (FK id_lider→usuarios ahora en gym → FK ROTA)
public.clan_miembros             -- PK(id_clan,id_usuario); FK→clanes + usuarios(gym) → FK ROTA
public.torneos_semanales         -- RF-024
public.marketplace_vendors       -- RF-031..034
public.marketplace_transactions  -- FK→usuarios(gym) + vendors → FK ROTA
public.corporate_clients         -- RF-035
public.corporate_leaderboards    -- RF-036
public.dynamic_pricing_log       -- RF-044 (FK→gimnasios(gym) → FK ROTA)
```
> **[AUDITORÍA — CÓDIGO MUERTO + FK ROTAS]** Estas 9 tablas: (1) no tienen referencia en el frontend, (2) no reciben RLS ni parches, (3) varias declaran FK hacia tablas que 009 movió a `gym` (`usuarios`, `gimnasios`), por lo que **sus FK quedan rotas o apuntan a tablas inexistentes en `public`**. Son candidatas claras a archivado. Se conservan y se marcan. Ver AUDIT_REPORT.

### 3.15 `gym.codigos_acceso` — Códigos de acceso por gimnasio (migración 009)

```sql
CREATE TABLE gym.codigos_acceso (
  id_codigo        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_gimnasio      UUID NOT NULL REFERENCES gym.gimnasios(id_gimnasio) ON DELETE CASCADE,
  codigo           VARCHAR(12) UNIQUE NOT NULL,
  tipo             VARCHAR(20) NOT NULL DEFAULT 'general'
                     CHECK (tipo IN ('general','staff','miembro','invitacion')),
  descripcion      VARCHAR(255),
  usos_actuales    INT NOT NULL DEFAULT 0,
  usos_max         INT,
  activo           BOOLEAN NOT NULL DEFAULT TRUE,
  fecha_expiracion TIMESTAMPTZ,
  creado_por       UUID REFERENCES gym.usuarios(id_usuario),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_codigos_acceso_gimnasio ON gym.codigos_acceso(id_gimnasio);
CREATE INDEX idx_codigos_acceso_codigo   ON gym.codigos_acceso(codigo) WHERE activo = TRUE;
```
> **[AUDITORÍA]** Reemplazada conceptualmente por `public.codes` (010). Mantenida por `handle_new_user` que aún inserta aquí el "código principal" del gym en CASO A. Duplicación funcional.

---

## 4. TABLAS — ESQUEMA `public` DEFINIDAS EN ESTE REPO (núcleo compartido GYMsos)

### 4.1 `public.cat_code_types` — Catálogo de tipos de código (010)

```sql
CREATE TABLE public.cat_code_types (
  id            TEXT PRIMARY KEY,
  description   TEXT NOT NULL,
  module        TEXT NOT NULL DEFAULT 'core',
  public_lookup BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Seeds: GYM_ACCESS, GYM_PROMO, USER_INVITE, ACCOUNT_ACTIVATE, PASSWORD_RESET,
--        TEMP_ACCESS, LICENSE, DOCUMENT_VERIFY, EDU_ENROLL, COUPON (10 tipos)
```

### 4.2 `public.codes` — Tabla central de códigos (010)

```sql
CREATE TABLE public.codes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,  -- [DEP EXTERNA]
  code         TEXT NOT NULL,
  type_id      TEXT NOT NULL REFERENCES public.cat_code_types(id),
  description  TEXT,
  status       TEXT NOT NULL DEFAULT 'active'
                 CHECK (status IN ('active','used','expired','revoked','suspended')),
  max_uses     INT CHECK (max_uses IS NULL OR max_uses > 0),
  current_uses INT NOT NULL DEFAULT 0 CHECK (current_uses >= 0),
  expires_at   TIMESTAMPTZ,
  metadata     JSONB NOT NULL DEFAULT '{}',
  created_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, code)
);
CREATE INDEX idx_codes_tenant        ON public.codes(tenant_id);
CREATE INDEX idx_codes_code          ON public.codes(code);
CREATE INDEX idx_codes_type          ON public.codes(type_id);
CREATE INDEX idx_codes_status_active ON public.codes(status) WHERE status = 'active';
CREATE INDEX idx_codes_tenant_type   ON public.codes(tenant_id, type_id);
CREATE INDEX idx_codes_expires       ON public.codes(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_codes_lookup        ON public.codes(code, status) WHERE status = 'active';
```
> **[AUDITORÍA — ÍNDICES REDUNDANTES]** `idx_codes_code`, `idx_codes_status_active` e `idx_codes_lookup` se solapan parcialmente. Ver AUDIT_REPORT (Prioridad Baja).

### 4.3 `public.code_usages` — Auditoría de uso de códigos (010)

```sql
CREATE TABLE public.code_usages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id      UUID NOT NULL REFERENCES public.codes(id) ON DELETE CASCADE,
  tenant_id    UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,  -- [DEP EXTERNA]
  used_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  used_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  module_name  TEXT NOT NULL,
  observations TEXT,
  ip_address   INET,
  metadata     JSONB NOT NULL DEFAULT '{}'
);
CREATE INDEX idx_code_usages_code_id ON public.code_usages(code_id);
CREATE INDEX idx_code_usages_tenant  ON public.code_usages(tenant_id);
CREATE INDEX idx_code_usages_used_by ON public.code_usages(used_by);
CREATE INDEX idx_code_usages_used_at ON public.code_usages(used_at DESC);
CREATE INDEX idx_code_usages_module  ON public.code_usages(module_name);
```

### 4.4 `public.audit_logs` — Log de auditoría universal (015b)

```sql
CREATE TABLE public.audit_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID REFERENCES public.tenants(id) ON DELETE SET NULL,   -- [DEP EXTERNA]
  actor_id        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type      TEXT NOT NULL,             -- INSERT | UPDATE | DELETE
  resource_name   TEXT NOT NULL,
  payload_before  JSONB,
  payload_after   JSONB,
  ip              INET,
  user_agent      TEXT,
  retention_until TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_logs_tenant   ON public.audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_actor    ON public.audit_logs(actor_id);
CREATE INDEX idx_audit_logs_event    ON public.audit_logs(event_type);
CREATE INDEX idx_audit_logs_resource ON public.audit_logs(resource_name);
CREATE INDEX idx_audit_logs_created  ON public.audit_logs(created_at DESC);
```
> **[AUDITORÍA]** Estructura inferida por 015b desde el trigger externo `fn_trigger_audit_universal()` (BD Maestra) que fallaba por falta de esta tabla. Es un objeto puente creado reactivamente.

### 4.5 `public.user_roles` — Asignación RBAC de roles por tenant (016)

```sql
CREATE TABLE public.user_roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,   -- [DEP EXTERNA]
  user_id     UUID NOT NULL REFERENCES auth.users(id)     ON DELETE CASCADE,
  role_id     UUID NOT NULL REFERENCES public.roles(id)   ON DELETE CASCADE,   -- [DEP EXTERNA]
  assigned_by UUID REFERENCES auth.users(id)              ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at  TIMESTAMPTZ,
  UNIQUE (tenant_id, user_id, role_id)
);
CREATE INDEX idx_user_roles_tenant  ON public.user_roles(tenant_id);
CREATE INDEX idx_user_roles_user    ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role    ON public.user_roles(role_id);
CREATE INDEX idx_user_roles_active  ON public.user_roles(user_id, tenant_id) WHERE expires_at IS NULL;
CREATE INDEX idx_user_roles_expires ON public.user_roles(expires_at) WHERE expires_at IS NOT NULL;
```
> **[AUDITORÍA]** Distinta de `public.user_roles_sedes` (BD Maestra, multi-sede/ONG). Confusión de nombres documentada en migración 019.

### 4.6 `public.code_grants` — Rol otorgado por un código (016)

```sql
CREATE TABLE public.code_grants (
  code_id UUID NOT NULL REFERENCES public.codes(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,   -- [DEP EXTERNA]
  PRIMARY KEY (code_id, role_id)
);
CREATE INDEX idx_code_grants_code ON public.code_grants(code_id);
CREATE INDEX idx_code_grants_role ON public.code_grants(role_id);
```

### 4.7 `public.user_permission_overrides` — Overrides de permisos por persona (020)

```sql
CREATE TABLE public.user_permission_overrides (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,       -- [DEP EXTERNA]
  user_id    uuid NOT NULL REFERENCES auth.users(id)     ON DELETE CASCADE,
  permission text NOT NULL REFERENCES public.cat_permissions(id),                 -- [DEP EXTERNA]
  effect     text NOT NULL CHECK (effect IN ('grant','deny')),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  UNIQUE (tenant_id, user_id, permission)
);
CREATE INDEX idx_upo_user_tenant ON public.user_permission_overrides (user_id, tenant_id);
```
> **[AUDITORÍA]** La migración 020 documenta que este SQL **ya se había ejecutado manualmente** en el SQL Editor durante pruebas E2E antes de ser versionado. Deuda de proceso.

---

## 5. SEEDS DEL CATÁLOGO DE PERMISOS (migración 016, en `public.cat_permissions` — tabla EXTERNA)

> La migración 016 **inserta** 31 permisos del módulo gym en `public.cat_permissions` (tabla que pertenece a la BD Maestra). Se listan porque son datos estructurales sembrados por este proyecto:

```
gym.usuarios.ver/crear/editar/eliminar
gym.membresias.ver/crear/aprobar/cancelar
gym.pagos.ver/crear/reembolsar
gym.clases.ver/gestionar/inscribir
gym.accesos.ver/crear
gym.planes.ver/gestionar
gym.reportes.ver/exportar
gym.codigos.ver/crear/revocar
gym.config.ver/editar
gym.espacios.ver/gestionar
gym.entrenadores.ver/gestionar
gym.nutricion.ver/gestionar
```
> **[AUDITORÍA]** El comentario de 016 dice "31 permisos" pero el `INSERT` enumera **30**. Discrepancia de conteo (cosmética).
> **[AUDITORÍA]** La migración 020 usa permisos `ace.perms.manage` y `ace.perms.read` que **NO** son sembrados por este proyecto y deben preexistir en `public.cat_permissions` (BD Maestra), o el FK de `user_permission_overrides` fallará.

### Roles de sistema sembrados por tenant gym (016, en `public.roles` — tabla EXTERNA)
7 roles por cada tenant `industry_type_id='gym'`: `Administrador General` (h=0), `Supervisor` (10), `Cajero` (30), `Recepcionista` (40), `Entrenador` (50), `Nutricionista` (50), `Miembro` (100). Con sus `role_permissions` correspondientes (ver DATABASE_DICTIONARY).

---

## 6. FUNCIONES (estado final vigente)

> Muchas funciones se redefinieron varias veces vía `CREATE OR REPLACE`. Aquí se documenta la **versión final efectiva** y el archivo de origen.

### 6.1 Helpers RLS (schema public y gym)

```sql
-- get_user_gym() — versión final: migración 009
CREATE OR REPLACE FUNCTION public.get_user_gym() RETURNS UUID AS $$
  SELECT id_gimnasio FROM gym.usuarios WHERE id_usuario = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- get_user_rol() — versión final: migración 009
CREATE OR REPLACE FUNCTION public.get_user_rol() RETURNS TEXT AS $$
  SELECT rol FROM gym.usuarios WHERE id_usuario = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- gym.current_gym_id() — migración 009
CREATE OR REPLACE FUNCTION gym.current_gym_id() RETURNS UUID
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = gym, public, auth AS $$
  SELECT id_gimnasio FROM gym.usuarios WHERE id_usuario = auth.uid()
$$;

-- public.fn_current_tenant_id() — migración 016 (lee tabla externa public.profiles)
CREATE OR REPLACE FUNCTION public.fn_current_tenant_id() RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
$$;
```

### 6.2 Generación de códigos y planes

```sql
-- generate_gym_code(p_nombre) — migración 009: genera código base+hash
-- _gym_plan_to_bd(p_plan) — migración 015b: mapea plan gym → plan BD Maestra
--   pequeno→basic, mediano→pro, grande→pro, enterprise→enterprise, else basic
-- _gym_plan_to_licenses(p_plan) — migración 015b: pequeno→100, mediano→500,
--   grande→2000, enterprise→99999, else 100
```

### 6.3 Sistema de códigos genérico (migración 010)

```sql
-- fn_codes_set_updated_at()  — trigger fn: NEW.updated_at = now()
-- fn_validate_code(p_code, p_type_id?, p_tenant_id?) → JSONB  (valida sin consumir; anon+auth)
-- fn_use_code(p_code, p_module_name, ...) → JSONB  (valida+consume+audita; FOR UPDATE anti-race)
-- fn_create_code(p_tenant_id, p_type_id, p_code?, ...) → JSONB  (crea; auto-formato ABC-1234-XY)
-- fn_revoke_code(p_code_id, p_reason?) → JSONB  (revoca dentro del tenant)
```

### 6.4 Perfil y avatar (migraciones 012, 014)

```sql
-- fn_get_my_profile() → JSONB — versión final 014 (incluye avatar_url, tenant_id)
-- fn_update_my_avatar(p_url) → JSONB — 014 (UPDATE profiles.avatar_url + gym.usuarios.foto_url)
```

### 6.5 RBAC / permisos (migraciones 016, 019, 020)

```sql
-- fn_has_permission(p_permission TEXT) → BOOLEAN — 016 (user_roles ⋈ role_permissions)
--   [AUDITORÍA] Existe además un overload EXTERNO fn_has_permission(text,uuid) del stack
--   multi-sede/ONG. La migración 020 NO toca esta función por ambigüedad de overload
--   (oids 47643 vs 100353) que rompería ~20 políticas RLS externas.
-- fn_my_permissions() → TABLE(permission, role_name) — versión final 020
--   (rol base ∪ grants − denies, usando user_permission_overrides)
-- fn_check_permission(p_permission text) → boolean — 020 (booleano sin ambigüedad de overload)
-- fn_create_staff_code(p_tenant_id, p_role_id, ...) → JSONB — versión final 019c
--   (consulta directa a user_roles + role_permissions; crea code USER_INVITE + code_grants)
```

### 6.6 Bootstrap de tenant (migración 009, schema gym)

```sql
-- gym.bootstrap_gym_tenant(p_nombre, p_ruc?, ...) → JSONB
--   Crea gimnasio + código + asigna al usuario como gerente. Respaldo del trigger.
-- gym.join_gym_with_code(p_codigo, p_nombre?, p_cargo?) → JSONB
--   Une un usuario autenticado a un gym vía gym.codigos_acceso.
```

### 6.7 Trigger de creación de usuario (estado final: migración 017)

```sql
-- public.handle_new_user() RETURNS trigger — SECURITY DEFINER, search_path = gym, public
-- Redefinida en 009 → 011 → 015b → 016 → 017 (versión final: 017, con fixes de seguridad
-- staff_code: filtro por tenant, anti-race, validación de expiración).
-- Lógica (versión final):
--   SIEMPRE: upsert en public.profiles (BD Maestra)
--   CASO A (gym_nombre presente): crea public.tenants + gym.gimnasios + gym.codigos_acceso
--          + gym.usuarios (rol gerente) + user_roles(Administrador General)
--   CASO B (id_gimnasio presente): crea gym.usuarios; si staff_code → asigna rol de code_grants
--          y consume código; si no → rol 'Miembro'
--   CASO C: no-op
--   EXCEPTION WHEN OTHERS → RAISE WARNING + RETURN NEW (nunca aborta el signup)
```

---

## 7. TRIGGERS

```sql
-- 7.1 on_auth_user_created — AFTER INSERT ON auth.users FOR EACH ROW → public.handle_new_user()
--     Origen: migración 009 (creado condicionalmente si no existe)

-- 7.2 tr_codes_updated_at — BEFORE UPDATE ON public.codes FOR EACH ROW → fn_codes_set_updated_at()
--     Origen: migración 010

-- 7.3 [DEP EXTERNA] fn_trigger_audit_universal() sobre public.tenants (BD Maestra).
--     No definido en este repo; su existencia obligó a crear public.audit_logs (015b).
```

---

## 8. ROW LEVEL SECURITY — POLÍTICAS (estado final)

### 8.1 Esquema `gym`

```sql
-- gym.usuarios (migración 013 — reemplaza políticas base):
--   usuarios_select_own, usuarios_select_gym, usuarios_update_own,
--   usuarios_update_staff, usuarios_insert_staff, usuarios_delete_admin
-- gym.planes:        planes_select_gym, planes_write_staff                    (009)
-- gym.codigos_acceso:codigos_select_public, codigos_write_gerente             (009)
-- gym.promociones:   promociones_select_gym, promociones_write_staff          (009)
-- gym.maquinas:      maquinas_select_gym, maquinas_write_staff                (009)
-- gym.espacios:      espacios_select_gym, espacios_write_staff               (009)
-- gym.entrenadores:  entrenadores_select_gym, entrenadores_write_staff        (009)
-- [BASE, posiblemente vigentes] membresias_select, pagos_select, clases_select,
--   accesos_select, churn_gerente_select (supabase-schema.sql) — usan get_user_rol()
```
> **[AUDITORÍA — TABLAS SIN RLS COMPLETO]** Las siguientes tablas `gym.*` NO reciben políticas en ninguna migración activa y probablemente quedan con RLS deshabilitado o sin políticas de escritura: `asistencias`, `inscripciones`, `membresias`(solo SELECT base), `pagos`(solo SELECT base), `churn_predictions`(solo SELECT base), `churn_interventions`, `gamification_xp`, `gamification_levels`, `digital_twin`, `ai_recommendations`, `wearable_sync`, `health_alerts`. Combinado con el GRANT amplio a `authenticated`, es un **riesgo de seguridad ALTO**.

### 8.2 Esquema `public` (objetos de este repo)

```sql
-- public.codes:       codes_public_lookup, codes_tenant_select, codes_tenant_write     (010)
-- public.code_usages: code_usages_tenant                                               (010)
-- public.profiles:    profiles_self_select, profiles_self_update                       (012)
-- public.user_roles:  user_roles_self_select, user_roles_tenant_select, user_roles_admin_write (016)
-- public.code_grants: code_grants_tenant_select                                        (016)
-- public.audit_logs:  audit_logs_tenant_select                                         (015b)
-- public.user_permission_overrides: upo_select, upo_insert, upo_update, upo_delete
--         (020 — todas condicionadas al permiso ace.perms.manage)
```
> **[AUDITORÍA]** `user_roles_admin_write` solo comprueba `tenant_id = fn_current_tenant_id()` sin exigir un permiso concreto: **cualquier usuario del tenant podría escribir en user_roles** (auto-asignarse roles). Riesgo ALTO. Igual observación para `codes_tenant_write`.

---

## 9. CONTRATO DE DEPENDENCIAS EXTERNAS (BD Maestra — NO definidas en este repo)

Estos objetos son **referenciados** por las migraciones/funciones/RLS pero **no existen en el repositorio**. Deben preexistir en el proyecto Supabase o el despliegue falla:

```
public.tenants(id, name, tax_id, industry_type_id, plan_id, status_financial_id, max_licenses, ...)
public.profiles(id → auth.users, full_name, tipo_documento, numero_documento, genero,
                tenant_id → tenants, avatar_url, updated_at, ...)
public.roles(id, tenant_id, name, hierarchy_level, is_system_role, ...)
public.role_permissions(role_id → roles, permission → cat_permissions)
public.cat_permissions(id, description, module, ...)
public.sedes(...)                     -- sucursales (mencionada, no usada en código gym)
public.user_roles_sedes(...)          -- RBAC multi-sede/ONG (overload fn_has_permission)
public.fn_has_permission(text, uuid)  -- overload externo (~20 RLS dependen de él)
public.fn_trigger_audit_universal()   -- trigger de auditoría sobre tenants
public.seed_gym_roles(target, template) -- clona 7 roles+permisos desde tenant plantilla
                                          (definida en scratch archivado, ejecutada manualmente)
Catálogos: plan_id (basic/pro/enterprise), status_financial_id (FIN-ACTIVE/GRACE/SUSPENDED/PENDING),
           industry_type_id ('gym'), permisos ace.perms.manage / ace.perms.read
```
> **[AUDITORÍA — CRÍTICO]** Sin estos objetos, las migraciones 010, 015b, 016, 020 **no se pueden ejecutar** (fallan por FK/función inexistente). El repositorio **no es autodesplegable**. Ver AUDIT_REPORT — Prioridad Alta.

---

## 10. MAPA DE SECUENCIAS, TIPOS Y ENUMS

```
-- SECUENCIAS: ninguna explícita. Todas las PK usan UUID (uuid_generate_v4 / gen_random_uuid).
--   El GRANT USAGE ON ALL SEQUENCES (009) es preventivo y no aplica a ninguna secuencia real.
-- TIPOS PERSONALIZADOS / ENUM: ninguno. Los "enums" se implementan con VARCHAR + CHECK.
-- DOMINIOS: ninguno.
-- VISTAS: ninguna (no existe CREATE VIEW en todo el proyecto).
-- PROCEDIMIENTOS (CREATE PROCEDURE): ninguno. Toda lógica está en FUNCTIONS.
```

---

## 11. ORDEN DE RECONSTRUCCIÓN RECOMENDADO (para despliegue limpio)

```
0. [PRE-REQUISITO EXTERNO] Desplegar BD Maestra: tenants, profiles, roles,
   role_permissions, cat_permissions, sedes, user_roles_sedes, fn_has_permission(text,uuid),
   fn_trigger_audit_universal, catálogos. (NO versionado aquí — requiere revisión manual.)
1. Extensiones (sección 1)
2. supabase-schema.sql   → crea 30 tablas en public + índices + RLS base + seeds demo
3. 009 → crea schema gym, mueve tablas, columnas extra, codigos_acceso, helpers, trigger, RPCs gym
4. 010 → sistema de códigos (cat_code_types, codes, code_usages) + RPCs fn_*_code
5. 011 → fix handle_new_user ↔ profiles + backfill
6. 012 → RLS profiles + fn_get_my_profile
7. 013 → RLS gym.usuarios (6 políticas)
8. 014 → avatar_url + fn_update_my_avatar + fn_get_my_profile v2
9. 015b → audit_logs + tenant_id en gimnasios + backfill tenants/profiles + handle_new_user
10. 016 → cat_permissions seeds + user_roles + code_grants + fn_current_tenant_id +
    roles seeds + fn_has_permission + fn_my_permissions + fn_create_staff_code + handle_new_user
11. 017 → fix seguridad handle_new_user (staff_code)
12. 019 → fix fn_create_staff_code (consulta directa user_roles)
13. 020 → user_permission_overrides + fn_my_permissions v2 + fn_check_permission + grants ace.*
```
> **[AUDITORÍA]** No se aplican: `000_ROLLBACK` (revierte), `archive/*` (superseded), `018`/`018b` (revertidos entre sí), `015` original (falló, reemplazado por 015b), `archive/00101 SCRATCH` (no-migración). Ver DATABASE_DICTIONARY y AUDIT_REPORT.

---

## 12. INVENTARIO RESUMEN

| Categoría | Definidos en repo | Referenciados externos |
|---|---|---|
| Esquemas | `gym`, `public`(parcial) | `auth` |
| Tablas `gym` | 22 | — |
| Tablas `public` (repo, núcleo GYMsos) | 7 (cat_code_types, codes, code_usages, audit_logs, user_roles, code_grants, user_permission_overrides) | tenants, profiles, roles, role_permissions, cat_permissions, sedes, user_roles_sedes (≥7) |
| Tablas `public` HUÉRFANAS (innovación no movida) | 9 (battle_pass_progression, clanes, clan_miembros, torneos_semanales, marketplace_vendors, marketplace_transactions, corporate_clients, corporate_leaderboards, dynamic_pricing_log) | — |
| Funciones | ~22 (final) | fn_has_permission(text,uuid), fn_trigger_audit_universal, seed_gym_roles |
| Triggers | 2 | 1 (audit universal) |
| Políticas RLS | ~32 | ~20 (stack ONG) |
| Índices | ~40 | — |
| Vistas / Procedimientos / Enums / Secuencias | 0 | — |

---
*FIN DATABASE_MASTER_SCRIPT.md — Reconstrucción basada exclusivamente en evidencia del repositorio. Los elementos marcados `[DEP EXTERNA]` y `Requiere revisión manual` deben validarse contra el proyecto Supabase real.*
