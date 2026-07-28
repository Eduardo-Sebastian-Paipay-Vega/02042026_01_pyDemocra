# Informe de Implementación Final (ejecutado tras aprobación)

Aprobación del autor: plan completo (cap05/5.1 + 5.5) + regenerar diagrama.

## Cambios realizados

### 1. `Documento/cap05/5.1_requisitos_funcionales.tex`
- **Antes:** "…refinados iterativamente con base en **las entrevistas a usuarios
  representativos** y el estudio de procesos organizacionales reales."
- **Después:** "…refinados iterativamente con base en el **análisis documental del
  código fuente existente (ingeniería inversa)** y el estudio de los procesos
  organizacionales reales."
- **Evidencia:** `frontmatter/resumen.tex`, `cap03/3.6`, `dds/.../01-ssot-maestro.md`.
- Tabla RF y RF-016 ("entrevistas de voluntarios", feature) intactas.

### 2. `Documento/cap05/5.5_flujo_dds.tex`
- **Fase 1** (`subsec:fase1-descubrimiento`): se elimina "entrevistas
  semiestructuradas" y "Design Thinking"; se describe el análisis inverso As-Is,
  derivación de requisitos desde el código, artefactos reales (inventario de código,
  estado actual, actores, C4, brechas) y Red Teaming/STRIDE.
- **Fase 2** (`subsec:fase2-innovacion`): se elimina "brainstorming", "análisis
  competitivo" y "prototipos validados con usuarios"; se describen los patrones de
  innovación reales (Zero-ORM+RLS, arquitectura híbrida, MPA) y la matriz de
  integración de requisitos.
- **Tabla `tab:fases-artefactos`:** filas de Fase 1 y Fase 2 alineadas con los
  artefactos reales.
- Fases 0, 3–7 sin cambios (ya alineadas).
- **Etiquetas conservadas** (`sec:flujo-dds`, `subsec:fase0..7`, `fig:flujo-dds`,
  `tab:fases-artefactos`): el `\autoref{sec:flujo-dds}` de `cap02/2.10` sigue válido.
- **Evidencia:** `dds/fases/fase_1..2/**`, `dds/.../innovacion.md`,
  `dds/.../integracion_requisitos.md`, `resumen.tex`, monolito.

### 3. `Documento/imagenes/diagramas/Flujo de DDS.jpg`
- Regenerado con las 8 fases reales (0–7), hub SSOT y lazo de retroalimentación.
- Sin fechas 2023, sin nombres tipo Scrum, sin texto corrupto. Paleta de la tesis.
- Original respaldado en `/tmp/Flujo_de_DDS_ORIGINAL_backup.jpg` (sesión).
- `fig:flujo-dds` y su `\ref` en `cap05/5.5` intactos.

## Validaciones efectuadas

- **Bytes NUL:** 0 en ambos `.tex` editados.
- **Balance de entornos:** 5.1 → 2/2; 5.5 → 5/5.
- **Compilación aislada** de `cap05/5.5` (con imágenes) y de `cap02/2.10`: 2 pasadas,
  exit 0, sin errores, sin Overfull/Underfull, sin referencias indefinidas.
- **Re-barrido semántico:** 0 residuos de método (entrevista/design
  thinking/brainstorming); la única "entrevista" restante en cap05 es RF-016 (feature
  de admisión) — legítima.
- **Coherencia global:** resumen, abstract, introducción, objetivos, cap01, cap02,
  cap03, cap05 y anexos cuentan ahora la misma historia (DDS + ingeniería inversa).

## Pendiente (fuera del entorno de sesión)

- **Compilación total de `main.tex` (3 pasadas)** en la máquina del autor: este
  entorno carece de `texlive-lang-spanish` (babel `spanish`).
- **Commit/push:** bloqueado por un `.git/index.lock` residual que el montaje no
  permite eliminar. Archivos guardados en disco; commitear desde la máquina del autor
  (o eliminar `.git\index.lock` y commitear).

## Archivos tocados en esta fase
- `Documento/cap05/5.1_requisitos_funcionales.tex` (1 frase)
- `Documento/cap05/5.5_flujo_dds.tex` (Fases 1–2 + 2 filas de tabla)
- `Documento/imagenes/diagramas/Flujo de DDS.jpg` (regenerado)
- `changes/.../*` (documentación de auditoría)

---

## ANEXO — Fase 1 y Fase 2 (entregabilidad)

### Fase 1 — Referencias y numeración (COMPLETADA)
- `frontmatter/introduccion.tex`: reescrito el párrafo de estructura para los 5
  capítulos reales (problema, marco, metodo, resultados_discusion, conclusiones).
  Eliminadas 6 referencias colgantes (chapter:api/datos/modulos/calidad/arquitectura/
  discusion) y la mención al cap. eliminado.
- `cap01/1.3_hipotesis.tex`: `chapter:resultados` → `chapter:resultados_discusion`.
- Resultado: compila con **0 referencias y 0 citas indefinidas**.

### Fase 2 — Descorrupción, cap03 (COMPLETADA)
Reescritas 5 secciones que estaban en *word-salad* ("inamovible asintótico
paramétrico"), reconstruidas desde la evidencia del repo (resumen, cap03/3.7
White-Box, /dds):
- `cap03/3.1_tipo.tex` — investigación aplicada y tecnológica.
- `cap03/3.2_nivel.tex` — nivel descriptivo (alineado al resumen; antes decía
  "descriptiva y explicativa").
- `cap03/3.3_diseno.tex` — no experimental, transversal.
- `cap03/3.6_tecnicas_instrumentos.tex` — análisis documental del código (White-Box),
  pruebas automatizadas (Jest/supertest/Vitest/pgTAP), cobertura, carga, SUS.
- `cap03/3.8_etica.tex` — Zero-Trust, hash de credenciales, JWT, RLS, licencias abiertas.
- Sin tocar (ya limpias): 3.4 población/muestra, 3.5 variables/indicadores, 3.7 validez.
- Resultado: 0 marcadores de corrupción en cap03; compila limpio (86 pág; la baja
  desde 96 se debe a que el texto corrupto era relleno inflado).

### Incoherencias de contenido detectadas (para decidir, NO corregidas)
- **Variables:** `cap03/3.5` define la variable dependiente como "Eficiencia de
  Desempeño y Cobertura de Código"; el `resumen.tex` habla de "Funcionamiento y
  Usabilidad". La usabilidad (SUS) se mide en cap05/5.3 pero no figura como variable
  en 3.5. Requiere decisión editorial.

### Corrupción pendiente (Fase 2, próximos capítulos)
- `cap02`: 2.2, 2.3, 2.4, 2.5 (y algo de 2.9).
- `cap05`: 5.11, 5.12 (además arrastra contenido de clasificados "anuncio"), 5.14.

### Fase 2 — Descorrupción, cap02 (COMPLETADA)
Reescritas 4 secciones corruptas (estilo florido + adjetivos parásitos ciego/cíclico/rígido):
- `cap02/2.2_ingenieria_web.tex` — glosario web + SPA/React/Virtual DOM/Diffing O(n)/60 FPS.
- `cap02/2.3_ongs.tex` — definición de ONG, carga logística, Data Siloing, brecha de privacidad/RLS.
- `cap02/2.4_dds.tex` — Data Distribution Service (OMG): DCPS/RTPS/UDP, choque con firewalls, WebSockets (443).
- `cap02/2.5_qos_dds.tex` — políticas QoS (Reliability/Deadline/Lifespan/Durability) vs redes indeterministas; WebSockets.
- Preservados títulos, subtítulos y hechos técnicos. 0 marcadores de corrupción; compila limpio (81 pág).

### Descorrupción pendiente
- `cap05`: 5.11 (pruebas API), 5.12 (integración E2E; arrastra contenido de clasificados "anuncio"), 5.14 (matriz ISO).
- `cap02` (florido, opcional, NO word-salad): 2.0 presentación, 2.1 antecedentes, 2.7 multitenant.

### Fase 2 — Descorrupción, cap05 (COMPLETADA)
Reescritas 3 secciones (word-salad + contenido heredado del proyecto de clasificados):
- `cap05/5.11_pruebas_api.tex` — tabla de endpoints realineada a la API real de Democra
  (/api/auth/terminal-login, /api/sedes, /api/iam/roles, /api/onboarding/bootstrap-tenant);
  eliminados los endpoints /api/anuncios.
- `cap05/5.12_pruebas_integracion.tex` — prueba E2E realineada al flujo real de admisión de
  voluntario con carga de documento; figura de traza HTTP depurada (POST /api/admision/solicitudes,
  carnet.jpg); eliminado "anuncio"; corregido "MySQL/PostgreSQL" → PostgreSQL; upload a Supabase Storage.
- `cap05/5.14_matriz_pruebas_iso.tex` — matriz ISO 25010: TC-SEC-01 corregido "Prisma ORM" →
  consultas parametrizadas del cliente Supabase (Zero-ORM, coherente con ADR 002); TC-FUN-01/02
  "Anuncio" → registro/voluntario.
- Verificado con la API real (server/routes, docs/api/openapi.yaml) y package.json (Prisma=0).
- 0 residuo (anuncio/prisma/mysql); compila limpio.

## ESTADO GLOBAL TRAS FASE 1 + FASE 2
- Compila: 0 errores, 0 referencias indefinidas, 0 citas indefinidas. **75 páginas**
  (desde 96; la reducción es por eliminación de relleno corrupto inflado, sin pérdida de contenido real).
- Corrupción word-salad: ELIMINADA en cap02 (2.2-2.5), cap03 (3.1,3.2,3.3,3.6,3.8) y cap05 (5.11,5.12,5.14).
- Pendiente (opcional/no bloqueante):
  * Estilo florido en cap02 2.0, 2.1, 2.6-2.9 (legible; posible pulido).
  * Incoherencia de variables: cap03/3.5 ("Desempeño/Cobertura") vs resumen ("Funcionamiento/Usabilidad").
  * Compilación final de main.tex en la máquina del autor (falta texlive-lang-spanish aquí).
  * Commit (bloqueado por .git/index.lock residual del entorno).
