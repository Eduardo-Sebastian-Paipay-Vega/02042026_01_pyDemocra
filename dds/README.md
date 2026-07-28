# Ciclo de vida de desarrollo de software guiado por documentación (Document-Driven SDLC)

Este directorio raíz (`dds/`) actúa como la **Única Fuente de Verdad (SSOT)** del proyecto. Aísla toda la documentación y contexto de diseño del código fuente funcional, manteniendo el repositorio limpio y desacoplado.

> **Nombre técnico oficial de la metodología (ver `dds/decisiones/ADR-001`):**
> **Document-Driven SDLC** — un ciclo de vida en el que el documento de diseño (RFC / design doc) se escribe y se aprueba **antes** de implementar. El contexto documentado es el activo principal; el código se construye contra documentos aprobados. Foco: que el software sea lo más **descriptible** posible.
>
> **Jerarquía de nombres (para no confundir a humanos ni a agentes de IA):**
>
> - **Nombre técnico real:** *Document-Driven SDLC* (SDLC guiado por documentación con compuerta de RFC/Design Docs).
> - **Alias interno del proyecto:** *"Living DDS"* — útil en el día a día, **no es término de industria**; no se presenta como tal fuera del equipo.
> - **Agrupación conceptual de las fases:** *Discover · Design · Ship* — una forma de leer el flujo, **no un estándar externo**.
>
> **Respaldo real de industria:** Amazon *Working Backwards* (PR/FAQ), *RFC / Design Docs* de Stripe, Uber y Google, *Dual-Track Agile* (Marty Cagan) y el *Double Diamond* del Design Council.

## Fases y bloques

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

* **Fase 0 — Developer Experience (ADN Semilla):** transversal, **fuera** de los tres bloques. Regla: *no se toca* (no se elimina ni renombra). Define cómo trabaja el equipo y cómo se comporta la IA.
* **DISCOVER** (`fase_1`, `fase_2`): entender el problema y validar viabilidad antes de gastar presupuesto.
* **DESIGN** (`fase_3`, `fase_4`): definir el *cómo* técnico y visual.
* **SHIP** (`fase_5`, `fase_6`, `fase_7`): construir, validar (QA) y operar.

### Documentos vivos objetivo por fase

| Fase | Bloque | Documentos vivos (objetivo) |
|------|--------|------------------------------|
| `fase_0_developer_experience` | ADN Semilla | `developer_handbook.md`, `ai_instructions.txt` |
| `fase_1_descubrimiento_y_analisis` | DISCOVER | `PRD.md`, `user_journeys.json` |
| `fase_2_innovacion_y_validacion` | DISCOVER | `tech_spike_logs.md`, `model_benchmarks.md` |
| `fase_3_diseno_y_definicion` | DESIGN | `openapi_spec.yaml`, `db_schema.mermaid`, `data_contracts.json` |
| `fase_4_ui_ux` | DESIGN | `design_tokens.json`, `navigation_flow.md` |
| `fase_5_arquitectura_y_desarrollo` | SHIP | `ADR_*.md` |
| `fase_6_qa_y_testing` | SHIP | `test_scenarios.md`, `critical_paths.json` |
| `fase_7_despliegue_y_operaciones` | SHIP | `runbook.md`, `disaster_recovery.md` |

> Los documentos vivos son el **objetivo** del framework; su adopción es incremental. Toda evolución se registra como nuevo ADR en `dds/decisiones/` y como entrada en `changes/`.

## Propósito Arquitectónico

1. **Single Source of Truth (SSOT) & Alta Cohesión**: Al encapsular toda la información de diseño y contexto de IA bajo la carpeta `dds/`, se consolida un único punto de referencia para humanos y agentes de inteligencia artificial. Ningún documento reside huérfano en la raíz del repositorio, garantizando el principio de orden del sistema.
2. **Desacoplamiento Funcional**: Los archivos de código del proyecto y la documentación viven en espacios separados. Esto evita la contaminación de los empaquetados de software y previene que los agentes de IA se confundan al analizar ficheros de código frente a especificaciones de diseño.
3. **Habilitación de Agentes Multitarea (Multi-Agent Safety)**: Al modularizar los artefactos dentro de subcarpetas específicas (`prompts/`, `especificaciones/`, `pruebas/`, `evidencias/`) dentro de cada fase, diferentes agentes de IA pueden escribir y leer en paralelo en distintos contextos sin provocar conflictos de merges ni sobrescrituras de ficheros.
4. **Trazabilidad y Versionado Determinista**: La jerarquía numerada y estructurada facilita la navegación a nivel de Git. Permite la revisión de cambios históricos estructurada por fase del ciclo de vida, sirviendo como un registro inmutable del crecimiento del sistema.

## Estructura Principal

* `fases/`: Contiene las fases del ciclo de vida y la evolución del software (desde el descubrimiento hasta el despliegue).
* `prompts/`: Repositorio centralizado de prompts de IA utilizados y validados a lo largo del proyecto, clasificados por áreas técnicas (análisis, arquitectura, testing, etc.).
* `contexto_ia/`: Espacio exclusivo para proveer el contexto del sistema a agentes inteligentes autónomos (reglas, glosarios, estándares, restricciones).
* `plantillas/`: Modelos y plantillas estandarizados para generar artefactos documentales consistentes (casos de uso, historias BDD, OpenAPI, ADR).
* `evidencias/`: Almacén para guardar trazas de auditoría técnica del repositorio (capturas, queries SQL, esquemas de tablas).
* `decisiones/`: Directorio dedicado a los **Architecture Decision Records (ADR)** del proyecto, manteniéndolos aislados del flujo evolutivo funcional.
* `diagramas/`: Repositorio consolidado de diagramas técnicos que representan estáticamente y dinámicamente el comportamiento e infraestructura del sistema.
* `reportes/`: Consolidado de auditorías, reportes de cobertura, validaciones de código y resúmenes ejecutivos.

La base estructural está lista para que la organización y los agentes inteligentes comiencen a poblar el sistema de documentación de forma escalable y segura.
