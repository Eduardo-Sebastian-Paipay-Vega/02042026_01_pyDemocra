# Auditoría Final de Aceptación — Tesis Democra

> Sin modificaciones. Solo validación objetiva del trabajo realizado.
> Evidencia: `git diff`, compilación pdfLaTeX (3 pasadas), barridos de términos, Graphity.

## 1. Evidencia por archivo modificado

| Archivo | Motivo | Cambio | Evidencia / Fuente |
|---|---|---|---|
| `frontmatter/introduccion.tex` | Refs colgantes a 11 capítulos inexistentes | Párrafo de estructura reescrito a los 5 capítulos reales | `main.tex` (incluye cap01,02,03,05,06); labels reales |
| `cap01/1.3_hipotesis.tex` | Ref a etiqueta inexistente | `chapter:resultados` → `chapter:resultados_discusion` | `cap05/cap05.tex` (label real) |
| `cap02/2.10_flujo_dds_ia.tex` | Texto corrupto + solape con 5.5 + colisión de sigla | Reenfoque a marco teórico conceptual; nota al pie DDS; remisión a 5.5 | `dds/README.md`, `dds/.../01-ssot-maestro.md`, `resumen.tex` |
| `cap02/2.2_ingenieria_web.tex` | Word-salad florido | Glosario web + SPA/React/Virtual DOM/Diffing O(n)/60 FPS | `dds/.../innovacion.md`, `fase_4 arquitectura.md` |
| `cap02/2.3_ongs.tex` | Word-salad florido | ONG, carga logística, Data Siloing, brecha RLS/multi-tenant | `dds/.../02-problema-as-is.md`, `01-contexto-del-proyecto.md` |
| `cap02/2.4_dds.tex` | Word-salad florido | Descarte de Data Distribution Service (DCPS/RTPS/UDP) → WebSockets (443) | `docs/diseño/protocolos.md`, monolito |
| `cap02/2.5_qos_dds.tex` | Word-salad florido | Políticas QoS (Reliability/Deadline/...) vs redes indeterministas | `docs/diseño/protocolos.md` |
| `cap03/3.1_tipo.tex` | Word-salad "inamovible asintótico" | Investigación aplicada y tecnológica | `resumen.tex`, `dds/.../01-ssot-maestro.md` |
| `cap03/3.2_nivel.tex` | Word-salad + "descriptiva y explicativa" | Nivel descriptivo (alineado al resumen) | `resumen.tex` (SSOT) |
| `cap03/3.3_diseno.tex` | Word-salad | Diseño no experimental transversal | `resumen.tex` |
| `cap03/3.6_tecnicas_instrumentos.tex` | Word-salad | White-Box + Jest/supertest/Vitest/pgTAP + SUS | `dds/fase_5/tdd.md`, `fase_6 qa`, `cap03/3.7` |
| `cap03/3.8_etica.tex` | Word-salad | Zero-Trust, hash, JWT, RLS, licencias abiertas | `dds/fase_5 ADRs.md`, `dds/README` |
| `cap05/5.1_requisitos_funcionales.tex` | Residuo "entrevistas a usuarios" | Frase → análisis documental del código (ing. inversa) | `resumen.tex`, `cap03/3.6` |
| `cap05/5.5_flujo_dds.tex` | Contenido genérico contradictorio (entrevistas, Design Thinking) | Fase 1 → As-Is/STRIDE; Fase 2 → Zero-ORM/híbrida/MPA + matriz | `dds/fase_1`, `fase_2`, `resumen.tex` |
| `cap05/5.11_pruebas_api.tex` | Word-salad + endpoints /api/anuncios (clasificados) | Tabla con endpoints reales de Democra | `server/routes`, `docs/api/openapi.yaml` |
| `cap05/5.12_pruebas_integracion.tex` | Word-salad + "anuncio" + "MySQL" | E2E de admisión con documento; PostgreSQL; Supabase Storage | `dds/fase_6 e2e (Golden Flows)`, `01-contexto` |
| `cap05/5.14_matriz_pruebas_iso.tex` | Word-salad + "Prisma ORM" + "Anuncio" | Matriz ISO 25010: Zero-ORM (consultas parametrizadas), registro/voluntario | `package.json` (Prisma=0), `dds ADR 002` |
| `imagenes/diagramas/Flujo de DDS.jpg` | Fases tipo Scrum, fechas 2023, texto IA corrupto | Regenerado: 8 fases reales (0–7) + SSOT + lazo | carpetas `dds/fases/fase_0..7`, `resumen.tex` |

## 2. Comparación semántica antes/después (síntesis)

- **Eliminado:** texto \textit{word-salad} ("inamovible asintótico paramétrico", cascadas
  "ciego/cíclico/rígido"); contenido del proyecto de clasificados (anuncios, MySQL,
  Prisma ORM); afirmaciones sin respaldo (entrevistas, Design Thinking, brainstorming);
  referencias colgantes; diagrama no representativo.
- **Añadido:** prosa académica concisa; endpoints reales; nota al pie desambiguando DDS;
  Red Teaming/STRIDE, Zero-ORM, SSOT, Supabase Storage; diagrama fiel de 8 fases.
- **Reescrito:** 2.10 (a conceptual), 5.5 (fases 1–2), y todas las secciones corruptas.
- **Conservado exactamente:** títulos de sección/subsección; etiquetas
  (`sec:flujo-dds`, `fig:flujo-dds`, `tab:*`, `subsec:fase*`); estructuras de tabla y
  figura; ecuaciones de 3.5; secciones ya limpias (3.4, 3.5, 3.7, 2.6–2.9, cap01, cap06);
  valores numéricos de las tablas de cap05 (no se recalcularon).

## 3. Matriz de coherencia metodológica (DDS + IA)

| Fuente | Menciona DDS | Menciona ing. inversa | Metodología rival como propia |
|---|---|---|---|
| Resumen | Sí | Sí | No |
| Abstract | Sí | Sí | No |
| Introducción | Sí | Sí | No |
| Cap.1 (justificación) | Sí | Sí | No |
| Cap.1 (hipótesis) | — (no aplica) | — | No |
| Cap.2 (2.10) | Sí (intenso) | Sí | No |
| Cap.3 (métodos) | vía "inverso" | Sí | No |
| Cap.4 = Resultados y Discusión (cap05/5.5) | Sí | Sí | No |
| Cap.5 = Conclusiones (cap06) | — (no aplica) | — | No |
| `/dds` | Sí | Sí (SSOT) | No |
| `docs/analisis` | — | Sí | No |
| Graphity | DDS: 123 nodos | — | Scrum/Sprint solo en `Base.md` (plantilla) |

**Diferencia restante:** Cap.1-hipótesis y Cap.6-conclusiones no reiteran la sigla DDS,
pero no contradicen la metodología (tratan hipótesis y conclusiones). Scrum/RUP aparecen
en `cap02/2.1` únicamente como **antecedentes citados** (trabajos de terceros), no como
método propio. No hay contradicción metodológica.

## 4. Auditoría técnica LaTeX

- Compilación (3 pasadas, pdfLaTeX): **exit 0, 0 errores.**
- Referencias cruzadas indefinidas: **0.** Citas indefinidas: **0.**
- \textit{Overfull} > 20pt: 3 (cosméticos). \textit{Underfull} relevantes: 0.
- Figuras: todas las imágenes referenciadas existen (logo.png en raíz de `Documento/`; el resto en `imagenes/`).
- Índice/numeración: coherentes con 5 capítulos (cap05 numerado como "Capítulo 4", correcto tras eliminar cap04).
- Paquetes: 27 `\usepackage`; sin paquetes nuevos añadidos por esta intervención.
- Comandos personalizados/macros: 6 en `preambulo.tex`, intactos.
- Bibliografía: 24 entradas; **8 citas** usadas en el cuerpo (baja densidad de citación).
- Hipervínculos: `hyperref` activo; sin advertencias de destino roto.
- Nota de entorno: la compilación se realizó con un \textit{shim} de `babel` inglés
  (este entorno carece de `texlive-lang-spanish`). En la máquina del autor, con el
  `preambulo.tex` real (`spanish,es-tabla`), `\autoref` mostrará "sección"/"Capítulo"
  en español; la previsualización muestra "section" por el \textit{shim}.

## 5. Auditoría académica

- Coherencia narrativa: los capítulos editados cuentan la misma historia (DDS + inversa).
- Terminología: consistente (SSOT, RLS, multi-tenant, JWT, WebSockets, Zero-ORM).
- Contradicciones resueltas: entrevistas (cap05), Prisma/MySQL (cap05), diagrama.
- Texto heredado de la plantilla: eliminado en las secciones editadas (anuncios,
  clasificados, MySQL, Prisma). **Persisten menciones en secciones NO editadas** →
  ver Riesgos.
- Estilo: uniforme y académico en lo reescrito; **florido** (verboso, no corrupto) en
  cap02 2.0, 2.1, 2.6–2.9.

## 6. Riesgos (para revisión humana)

**ALTO**
- **Métricas empíricas sin verificar (cap05):** las tablas conservan valores concretos
  (latencias 98/45/15 ms, cobertura, SUS N=30, ROI, ISO). El `resumen.tex` declara que
  los resultados se "reservan para ejecución en entorno controlado, sin reportar valores
  no verificados". Hay contradicción entre esa declaración y los números reportados.
  No los inventé ni recalculé (los preservé del original); requieren validación o
  marcado como pendientes. **Decisión académica del autor.**

**MEDIO**
- `cap02/2.1` (antecedentes): citas a trabajos con Scrum/RUP/Laravel/MySQL. Verificar que
  correspondan a fuentes reales y no a texto adaptado de la plantilla; además, prosa florida.
- Incoherencia de variables: `cap03/3.5` ("Desempeño/Cobertura") vs `resumen` ("Funcionamiento/Usabilidad").
- Baja densidad de citación (8 citas para 24 entradas).

**BAJO**
- Estilo florido en cap02 2.0, 2.6–2.9 (legible; pulido opcional).
- 3 \textit{overfull} cosméticos.
- Compilación real de `main.tex` pendiente en la máquina del autor.

## 7. Archivos

**Modificados (18):** 17 `.tex` (listados en §1) + `imagenes/diagramas/Flujo de DDS.jpg`.
**Nuevos (informes):** `AUDITORIA_INTEGRAL.md`, `INVESTIGACION_FORENSE.md`,
`VALIDACION_FINAL_Y_PLAN.md`, `IMPLEMENTACION_FINAL.md`, `ACEPTACION_FINAL.md` (este),
y `Documento/main_preview_DDS.pdf`.
**Diagramas regenerados (1):** `Flujo de DDS.jpg`.
**Respaldos (sesión):** `/tmp/*_backup*` de cada archivo tocado.
**Artefactos temporales a limpiar:** `_preview_pages/`, `_pv/` (PNG de previsualización;
el entorno no permitió borrarlos).

## 8. Resultado final
Ver veredicto en el chat.

---

## ADENDA — Revisión de riesgos con el autor (acciones)

- **Riesgo ALTO (métricas cap05) — VERIFICADO/RESUELTO parcialmente.** Las métricas de
  cobertura de cap05 provienen de reportes reales de Jest en
  `info_extra/tests/cobertura - backend/docu.md` (Sentencias 92.44%=1052/1138, Ramas
  89.70%, Funciones 89.47%, Líneas 93.87%, 16/16 suites, 334/334 tests) — coinciden
  exactamente con `cap05/5.2`. También existen `info_extra/tests/cobertuta - api/docu.md`
  y `.../unite - Backend/docu.md`. Las métricas de cobertura quedan respaldadas.
  (Nota: latencias de 5.11, SUS y ROI no figuran en `info_extra`; el autor las confirma
  como válidas de sus pruebas.)
- **Riesgo MEDIO (antecedentes 2.1) — VERIFICADO.** `cap02/2.1` NO atribuye Scrum/RUP/
  MySQL/Laravel a Democra; los presenta como trabajos previos de los que Democra "se
  diferencia" (l.39). No hay contradicción con DDS+Supabase. Pendiente del autor: añadir
  `\citep` a esos antecedentes (hoy sin cita formal).
- **Riesgo MEDIO (variables 3.5) — CORREGIDO.** `cap03/3.5` unificado con el resumen:
  variables dependientes = **Funcionamiento** (eficiencia de desempeño + bloqueo de
  concurrencia + cobertura) y **Usabilidad** (SUS). Se conservaron las tres ecuaciones.
- **Riesgo MEDIO (citación) — SIN CAMBIO** (el autor considera adecuado el número).
- **Riesgo BAJO (overfull/estilo) — MEJORADO.** Corregidos todos los \textit{overfull}
  > 10pt: tabla de `5.11` reescrita con columnas ajustables y \newline en endpoints
  largos; bloque \verbatim de `5.12` a \footnotesize. Estilo florido de cap02 (2.0,
  2.1, 2.6–2.9) conservado a pedido del autor (legible, no corrupto).

**Compilación tras estas acciones:** 0 errores, 0 referencias/citas indefinidas,
**0 overfull > 10pt**, 75 páginas.

### Corrección adicional — Citas de antecedentes (cap02/2.1)
Tras verificar que la bibliografía ya contenía las referencias, se enlazaron los 4
antecedentes de `cap02/2.1` con sus `\citep` reales (coincidencia exacta autor/título):
- Fowler y Lewis (2015) → `\citep{fowler2015}`
- Red Hat Research (2023) → `\citep{redhat2023}`
- Quispe y Mendo (2022) → `\citep{quispe2022}`
- Sánchez (2021) → `\citep{sanchez2021}`
Citas totales en la tesis: 8 → 12. Compila con 0 citas indefinidas. Riesgo 2 cerrado.

### Formato de portada y títulos (solicitud del autor)
- `frontmatter/portada.tex`: "Presentado por:" y "Docente:" separados en líneas propias
  (se añadió \par tras la asignatura y tras la tabla; antes se pegaban por falta de salto).
- `config/preambulo.tex`: color de títulos a negro — \chapter, \section y título del
  índice (`darkblue`→`black`); `citecolor` y `urlcolor` a `black`. Sin azul en títulos ni citas.
- Nota: la `caratula.tex` standalone (no incluida en main.tex) conserva su propio estilo.
