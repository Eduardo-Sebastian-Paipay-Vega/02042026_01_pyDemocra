# FILES_CHANGED — Auditoría de `cap02/2.10_flujo_dds_ia.tex`

## Modificados

- `Documento/cap02/2.10_flujo_dds_ia.tex`
  - Reescritura completa de la sección. De 28 líneas a ~300.
  - Corregido el título de la sección (eliminado "Autónoma", redacción precisa).
  - Añadido `\label{sec:flujo_dds_ia}`.
  - Corregidas todas las conjunciones "y"/"e" corruptas de la versión previa.
  - Añadida nota al pie que desambigua DDS (*Design Documentation System*) frente al
    *Data Distribution Service* de la Sección 2.4.
  - Nuevas subsecciones: Principios arquitectónicos; Modelo de interacción con la
    IA; Punto de partida (Ingeniería de Requisitos Inversa); Fundamentación de las 8
    fases (enriquecida con subfases y artefactos); Aplicación real; Síntesis.
  - Dos tablas nuevas (`tabularx`): contrato de prompt (`tab:contrato_prompt`) y
    fases→subfases→artefactos (`tab:fases_dds`).
  - Sin código fuente (no había `lstlisting`/`minted`/`verbatim`; se mantiene así).

## Creados (documentación de auditoría)

- `changes/2026-07-16_04-04_auditoria-cap02-2.10-flujo-dds-ia/CHANGELOG.md`
- `changes/2026-07-16_04-04_auditoria-cap02-2.10-flujo-dds-ia/SUMMARY.md`
- `changes/2026-07-16_04-04_auditoria-cap02-2.10-flujo-dds-ia/FILES_CHANGED.md`

## No modificados (verificados como fuente, sin cambios)

- `dds/**` (fuente de verdad consultada).
- `Documento/cap02/cap02.tex`, `2.4_dds.tex`–`2.9_*.tex` (no alterados).
- `Documento/config/preambulo.tex` (sin paquetes nuevos).

## Respaldo

- Copia del original en `/tmp/2.10_original_backup.tex` (sesión); la versión previa
  también recuperable vía `git show HEAD:Documento/cap02/2.10_flujo_dds_ia.tex`.
