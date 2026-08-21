# 🚀 AGENTS.md — MANIFIESTO DE EDUCACION OS / DEMOCRA SCHOOL: EL OPERATING SYSTEM INTELIGENTE DE LA EDUCACIÓN

> **"No estamos construyendo un software educativo. Estamos construyendo la infraestructura inteligente operacional que va a transformar cómo las instituciones educan, previenen la deserción escolar, y optimizan el aprendizaje humano automáticamente."**

---

## 🌌 LA VISIÓN

En 2030, **EDUCACION OS será la infraestructura operacional donde correrá la educación global:**

Un **sistema operativo vivo** que:
- Aprende de cada interacción pedagógica, cada ritmo de aprendizaje y cada patrón de rendimiento.
- Predice el riesgo de abandono y deserción académica 30 días antes mediante IA con alerta temprana (EWS).
- Personaliza la ruta de aprendizaje automáticamente adaptando ritmos, formatos y dificultades por estudiante.
- Conecta a docentes, coordinadores, estudiantes, padres de familia y directores en una red operacional fluida.
- Automatiza tareas administrativas repetitivas (firmas digitales, actas, sincronización ERP contable).
- **Posee un data moat impenetrable**: 10 billones de datapoints pedagógicos que sustentan el Gemelo Digital del Estudiante (DTL).

---

## ⚡ REGLAS OPERATIVAS DE SUPABASE & VIBE CODING

### **1. Fuente Única de Verdad de Tipos (`packages/shared-types/src/database.types.ts`)**
Toda definición de tabla, enum o función en PostgreSQL DEBE ser reflejada automáticamente en `database.types.ts` utilizando la CLI de Supabase:
```bash
pnpm db:types
```
El backend (`apps/api`) y el frontend (`apps/web`) importan exclusivamente los tipos generados de `@educacion/shared-types`, eliminando el 90% de alucinaciones y descalces de tipos.

### **2. Gestión de Migraciones en `packages/database/supabase`**
- Toda creación o modificación de tablas reside en `packages/database/supabase/migrations/` con prefijo de timestamp ISO (`YYYYMMDDHHMMSS_nombre.sql`).
- Toda política de seguridad RLS (Row Level Security) reside en `packages/database/supabase/policies/`.
- Los datos de prueba iniciales se gestionan en `packages/database/supabase/seed.sql`.

---

## 📚 AGENTS.md — Guía Técnica Maestra del Repositorio

> **Este archivo es leído automáticamente por los agentes de IA al inicio de cada sesión.**
> Contiene el contexto completo, reglas operativas, estructura del proyecto,
> principios de arquitectura DDS y las normas de sincronización con GitHub.

---

## 🔴 CENTRO DE OPERACIONES GITHUB — SINCRONIZACIÓN MAIN

> **Repositorio Remoto Oficial**: `https://github.com/Eduardo-Sebastian-Paipay-Vega/Educ_Democra_trys.git`  
> **Rama Principal**: `main` (Fuente de Verdad en la Nube)  
> **Directorio Local**: `d:\2026\EDUCIA`

### Protocolo AutoPush
```bash
git add -A && git commit -m "feat(alcance): descripción clara" && git push origin main
```

---

## 🔄 REGLA DE PROPAGACIÓN BIDIRECCIONAL EN CASCADA Y CONTROL AUDITABLE DE CAMBIOS (`cambios/`)

### 1. Principio de Propagación Bidireccional
Cualquier modificación realizada en una fase DDS o paquete compartido DEBE propagarse **hacia arriba** (Fase 4, 3, 2, 1, 0, 00) y **hacia abajo** (Fase 6, 7, `packages/*`, `apps/*`) para garantizar la trazabilidad $1:1$ ininterrumpida.

### 2. Protocolo de Registro Obligatorio en `cambios/`
Por cada cambio o modificación realizada en la arquitectura/documentación/código, se DEBE generar un archivo en `cambios/`:
`cambios/DDMMYYYY_NombreDelCambio.md` (Ejemplo: `cambios/03082026_AdaptacionEcosistemaSupabase.md`).

---

## 🗂️ Estructura Monorepo Supabase del Repositorio

```
EDUCIA/
├── README.md                                 ← Portal de Navegación DDS & Supabase
├── AGENTS.md                                 ← Manifiesto y guía técnica de IA (Este archivo)
├── pnpm-workspace.yaml                        ← Configuración Monorepo PNPM
├── package.json                              ← Manifest raíz (scripts Supabase CLI)
├── docker-compose.yml                        ← Orquestación de infraestructura auxiliar
├── .env.example                              ← Variables de entorno Supabase & App
│
├── 00_GOBERNANZA_Y_ESTRATEGIA/               ← FASE 00: Archivo Maestro Consolidades
├── FASE_0_DDS/                               ← FASE 0: Archivo Maestro Requisitos & Seguridad
├── FASE_1_PROBLEMAS/                          ← FASE 1: Archivo Maestro Problemas
├── FASE_2_VALOR_AGREGADO/                     ← FASE 2: Archivo Maestro Propuesta de Valor
├── FASE_3_REQUISITOS_Y_CASOS_USO/             ← FASE 3: Archivo Maestro Casos de Uso
├── FASE_4_PLAN_DE_NEGOCIO/                    ← FASE 4: Archivo Maestro Plan de Negocio
├── FASE_5_BASE_DE_DATOS/                      ← FASE 5: Archivo Maestro DDL SQL PostgreSQL
├── FASE_6_DISENO_UX_UI/                       ← FASE 6: Archivo Maestro Diseño UX/UI
├── FASE_7_APLICACION_Y_APIS/                 ← FASE 7: Archivo Maestro Contratos API NestJS
│
├── apps/                                     ← Aplicaciones Ejecutables
│   ├── api/                                  ← Backend NestJS (`apps/api/src`)
│   └── web/                                  ← Frontend Next.js / React (`apps/web/src`)
│
├── packages/                                 ← Código Compartido Monorepo
│   ├── config/                               ← TSConfig base
│   ├── database/                             ← Ecosistema Supabase (config, migrations, RLS)
│   │   └── supabase/
│   │       ├── config.toml                   ← Configuración Supabase CLI
│   │       ├── seed.sql                      ← Datos de prueba iniciales
│   │       ├── migrations/                   ← Migraciones SQL (Fase 5)
│   │       └── policies/                     ← Políticas RLS (Fase 0)
│   ├── shared-types/                         ← database.types.ts & DTOs
│   └── ui/                                   ← Design Tokens & Componentes
│
└── cambios/                                  ← Registro histórico de cambios auditable
```

---

*AGENTS.md actualizado con arquitectura Supabase Enterprise Monorepo. Última actualización: 2026-08-03*
*Repositorio EDUCACION OS / Democra School.*


# AGENTS.md — Workspace EDUCACION OS / Democra School
# `.agents/AGENTS.md` — Reglas específicas del workspace para agentes de IA

> Este archivo extiende el `AGENTS.md` raíz del repositorio con reglas específicas para el equipo de desarrollo de Frontend/UI.

---

## 🎨 SISTEMA DE SKILLS FRONTEND (Activación Automática)

### Jerarquía de Activación

Cuando se detecte cualquier tarea relacionada con Frontend, UI, UX, componentes, diseño o interactividad, los agentes DEBEN activar las siguientes skills en orden de prioridad:

| Prioridad | Skill | Trigger |
|-----------|-------|---------|
| **ABSOLUTA** | `frontend-master` | Cualquier tarea de UI/Frontend |
| 1 | `ui-ux-pro` | Nuevo componente/página |
| 2 | `react-design-patterns` | Arquitectura React/Next.js |
| 3 | `design-system-enforcer` | Antes de crear cualquier componente |
| 4 | `tailwind-expert` | Escribir o revisar Tailwind |
| 5 | `accessibility-expert` | Forms, tables, interactivos |
| 6 | `responsive-expert` | Layouts y páginas |
| 7 | `browser-testing` | Tras implementar UI |
| 8 | `modern-web-guidance` | Performance/SEO |
| 9 | `frontend-code-review` | Review/refactor |
| 10 | `shadcn-ui-expert` | Componentes shadcn, formularios |

### Palabras Clave que Activan el Sistema de Skills Frontend

Si el mensaje del usuario contiene alguna de estas palabras, activar `frontend-master` primero:

```
componente, component, página, page, pantalla, screen, dashboard, panel,
layout, table, tabla, formulario, form, diseño, design, UI, UX, interfaz,
interface, botón, button, card, modal, sidebar, nav, header, footer,
landing, hero, SaaS, admin, portal, responsive, mobile, dark mode,
Next.js, React, Tailwind, shadcn, Radix, TypeScript (en contexto UI),
gráfico, chart, badge, alert, toast, skeleton, spinner, loading
```

---

## 🚫 GUARDRAILS FRONTEND (No Negociables)

Los agentes DEBEN rechazar o corregir cualquier código que viole estas reglas:

1. **Sin colores hardcodeados** (`bg-[#4f46e5]`) — usar tokens del sistema (`bg-primary`)
2. **Sin layouts con position absolute** — usar CSS Grid o Flexbox
3. **Sin componentes duplicados** — verificar shadcn/ui antes de crear
4. **Sin pantallas en blanco durante carga** — siempre `<Skeleton />`
5. **Sin estados vacíos ignorados** — siempre Empty State con CTA
6. **Sin `any` en TypeScript** — tipos correctos siempre
7. **Sin prop drilling > 2 niveles** — Context o Zustand
8. **Sin desarrollo Desktop-first** — Mobile-First obligatorio
9. **Sin componentes sin Dark Mode** — `dark:` clases siempre
10. **Lighthouse < 95 es inaceptable** — verificar antes de PR

---

## 🏗️ ARQUITECTURA FRONTEND (Referencia Rápida)

```
apps/web/src/
├── app/                → Next.js App Router (layouts, pages, loading, error)
├── features/           → Lógica por dominio de negocio
│   ├── ews/           → Early Warning System
│   ├── students/      → Gestión de estudiantes
│   ├── teachers/      → Gestión de docentes
│   └── reports/       → Reportes y analytics
├── components/
│   ├── ui/            → shadcn/ui components (no editar manualmente)
│   └── shared/        → Componentes compartidos del proyecto
├── hooks/             → Custom hooks globales
├── lib/               → Supabase client, utils, helpers
└── types/             → Tipos globales (complementan @educacion/shared-types)
```

---

## 📋 ESTÁNDAR DE CALIDAD MÍNIMO

Todo entregable de Frontend DEBE cumplir:

- **Lighthouse Performance:** ≥ 95
- **Lighthouse Accessibility:** ≥ 95
- **Lighthouse Best Practices:** ≥ 95
- **Lighthouse SEO:** ≥ 95
- **WCAG:** 2.1 nivel AA
- **Responsive:** 320px → 1920px+
- **Dark Mode:** Funcional al 100%
- **TypeScript:** Sin `any` explícitos

---

*Skills Frontend instaladas en `.agents/skills/`. Actualizado: 2026-08-03*


