# Investigación Forense del Repositorio — Metodología de Democra

> Modo investigación (sin editar la tesis). Objetivo: demostrar con evidencia si
> existe contradicción metodológica, reconstruir la evolución del proyecto y
> establecer la versión vigente. La verdad se fija por evidencia, no por mayoría.

## 1. Evidencia de Git (orden de aparición)

| Artefacto | 1er commit | Fecha | Commit |
|---|---|---|---|
| `Documento/Base.md` | creación | 2026-07-04 | (más antiguo del set) |
| `dds/` (README y estructura) | creación | 2026-07-09 | `d03c7bd` "Update project before fresh clone" |
| `Documento/cap02/2.10`, `cap05/5.5`, resto de `.tex` | creación | 2026-07-15 | `a57698f` "Update tests, coverage and project configs" |
| `Documento/imagenes/diagramas/Flujo de DDS.jpg` | creación | 2026-07-15 | `a57698f` |

Consecuencia: todo el árbol LaTeX entró en un único commit (07-15), posterior a
`/dds` (07-09) y a `Base.md` (07-04). Git no permite sub-datar capítulos entre sí
(entraron juntos), pero sí establece el orden macro: Base.md → dds → tesis .tex.

## 2. Identidad real de `Base.md` (hallazgo central)

`Base.md` (217 KB, 07-04) **NO es la tesis de Democra**. Es la tesis de **otro
proyecto**: un marketplace de anuncios **clasificados C2C para Ayacucho** sobre
**MySQL**, con metodología **Scrum**. Conteo textual en `Base.md`:

- `Ayacucho`: 74 · `clasificados`: 68 · `MySQL`: 38 · `democra`: 3
- `Sprint`: 78 · `Retrospectiva`: 9 · secciones "Framework Scrum" (2.2.5)
- `entrevista`: 12 — incluida la **guía de entrevista semiestructurada a
  ciudadanos de Ayacucho** (`Base.md` L837), y "entrevistas preliminares con
  ciudadanos locales activos en el comercio digital" (L815).

Es decir, `Base.md` es la **plantilla de origen** desde la que se adaptó la tesis
de Democra. Su método real (para el proyecto de clasificados) fue Scrum +
entrevistas + encuesta + SUS.

## 3. Método vigente de Democra (evidencia convergente e independiente)

La metodología propia de Democra es **DDS (Design Documentation System) +
ingeniería inversa documental** sobre un código preexistente. Fuentes:

- `dds/README.md` y toda la carpeta `dds/` (8 fases, SSOT, prompts) — 07-09.
- `dds/fases/fase_3_.../dds_ssot/documentacion/01-ssot-maestro.md`: la doc se pobló
  "tras el descubrimiento exhaustivo del código fuente".
- `frontmatter/resumen.tex`: "ingeniería inversa documental sobre el repositorio".
- `frontmatter/abstract.tex`: "documentary reverse-engineering approach".
- `frontmatter/introduccion.tex` (L24): "ingeniería inversa documental: el repositorio…".
- `cap01/1.5_justificacion.tex` (L7): "ingeniería reversa de requerimientos … SSOT".
- `cap03/3.6_tecnicas_instrumentos.tex`: técnica de **Caja Blanca / auditor forense**,
  "el investigador no actúa como usuario … sino como auditor forense con acceso
  total al código"; instrumentos = testing automatizado (k6/Artillery), SUS. NO
  menciona entrevistas de levantamiento.

## 4. Origen del texto en conflicto (cap05)

- `cap05/5.5_flujo_dds.tex` (L37): "recolección de requisitos mediante **entrevistas
  semiestructuradas**". Frase heredada de `Base.md` L837 (guía de entrevista
  semiestructurada, proyecto de Ayacucho).
- `cap05/5.1_requisitos_funcionales.tex` (L16): RF "refinados … con base en **las
  entrevistas a usuarios representativos**". Mismo residuo del template.
- Términos `design thinking`, `brainstorming`, `semiestructurad`: aparecen **solo**
  en `cap05/5.5` — 0 ocurrencias en el resto de la tesis, 0 en `/dds`, 0 en el
  código. Relleno genérico/idealizado, no evidenciado.
- En Graphity, "entrevista" son **19 nodos de CÓDIGO** del módulo de admisión
  (`useEntrevistasAdmision.ts`, `createEntrevistaAdmision()`): es una **función del
  producto** (RF-016 "ciclo de selección y entrevistas de voluntarios"), no una
  técnica de investigación.

## 5. ¿Existe evidencia de que se hicieran entrevistas en Democra?

No. Búsqueda en `dds/` y `docs/`: no hay actas, audios, transcripciones ni guía de
entrevista propios de Democra. La carpeta
`dds/fases/fase_1_.../descubrimiento/documentacion/` solo contiene análisis
(contexto, problema As-Is, alcance, glosario). El prompt de descubrimiento
menciona "audios o transcripciones" como **plantilla de entradas**, pero tales
ficheros no existen. Las únicas entrevistas con respaldo documental son las de
`Base.md` (otro proyecto, Ayacucho).

## 6. El diagrama `Flujo de DDS.jpg`

- Entró en git el 07-15 (`a57698f`); no se halló fuente editable (drawio/svg/fig).
- Contenido: 8 etapas con nombres genéricos ("Iniciación", "Investigación de
  Mercado", "Ideación", "Sprint y Pruebas", "Revisión y Retrospectiva"), **fechas
  de 2023** (el proyecto es 2026) y texto IA corrupto ("Ciemplex: Integrated
  mterochip…"). No coincide con las 8 fases DDS (0–7) ni con `Base.md`.
- Es una ilustración genérica; lo usa `cap05/5.5` (`fig:flujo-dds`). Contradice al
  propio texto de 5.5 (que usa "Developer Experience / Descubrimiento…").

## 7. Matriz de trazabilidad (concepto → archivo → ¿respalda método vigente?)

| Concepto | Archivo (evidencia) | ¿Método vigente DDS+inversa? | Confianza |
|---|---|---|---|
| Ingeniería inversa documental | frontmatter/resumen.tex | Sí | Alta |
| Reverse-engineering | frontmatter/abstract.tex | Sí | Alta |
| Ingeniería inversa documental | frontmatter/introduccion.tex L24 | Sí | Alta |
| Ingeniería reversa de requerimientos | cap01/1.5_justificacion.tex L7 | Sí | Alta |
| DDS + ingeniería inversa | cap02/2.10 (actual) | Sí | Alta |
| Auditor forense / Caja Blanca (no usuario) | cap03/3.6_tecnicas_instrumentos.tex | Sí (coherente) | Alta |
| "descubrimiento exhaustivo del código" | dds/.../01-ssot-maestro.md | Sí | Alta |
| Entrevistas a usuarios representativos | cap05/5.1 L16 | NO — residuo template | Alta |
| Entrevistas semiestructuradas | cap05/5.5 L37 | NO — residuo template | Alta |
| Design Thinking / brainstorming | cap05/5.5 (único) | NO — relleno genérico | Alta |
| Guía de entrevista semiestructurada (ORIGEN) | Base.md L837 (Ayacucho/C2C) | N/A (otro proyecto) | Alta |
| "entrevista" en código | useEntrevistasAdmision.ts (Graphity, 19 nodos) | N/A (feature admisión) | Alta |

## 8. Veredicto (con nivel de confianza)

**No hay dos metodologías vigentes en conflicto.** Hay UNA vigente (DDS + ingeniería
inversa documental) y RESIDUOS de la plantilla `Base.md` (Scrum + entrevistas del
proyecto de Ayacucho) que sobrevivieron en `cap05/5.1` y `cap05/5.5`.

- Versión vigente/correcta: **DDS + ingeniería inversa** — confianza **ALTA**
  (respaldada por resumen, abstract, introducción, cap01, cap02, cap03 y todo `/dds`,
  fuentes independientes que convergen).
- Texto obsoleto/heredado: **"entrevistas … " en cap05/5.1 y 5.5** y las descripciones
  genéricas de fases en 5.5 — confianza **ALTA** de que son residuo del template sin
  respaldo en artefactos de Democra.
- Diagrama `Flujo de DDS.jpg`: **no representativo** (genérico, fechas 2023, sin
  fuente) — confianza **ALTA**.

Regla aplicada: la conclusión NO se basa en "mayoría de documentos", sino en la
cadena de evidencia (orden de Git, identidad de `Base.md` como otro proyecto,
ausencia total de artefactos de entrevistas en Democra, y el rol de "entrevista" en
el código como feature de admisión).

## 9. Alternativas de resolución (SIN ejecutar todavía)

Para `cap05/5.1` y `cap05/5.5` (documentos a decidir por el autor):
- **A.** Sustituir el lenguaje de "entrevistas/Design Thinking/brainstorming" por la
  descripción real por fase (ingeniería inversa + artefactos de `/dds`), alineando
  5.5 con 2.10 y el resumen. (Máxima coherencia; requiere editar cap05.)
- **B.** Conservar "entrevista" solo donde sea legítima (RF-016, feature de admisión;
  SUS de usabilidad N=30) y eliminar la afirmación de que los requisitos se
  levantaron por entrevistas. (Cambio mínimo y quirúrgico.)
- **C.** Si el autor SÍ realizó entrevistas, incorporar la evidencia (guía, actas,
  fechas, participantes) al repo; hoy no existe y por eso la afirmación no se sostiene.

Para el diagrama:
- **D.** Regenerar `Flujo de DDS.jpg` con las 8 fases reales (0–7) y sin fechas 2023.
- **E.** Retirar la figura de `cap05/5.5` hasta disponer de una versión fiel.

Recomendación (si se decide actuar): **A + B + D**. No se ejecuta nada hasta tu visto
bueno.
