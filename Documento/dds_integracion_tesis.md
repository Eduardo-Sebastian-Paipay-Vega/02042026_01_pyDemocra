# Integración de la Metodología DDS en la Tesis Democra

> Entregable de ingeniería documental. Integra el contenido ya documentado en la carpeta
> `dds/` del repositorio (fuente de verdad, análisis de solo lectura) dentro de la estructura
> de la tesis, separando el plano **conceptual** (Cap. 2, Marco Teórico) del plano **aplicado**
> (Cap. 3, Material y Métodos). No se inventan fases ni flujos: todo procede de `dds/`.

---

## 1. Inventario de `dds/`

| Artefacto (ubicación en `dds/`) | Tipo | Destino |
|---|---|---|
| `README.md` (definición DDS + IA, SSOT, propósito arquitectónico) | Metodología | **2.3** |
| `fase_3.../dds_ssot/documentacion/01-ssot-maestro.md` (mapa de fuentes de verdad) | Metodología / Validación | **2.3** y **3.x** |
| `fase_0_developer_experience/onboarding/guia_onboarding.md` | Flujo ciclo de vida (Fase 0) | **3.x** |
| `fase_1_descubrimiento_y_analisis/README.md` + descubrimiento/analisis_as_is/requisitos_basicos/red_teaming | Flujo ciclo de vida (Fase 1) | **3.x** |
| `fase_1.../red_teaming/threat_modeling/stride.md` | Mini-flujo de validación (seguridad) | **3.x** |
| `fase_2_innovacion_y_validacion/README.md` + validacion/documentacion/validacion.md | Flujo + mini-flujo de validación (pgTAP, unit) | **3.x** |
| `fase_3_diseno_y_definicion/README.md` (DDD, CU, BD, OpenAPI, BDD, tipos, SSOT) | Flujo ciclo de vida (Fase 3) | **3.x** |
| `fase_3.../historias_bdd/pruebas/*.md` (Gherkin) | Mini-flujo de validación (aceptación) | **3.x** |
| `fase_3.../contratos_openapi/contratos/openapi.md` | Mini-flujo de validación (contrato) | **3.x** |
| `fase_4_ui_ux/README.md` (mocking, arquitectura de componentes) | Flujo ciclo de vida (Fase 4) | **3.x** |
| `fase_5_arquitectura_y_desarrollo/README.md` + arquitectura/decisiones_arquitectonicas/ADRs.md | Flujo + decisiones (Fase 5) | **3.x** |
| `fase_5.../tdd/pruebas/01-estrategia-testing.md` | Mini-flujo de validación (TDD) | **3.x** |
| `fase_6_qa_y_testing/README.md` (QA, mutation, chaos, E2E) | Flujo + mini-flujo de validación (Fase 6) | **3.x** |
| `fase_7_despliegue_y_operaciones/README.md` (CI/CD, GitOps, Docker, observabilidad) | Flujo ciclo de vida (Fase 7) | **3.x** |
| `contexto_ia/`, `plantillas/`, `decisiones/`, `diagramas/`, `evidencias/`, `reportes/` | Soporte transversal DDS | **2.3** (mención) |
| `MEJORAS/BD_viva_09072026.txt` + `MEJORAS/09072026/REQ00X.md` | Base viva / backlog de mejoras | **3.x** (trazabilidad) |

---

## 2. Índice actualizado (inserciones marcadas con »)

```
Capítulo 2. Marco Teórico y Tecnológico
  2.1 Arquitectura SaaS Multi-Tenant
  2.2 SPA y el ecosistema React
  ...
  2.7 Calidad del producto (ISO/IEC 25010)
» 2.8 Metodología DDS (Document-Driven SDLC + IA)      [CONCEPTUAL — NUEVO]
    2.8.1 Definición y propósito arquitectónico (SSOT)
    2.8.2 Principios rectores
    2.8.3 Fases del ciclo de vida DDS
    2.8.4 Mini-flujos de validación de información

Capítulo 3. Material y Métodos                                 [CAPÍTULO NUEVO]
  3.1 Tipo, nivel y diseño de la investigación
  3.2 Procedencia y gobernanza de datos (repositorio como SSOT)
» 3.3 Aplicación de la metodología DDS al proyecto            [APLICADO — NUEVO]
    3.3.1 Trazabilidad de fases DDS y artefactos producidos
    3.3.2 Flujos del ciclo de vida del software
    3.3.3 Mini-flujos de validación de la información
    3.3.4 Trazabilidad del diseño (SSOT operativo)
```

> Nota de numeración: en el índice vigente el Marco Teórico tiene 7 subsecciones; la
> metodología DDS se inserta como **2.8** (subcapítulo conceptual). El plano aplicado se ubica
> en el nuevo capítulo **Material y Métodos** como **3.3**. Si se prefiere el rótulo exacto
> `2.3` del enunciado, basta renumerar el bloque conceptual como 2.3 y desplazar las demás
> subsecciones; el `.tex` usa `\label/\autoref`, por lo que la numeración se ajusta sola.

---

## 3. Contenido desarrollado

### 2.8 Metodología DDS (Document-Driven SDLC + IA) — plano conceptual

**2.8.1 Definición y propósito.** DDS (Document-Driven SDLC asistido por Inteligencia
Artificial) es un ciclo de vida de desarrollo guiado por documentación que consolida, en un único árbol de
carpetas (`dds/`), la **Única Fuente de Verdad (SSOT)** del proyecto, aislando la documentación
de diseño y el contexto para agentes de IA respecto del código funcional. Su propósito es
mantener el repositorio desacoplado y cohesionado: ningún artefacto de diseño reside huérfano en
la raíz, y el código y su documentación evolucionan en espacios separados.

**2.8.2 Principios rectores.** DDS se sustenta en cuatro principios: (i) *Single Source of Truth
y alta cohesión*, un punto único de referencia para humanos y agentes; (ii) *desacoplamiento
funcional* entre código y documentación; (iii) *habilitación de agentes multitarea*, mediante la
modularización en subcarpetas (`prompts/`, `especificaciones/`, `pruebas/`, `evidencias/`) que
permite trabajo paralelo sin conflictos de fusión; y (iv) *trazabilidad y versionado
determinista*, gracias a una jerarquía numerada revisable por fase del ciclo de vida. El
documento SSOT maestro formaliza además un **mapa de fuentes de verdad**: las migraciones SQL
gobiernan el esquema de datos, los tipos TypeScript el contrato de dominio, `openapi.yaml` el
contrato de API, y los documentos DDS las reglas de negocio y los flujos.

**2.8.3 Fases del ciclo de vida DDS.** La metodología organiza la evolución del software en ocho
fases: Fase 0 — Developer Experience; Fase 1 — Descubrimiento y Análisis; Fase 2 — Innovación y
Validación; Fase 3 — Diseño y Definición; Fase 4 — UI/UX; Fase 5 — Arquitectura y Desarrollo;
Fase 6 — QA y Testing; y Fase 7 — Despliegue y Operaciones. Cada fase agrupa subcarpetas
transversales de documentación, especificaciones, prompts de IA, diagramas, modelos, pruebas y
evidencias.

**2.8.4 Mini-flujos de validación de información.** DDS incorpora, a lo largo de las fases,
puntos de control que validan la integridad de la información antes de avanzar: modelado de
amenazas STRIDE (Fase 1), validación temprana de base de datos con pgTAP y pruebas unitarias
(Fase 2), historias BDD en Gherkin y validación de contratos OpenAPI/tipos (Fase 3), TDD (Fase
5) y pruebas de mutación, caos y E2E (Fase 6). Estos mini-flujos materializan el principio de
que la documentación de diseño debe permanecer consistente con el código en todo momento.

> La *aplicación* concreta de estas fases al proyecto Democra se desarrolla en el §3.3
> (referencia cruzada), evitando duplicar contenido entre el plano conceptual y el aplicado.

---

### 3.3 Aplicación de la metodología DDS al proyecto — plano aplicado

**3.3.1 Trazabilidad de fases y artefactos.** El proyecto Democra pobló la estructura DDS tras
un descubrimiento exhaustivo del código fuente (ingeniería de requisitos inversa, v1.0.0 del
SSOT, 2026-07-09). La tabla de trazabilidad (ver versión LaTeX) asocia cada fase con los
artefactos reales producidos en `dds/fases/`.

**3.3.2 Flujos del ciclo de vida del software.** La documentación DDS materializa el ciclo de
vida en flujos concretos:
- *Fase 0 (DX):* guía de onboarding con el levantamiento del entorno local (Supabase CLI +
  migraciones, API Express en `:8787`, Vite en `:5173`) y convenciones (sin ORM, Tailwind v4,
  GitFlow con Conventional Commits).
- *Fase 1:* descubrimiento (contexto, problema As-Is, alcance, inventario de código), análisis
  As-Is (C4, arquitectura actual, brechas), requisitos (actores, RU, RF, RNF, reglas de negocio)
  y red teaming (STRIDE, auditoría de seguridad inicial).
- *Fase 2:* definición de ventajas competitivas (vaca morada), innovación, integración de
  requisitos y validación temprana de hipótesis.
- *Fase 3:* diseño y definición mediante DDD (bounded contexts, entidades y agregados, mapa de
  contextos), casos de uso, modelo de base de datos, contratos OpenAPI, historias BDD, tipos y
  el SSOT maestro.
- *Fase 4:* mocking/prototipos (look & feel) y arquitectura de componentes UI.
- *Fase 5:* decisiones arquitectónicas (ADRs, p. ej. multi-tenancy con RLS, Express vs. Edge),
  estrategia de backend, TDD y optimización/rendimiento.
- *Fase 6:* aseguramiento de la calidad con planes de QA, mutation testing, chaos engineering y
  E2E.
- *Fase 7:* despliegue y operaciones con CI/CD, GitOps, Docker, observabilidad y hotfixes.

**3.3.3 Mini-flujos de validación de la información.** Cada avance se validó con controles
específicos documentados en `dds/`:
- *Aislamiento de datos:* pruebas pgTAP sobre `supabase/tests/` verifican la creación atómica de
  tenants, la inyección de `tenant_id` y las restricciones `ON CONFLICT` que garantizan el
  aislamiento multi-tenant/RLS antes de tocar el frontend.
- *Lógica de aplicación:* pruebas unitarias con Vitest (frontend, entorno jsdom) y Jest
  (backend, motor de riesgo y rutas de auth con supertest).
- *Seguridad:* modelado de amenazas STRIDE y auditoría de seguridad inicial (Fase 1).
- *Aceptación:* historias BDD (Gherkin) por dominio (auth, admisión, proyectos).
- *Contratos:* consistencia OpenAPI ↔ rutas Express y tipos TS ↔ esquema de BD (regla SSOT).
- *Calidad avanzada:* mutation testing, chaos engineering y E2E (Fase 6).

**3.3.4 Trazabilidad del diseño (SSOT operativo).** El mapa de fuentes de verdad del SSOT fija
la prioridad ante discrepancias (migraciones SQL para el esquema, tipos TS para el dominio,
`openapi.yaml` para la API) y el flujo de actualización *Código → documentación analítica → DDS*.
La base viva (`MEJORAS/BD_viva_09072026.txt`) y los requerimientos de mejora `REQ001–REQ008`
constituyen el registro evolutivo de la trazabilidad. [PENDIENTE: cuantificar cobertura de
artefactos por fase y adjuntar el reporte de auditoría de `dds/reportes/` cuando esté disponible].

---

## 4. Nota de separación (obligatoria)

Los capítulos **Resultados** y **Discusión** se mantienen **independientes** y no se mezclan con
el contenido metodológico de DDS. En §2.8 reside únicamente la **definición conceptual** de la
metodología; en §3.3, su **aplicación y trazabilidad** al proyecto. La evidencia empírica
(cobertura de pruebas, Lighthouse, SUS) y el contraste de resultados con antecedentes se reservan
para el Capítulo de Resultados y la sección de Discusión, respectivamente, referenciados mediante
`\autoref` sin duplicar contenido.
