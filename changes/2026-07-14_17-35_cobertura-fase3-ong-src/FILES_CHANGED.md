# FILES_CHANGED — Fase 3: cobertura parcial en `ong/src`

## Creados — tests nuevos de esta sesión (Fase 3)
- `ong/src/app/modules/people/idCardUnits.test.ts` — 23 pruebas de conversión de unidades y escalado.
- `ong/src/app/modules/people/idCardShared.test.ts` — 19 pruebas de defaults/merge/código/QR/render.

## Versionados — tests ya escritos (Fases 1–2 y hooks de Fase 3) que estaban sin commitear
Servicios y utils puras:
- `ong/src/app/services/admision/form-adapters.test.ts`
- `ong/src/app/services/clinico/form-adapters.test.ts`
- `ong/src/app/services/personas/form-adapters.test.ts`
- `ong/src/app/services/account/myAccount.service.test.ts`
- `ong/src/app/services/clinico/medicalAudit.service.test.ts`
- `ong/src/app/services/operacion/asignacionesActividad.service.test.ts`
- `ong/src/app/utils/generateCode.test.ts`
- `ong/src/core/ui-state/persistence.test.ts`

Módulo people (idCard):
- `ong/src/app/modules/people/idCardBatch.test.ts`
- `ong/src/app/modules/people/idCardPdfExport.test.ts`
- `ong/src/app/modules/people/hooks/useBeneficiaryDetail.test.ts`
- `ong/src/app/modules/people/hooks/useIdCardDetail.test.ts`
- `ong/src/app/modules/people/hooks/useIdCardTemplateDetail.test.ts`
- `ong/src/app/modules/people/hooks/useMedicalRecordDetail.test.ts`
- `ong/src/app/modules/people/hooks/useVolunteerDetail.test.ts`

Módulo admission (hooks):
- `ong/src/app/modules/admission/hooks/useAdmissionReferenceCatalogs.test.ts`
- `ong/src/app/modules/admission/hooks/useDocumentosAdmision.test.ts`
- `ong/src/app/modules/admission/hooks/useEntrevistasAdmision.test.ts`
- `ong/src/app/modules/admission/hooks/useOnboardingAdmision.test.ts`
- `ong/src/app/modules/admission/hooks/useSolicitudAdmisionDetail.test.ts`
- `ong/src/app/modules/admission/hooks/useSolicitudesAdmision.test.ts`
- `ong/src/app/modules/admission/hooks/useVolunteerRegistrationByCode.test.ts`

Módulo operation:
- `ong/src/app/modules/operation/operationService.test.ts`
- `ong/src/app/modules/operation/hooks/useActividadDetail.test.ts`
- `ong/src/app/modules/operation/hooks/useAprobacionDetail.test.ts`
- `ong/src/app/modules/operation/hooks/useAsistenciaDetail.test.ts`
- `ong/src/app/modules/operation/hooks/useHoraDetail.test.ts`

Módulo projects:
- `ong/src/app/modules/projects/hooks/useProjectDetails.test.ts`

Módulo resources (hooks financieros e inventario):
- `ong/src/app/modules/resources/hooks/useCategoriaFinancieraDetail.test.ts`
- `ong/src/app/modules/resources/hooks/useCategoriasFinancieras.test.ts`
- `ong/src/app/modules/resources/hooks/useComprobantesFinancieros.test.ts`
- `ong/src/app/modules/resources/hooks/useCuentaFinancieraDetail.test.ts`
- `ong/src/app/modules/resources/hooks/useCuentasFinancieras.test.ts`
- `ong/src/app/modules/resources/hooks/useInventarioMovimientos.test.ts`
- `ong/src/app/modules/resources/hooks/useItemDetail.test.ts`
- `ong/src/app/modules/resources/hooks/useItems.test.ts`
- `ong/src/app/modules/resources/hooks/useKardex.test.ts`
- `ong/src/app/modules/resources/hooks/useReportesFinancieros.test.ts`
- `ong/src/app/modules/resources/hooks/useTransaccionFinancieraDetail.test.ts`
- `ong/src/app/modules/resources/hooks/useTransaccionInventarioDetail.test.ts`
- `ong/src/app/modules/resources/hooks/useTransaccionesFinancieras.test.ts`
- `ong/src/app/modules/resources/hooks/useUbicacionDetail.test.ts`
- `ong/src/app/modules/resources/hooks/useUbicaciones.test.ts`

## Modificados — configuración de cobertura
- `vite.config.js` — reporter `lcov` + `reportsDirectory: "coverage-web"`.
- `vitest.config.ts` — misma config de cobertura dedicada para el explorer.
- `.gitignore` — agrega `coverage-web/`.

## Creados — documentación de auditoría
- `changes/2026-07-14_17-35_cobertura-fase3-ong-src/CHANGELOG.md`
- `changes/2026-07-14_17-35_cobertura-fase3-ong-src/SUMMARY.md`
- `changes/2026-07-14_17-35_cobertura-fase3-ong-src/FILES_CHANGED.md`

## No incluidos deliberadamente
Archivos sueltos de la raíz ajenos a esta tarea (PDFs, CSV de Supabase, `Documento/`,
scripts `*.py`, `scratch_*.txt`, `0X_*.md`) — quedan sin versionar por no pertenecer a la
secuencia de cobertura.
