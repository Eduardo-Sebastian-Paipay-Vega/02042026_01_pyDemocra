# Validación Final de la Investigación + Plan de Cambios (SIN EJECUTAR)

> Fase de validación integral. No se ha modificado ningún archivo de la tesis.
> Requiere aprobación explícita del autor antes de implementar.

## 1. Cadena de evidencia por conclusión

### C-A. Método vigente de Democra = DDS + ingeniería inversa documental
- **Respaldo:** `frontmatter/resumen.tex` ("ingeniería inversa documental sobre el
  repositorio"); `frontmatter/abstract.tex` ("documentary reverse-engineering");
  `frontmatter/introduccion.tex` L24; `cap01/1.4_objetivos.tex` ("aplicando … la
  metodología DDS"); `cap01/1.5_justificacion.tex` L7 ("ingeniería reversa de
  requerimientos … SSOT"); `cap02/2.10`; `cap03/3.6` y `3.7` (White-Box / auditor
  forense, se distancia de encuestas); todo `dds/`; monolito
  `proyecto_final_corregido.tex` L158/235/314.
- **Evidencia en contra:** ninguna.
- **Confianza: ALTA.** Seis fuentes independientes convergen.
- **Si fuera incorrecta:** habría que rehacer el marco metodológico completo; no hay
  ningún indicio que lo sugiera.

### C-B. `Base.md` es la tesis-plantilla de OTRO proyecto (clasificados C2C, Ayacucho, MySQL, Scrum)
- **Respaldo:** conteos en `Base.md` — Ayacucho 74, clasificados 68, MySQL 38,
  democra 3, Sprint 78, Retrospectiva 9, "Framework Scrum" (L414), "guía de
  entrevista semiestructurada … ciudadanos de Ayacucho" (L837).
- **Evidencia en contra:** ninguna (las 3 menciones de "democra" son marginales).
- **Confianza: ALTA.**
- **Si fuera incorrecta:** cambiaría el origen del texto, pero no el hecho de que el
  contenido de entrevistas no tiene respaldo en artefactos de Democra.

### C-C. "Entrevistas" en cap05/5.1 y 5.5 = afirmación sin respaldo evidencial en Democra
- **Respaldo:** no existen actas/audios/transcripciones/guía en `dds/` ni `docs/`;
  `descubrimiento/documentacion/` solo tiene análisis; Graphity: "entrevista" = 9
  nodos de CÓDIGO del módulo de admisión (`useEntrevistasAdmision.ts`,
  `solicitudesAdmision.service.ts`, `app-database.ts`); el monolito NO contiene
  "entrevista" (0). Origen textual: `Base.md` L837.
- **Evidencia en contra / matiz:** existe RF-016 "entrevistas de voluntarios" (feature
  de admisión, legítima) y el SUS N=30 (`cap05/5.3`, usabilidad, legítimo). Estas NO
  son levantamiento de requisitos por entrevista.
- **Confianza: ALTA** en que no hay respaldo documental en el repo. **LÍMITE
  EPISTÉMICO:** no puedo probar que el autor NO haya hecho entrevistas fuera del
  repositorio; solo puedo probar ausencia de artefactos. Por eso el plan ofrece la
  opción de aportar evidencia en lugar de borrar.
- **Si fuera incorrecta (sí hubo entrevistas):** la corrección correcta sería añadir
  la evidencia (guía, actas, fechas, participantes), no eliminar el texto.

### C-D. "Design Thinking" y "brainstorming" = relleno genérico, solo en cap05/5.5
- **Respaldo:** 0 ocurrencias en el resto de la tesis, 0 en `Base.md`, 0 en `/dds`,
  0 nodos en Graphity (código+md). Aparecen únicamente en `cap05/5.5.tex`.
- **Evidencia en contra:** ninguna.
- **Confianza: ALTA.**

### C-E. El diagrama `Flujo de DDS.jpg` no es representativo
- **Respaldo:** fases genéricas ("Iniciación", "Investigación de Mercado", "Sprint y
  Retrospectiva"), fechas 2023 (proyecto 2026), texto IA corrupto; sin fuente
  editable; entró el 07-15 (`a57698f`).
- **Evidencia en contra:** ninguna (no coincide ni con `/dds` ni con `Base.md`).
- **Confianza: ALTA.**

### C-F. Orden histórico: Base.md (07-04) → dds/ (07-09) → tesis .tex (07-15)
- **Respaldo:** `git log --follow` de cada artefacto (`d03c7bd`, `a57698f`).
- **Límite:** todo el árbol `.tex` entró en un commit único (07-15); Git no sub-data
  capítulos entre sí. Suficiente para el orden macro, no para el micro.
- **Confianza: ALTA** (orden macro).

## 2. Autocrítica (auditando mi propia investigación)

- **Falso positivo corregido:** en el informe anterior califiqué las descripciones de
  fase de `cap05/5.5` como "genéricas/relleno" de forma demasiado amplia. Es
  impreciso: los **wireframes/prototipos** (Fase 4) SÍ tienen respaldo real
  (`anexos/anexos.tex` Anexo A "Prototipado de Baja Fidelidad" + `info_extra/prototipado/`),
  y las **heurísticas de Nielsen** y el SUS de usabilidad SÍ existen (monolito L619;
  `cap05/5.3`). El residuo real es QUIRÚRGICO: entrevistas (Fase 1), y Design
  Thinking / brainstorming / análisis competitivo / "prototipos validados con
  usuarios" (Fase 2). El resto de fases está alineado.
- **Sesgo evitado:** no concluyo "por mayoría de documentos". La conclusión se apoya
  en identidad de `Base.md`, ausencia de artefactos y rol de "entrevista" en código.
- **Documento que pude haber ignorado:** el monolito `proyecto_final_corregido.tex`.
  Lo revisé: refuerza C-A/C-C (está limpio de entrevistas).
- **Excepción reconocida:** límite epistémico de C-C (entrevistas offline no
  probables ni refutables por el repo).

## 3. Segunda auditoría del repositorio (sin nuevas contradicciones)

Revisado en esta pasada: `cap01/1.4` objetivos (DDS, sin entrevistas), `cap03/3.6`
y `3.7` (White-Box/forense), `cap06` conclusiones (auditoría, sin método en
conflicto), `anexos/anexos.tex` (prototipos; sin guía de entrevista ni matriz de
consistencia), monolito (limpio). No apareció ninguna contradicción nueva. La única
inconsistencia sigue siendo el residuo de entrevistas/Design Thinking en cap05.

## 4. Verificación con Graphity (mapa + lectura directa)

| Concepto | Graphity (fuente de nodos) | Lectura directa |
|---|---|---|
| Scrum | 7 nodos, todos `Base.md` | Confirmado (otro proyecto) |
| Sprint | 6 nodos, todos `Base.md` | Confirmado |
| Entrevista | código admisión (useEntrevistasAdmision, solicitudesAdmision) | Feature de producto |
| Design Thinking | 0 nodos | Solo en cap05/5.5.tex |
| Brainstorming | 0 nodos | Solo en cap05/5.5.tex |
| DDS / fases 0-7 | 123 nodos dds/ | Confirmado |
| Ingeniería inversa | `00-indice.md`, `Base.md` | En .tex (resumen, cap01, cap02) |

Nota de calibración: Graphity NO indexa en profundidad los `.tex` de `Documento/`
(sí `.md`, `.toc`, código). Por eso "ingeniería inversa" da pocos nodos pese a estar
en el frontmatter; la verdad se estableció por lectura directa (grep), no por el grafo.

## 5. Plan de cambios propuesto (por archivo) — PENDIENTE DE APROBACIÓN

### Archivo 1 — `Documento/cap05/5.1_requisitos_funcionales.tex` (L14-17)
- **Cambio:** en la frase "refinados iterativamente con base en **las entrevistas a
  usuarios representativos** y el estudio de procesos organizacionales reales",
  sustituir el fragmento de entrevistas por el método real (análisis documental del
  código fuente / ingeniería inversa), conservando "estudio de procesos".
- **Evidencia:** `resumen.tex`, `cap03/3.6`, `dds/.../01-ssot-maestro.md`.
- **Impacto:** una frase. **No** toca la tabla RF (RF-016 "entrevistas de
  voluntarios" es feature legítima y se conserva).
- **Labels/refs/figuras/tablas afectadas:** ninguna.

### Archivo 2 — `Documento/cap05/5.5_flujo_dds.tex` (quirúrgico)
- **Cambios:**
  - Fase 1 (`subsec:fase1-descubrimiento`): reemplazar "entrevistas
    semiestructuradas" por análisis inverso del sistema existente + As-Is + STRIDE
    (dds fase 1). Conservar "mapa de actores / diagramas de contexto".
  - Fase 2 (`subsec:fase2-innovacion`): reemplazar "brainstorming estructurado,
    análisis competitivo … prototipos conceptuales validados con usuarios" por los
    artefactos reales de innovación (Zero-ORM+RLS, arquitectura híbrida, MPA) y la
    matriz de integración de requisitos (dds fase 2).
  - Fases 0, 3, 4, 5, 6, 7: se conservan (alineadas; Fase 4 wireframes con respaldo
    en Anexo A).
  - Tabla `tab:fases-artefactos`: alinear la fila de Fase 1 y Fase 2 con los
    artefactos reales (opcional, mismo criterio).
- **Evidencia:** `dds/fases/fase_1..2/**`, `resumen.tex`, monolito.
- **CONSERVAR todas las etiquetas** (`sec:flujo-dds`, `subsec:fase0..7`,
  `fig:flujo-dds`, `tab:fases-artefactos`): el `\autoref{sec:flujo-dds}` de
  `cap02/2.10` (4 usos) DEBE seguir resolviendo.
- **Impacto:** 2 subsecciones + 2 filas de tabla. Refs cruzadas intactas.

### Archivo 3 — `Documento/imagenes/diagramas/Flujo de DDS.jpg` (decisión aparte)
- **Opción E1:** regenerar el diagrama con las 8 fases reales (0–7), sin fechas 2023.
- **Opción E2:** retirar la figura de `cap05/5.5` (L117-121) y su `\ref` (L119).
- **Recomendación:** E1 (mantiene el apoyo visual y `fig:flujo-dds`).

## 6. Coherencia global de la tesis (misma historia)

Tras los cambios, todas las piezas contarían lo mismo (DDS + ingeniería inversa):
resumen ✓, abstract ✓, introducción ✓, objetivos ✓, metodología (cap02 teórico +
cap03 White-Box) ✓, resultados (cap05/5.5 corregido) ✓, discusión ✓, conclusiones ✓,
anexos (prototipos, coherentes con Fase 4) ✓. Se elimina la única desviación (cap05
entrevistas). No se introducen conceptos nuevos sin respaldo.

## 7. Auditoría LaTeX previa a cambios

- Referencias externas a cap05/5.5: solo `\autoref{sec:flujo-dds}` desde cap02/2.10
  → se preserva la etiqueta. `fig:flujo-dds` y `tab:fases-artefactos` se referencian
  solo dentro de 5.5.
- Sin paquete de acrónimos/glosario (siglas inline) → nada que regenerar.
- `main.tex` incluye cap02 y cap05.
- Riesgo de entorno: la herramienta de edición corrompe el disco montado (truncado /
  bytes NUL); los cambios se aplicarán por shell (heredoc/sed) y se verificará
  ausencia de NUL. La compilación total de `main.tex` requiere `texlive-lang-spanish`
  (ausente aquí) → verificación final en la máquina del autor.

## 8. Plan de ejecución (orden, dependencias, riesgos, validaciones)

1. `cap05/5.1` (1 frase) — sin dependencias.
2. `cap05/5.5` (Fases 1 y 2 + tabla) — conservar etiquetas.
3. Diagrama (E1 o E2 según tu decisión).
4. Verificar balance begin/end y 0 bytes NUL en cada archivo tocado.
5. Compilación aislada de cap05/5.5 y cap02/2.10 (2 pasadas) sin errores/overfull.
6. Re-barrido semántico: 0 "entrevista"/"design thinking"/"brainstorming" como método
   (salvo RF-016 feature y SUS).
7. Actualizar `changes/` (CHANGELOG/FILES_CHANGED) y commit (si el lock del repo lo
   permite; hoy `.git/index.lock` bloquea commits en este entorno).
8. Verificación final en máquina del autor: `pdflatex ×3` sobre `main.tex`.

- **Riesgos:** romper `sec:flujo-dds` (mitigado: se conserva); reintroducir corrupción
  de escritura (mitigado: shell + verificación NUL); no poder commitear aquí (se
  reporta).

## 9. Estado

Análisis terminado. **No se ha modificado ningún archivo de la tesis.** A la espera
de aprobación para ejecutar (y de tu decisión sobre el diagrama: E1 regenerar o E2
retirar).
