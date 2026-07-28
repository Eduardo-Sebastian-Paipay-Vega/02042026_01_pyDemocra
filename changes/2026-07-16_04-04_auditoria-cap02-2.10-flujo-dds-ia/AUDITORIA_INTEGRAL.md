# Auditoría Integral (2ª iteración) — cap02/2.10 + hallazgos de repositorio completo

> Complementa CHANGELOG.md / SUMMARY.md / FILES_CHANGED.md tras ampliar el alcance
> a TODO el repositorio (Fase -1), no solo a `/dds`.

## 1. Fase -1: Modelo mental del repositorio (fuentes analizadas)

- **`/dds`** (metodología real, 8 fases 0–7, prompts, SSOT, DDD, ADR).
- **`graphify-out/`** — grafo Graphity (11 279 nodos, 15 227 aristas, commit `05e94df`).
  Se consultó `graph.json` para mapear los 123 nodos relacionados con DDS y validar
  la estructura de fases. El grafo se usó como mapa; cada hallazgo se validó leyendo
  el archivo fuente.
- **`docs/analisis/`** — fuente autoritativa de actores (02-actores.md), RF, RNF,
  casos de uso y matriz de trazabilidad. Confirma 12 actores (ACT-01..ACT-12).
- **`frontmatter/`** (resumen, abstract, introducción) — describen "metodología DDS
  … organizada en ocho fases" e "ingeniería inversa documental sobre el repositorio".
- **`proyecto_final_corregido.tex`** (monolito de respaldo) — coincide: "DDS
  (Design Documentation System asistido por IA), ocho fases"; "ingeniería reversa
  de requerimientos"; SSOT.
- **`cap05/5.5_flujo_dds.tex`** — describe la MISMA metodología en Resultados.
- Diagramas en `Documento/imagenes/diagramas/` e `info_extra/diagramas/`.

## 2. Evidencia por afirmación (trazabilidad)

| Afirmación en 2.10 | Archivo(s) fuente | Tipo |
|---|---|---|
| DDS = Design Documentation System + IA | `dds/README.md`; `frontmatter/resumen.tex` | Metodológico / Tesis |
| SSOT y 4 principios | `dds/README.md` | Metodológico |
| Contrato de prompt (rol/inputs/control/outputs + validación) | `dds/fases/**/prompts/prompt_*.md` | Metodológico |
| Ingeniería de Requisitos Inversa | `dds/fases/fase_3_.../dds_ssot/documentacion/01-ssot-maestro.md` (v1.0.0); `frontmatter/resumen.tex` | Metodológico / Tesis |
| 8 fases (nombres y orden 0–7) | carpetas `dds/fases/fase_0..7/`; `frontmatter/resumen.tex` | Estructura / Tesis |
| 12 actores | `docs/analisis/02-actores.md` (ACT-01..12); `dds/fases/fase_1_.../requisitos_basicos/especificaciones/01-actores.md` | Análisis |
| 9 bounded contexts | `dds/fases/fase_3_.../dominios_ddd/modelos/01-bounded-contexts.md` | Diseño |
| 5 ADR | `dds/fases/fase_5_.../arquitectura/decisiones_arquitectonicas/ADRs.md` | ADR |

Ninguna afirmación quedó sin respaldo. Se retiró la tabla fase→artefactos previa
para no duplicar `tab:fases-artefactos` de cap05/5.5.

## 3. Decisión de alcance (aprobada por el autor)

- **2.10 = fundamento conceptual** (qué es el DDS: principios, modelo de IA,
  premisa de ingeniería inversa, caracterización de las 8 fases) con remisión
  explícita a `\autoref{sec:flujo-dds}` (cap05/5.5) para la aplicación y resultados.
- Se eliminó del capítulo la narrativa de ejecución detallada y la tabla de
  artefactos (pertenecen a Resultados), evitando duplicación.

## 4. CONTRADICCIONES DETECTADAS (no ocultadas)

### C1 — Colisión de sigla "DDS" (RESUELTA en 2.10)
`DDS` = *Design Documentation System* (2.10) vs *Data Distribution Service*
(secciones 2.4–2.6). Fuente correcta: ambas son legítimas pero distintas.
Resolución: nota al pie en 2.10 que desambigua y remite a la Sección 2.4.

### C2 — cap05/5.5 describe las fases de forma genérica que contradice /dds (PENDIENTE)
`cap05/5.5_flujo_dds.tex` afirma, p. ej., que la Fase 1 recolecta requisitos
"mediante entrevistas semiestructuradas" y aplica Design Thinking/brainstorming.
Esto contradice la fuente autoritativa (`frontmatter/resumen.tex` y `/dds`), que
establecen **ingeniería inversa documental sobre el repositorio** (no entrevistas).
- **Fuente correcta:** `frontmatter/resumen.tex` + `/dds` (coinciden entre sí, con
  el monolito y con el 2.10 corregido).
- **Documento a corregir:** `cap05/5.5_flujo_dds.tex` (texto genérico no evidenciado).
- **Estado:** reportado; NO modificado (decisión del autor: por ahora solo reportar).

### C3 — El diagrama "Flujo de DDS.jpg" contradice su propio texto y a /dds (PENDIENTE)
La figura (`fig:flujo-dds`, usada en cap05/5.5) muestra 8 etapas con nombres
distintos ("Iniciación", "Investigación de Mercado", "Ideación", "Sprint y
Pruebas", "Revisión y Retrospectiva"), estética Scrum y **fechas de 2023**
(el proyecto es 2026). Contiene texto IA corrupto ("Ciemplex: Integrated
mterochip…"). No corresponde a la metodología DDS real.
- **Fuente correcta:** las fases reales 0–7 (`/dds`, resumen, texto de 5.5).
- **Acción recomendada:** regenerar el diagrama con las 8 fases reales; entretanto,
  2.10 NO referencia esta figura.
- **Estado:** reportado; imagen no modificada.

## 5. Auditoría LaTeX (estilo vs. toda la tesis)

- Especificador de flotante alineado a `[htbp]` (convención dominante en cap05).
- Tablas: `tabularx`+`booktabs` (precedente en cap05: 5.11, 5.14, 5.1, 5.2, 5.3).
  Caption arriba + `\label` inmediato: consistente con la tesis.
- `\autoref` para referencias cruzadas: consistente con `frontmatter/introduccion.tex`.
- Sin entornos de código (`lstlisting`/`minted`/`verbatim`).
- Compilación aislada con la geometría real: 2 pasadas, exit 0, **sin errores,
  sin Overfull ni Underfull**, sin referencias indefinidas.
- Figuras: se verificó existencia física de `Flujo de DDS.jpg` y de los diagramas de
  arquitectura/stack (usados en cap05); 2.10 no incluye figuras propias.

## 6. Verdatura pendiente

Confirmar compilación de `main.tex` completo en la máquina del autor (el entorno de
la sesión carece de `texlive-lang-spanish`). Decidir corrección de C2/C3 en cap05.
