# FILES_CHANGED — Framework Living DDS² y reorganización documental

## Creados

- `dds/decisiones/ADR-001-living-dds-document-driven-sdlc.md` — ADR que formaliza el framework Living DDS² (doble significado del acrónimo, Fase 0 como ADN Semilla, tabla de documentos vivos por fase).
- `changes/2026-07-16_21-35_framework-living-dds/CHANGELOG.md` — historial técnico del cambio.
- `changes/2026-07-16_21-35_framework-living-dds/SUMMARY.md` — resumen ejecutivo.
- `changes/2026-07-16_21-35_framework-living-dds/FILES_CHANGED.md` — este archivo.

## Modificados

- `dds/README.md` — nuevo título (`DDS² · Living DDS`), bloque que declara el doble significado, diagrama de fases/bloques y tabla de documentos vivos. Contenido previo (propósito arquitectónico, estructura principal) conservado íntegro.

## Movidos (misma sesión — reorganización documental)

### `.md` (12), de raíz a:
- `docs/analisis/` ← `01_Reconstruccion_Funcional.md`, `02_Requerimientos_Funcionales.md`
- `docs/general/base-datos/` ← `AUDIT_REPORT_S1.md`, `DATABASE_DICTIONARY_S1.md`, `DATABASE_MASTER_SCRIPT_S1.md`
- `docs/ong/` ← `LOOK_AND_FEEL_ONG.md`, `LOOK_AND_FEEL_IMPLEMENTATION_REPORT.md`, `ONG_LIGHT_MODE_REDESIGN_REPORT.md`, `ONG_ROUTER_INTEGRATION_REPORT.md`, `PROMPT_APLICAR_LOOK_AND_FEEL_ONG.md`
- `docs/general/` ← `PROMPT_INTEGRA.md`
- `Documento/` ← `PRESENTACION.md`

### `.txt` (11), de raíz a:
- `info_extra/tests/logs-cobertura/` ← `coverage_final.txt`, `coverage_istanbul.txt`, `coverage_istanbul_final.txt`, `coverage_output.txt`, `coverage_v8_final.txt`, `coverage_v8_final2.txt`, `coverage_v8_final3.txt`, `coverage_v8_final4.txt`, `coverage_v8_final5.txt`
- `info_extra/scratch/` ← `scratch_bib.txt`, `scratch_step569.txt`

## Eliminados

Ninguno.

## Nota de reversión

Los movimientos se hicieron con `mv` (no `git mv`) por `index.lock` bloqueado. Para revertir: mover los archivos de vuelta a la raíz y restaurar `dds/README.md` desde git (`git checkout -- dds/README.md`), luego borrar el ADR y esta carpeta `changes/`.
