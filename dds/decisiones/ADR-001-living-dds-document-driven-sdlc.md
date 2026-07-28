# ADR-001: Adoptar el "Ciclo de vida de desarrollo de software guiado por documentación (Document-Driven SDLC)"

**Estado:** Aceptado
**Fecha:** 2026-07-16 · **Revisado:** 2026-07-17
**Contexto/Módulo:** Metodología de documentación y ciclo de vida (`dds/`, transversal a todo el repositorio)

## Contexto

El directorio `dds/` nació con un significado documentado en su `README.md`: **DDS = Document-Driven System + IA**, es decir, un sistema de documentación que actúa como Única Fuente de Verdad (SSOT), aislando el contexto de diseño del código fuente para que humanos y agentes de IA trabajen sobre una base ordenada.

Al analizar la estructura real de `dds/fases/` se detectó que las fases numeradas se agrupan de forma natural y contigua en tres bloques que coinciden con un flujo de producto: **Discover, Design, Ship**:

- **DISCOVER** → `fase_1_descubrimiento_y_analisis` + `fase_2_innovacion_y_validacion`
- **DESIGN** → `fase_3_diseno_y_definicion` + `fase_4_ui_ux`
- **SHIP** → `fase_5_arquitectura_y_desarrollo` + `fase_6_qa_y_testing` + `fase_7_despliegue_y_operaciones`

Esto generó dos problemas de rigor:

1. **Choque de acrónimo:** "DDS" se leía a la vez como *Document-Driven System* y como *Discover, Design, Ship*, sin declararlo.
2. **Riesgo de siglas no sustentadas:** una versión previa de este ADR nombró la metodología como "DDS²" / "Living DDS²" y trató "Discover, Design, Ship" como si fuera un estándar de industria. **No lo es.** No existe un framework canónico con ese nombre atribuible a Intercom/Spotify/Figma. Presentar siglas inventadas como estándar debilita la defensa técnica (tesis, entrevista, revisión de pares).

Además existe una **`fase_0_developer_experience`** que no pertenece a ninguno de los tres bloques del flujo de valor: es una fase transversal/habilitadora (DX, onboarding, reglas de IA), y por decisión del equipo *no se toca* (no se elimina ni renombra).

Restricciones: la documentación debe seguir siendo consumible por agentes de IA; el mapeo debe quedar trazable para incorporarse luego como sección de la tesis LaTeX en `Documento/`.

## Decisión

Adoptamos como **nombre técnico oficial** de la metodología:

> **Ciclo de vida de desarrollo de software guiado por documentación (Document-Driven SDLC).**

Definición operativa: un SDLC en el que **el documento de diseño (RFC / design doc) se escribe y se aprueba antes de implementar**. El contexto documentado es el activo principal; el código se construye contra documentos aprobados, no al revés. Objetivo de foco: que el software sea lo más **descriptible** posible, de modo que un humano o un agente de IA pueda leer la fase correspondiente y actuar con precisión sin contexto externo.

Jerarquía de nombres (para evitar ambigüedad):

- **Nombre técnico real:** *Document-Driven SDLC* (SDLC guiado por documentación con compuerta de RFC/Design Docs).
- **Alias interno del proyecto:** *"Living DDS"* — pegajoso y útil para el día a día, pero **no es un término de industria** y no se presenta como tal fuera del equipo.
- **Agrupación conceptual de las fases:** *Discover · Design · Ship* — una forma de leer el flujo, **no un estándar externo**.

### Respaldo real de industria

La metodología no es inventada: es la implementación física de prácticas reales y ampliamente citadas.

- **SDLC (fases 1–7):** ciclo de vida clásico de software — requisitos, viabilidad, diseño, implementación, verificación y operación. (Referencia general: familia ISO/IEC/IEEE 12207 de procesos del ciclo de vida; nuestra secuencia es un SDLC genérico, no la estructura literal del estándar.)
- **Documentación como compuerta antes de codificar:**
  - **Amazon — "Working Backwards" (PR/FAQ):** antes de construir un servicio se redacta un comunicado de prensa y FAQ simulados; si el documento no es autoexplicativo, el proyecto no se aprueba.
  - **RFC / Design Docs (Stripe, Uber, Google):** el desarrollador escribe un documento de diseño técnico (esquema de datos, APIs, riesgos), se revisa y aprueba *sobre el papel*, y solo entonces se programa.
- **Descubrimiento vs. entrega — Dual-Track Agile** (Marty Cagan / Silicon Valley Product Group): separar el *discovery* (validar qué construir) de la *delivery* (construirlo). Nuestros bloques Discover / (Design+Ship) reflejan esa separación.
- **Referencia de diseño de producto:** *Double Diamond* del Design Council (Discover–Define–Develop–Deliver), del que "Discover/Design/Ship" es una simplificación conceptual.

### Estructura canónica

```
 ┌─────────────────────────────────────────────────────────┐
 │        FASE 0: DEVELOPER EXPERIENCE (El ADN Semilla)     │
 └────────────────────────────┬────────────────────────────┘
                              │
       ┌──────────────────────┼──────────────────────┐
       ▼                      ▼                      ▼
   [ DISCOVER ]           [ DESIGN ]             [ SHIP ]
  (Fases 1 y 2)         (Fases 3 y 4)        (Fases 5, 6 y 7)
```

- **Fase 0 — Developer Experience (ADN Semilla):** transversal, fuera de los tres bloques. No se elimina ni renombra. Define cómo trabaja el equipo y cómo se comporta la IA. Documentos vivos objetivo: `developer_handbook.md`, `ai_instructions.txt`.
- **Bloque DISCOVER:** entender el problema antes de proponer solución (RFCs de producto, análisis, validación de viabilidad).
- **Bloque DESIGN:** definir el *cómo* técnico y visual (design docs, contratos de API, mockups).
- **Bloque SHIP:** construir contra los documentos aprobados, validar (QA) y operar.

### Documentos vivos objetivo por fase

| Fase | Bloque | Documentos vivos (objetivo) | Función |
|------|--------|------------------------------|---------|
| `fase_0_developer_experience` | ADN Semilla | `developer_handbook.md`, `ai_instructions.txt` | Reglas del equipo y comportamiento de la IA |
| `fase_1_descubrimiento_y_analisis` | DISCOVER | `PRD.md`, `user_journeys.json` | El "dolor" del usuario; evita sobrediseño |
| `fase_2_innovacion_y_validacion` | DISCOVER | `tech_spike_logs.md`, `model_benchmarks.md` | Experimentos fallidos/exitosos; evita repetir caminos muertos |
| `fase_3_diseno_y_definicion` | DESIGN | `openapi_spec.yaml`, `db_schema.mermaid`, `data_contracts.json` | Arquitectura y contratos legibles por IA (RFC/design doc) |
| `fase_4_ui_ux` | DESIGN | `design_tokens.json`, `navigation_flow.md` | Interfaz traducida a fichas de diseño |
| `fase_5_arquitectura_y_desarrollo` | SHIP | `ADR_*.md` (Architecture Decision Records) | Código autodescriptivo vía decisiones registradas |
| `fase_6_qa_y_testing` | SHIP | `test_scenarios.md`, `critical_paths.json` | Definición de "software exitoso"; base para auto-generar pruebas |
| `fase_7_despliegue_y_operaciones` | SHIP | `runbook.md`, `disaster_recovery.md` | Operación reproducible al pie de la letra |

> Los nombres de documentos vivos son el **objetivo** del framework; su adopción es incremental. Este ADR fija el estándar, no exige que todos existan ya.

## Consecuencias Positivas

- **Nombre defendible ante pares/jurado:** anclado a prácticas reales (PR-FAQ, RFC, dual-track), no a siglas de moda.
- **Elimina la ambigüedad del acrónimo:** "DDS" queda como alias interno, con el nombre técnico real declarado.
- **La Fase 0 queda formalmente ubicada** como transversal.
- **Da "memoria" al sistema:** un agente de IA o un desarrollador nuevo lee Fase 0 + la fase relevante y actúa con precisión sin contexto externo.
- **Trazabilidad:** el mapeo fase→bloque queda listo para la tesis LaTeX (`Documento/`).

## Consecuencias Negativas (Trade-offs)

- **El bloque SHIP queda desbalanceado** (3 fases vs. 2 y 2): forzamiento consciente de 7 fases en 3 grupos.
- **"Discover, Design, Ship" no es un estándar de industria:** se usa como agrupación conceptual interna, no como marco externo citable.
- **Costo de mantenimiento documental:** exige disciplina; documentación desactualizada sería peor que no tenerla.

## Mitigaciones

- Declarar explícitamente la jerarquía de nombres (técnico / alias / conceptual) aquí y en `dds/README.md` (hecho).
- Citar los anclajes reales (PR-FAQ, RFC, dual-track, Double Diamond) para sustento en la tesis.
- Adopción incremental de documentos vivos; cada evolución se registra como nuevo ADR en `dds/decisiones/` y como entrada en `changes/`.

## Notas Adicionales

- Reemplaza la definición previa de `dds/README.md` (que solo declaraba *Document-Driven System + IA*) y corrige la versión previa de este ADR que usaba "DDS²" como si fuera término de industria.
- Auditoría de este cambio: `changes/2026-07-16_21-35_framework-living-dds/`.
- Pendiente futuro: incorporar esta metodología como una sección/capítulo de la documentación LaTeX en `Documento/`.
