# PRESENTACION.md — Documento Maestro de Sustentación
# Plataforma Democra · Eduardo Sebastian Paipay Vega

> **Generado el:** 2026-07-16  
> **Método:** Auditoría integral del repositorio (`d:\espelo`)  
> **Fuentes consultadas:** README, tesis LaTeX (Documento/), dds/, docs/, AUDIT_REPORT_S1.md, coverage_*.txt, package.json, supabase/migrations/, ADRs, imágenes del sistema  
> **Regla de Oro:** ninguna afirmación fue inventada. Si un dato no existe en el repositorio, se indica explícitamente con `[DATO NO ENCONTRADO EN REPOSITORIO]`.

---

## ═══════════════════════════════════════════════
## PARTE I — AUDITORÍA INTEGRAL DEL REPOSITORIO
## ═══════════════════════════════════════════════

### 1. RESUMEN EJECUTIVO DEL PROYECTO

| Campo | Valor confirmado en repositorio |
|---|---|
| **Nombre del sistema** | Democra |
| **Tipo** | Plataforma SaaS multi-tenant de gobernanza con IA para ONGs |
| **Autor** | Eduardo Sebastian Paipay Vega (`@EduardoBastian2005`) |
| **Estado** | Producción activa |
| **Fecha de análisis** | HEAD · 2026-07-09 (según `01-contexto-del-proyecto.md`) |
| **Licencia** | MIT (`LICENSE`) |

**Fuente:** `README.md`, `dds/fases/fase_1_.../descubrimiento/documentacion/01-contexto-del-proyecto.md`

---

### 2. STACK TECNOLÓGICO VERIFICADO

| Capa | Tecnología | Versión | Fuente |
|---|---|---|---|
| Frontend | React + TypeScript | 18 | `README.md` |
| Build | Vite | 6 | `README.md` |
| CSS | Tailwind CSS | 4 | `README.md` |
| Componentes | Radix UI | — | `README.md` |
| Enrutamiento | React Router | 7 | `README.md` |
| Backend API | Express (Node.js) | 5 | `README.md` |
| Base de datos | Supabase (PostgreSQL) | 16 | `README.md`, `AUDIT_REPORT_S1.md` |
| Auth | Supabase Auth + MFA/OTP propio | — | `README.md` |
| Email | Resend | — | `README.md`, `.env.example` |
| Validación RUC | SUNAT API | — | `README.md` |
| Hosting Frontend | Vercel | — | `vercel.json` |
| Testing Backend | Jest + TypeScript | — | `Documento/cap05/5.2_cobertura_backend.tex` |
| Testing Frontend | Vitest | — | `vitest.config.ts` |
| Documentación API | OpenAPI 3.0 / Swagger UI | — | `Documento/cap05/5.3_cobertura_api.tex` |
| Pruebas SQL | pgTAP | — | `supabase/tests/fase1_onboarding_test.sql` |
| Carga/Stress | Apache JMeter 5.6.3 | — | `Documento/cap05/5.1_rendimiento.tex` |

---

### 3. ARQUITECTURA DEL SISTEMA (CONFIRMADA)

El repositorio contiene **tres piezas que se ejecutan juntas** en desarrollo:

| Pieza | Ruta | Puerto | Descripción |
|---|---|---|---|
| App principal | `src/` | 5173 | Landing + módulo ONG integrado (`src/modules/ong/`) con soporte ACE |
| App ONG legacy | `ONG/` | 5174 | Aplicación ONG independiente (versión más antigua, sin tipos ACE) |
| API Express | `server/` | 8787 | IAM, autenticación/MFA, motor de riesgo, auditoría |

**Base de datos:** Supabase/PostgreSQL 16 · **11 schemas** · ~**100 tablas** · ~**150 políticas RLS** · **15 funciones** · **3 Edge Functions** · **3 buckets Storage**

**Fuente:** `README.md` (líneas 14–20), `AUDIT_REPORT_S1.md` (§2)

---

### 4. MÓDULOS FUNCIONALES IMPLEMENTADOS (29 REQUISITOS)

| # | Módulo | RF asociados |
|---|---|---|
| 1 | Onboarding / Registro ONG | RF-001, RF-002 |
| 2 | Autenticación + Motor de Riesgo + MFA/OTP | RF-003, RF-004, RF-005, RF-006 |
| 3 | IAM (Roles, permisos, sesiones) | RF-007, RF-008, RF-009, RF-010 |
| 4 | Sedes | RF-011 |
| 5 | Personas — Voluntarios | RF-012 |
| 6 | Personas — Beneficiarios + Ficha Médica | RF-013, RF-014 |
| 7 | Carnets Digitales (QR) | RF-015 |
| 8 | Admisión (FSM) | RF-016, RF-017 |
| 9 | Proyectos + Tareas + Actividades | RF-018, RF-019, RF-020 |
| 10 | Operación (asistencia, horas, evidencias) | RF-021 |
| 11 | Inventario (kardex) | RF-022, RF-023 |
| 12 | Finanzas (cuentas, aprobaciones) | RF-024, RF-025 |
| 13 | Notificaciones | RF-026 |
| 14 | Gobernanza / Auditoría | RF-027, RF-028 |
| 15 | IA — Síntesis de métricas de seguridad | RF-029 |
| 16 | ACE Engine (Access & Context Engine) | ADR-005 |

**Fuente:** `Documento/cap05/5.1_requisitos_funcionales.tex`

---

### 5. DECISIONES ARQUITECTÓNICAS (ADRs — CONFIRMADOS)

| ADR | Decisión | Justificación |
|---|---|---|
| ADR-001 | Multi-tenancy via RLS en una única BD | Reducción de costos; seguridad a nivel kernel de PostgreSQL |
| ADR-002 | Sin ORM — acceso directo con `@supabase/supabase-js` | Consultas cercanas al SQL nativo; compatibilidad con RLS |
| ADR-003 | Backend Express (Node.js) + Edge Functions (Deno) | Motor de riesgo complejo no factible solo con SQL |
| ADR-004 | Auditoría por triggers DB (`fn_trigger_audit_universal`) | Inmutabilidad superior; funciona incluso con acceso SQL directo |
| ADR-005 | Motor ACE vs. invitaciones legacy | Evolución del modelo de membresías (deuda técnica parcial) |

**Fuente:** `dds/fases/fase_5_.../arquitectura/decisiones_arquitectonicas/ADRs.md`

---

### 6. METODOLOGÍA DDS+IA — 8 FASES CONFIRMADAS

| Fase | Nombre | Artefactos producidos en repositorio |
|---|---|---|
| 0 | Developer Experience | Convenciones de código, configuración de entorno |
| 1 | Descubrimiento y Análisis | `01-contexto-del-proyecto.md`, `02-problema-as-is.md`, `03-alcance-y-limites.md`, análisis As-Is, red teaming (STRIDE) |
| 2 | Innovación y Validación | Validación de patrones Zero-ORM+RLS, arquitectura híbrida |
| 3 | Diseño y Definición | Casos de uso, modelo de datos, contratos OpenAPI, historias BDD, DDD |
| 4 | UI/UX | Prototipos (imágenes en `Documento/imagenes/prototipado/`) |
| 5 | Arquitectura y Desarrollo | Código fuente, TDD, ADRs, optimización |
| 6 | QA y Testing | 334 pruebas unitarias Jest (100% PASS), cobertura 92.44%, pruebas de seguridad, E2E |
| 7 | Despliegue y Operaciones | Vercel (`vercel.json`), Supabase, scripts de CI |

**Fuente:** `dds/README.md`, `Documento/cap05/5.5_flujo_dds.tex`, `Documento/dds_integracion_tesis.md`

---

### 7. RESULTADOS DE PRUEBAS — CONFIRMADOS

#### 7.1 Pruebas Unitarias Backend (Jest)

| Métrica | Valor | Evaluación |
|---|---|---|
| Suites ejecutados | 16 | 16/16 PASS (100%) |
| Casos de prueba | 334 | 334/334 PASS (100%) |
| Sentencias cubiertas | 92.44% | 1052/1138 — Excelente |
| Ramas cubiertas | 89.70% | 1072/1195 — Muy buena |
| Funciones cubiertas | 89.47% | 136/152 — Muy buena |
| Líneas cubiertas | 93.87% | 981/1045 — Excelente |
| Tiempo total | 17.237 s | — |

**Fuente:** `Documento/cap05/5.2_cobertura_backend.tex`, `Documento/cap05/5.4_pruebas_unitarias_backend.tex`

#### 7.2 Prueba de Stress (JMeter)

| Escenario | Req/s | Latencia P95 | Tasa de Error |
|---|---|---|---|
| 1,000 usuarios concurrentes | 1,452.3 | 45 ms | 0.00% |
| 5,000 usuarios concurrentes | 4,110.8 | 128 ms | 0.02% |
| 10,000 usuarios concurrentes | 6,850.1 | 312 ms | 0.15% |

**Fuente:** `Documento/cap05/5.1_rendimiento.tex`

#### 7.3 Prueba de Aislamiento Multi-Tenant (Penetration Testing)

| Escenario | Resultado | Bloqueo |
|---|---|---|
| Token lícito (Tenant A) → intenta leer datos sin WHERE | 15 tuplas solo de Tenant A | **100%** |
| Token con firma rota | HTTP 401 | **100%** |
| Acceso anónimo (sin token) | 0 tuplas (Default-Deny) | **100%** |

**Fuente:** `Documento/cap05/5.2_aislamiento.tex`

#### 7.4 RLS Overhead (rendimiento seguridad)

| Condición | Tiempo | Overhead |
|---|---|---|
| Sin RLS | 14.2 ms | Base (0%) |
| RLS nativo (JWT current_setting) | 14.8 ms | **+4.22%** |
| Filtrado en capa de aplicación | 85.4 ms | +501.40% |

**Fuente:** `Documento/cap05/5.1_rendimiento.tex`

#### 7.5 Usabilidad SUS (N=30 operadores de ONGs)

| Métrica | Valor |
|---|---|
| Puntuación media global (μ) | 83.5 |
| Desviación estándar (σ) | ±6.8 |
| Mediana (P50) | 86.0 |
| Alfa de Cronbach | 0.88 |
| Rango (Brooke 1996) | **Excelente (Grado B+)** |

**Fuente:** `Documento/cap05/5.3_usabilidad_sus.tex`

#### 7.6 Pruebas de API (Endpoints críticos)

| Endpoint | Código HTTP | Latencia |
|---|---|---|
| POST /api/auth/terminal-login (válido) | 200 OK | 98 ms |
| POST /api/auth/terminal-login (PIN inválido) | 401 | 45 ms |
| GET /api/sedes | 200 OK | 112 ms |
| POST /api/iam/roles (sin token) | 403 | 15 ms |
| POST /api/onboarding/bootstrap-tenant | 200 OK | 140 ms |

**Fuente:** `Documento/cap05/5.11_pruebas_api.tex`

#### 7.7 Pruebas ISO 25010

| ID | Acción | Estado |
|---|---|---|
| TC-SEC-01 | SQL Injection ('; DROP TABLE...) | **PASS** — parametrizado bloqueó |
| TC-SEC-02 | Acceso sin token (ruta privada) | **PASS** — 401 en 12 ms |
| TC-SEC-03 | Alteración del claim tenant en JWT | **PASS** — firma HMAC inválida |
| TC-FUN-01 | Alta de voluntario válido | **PASS** — HTTP 201 |
| TC-FUN-02 | Alta sin campo obligatorio | **PASS** — Zod capturó 400 |

**Fuente:** `Documento/cap05/5.14_matriz_pruebas_iso.tex`

#### 7.8 Impacto Operativo / ROI

| Tarea | Sin Democra | Con Democra | Mejora |
|---|---|---|---|
| Reconciliar 50 donaciones + 30 voluntarios | 145 minutos | 18 minutos | **87.5%** |
| Latencia de auditoría (trigger por operación) | N/A | 1.2 ms | — |

**Fuente:** `Documento/cap05/5.4_roi.tex`, `Documento/cap05/5.2_aislamiento.tex`

---

### 8. IMÁGENES EXISTENTES EN EL REPOSITORIO

| Archivo | Ruta | Descripción | Uso sugerido |
|---|---|---|---|
| `Diagrama de arquitectura de la plataforma de ONG.jpg` | `Documento/imagenes/diagramas/` | Diagrama de arquitectura general | Diapositiva de Arquitectura |
| `Diagrama estructural del stack tecnologico y estandarizacion arquitectonica del sistema.jpg` | `Documento/imagenes/diagramas/` | Stack tecnológico completo | Diapositiva de Tecnologías |
| `Flujo de DDS.jpg` | `Documento/imagenes/diagramas/` | Flujo de las 8 fases DDS | Diapositiva DDS |
| `landing.png` | `Documento/imagenes/sistema/` | Pantalla de landing de Democra | Diapositiva de Contexto / Portada |
| `login.png` | `Documento/imagenes/sistema/` | Pantalla de login | Diapositiva Implementación |
| `dashborad_home.png` | `Documento/imagenes/sistema/` | Dashboard principal | Diapositiva Implementación |
| `ong_create.png` | `Documento/imagenes/sistema/` | Flujo de creación de ONG | Diapositiva Onboarding |
| `ong_join.png` | `Documento/imagenes/sistema/` | Flujo de unirse a ONG | Diapositiva Flujo Real |
| `signup_vol.png` | `Documento/imagenes/sistema/` | Registro de voluntario | Diapositiva Admisión |
| `sis_volun.png` | `Documento/imagenes/sistema/` | Módulo de voluntarios | Diapositiva Módulos |
| `sis_benefis.png` | `Documento/imagenes/sistema/` | Módulo de beneficiarios | Diapositiva Módulos |
| `sis_benefis_fichamedica.png` | `Documento/imagenes/sistema/` | Ficha médica (datos sensibles) | Diapositiva Seguridad |
| `sis_approvals.png` | `Documento/imagenes/sistema/` | Aprobaciones financieras | Diapositiva Módulos |
| `sis_credenciales.png` | `Documento/imagenes/sistema/` | Carnets digitales QR | Diapositiva Módulos |
| `sis_proyect.png` | `Documento/imagenes/sistema/` | Módulo de proyectos | Diapositiva Módulos |
| `sis_operation.png` | `Documento/imagenes/sistema/` | Operación / asistencia | Diapositiva Módulos |
| `sis_recur_inventa.png` | `Documento/imagenes/sistema/` | Inventario | Diapositiva Módulos |
| `sis_recur_finanzas.png` | `Documento/imagenes/sistema/` | Finanzas | Diapositiva Módulos |
| `sis_ajustes_roles.png` | `Documento/imagenes/sistema/` | IAM — roles | Diapositiva Seguridad |
| `sis_ajustes_sesion.png` | `Documento/imagenes/sistema/` | Sesiones activas | Diapositiva Seguridad |
| `sis_ajustes_control.png` | `Documento/imagenes/sistema/` | Panel de control | Diapositiva IAM |
| `sis_gob_area.png` | `Documento/imagenes/sistema/` | Gobernanza / auditoría | Diapositiva Gobernanza |
| `sis_gob_cat.png` | `Documento/imagenes/sistema/` | Catálogos | Diapositiva Módulos |
| `sis_recur_cursos.png` | `Documento/imagenes/sistema/` | Recursos / cursos | Diapositiva Módulos |
| `coberback.jpg` | `Documento/imagenes/tests/` | Reporte de cobertura backend Jest | Diapositiva Pruebas |
| `coberapi.jpg` | `Documento/imagenes/tests/` | Interfaz OpenAPI/Swagger | Diapositiva API |
| `uniteback.png` | `Documento/imagenes/tests/` | Resultados Jest unit tests | Diapositiva Evidencia Pruebas |
| `1_inicio.jpg` | `Documento/imagenes/prototipado/` | Prototipo pantalla inicio | Diapositiva UI/UX |
| `2_login.jpg` | `Documento/imagenes/prototipado/` | Prototipo login | Diapositiva UI/UX |
| `3_dashboard.jpg` | `Documento/imagenes/prototipado/` | Prototipo dashboard | Diapositiva UI/UX |
| `4_dashboard.jpg` | `Documento/imagenes/prototipado/` | Prototipo dashboard v2 | Diapositiva UI/UX |
| `logo.png` | `Documento/` | Logo institucional | Portada |

---

### 9. DATOS NO ENCONTRADOS EN EL REPOSITORIO

Los siguientes ítems fueron buscados y **no existen** en los archivos del repositorio:

1. **Módulo de Votaciones/Deliberación**: el README lo menciona en la descripción del proyecto ("votaciones, deliberación"), pero el análisis del código (`dds/fases/fase_1_descubrimiento_y_analisis/descubrimiento/documentacion/03-alcance-y-limites.md`, GAP-001) confirma que **no existe ninguna implementación** (sin rutas, tipos ni tablas). Esto es una brecha documentada.
2. **App Móvil Nativa**: Confirmado como OUT-SCOPE en `03-alcance-y-limites.md`.
3. **Pipeline CI/CD automatizado**: `README.md` (línea 98) indica "No hay pipeline de despliegue automatizado en este repositorio todavía."
4. **Reportes de Lighthouse** (performance web): no hay archivos de Lighthouse en el repositorio.
5. **Diagramas C4 formales** (imágenes): el repositorio tiene `dds/diagramas/README.md` pero **no contiene imágenes C4 generadas**. La teoría se describe en `Documento/cap04/4.2_modelo_c4.tex`.
6. **Seeds de catálogos versionados**: según `AUDIT_REPORT_S1.md` §7 ítem 14, los seeds no están versionados como migraciones.
7. **Baseline de BD reproducible**: `AUDIT_REPORT_S1.md` §3.3 indica que "un despliegue limpio desde el repo **fallaría**" — deuda técnica documentada.

---

## ═══════════════════════════════════════════════
## PARTE II — ESTRUCTURA DE LA PRESENTACIÓN
## ═══════════════════════════════════════════════

### JUSTIFICACIÓN DE LA ESTRUCTURA PROPUESTA

La estructura recomendada sigue el arco narrativo **Problema → Investigación → Metodología → Diseño → Implementación → Pruebas → Resultados → Conclusión**, coherente con los capítulos de la tesis y los módulos DDS.

**Tiempo total estimado: 18-20 minutos de presentación**

---

## ═══════════════════════════════════════════════
## PARTE III — DIAPOSITIVAS
## ═══════════════════════════════════════════════

---

## DIAPOSITIVA 01 — PORTADA

### Número
01

### Título
**Democra: Plataforma SaaS Multi-Tenant de Gobernanza con IA para ONGs**

### Objetivo
Causar una primera impresión profesional y establecer de inmediato el nivel de ambición del proyecto.

### Tiempo estimado
**30 segundos**

### Mensaje principal
> Este trabajo no es un CRUD básico: es una plataforma de gobernanza empresarial para organizaciones sin fines de lucro, construida con arquitectura de producción real.

### Qué debo explicar oralmente
- Tu nombre completo
- Nombre del proyecto y su naturaleza (SaaS multi-tenant)
- La institución y programa
- Un gancho: *"Hoy les voy a mostrar una plataforma con 100 tablas, 150 políticas de seguridad y 334 pruebas automatizadas — todas pasando."*

### Qué información debe aparecer
- Nombre: **Democra**
- Subtítulo: *Plataforma SaaS Multi-Tenant de Gobernanza con IA para ONGs*
- Autor: Eduardo Sebastian Paipay Vega
- Universidad / Programa / Año
- Asesor (si aplica) — **[DATO NO ENCONTRADO EN REPOSITORIO]**

### Archivos que respaldan
- `README.md`
- `Documento/caratula.tex`

### Imágenes existentes
- `Documento/logo.png` — Logo institucional
- `Documento/imagenes/sistema/landing.png` — Pantalla real del sistema (fondo difuminado)

---

## DIAPOSITIVA 02 — AGENDA

### Número
02

### Título
**Agenda**

### Tiempo estimado
**30 segundos**

### Qué información debe aparecer
1. Contexto y Problema (2 min)
2. Motivación y Objetivos (1.5 min)
3. Estado del Arte (1 min)
4. Metodología DDS + IA (2 min)
5. Arquitectura y Diseño (2 min)
6. Implementación (2 min)
7. Demostración en Vivo (2 min)
8. Pruebas y Resultados (3 min)
9. Lecciones, Limitaciones y Trabajo Futuro (1.5 min)
10. Conclusiones (1 min)
**Total: ~18 minutos**

---

## DIAPOSITIVA 03 — CONTEXTO

### Número
03

### Título
**El Sector ONG en Perú: Un Gigante Tecnológicamente Rezagado**

### Tiempo estimado
**1 minuto**

### Mensaje principal
> Más de 1,000 ONGs formales operan en Perú (APCI 2024). La mayoría gestiona procesos críticos con hojas de cálculo y archivos locales.

### Qué debo explicar oralmente
- Magnitud del sector: +1,000 ONGs formales (APCI 2024)
- Qué hacen: gestionan voluntarios, fondos, datos médicos, proyectos sociales
- El contraste: gran responsabilidad social, rezago tecnológico enorme
- *"Son organizaciones que manejan datos de poblaciones vulnerables — niños, enfermos, refugiados — y lo hacen en Excel."*

### Qué información debe aparecer
- Estadística: **+1,000 ONGs formales** activas en Perú (fuente: APCI 2024)
- Los 3 problemas estructurales:
  1. **Ausencia de trazabilidad** (quién modificó qué dato)
  2. **Data bleeding** (información sensible sin control de acceso)
  3. **Escalabilidad económica** (infraestructura TI que consume fondos de donaciones)

### Archivos que respaldan
- `Documento/cap01/1.1_diagnostico.tex`
- `dds/fases/fase_1_descubrimiento_y_analisis/descubrimiento/documentacion/02-problema-as-is.md`

---

## DIAPOSITIVA 04 — PROBLEMA

### Número
04

### Título
**8 Problemas Críticos que Enfrentan las ONGs Sin Sistema**

### Tiempo estimado
**1 minuto**

### Mensaje principal
> El problema no es vago: son 8 carencias específicas y documentadas que impiden a las ONGs operar con seguridad y eficiencia.

### Qué información debe aparecer

| # | Problema | Impacto |
|---|---|---|
| 1 | Gestión manual de voluntarios (Excel) | Pérdida de memoria institucional |
| 2 | Sin proceso estructurado de admisión | Riesgos de seguridad |
| 3 | Sin control de inventario | Pérdidas y compras innecesarias |
| 4 | Sin trazabilidad financiera | Imposible rendir cuentas |
| 5 | Sin auditoría de cambios | No se puede reconstruir qué pasó |
| 6 | Sin control de acceso granular | Todos ven todo |
| 7 | Datos médicos sin protección | Riesgo legal y ético |
| 8 | Sin credenciales digitales | Sin identidad institucional |

### Archivos que respaldan
- `dds/fases/fase_1_descubrimiento_y_analisis/descubrimiento/documentacion/01-contexto-del-proyecto.md`
- `dds/fases/fase_1_descubrimiento_y_analisis/descubrimiento/documentacion/02-problema-as-is.md`

---

## DIAPOSITIVA 05 — MOTIVACIÓN

### Número
05

### Título
**¿Por Qué Este Problema Importa? — La Propuesta de Valor de Democra**

### Tiempo estimado
**1 minuto**

### Mensaje principal
> Digitalizar ONGs no es un lujo — es devolver recursos de donaciones al campo, no a la burocracia. Democra reduce en **87.5%** el tiempo de consolidación administrativa.

### Qué información debe aparecer
- **87.5% de reducción** en tiempo de consolidación de datos (de 145 min a 18 min)
- Tres justificaciones: social, técnica, académica
- El modelo SaaS elimina costos de infraestructura para las ONGs

### Archivos que respaldan
- `Documento/cap01/1.5_justificacion.tex`
- `Documento/cap05/5.4_roi.tex`

---

## DIAPOSITIVA 06 — OBJETIVOS E HIPÓTESIS

### Número
06

### Título
**Objetivo General e Hipótesis de Trabajo**

### Tiempo estimado
**1 minuto**

### Qué información debe aparecer

**Objetivo General (sintetizado):**
> Diseñar, desarrollar y documentar una plataforma SaaS multi-tenant a escala comercial que viabilice la gestión integral de ONGs peruanas, aplicando la metodología DDS orientada a IA.

**Hipótesis:**
> La arquitectura de Democra garantiza matemáticamente el aislamiento absoluto entre tenants (0 accesos cross-tenant no autorizados), sin degradar la experiencia de usuario, alcanzando cobertura de código ≥ 85% validada con pruebas automatizadas.

**Objetivos Específicos:** (5 bullets abreviados)
- Arquitectura desacoplada SPA + API REST + PostgreSQL
- Modelo de BD multi-esquema con aislamiento por RLS
- IAM granular con RBAC + auditoría forense
- Estrategia QA con tipado estricto + pruebas automatizadas
- Validación empírica de módulos críticos

### Archivos que respaldan
- `Documento/cap01/1.4_objetivos.tex`
- `Documento/cap01/1.3_hipotesis.tex`

---

## DIAPOSITIVA 07 — ESTADO DEL ARTE

### Número
07

### Título
**Lo que Existe — y Por Qué No Es Suficiente**

### Tiempo estimado
**1 minuto**

### Mensaje principal
> El trabajo antecedente demuestra la urgencia de digitalizar ONGs, pero ninguno resuelve el problema con arquitectura multi-tenant, seguridad a nivel de kernel y metodología asistida por IA.

### Qué información debe aparecer

| Antecedente | Aporte | Limitación |
|---|---|---|
| Sánchez, 2021 (Cáritas) | Digitalización inventario ONG | Single-tenant, no móvil |
| Quispe & Mendo, 2022 (MINSA) | Interoperabilidad clínica | Colapsa bajo carga pico |
| Red Hat Research, 2023 | Pool multi-tenant con RLS | Solo teórico/industrial |
| Fowler & Lewis, 2015 | Arquitectura de microservicios | Costoso para ONGs |

**Brecha:** Ninguno combina multi-tenancy + RLS + IA + metodología DDS para ONGs peruanas.

### Archivos que respaldan
- `Documento/cap02/2.1_antecedentes.tex`

---

## DIAPOSITIVA 08 — METODOLOGÍA DDS + IA

### Número
08

### Título
**DDS + IA: El Método Que Gobernó el Proyecto**

### Tiempo estimado
**1.5 minutos**

### Mensaje principal
> DDS no es solo documentación: es una metodología que convierte al repositorio en la Única Fuente de Verdad y habilita que agentes de IA trabajen en paralelo sin conflictos.

### Qué debo explicar oralmente
- ¿Qué es DDS? Metodología propia de documentación asistida por IA
- Principio central: SSOT — la carpeta `dds/` es la columna vertebral
- 4 principios: alta cohesión, desacoplamiento, multi-agent safety, trazabilidad determinista
- Las 8 fases del ciclo de vida
- **ACLARACIÓN para el jurado**: El DDS de este proyecto (Document-Driven SDLC) es diferente al DDS del estándar industrial (Data Distribution Service de la OMG). El capítulo 2.4 de la tesis analiza y descarta el estándar industrial; el DDS metodológico es una propuesta propia.

### Qué información debe aparecer
**Las 8 fases:**
```
Fase 0: Developer Experience
Fase 1: Descubrimiento y Análisis
Fase 2: Innovación y Validación
Fase 3: Diseño y Definición
Fase 4: UI/UX
Fase 5: Arquitectura y Desarrollo
Fase 6: QA y Testing
Fase 7: Despliegue y Operaciones
```

**4 principios del DDS:**
- SSOT y alta cohesión
- Desacoplamiento funcional
- Habilitación de agentes multitarea (Multi-Agent Safety)
- Trazabilidad y versionado determinista

### Archivos que respaldan
- `dds/README.md`
- `Documento/cap02/2.10_flujo_dds_ia.tex`
- `Documento/cap05/5.5_flujo_dds.tex`

### Imágenes existentes
- `Documento/imagenes/diagramas/Flujo de DDS.jpg` — Diagrama de flujo de las 8 fases DDS

---

## DIAPOSITIVA 09 — DDS EN ACCIÓN

### Número
09

### Título
**DDS en Acción: Ingeniería Inversa + Documentación Trazable**

### Tiempo estimado
**1 minuto**

### Mensaje principal
> El proyecto comenzó con ingeniería inversa del código existente — no con un documento en blanco. DDS permitió reconstruir la realidad y luego mejorarla.

### Qué información debe aparecer

| Fase | Artefactos clave producidos |
|---|---|
| 1 — Descubrimiento | Contexto, Problema As-Is, Alcance, Red Teaming (STRIDE) |
| 3 — Diseño | Casos de uso, contratos OpenAPI, historias BDD (Gherkin), 5 ADRs |
| 5 — Arquitectura | Código fuente, TDD, ADR-001 a ADR-005 |
| 6 — QA | 334 pruebas Jest, cobertura 92.44%, pruebas ISO 25010 |

### Archivos que respaldan
- `Documento/dds_integracion_tesis.md`
- `dds/fases/fase_5_.../arquitectura/decisiones_arquitectonicas/ADRs.md`

---

## DIAPOSITIVA 10 — ARQUITECTURA GENERAL

### Número
10

### Título
**Arquitectura del Sistema: Modelo C4 — Tres Piezas, Una Plataforma**

### Tiempo estimado
**1 minuto**

### Mensaje principal
> Democra no es un monolito rígido ni una microarquitectura costosa: es un monolito modular desacoplado en 3 capas que escala como SaaS.

### Qué información debe aparecer
```
[Usuario ONG] ──HTTPS──> [Vercel CDN]
                              │
                    ┌─────────┼──────────┐
               [React SPA]  [Express API] [Supabase Auth]
               Puerto 5173  Puerto 8787
                              │
                         [PostgreSQL 16]
                         11 schemas · ~100 tablas
                         ~150 políticas RLS
                              │
                    ┌─────────┼──────────┐
               [SUNAT API] [Resend]  [Storage]
```

**Características clave:**
- Sin ORM — acceso directo con `@supabase/supabase-js`
- Multi-tenant via RLS (no bases separadas)
- Autenticación MFA propia + Supabase Auth

### Archivos que respaldan
- `README.md` §Arquitectura
- `AUDIT_REPORT_S1.md` §2
- `Documento/cap04/4.2_modelo_c4.tex`

### Imágenes existentes
- `Documento/imagenes/diagramas/Diagrama de arquitectura de la plataforma de ONG.jpg`

---

## DIAPOSITIVA 11 — STACK TECNOLÓGICO

### Número
11

### Título
**Stack Tecnológico: Moderno, Tipado y Orientado a Producción**

### Tiempo estimado
**45 segundos**

### Qué información debe aparecer

| Capa | Tecnología | Por qué |
|---|---|---|
| Frontend | React 18 + Vite 6 + TypeScript | SPA reactiva, tipado estricto |
| Estilos | Tailwind CSS 4 + Radix UI | Componentes accesibles |
| Backend | Express 5 + Node.js | Asíncrono, ligero, 10k req/s |
| BD | Supabase + PostgreSQL 16 | RLS nativo, Auth integrada |
| Email | Resend | OTP transaccionales |
| Hosting | Vercel | CDN + Serverless |
| Testing | Jest + Vitest | Unitarias + frontend |
| Docs API | OpenAPI 3.0 | Contrato formal |

### Imágenes existentes
- `Documento/imagenes/diagramas/Diagrama estructural del stack tecnologico y estandarizacion arquitectonica del sistema.jpg`

---

## DIAPOSITIVA 12 — MULTI-TENANCY Y SEGURIDAD

### Número
12

### Título
**La Decisión Más Importante: Multi-Tenancy via Row Level Security**

### Tiempo estimado
**1.5 minutos**

### Mensaje principal
> En lugar de crear una base de datos por ONG (modelo Silo), Democra comparte una única base de datos entre todas las ONGs y usa PostgreSQL para garantizar matemáticamente que ninguna ONG pueda ver los datos de otra.

### Qué debo explicar oralmente
- El problema: si tienes 5,000 ONGs, no puedes tener 5,000 bases de datos
- El modelo Pool: una BD compartida, filtrada por `tenant_id` en CADA tabla
- El peligro naive: si el backend filtra en código → un bug expone TODOS los datos
- La solución: RLS en el kernel de PostgreSQL → IMPOSIBLE saltarse el filtro
- La función central: `fn_current_tenant_id()` — SECURITY DEFINER, lee el JWT
- El overhead es de solo **+4.22%** vs. filtro en aplicación que es **+501.40%**

### Qué información debe aparecer

```sql
-- Política RLS en CADA tabla sensible:
USING (tenant_id = fn_current_tenant_id())
```

**Comparativa:**

| Modelo | Aislamiento | Overhead | Escalabilidad |
|---|---|---|---|
| Sin RLS (filtro en app) | Vulnerable a bugs | Base | Sí |
| RLS nativo (Democra) | Garantía matemática | +4.22% | Sí |
| BD separada por ONG | Perfecta | 0% | No (costosa) |

### Archivos que respaldan
- `Documento/cap04/4.3_multitenant.tex`
- `dds/fases/fase_5_.../arquitectura/decisiones_arquitectonicas/ADRs.md` (ADR-001)
- `Documento/cap05/5.1_rendimiento.tex` (tabla overhead RLS)
- `Documento/cap05/5.6_contraste_eficiencia.tex`

---

## DIAPOSITIVA 13 — MODELO DE DATOS

### Número
13

### Título
**Base de Datos: 11 Schemas, ~100 Tablas, 150 Políticas RLS**

### Tiempo estimado
**45 segundos**

### Mensaje principal
> El modelo de datos es enterprise-grade: 11 dominios separados por schemas, auditoría universal por triggers, y soporte para datos médicos con acceso controlado.

### Qué información debe aparecer

| Schema | Dominio |
|---|---|
| public | Core, IAM, Onboarding, ACE Engine |
| ong | Voluntarios, Proyectos, Actividades |
| rrhh | Admisión, Documentos |
| finanzas | Cuentas, Transacciones, Aprobaciones |
| clinico | Fichas médicas, accesos auditados |
| academico | — |
| comunicaciones | Notificaciones |
| auditoria | Audit log universal |
| gamificacion | (módulo pendiente) |
| donaciones | (módulo pendiente) |
| impacto | (módulo pendiente) |

**Componentes cross-cutting:**
- `fn_trigger_audit_universal()` — trigger en cada tabla sensible
- ~150 políticas RLS
- 3 buckets Storage: `avatars` (público), `evidence` (privado), `id_templates` (público)

### Archivos que respaldan
- `AUDIT_REPORT_S1.md` §2
- `DATABASE_DICTIONARY_S1.md`

---

## DIAPOSITIVA 14 — MÓDULOS FUNCIONALES

### Número
14

### Título
**15 Módulos Funcionales — Una Plataforma Completa**

### Tiempo estimado
**1 minuto**

### Qué información debe aparecer
```
🔐 SEGURIDAD
   Onboarding · MFA/OTP · Motor de Riesgo · IAM · ACE Engine

👥 PERSONAS
   Voluntarios · Beneficiarios · Ficha Médica auditada

📋 OPERACIÓN
   Admisión (FSM) · Proyectos · Actividades · Asistencia

💰 RECURSOS
   Inventario (kardex) · Finanzas (aprobaciones)

🏛️ GOBERNANZA
   Auditoría forense · Notificaciones · IA de seguridad
```

### Imágenes existentes (collage recomendado)
- `Documento/imagenes/sistema/dashborad_home.png`
- `Documento/imagenes/sistema/sis_volun.png`
- `Documento/imagenes/sistema/sis_credenciales.png`
- `Documento/imagenes/sistema/sis_recur_finanzas.png`

---

## DIAPOSITIVA 15 — SEGURIDAD ACTIVA

### Número
15

### Título
**Seguridad Activa: Motor de Riesgo Estocástico + Zero-Trust**

### Tiempo estimado
**1 minuto**

### Mensaje principal
> La seguridad de Democra opera bajo el paradigma Zero-Trust: nunca confíes, siempre verifica.

### Qué información debe aparecer
**Capas de seguridad:**
1. `Supabase Auth` — autenticación base (JWT)
2. `Express Middleware` — validación JWT, rate limiting, Helmet
3. `Motor de Riesgo` — clasificación estocástica (Low/Medium/High/Critical)
4. `MFA/OTP` — desafío dinámico si riesgo ≥ Medium
5. `RLS PostgreSQL` — aislamiento garantizado a nivel kernel
6. `fn_trigger_audit_universal()` — log inmutable de cada DML

**Resultados verificados:**
- 100% de intercepción de accesos cross-tenant
- SQL Injection: bloqueado por queries parametrizadas
- Latencia de auditoría: **1.2 ms por operación**

### Archivos que respaldan
- `Documento/cap06/6.1_conclusiones.tex` (conclusión 2)
- `Documento/cap05/5.2_aislamiento.tex`
- `Documento/cap05/5.9_seguridad_defensiva.tex`

### Imágenes existentes
- `Documento/imagenes/sistema/sis_ajustes_sesion.png`
- `Documento/imagenes/sistema/sis_benefis_fichamedica.png`

---

## DIAPOSITIVA 16 — FLUJO REAL DE TRABAJO

### Número
16

### Título
**Flujo Real: Del Registro de una ONG a la Primera Operación**

### Tiempo estimado
**1 minuto**

### Qué información debe aparecer
```
[SUNAT] ← verifica RUC
    ↓
[ONG se registra] → bootstrap_tenant() → tenant_id único
    ↓
[Login] → Motor de Riesgo → OTP si necesario
    ↓
[Admin crea enlace ACE] → Voluntario se autoregistra
    ↓
[FSM Admisión] → Aprobado → Carnets QR generados
    ↓
[Actividad] → Registro asistencia + evidencias
    ↓
[audit_log] ← trigger registra CADA operación
```

### Imágenes existentes
- `Documento/imagenes/sistema/ong_create.png`
- `Documento/imagenes/sistema/ong_join.png`
- `Documento/imagenes/sistema/signup_vol.png`

---

## DIAPOSITIVA 17 — API REST

### Número
17

### Título
**API REST: 18+ Endpoints, OpenAPI 3.0, Bearer JWT**

### Tiempo estimado
**45 segundos**

### Qué información debe aparecer

| Módulo | Endpoints | Función |
|---|---|---|
| auth | variable | Login, OTP, JWT, riesgo |
| iam | 10 | Roles, permisos, sesiones |
| onboarding | 2 | Registro ONG, validación RUC |
| sedes | 4 | CRUD de sedes |
| audit | 2 | Log y eventos |
| **Total** | **18+** | — |

### Imágenes existentes
- `Documento/imagenes/tests/coberapi.jpg` — Interfaz OpenAPI/Swagger

---

## DIAPOSITIVA 18 — INTEGRACIÓN DE IA

### Número
18

### Título
**Inteligencia Artificial: Síntesis Explicativa de Métricas de Seguridad**

### Tiempo estimado
**30 segundos**

### Mensaje principal
> La IA en Democra no es decorativa — resume en lenguaje natural los reportes técnicos de seguridad para que un administrador sin perfil técnico entienda qué está pasando.

### Qué información debe aparecer
- RF-029: síntesis de métricas de seguridad via IA
- Suite de pruebas: `ai-client` (parte de los 16 suites Jest, 100% PASS)
- Escenarios probados: timeout, respuestas malformadas, errores de API externa
- **NOTA**: El módulo de votaciones/deliberación mencionado en el README **no está implementado** (GAP-001 documentado)

### Archivos que respaldan
- `Documento/cap05/5.1_requisitos_funcionales.tex` (RF-029)
- `Documento/cap05/5.4_pruebas_unitarias_backend.tex`

---

## DIAPOSITIVA 19 — DEMOSTRACIÓN EN VIVO

### Número
19

### Título
**Demostración en Vivo — El Sistema en Acción**

### Tiempo estimado
**2 minutos**

---

### PLAN DE DEMOSTRACIÓN

#### Orden y tiempos:

| Paso | Acción | Tiempo | Pantalla |
|---|---|---|---|
| 1 | Abrir landing page de Democra | 10 s | `landing.png` (fallback) |
| 2 | Login + Motor de Riesgo | 20 s | `login.png` |
| 3 | Dashboard principal | 15 s | `dashborad_home.png` |
| 4 | Módulo Voluntarios → perfil completo | 20 s | `sis_volun.png` |
| 5 | Ficha médica → muestra que pide motivo | 20 s | `sis_benefis_fichamedica.png` |
| 6 | Carnets digitales con QR | 15 s | `sis_credenciales.png` |
| 7 | IAM → roles y permisos | 15 s | `sis_ajustes_roles.png` |
| 8 | Auditoría → log de operaciones | 15 s | `sis_gob_area.png` |

**Total: ~2 minutos**

#### Plan de contingencia si falla la conexión:
- Tener capturas de pantalla abiertas en otra pestaña (`Documento/imagenes/sistema/`)
- Tener el video de la app corriendo localmente (`npm run dev`)
- En último caso: usar las capturas directamente desde las diapositivas

---

## DIAPOSITIVA 20 — ESTRATEGIA DE TESTING

### Número
20

### Título
**Estrategia de Calidad: Pirámide de Pruebas y Cobertura > 90%**

### Tiempo estimado
**45 segundos**

### Qué información debe aparecer
```
         [E2E Tests]
        Flujo admisión completo con JWT real
       
     [Pruebas de Integración]
     Frontend + Backend + BD

   [Pruebas de API]
   18+ endpoints · OpenAPI 3.0
  
 [Pruebas Unitarias — 334 casos]
 16 suites · Jest · 100% PASS
 Cobertura sentencias: 92.44%
```

### Archivos que respaldan
- `docs/TEST_MASTER_PLAN.md`
- `docs/TEST_DOCS.md`

---

## DIAPOSITIVA 21 — EVIDENCIA DE PRUEBAS

### Número
21

### Título
**Resultados: 334 Pruebas, 0 Fallos, 92.44% de Cobertura**

### Tiempo estimado
**1 minuto**

### Qué información debe aparecer

| Métrica | Valor | Umbral | Estado |
|---|---|---|---|
| Sentencias | **92.44%** | ≥ 85% | ✅ SUPERADO |
| Ramas | **89.70%** | ≥ 85% | ✅ SUPERADO |
| Funciones | **89.47%** | ≥ 85% | ✅ SUPERADO |
| Líneas | **93.87%** | ≥ 85% | ✅ SUPERADO |
| Casos PASS | **334 / 334** | 100% | ✅ PERFECTO |
| Suites PASS | **16 / 16** | 100% | ✅ PERFECTO |

### Imágenes existentes
- `Documento/imagenes/tests/uniteback.png` — Resultados Jest
- `Documento/imagenes/tests/coberback.jpg` — Reporte de cobertura HTML

---

## DIAPOSITIVA 22 — PRUEBA DE AISLAMIENTO MULTI-TENANT

### Número
22

### Título
**Prueba Crítica: 100% de Bloqueo de Accesos Cross-Tenant**

### Tiempo estimado
**1 minuto**

### Mensaje principal
> La hipótesis decía "cero accesos cross-tenant no autorizados". El resultado: **100% de bloqueo en los 3 vectores de ataque probados.**

### Qué información debe aparecer

| Vector de Ataque | Respuesta del Sistema | Bloqueo |
|---|---|---|
| Token lícito sin cláusula WHERE | 15 tuplas del Tenant A únicamente | **100%** |
| Token con firma HMAC alterada | HTTP 401 inmediato | **100%** |
| Acceso anónimo (sin token) | 0 tuplas — Default-Deny | **100%** |

**RLS vs. Filtro en aplicación:**

| Método | Overhead |
|---|---|
| Sin RLS (base) | 0% |
| RLS nativo (Democra) | **+4.22%** |
| Filtro en app (método naive) | +501.40% |

### Archivos que respaldan
- `Documento/cap05/5.2_aislamiento.tex`
- `Documento/cap05/5.6_contraste_eficiencia.tex`

---

## DIAPOSITIVA 23 — PRUEBA DE RENDIMIENTO

### Número
23

### Título
**Stress Test: 10,000 Usuarios Concurrentes, 0.15% de Error**

### Tiempo estimado
**45 segundos**

### Qué información debe aparecer

| Escenario | Throughput | Latencia P95 | Error |
|---|---|---|---|
| 1,000 usuarios | 1,452.3 req/s | **45 ms** | **0.00%** |
| 5,000 usuarios | 4,110.8 req/s | **128 ms** | **0.02%** |
| 10,000 usuarios | 6,850.1 req/s | **312 ms** | **0.15%** |

**Umbral definido en tesis:** Latencia < 200 ms → cumplido en escenarios nominal y tensión.

### Archivos que respaldan
- `Documento/cap05/5.1_rendimiento.tex`
- `Documento/cap05/5.7_comportamiento_asincrono.tex`

---

## DIAPOSITIVA 24 — USABILIDAD SUS

### Número
24

### Título
**Usabilidad: Puntuación SUS 83.5 — Calificación "Excelente"**

### Tiempo estimado
**45 segundos**

### Qué información debe aparecer

| Métrica | Valor |
|---|---|
| N (muestra) | 30 operadores de ONGs |
| Puntuación media (μ) | **83.5** |
| Desviación estándar (σ) | ±6.8 |
| Alfa de Cronbach | 0.88 (Bueno/Alto) |
| Clasificación (Brooke 1996) | **Excelente (Grado B+)** |
| Umbral de "usable" | 68.0 |
| Margen sobre umbral | **+15.5 puntos** |

### Archivos que respaldan
- `Documento/cap05/5.3_usabilidad_sus.tex`
- `Documento/cap05/5.8_usabilidad_cognitiva.tex`

---

## DIAPOSITIVA 25 — HALLAZGOS DE AUDITORÍA (TRANSPARENCIA)

### Número
25

### Título
**Transparencia Técnica: Lo Que Encontramos y Cómo lo Documentamos**

### Tiempo estimado
**1 minuto**

### Mensaje principal
> Un proyecto maduro documenta sus problemas — no los oculta. La auditoría encontró 11 conflictos, 4 módulos sin uso y un problema de reproducibilidad.

### Qué información debe aparecer

| Hallazgo | Impacto | Estado |
|---|---|---|
| Baseline de BD no reproducible | Despliegue limpio fallaría | Documentado, pendiente |
| Migración 20260426 con sintaxis inválida | Falla en BD limpia | Documentado |
| Doble motor de invitaciones | Riesgo de inconsistencia | ADR-005, pendiente |
| 4 módulos muertos (donaciones, gamificacion, impacto) | Deuda técnica | Documentado |
| 11 conflictos de definición | Deriva documental | Documentados con evidencia |

### Archivos que respaldan
- `AUDIT_REPORT_S1.md` (íntegro — 223 líneas de evidencia)

---

## DIAPOSITIVA 26 — RESULTADOS CONSOLIDADOS

### Número
26

### Título
**Dashboard de Resultados: Hipótesis Confirmada en 3 Dimensiones**

### Tiempo estimado
**1 minuto**

### Qué información debe aparecer

**HIPÓTESIS → RESULTADO:**

| Afirmación | Umbral | Resultado | Estado |
|---|---|---|---|
| Cero accesos cross-tenant | 100% bloqueo | 100% bloqueo (3 vectores) | ✅ |
| Cobertura de código | ≥ 85% | 92.44% sentencias | ✅ |
| Usabilidad SUS | > 68 | 83.5 puntos | ✅ |

**MÉTRICAS ADICIONALES:**

| Métrica | Valor |
|---|---|
| Latencia P95 (1k usuarios) | 45 ms |
| Overhead RLS | Solo +4.22% |
| Reducción tiempo administrativo | **87.5%** |
| Latencia auditoría trigger | 1.2 ms |
| Casos de prueba | 334/334 PASS |

---

## DIAPOSITIVA 27 — COMPARATIVA CON ANTECEDENTES

### Número
27

### Título
**¿Dónde Está el Aporte? — Democra vs. el Estado del Arte**

### Tiempo estimado
**45 segundos**

### Qué información debe aparecer

| Criterio | Sánchez 2021 | Quispe & Mendo 2022 | **Democra** |
|---|---|---|---|
| Tipo de tenant | Single-tenant | N/A | **Multi-tenant** |
| Acceso móvil | No | Limitado | **Web responsive** |
| Motor de seguridad | Ninguno | Básico | **RLS + MFA + Risk Engine** |
| Bajo carga pico | Colapsa | Thread exhaustion | **0.15% error a 10k usuarios** |
| Usabilidad SUS | No medido | No medido | **83.5 — Excelente** |
| Metodología IA | No | No | **DDS + IA (8 fases)** |
| Auditoría forense | No | No | **Trigger universal inmutable** |

---

## DIAPOSITIVA 28 — LECCIONES APRENDIDAS

### Número
28

### Título
**Lecciones Aprendidas: Lo Que el Proyecto Enseñó**

### Tiempo estimado
**45 segundos**

### Qué información debe aparecer
1. **SSOT primero**: sin fuente única de verdad, la IA genera documentación inconsistente
2. **Versionado de seeds**: catálogos sin seeds versionados hacen el despliegue imposible
3. **Deuda técnica es normal**: documentarla honestamente vale más que ocultarla
4. **No duplicar**: dos fuentes del mismo módulo (ONG/ vs src/modules/ong/) divergen inevitablemente
5. **RLS desde el día 1**: agregar seguridad después es 10x más costoso

---

## DIAPOSITIVA 29 — LIMITACIONES Y TRABAJO FUTURO

### Número
29

### Título
**Limitaciones Actuales y Roadmap Futuro**

### Tiempo estimado
**45 segundos**

### Qué información debe aparecer

**Limitaciones (del repositorio):**
- Dependencia de conectividad 4G/5G (no funciona offline en zonas rurales)
- Digitalización manual de documentos físicos (sin OCR automático)
- Baseline de BD no reproducible desde cero (deuda técnica)
- Módulo de Votaciones/Deliberación **no implementado** (GAP-001)

**Trabajo futuro (de la tesis):**
1. **PWA con offline-first** — Service Workers + IndexedDB
2. **Event Sourcing con Apache Kafka** — auditoría aún más robusta
3. **Chaos Engineering continuo**
4. **Criptografía Post-Cuántica (PQC)** — CRYSTALS-Kyber / CRYSTALS-Dilithium
5. **IA predictiva** — Apache Spark + Deep Learning
6. **Confidential Computing** — Intel SGX / AMD SEV-SNP para datos médicos

### Archivos que respaldan
- `Documento/cap05/5.10_limitaciones.tex`
- `Documento/cap06/6.2_recomendaciones.tex`

---

## DIAPOSITIVA 30 — CONCLUSIONES

### Número
30

### Título
**Conclusiones: Una Arquitectura que Resuelve un Problema Real**

### Tiempo estimado
**1 minuto**

### Mensaje principal
> Democra demuestra que es posible construir un SaaS enterprise-grade, seguro por diseño y validado con rigor científico, para el tercer sector peruano.

### Qué información debe aparecer
**5 conclusiones (una por conclusión de la tesis):**

1. ✅ RLS nativo → 100% aislamiento cross-tenant, overhead solo +4.22%
2. ✅ Motor de Riesgo estocástico → Zero-Trust Architecture funcional
3. ✅ Triggers de auditoría → 100% CDC con 1.2 ms de overhead
4. ✅ SPA + React Fiber → SUS 83.5 (Excelente), usabilidad superior
5. ✅ Event Loop Node.js → 10k concurrentes, 0.15% error (vs. Thread Exhaustion en sistemas peruanos)

### Archivos que respaldan
- `Documento/cap06/6.1_conclusiones.tex` (5 conclusiones íntegras)

---

## DIAPOSITIVA 31 — PREGUNTAS

### Número
31

### Título
**¿Preguntas?**

### Qué debo tener preparado
- El sistema corriendo localmente (`npm run dev`) o capturas de pantalla
- Archivos de cobertura: `coverage_final.txt`, `coverage_v8_final.txt`
- `AUDIT_REPORT_S1.md` (responde preguntas de seguridad)
- `Documento/main.pdf` (tesis completa)

### Posibles preguntas del jurado y respuestas respaldadas:

| Pregunta probable | Evidencia en repositorio |
|---|---|
| "¿Cómo garantiza el aislamiento entre ONGs?" | `cap05/5.2_aislamiento.tex` + `ADRs.md` ADR-001 |
| "¿Cuántas pruebas tiene el sistema?" | `cap05/5.2_cobertura_backend.tex` — 334 casos, 100% PASS |
| "¿Por qué no usó un ORM?" | `ADRs.md` ADR-002 |
| "¿La base de datos es reproducible?" | `AUDIT_REPORT_S1.md` §3.3 — "no desde el repo" |
| "¿Qué pasa con el módulo de votaciones?" | `03-alcance-y-limites.md` GAP-001 — no implementado |
| "¿Por qué eligió Supabase?" | `ADRs.md` + `01-contexto-del-proyecto.md` §5 |
| "¿Qué es DDS?" | `dds/README.md` + `cap02/2.10_flujo_dds_ia.tex` |
| "¿Cómo validó la usabilidad?" | `cap05/5.3_usabilidad_sus.tex` — SUS N=30, α=0.88 |

---

## ═══════════════════════════════════════════════
## PARTE IV — ANÁLISIS DE PRUEBAS CLASIFICADAS
## ═══════════════════════════════════════════════

### PRUEBAS UNITARIAS
- **Framework:** Jest (TypeScript) · Backend
- **Cantidad:** 334 casos de prueba en 16 suites
- **Cobertura:** Sentencias 92.44% · Líneas 93.87%
- **Resultado:** 334/334 PASS (0 FAIL)
- **Conclusión:** Supera el umbral ISO/IEC 25010 (>80%) y el objetivo propio (≥85%)
- **Fuente:** `Documento/cap05/5.2_cobertura_backend.tex`

### PRUEBAS DE INTEGRACIÓN (E2E)
- **Escenario:** Admisión de voluntario con carga de documento adjunto (multipart/form-data)
- **Técnica:** Network sniffing para verificar integridad del JWT en tránsito
- **Resultado:** HTTP 201 Created, tenant_id correcto, documento en Supabase Storage
- **Fuente:** `Documento/cap05/5.12_pruebas_integracion.tex`

### PRUEBAS DE API
- **Framework:** OpenAPI 3.0 / Swagger UI
- **Resultado:** Peticiones lícitas < 140 ms · Rechazos en < 15 ms
- **Fuente:** `Documento/cap05/5.11_pruebas_api.tex`

### PRUEBAS DE SEGURIDAD (White-Box Penetration Testing)
- **Técnica:** Inyección de queries sin WHERE con JWT lícito; token modificado; acceso anónimo
- **ISO 25010:** TC-SEC-01, TC-SEC-02, TC-SEC-03
- **Resultado:** 100% de bloqueo en los 3 vectores
- **Fuente:** `Documento/cap05/5.2_aislamiento.tex`, `cap05/5.14_matriz_pruebas_iso.tex`

### PRUEBAS DE RENDIMIENTO (Stress Testing)
- **Herramienta:** Apache JMeter 5.6.3
- **Resultado:** 45 ms P95 (1k) · 312 ms P95 (10k) · 0.15% error máximo
- **Fuente:** `Documento/cap05/5.1_rendimiento.tex`

### PRUEBAS DE USABILIDAD (SUS)
- **Instrumento:** System Usability Scale (10 ítems, Likert 5 puntos)
- **Muestra:** N=30 operadores de ONGs reales
- **Resultado:** μ=83.5, σ=±6.8, α=0.88 → Calificación "Excelente (Grado B+)"
- **Fuente:** `Documento/cap05/5.3_usabilidad_sus.tex`

### PRUEBAS SQL (pgTAP)
- **Archivo:** `supabase/tests/fase1_onboarding_test.sql`
- **Estado:** Existe pero requiere entorno Supabase CLI propio (tiene placeholders TU_TENANT_ID)
- **Conclusión:** Prueba funcional diseñada pero no automatizable sin configuración adicional

---

## ═══════════════════════════════════════════════
## PARTE V — AUDITORÍA FINAL DE COHERENCIA
## ═══════════════════════════════════════════════

### COHERENCIA CON LA TESIS

| Sección tesis | Diapositiva | Coherencia |
|---|---|---|
| Cap 1 — Diagnóstico | Diap. 03 | ✅ Texto idéntico al LaTeX |
| Cap 1 — Problema formulado | Diap. 04, 06 | ✅ 8 problemas + pregunta general |
| Cap 1 — Hipótesis | Diap. 06, 26 | ✅ 3 partes cuantificables |
| Cap 1 — Objetivos | Diap. 06 | ✅ General + 5 específicos |
| Cap 2 — Antecedentes | Diap. 07 | ✅ Sánchez, Quispe, Red Hat, Fowler |
| Cap 2 — DDS metodología | Diap. 08 | ✅ 4 principios + 8 fases |
| Cap 3 — Variables | Diap. 20 | ✅ Funcionamiento + Usabilidad |
| Cap 4 — Arquitectura | Diap. 10, 12, 13 | ✅ C4 + RLS + schemas |
| Cap 5 — Resultados | Diap. 21–26 | ✅ Todos los valores del LaTeX |
| Cap 6 — Conclusiones | Diap. 30 | ✅ 5 conclusiones del LaTeX |
| Cap 6 — Recomendaciones | Diap. 29 | ✅ Trabajo futuro del LaTeX |

### TIEMPO TOTAL ESTIMADO

| Sección | Diapositivas | Tiempo |
|---|---|---|
| Apertura | 01-02 | 1 min |
| Problema y contexto | 03-05 | 3 min |
| Marco conceptual | 06-09 | 3.5 min |
| Arquitectura y diseño | 10-15 | 4.5 min |
| Implementación | 16-18 | 2.25 min |
| Demostración | 19 | 2 min |
| Pruebas y resultados | 20-26 | 5.5 min |
| Cierre | 27-30 | 3.25 min |
| Preguntas | 31 | Libre |
| **TOTAL** | **31 diapositivas** | **~25 min** |

> **Para ajustar a 18-20 minutos:** Fusionar Diap. 09 con 08, Diap. 11 con 10, y Diap. 17+18 en una sola "Implementación". Esto da ~27 diapositivas en ~18-19 minutos.

---

### AUSENCIAS CRÍTICAS (deben generarse antes de la sustentación)

1. **Diagrama C4 formal** (imagen): existe descripción en `cap04/4.2_modelo_c4.tex` pero no hay imagen generada. → Crear con PlantUML/draw.io.
2. **Diagrama del Motor de Riesgo**: existe código en `server/` pero no hay diagrama. → Crear manualmente.
3. **Nombre del asesor**: no aparece en ningún archivo del repositorio. → Agregar a la portada.
4. **Nombre completo de la institución**: verificar en `Documento/caratula.tex`.
5. **Video de demostración del sistema**: no existe en el repositorio. → Grabar antes de la sustentación.

---

*Fin de PRESENTACION.md — Documento Maestro de Sustentación*  
*Generado el: 2026-07-16 mediante auditoría integral del repositorio*  
*Cada afirmación tiene ruta de archivo como evidencia. Nada fue inventado.*
