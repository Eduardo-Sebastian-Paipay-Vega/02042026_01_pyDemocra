# CHANGELOG — Framework Living DDS² y reorganización documental

**Fecha y hora:** 2026-07-16 21:35 (UTC local del entorno)
**Autor:** Claude (Cowork)

## Objetivo del cambio

Formalizar la metodología de documentación del repositorio como el framework **"Living DDS²" (Document-Driven SDLC: Discover, Design, Ship)** y dejar la documentación de raíz reorganizada de forma coherente. Todo queda registrado para poder incorporarse luego como una fase/sección de la tesis LaTeX en `Documento/`.

## Contexto del problema

1. **Choque de acrónimo:** `dds/README.md` definía "DDS" únicamente como *Document-Driven System + IA*, pero la estructura real de `dds/fases/` se agrupa naturalmente en *Discover, Design, Ship*. El doble sentido estaba implícito y sin documentar, con riesgo de que humanos o agentes de IA lo reinterpreten.
2. **Fase 0 sin ubicar:** `fase_0_developer_experience` no pertenece a ninguno de los tres bloques del flujo de valor; era un hueco en el mapeo.
3. **Documentación dispersa:** varios `.md` y `.txt` sueltos en la raíz del repositorio (artefactos y documentos temáticos fuera de su carpeta lógica).

## Motivo de la modificación

Convertir el contexto documental en el activo principal del proyecto ("software descriptible"): que cada fase quede autodescrita por documentos vivos y que un agente de IA pueda leer la fase relevante y actuar con precisión sin contexto externo. Requiere que la metodología esté declarada de forma explícita, trazable y versionada.

## Solución implementada

1. **ADR-001** (`dds/decisiones/ADR-001-living-dds-document-driven-sdlc.md`): formaliza el framework Living DDS², declara el doble significado del acrónimo, ubica la Fase 0 como "ADN Semilla" transversal, y define la tabla de documentos vivos objetivo por fase. Formato según `dds/plantillas/decisiones_adr/plantilla-adr.md` (estilo Michael Nygard).
2. **`dds/README.md`**: encabezado y sección nuevos que declaran el doble significado, el diagrama de bloques (Fase 0 + Discover/Design/Ship) y la tabla de documentos vivos. Se conservó íntegro el contenido previo (propósito arquitectónico, estructura principal).
3. **Reorganización documental previa (misma sesión):**
   - 12 `.md` temáticos movidos de la raíz a `docs/analisis/`, `docs/general/base-datos/`, `docs/general/`, `docs/ong/` y `Documento/`.
   - 11 `.txt` (9 logs de cobertura + 2 scratch) movidos a `info_extra/tests/logs-cobertura/` e `info_extra/scratch/`.

## Riesgos identificados

- Los movimientos de archivos se hicieron con `mv` (no `git mv`) por un `index.lock` bloqueado en `.git`; los cambios quedan sin stagear hasta que el usuario los añada.
- El bloque SHIP queda desbalanceado (3 fases vs. 2 y 2): forzamiento consciente, documentado en el ADR.
- Los "documentos vivos" son objetivo, no realidad completa: su adopción es incremental.

## Impacto esperado

Documentación autodescriptiva, sin ambigüedad de acrónimo, con la Fase 0 formalmente ubicada y lista para consumo por agentes de IA y para la tesis LaTeX.

## Módulos afectados

- `dds/` (README, decisiones)
- `docs/`, `Documento/`, `info_extra/` (reorganización)

## Dependencias involucradas

Ninguna dependencia de código. Solo documentación Markdown.

## Posibles efectos secundarios

- Referencias por nombre a archivos movidos en otros `.md` son texto plano (no enlaces relativos); verificado que no hay enlaces markdown rotos.

## Revisión 2026-07-17 — Renombrado de la metodología

Tras revisión crítica de rigor, se corrigió el nombre y el sustento:

- **Nombre técnico oficial:** de "Living DDS²" / "DDS²" (presentado como si fuera término de industria) a **"Ciclo de vida de desarrollo de software guiado por documentación (Document-Driven SDLC)"**.
- "Living DDS" queda solo como **alias interno**; "Discover, Design, Ship" como **agrupación conceptual**, no estándar externo.
- Se añadió **respaldo real de industria** (Amazon Working Backwards/PR-FAQ, RFC de Stripe/Uber, design docs de Google, Dual-Track Agile de Cagan, Double Diamond) y se eliminó la atribución no sustentada de "Discover, Design, Ship" a Intercom/Spotify/Figma.
- Archivos tocados: `dds/decisiones/ADR-001-living-dds-document-driven-sdlc.md` (reescrito), `dds/README.md` (encabezado y jerarquía de nombres).

## Revisión 2026-07-17 (b) — Renombrado en la tesis LaTeX

Se propagó el nombre oficial a toda la tesis (`Documento/`):

- Reemplazo global **`Design Documentation System` → `Document-Driven SDLC`** (23 ocurrencias) en `.tex` y `.md` fuente. La sigla **DDS se conserva**.
- Archivos tocados: `frontmatter/resumen.tex`, `frontmatter/abstract.tex`, `cap01/1.4_objetivos.tex`, `cap01/1.5_justificacion.tex`, `cap02/2.10_flujo_dds_ia.tex`, `cap05/5.0_presentacion.tex`, `cap05/5.5_flujo_dds.tex`, `proyecto_final_corregido.tex`, `dds_integracion_tesis.md`, `PRESENTACION.md`.
- Glosas en español añadidas en puntos definitorios: título de §2.10 ("Ciclo de Vida de Desarrollo Guiado por Documentación"), resumen y primera definición. Se corrigió "documentación de diseño" → "desarrollo guiado por documentación" donde nombraba la metodología.
- La nota al pie que distingue DDS (metodología) del *Data Distribution Service* (§2.4, protocolo descartado) se mantiene válida.
- **No tocado a propósito:** `cap02/2.4_dds.tex` y `2.5_qos_dds.tex` (tratan del OMG Data Distribution Service, otro DDS).
- `main.aux` / `main.toc` aún muestran el nombre viejo por ser **archivos generados**; se actualizan al recompilar.

**Verificación:** compilación en el sandbox no concluyente por falta del paquete babel-español (`Unknown option 'spanish'`), error de preámbulo ajeno a estos cambios. Los fragmentos editados quedaron con LaTeX balanceado; recompilar en el entorno local del usuario.

## Revisión 2026-07-17 (c) — Antecedentes de industria y tabla comparativa en §2.10

Se enriqueció la sección teórica de la metodología (`cap02/2.10_flujo_dds_ia.tex`):

- Nueva subsección **"Fundamento Académico y Antecedentes en la Industria"** (`\label{subsec:dds_antecedentes}`) que ancla el DDS a: Parnas & Clements (1986, base académica), Amazon *Working Backwards*/PR-FAQ (Bryar & Carr, 2021), *Design Docs at Google* (Ubl, 2020), RFCs de Uber/Stripe (Orosz, 2019) y dual-track (Cagan, 2018).
- Nueva **tabla comparativa** (`\label{tab:dds_comparativa}`): DDS vs. Cascada, Ágil/Scrum, RUP, Dual-Track Agile y Design Docs/RFC, en 4 dimensiones (documento como compuerta, SSOT versionada, colaboración con IA gobernada, origen del dominio).
- **5 referencias nuevas** en `bibliografia/referencias.tex`: `parnas1986`, `bryar2021`, `ubl2020`, `orosz2019`, `cagan2018` (formato `\bibitem` existente). Fuentes verificadas por búsqueda web.

## Revisión 2026-07-17 (d) — Refuerzos cruzados

- `cap05/5.5_flujo_dds.tex`: la introducción ahora referencia el marco teórico (`\autoref{sec:flujo_dds_ia}`) y la tabla comparativa (`\autoref{tab:dds_comparativa}`).
- `frontmatter/abstract.tex`: se añadió una frase que ancla la metodología al patrón *document-as-gate* de la industria (Amazon Working Backwards, Google, Uber) y a Parnas & Clements.

## Estado del cambio

**Completado** (pendiente `git add` + commit + push por parte del usuario, por el bloqueo de `index.lock`; y recompilar la tesis localmente).
