# Fuentes Vigentes

## Jerarquia de consulta

1. Priorizar `docs/ong/` cuando el tema sea funcional o especifico del modulo ONG.
2. Usar `docs/general/` como soporte transversal del SaaS, auth, multi-tenant y auditorias.
3. Consultar `supabase/` y `ONG/supabase/` solo a traves de los indices de base de datos, porque esas rutas siguen siendo funcionales y no se movieron.
4. Dejar `docs/legacy/` para consulta historica.

## VIGENTE

- `docs/ong/indices/00-guia-maestra-modulos-y-bloqueos.md`
- `docs/ong/diccionarios-rf/ONGDiccionarioRF.md`
- `docs/ong/modulos-de-trabajo/01-home.md`
- `docs/ong/modulos-de-trabajo/02-operacion.md`
- `docs/ong/modulos-de-trabajo/03-proyectos.md`
- `docs/ong/modulos-de-trabajo/04-personas.md`
- `docs/ong/modulos-de-trabajo/05-aprobaciones.md`
- `docs/ong/modulos-de-trabajo/06-admision.md`
- `docs/ong/modulos-de-trabajo/07-recursos.md`
- `docs/ong/modulos-de-trabajo/08-gobernanza.md`
- `docs/ong/modulos-de-trabajo/08-notificaciones.md`
- `docs/ong/modulos-de-trabajo/10-configuracion.md`
- `docs/ong/scripts/Parte 4- Script maestro documental de ONG módulos complementarios.txt`
- `docs/general/scripts-maestros/Parte 1- Script maestro documental del Core SUBS public.txt`
- `supabase/migrations/20260301120000_ai_security_copilot.sql` (indexado, no movido)
- `supabase/migrations/20260302125000_fix_bootstrap_audit_tenant_null.sql` (indexado, no movido)
- `supabase/migrations/20260305100000_schema_guard.sql` (indexado, no movido)
- `supabase/migrations/20260305110000_rls_hardening_p0.sql` (indexado, no movido)
- `supabase/migrations/20260305_rls_hardening.sql` (indexado, no movido)
- `ONG/supabase/functions/admin-provision-user/index.ts` (indexado, no movido)
- `ONG/supabase/functions/admin-revoke-user-sessions/index.ts` (indexado, no movido)
- `ONG/supabase/functions/consume-volunteer-registration-code/index.ts` (indexado, no movido)
- `ONG/supabase/migrations/20260331_phase1_permissions_multischema.sql` (indexado, no movido)
- `ONG/supabase/migrations/20260401_phase1_2_storage_evidence_bucket.sql` (indexado, no movido)

## VIGENTE PARCIAL

- `docs/ong/arquitectura-funcional/00-sincronizacion-post-migracion.md`
- `docs/ong/modulos-de-trabajo/ONGModulosDeTrabajo(ED).md`
- `docs/ong/diccionarios-rf/ONGmatrizinformativa.csv`
- `docs/ong/indices/99-cierre-integral-repo.md`
- `docs/ong/scripts/Parte 2 - Script maestro documental de ONG módulos complementarios.txt`
- `docs/ong/scripts/Parte 3- Script maestro documental de ONG módulos complementarios.txt`
- `docs/general/arquitectura/SUBS-00-Master-Doc-Tecnica.md`
- `docs/general/arquitectura/SUBS-03-RN-Reglas-Riesgos.md`
- `docs/general/auth-y-logins/SUBS-02-SEC-Matriz-Permisos.md`
- `docs/general/auth-y-logins/README_AI_SECURITY_COPILOT.md`
- `docs/general/auth-y-logins/QA_ONBOARDING_RISK_CHECKLIST.md`
- `docs/general/base-datos/modelo-global/SUBS-05-Base-De-Datos-BD-supabase.md`
- `docs/general/base-datos/migraciones-documentadas/SUBS-06-Act-BD.md`
- `docs/general/base-datos/migraciones-documentadas/todocorridoensupabase.md`
- `docs/general/modulos-transversales/SUBS-01-REQ-Gestion-Actores.md`
- `docs/general/modulos-transversales/SUBS-04-CU-Pagos-Facturacion.md`
- `docs/general/auditorias-y-patches/DEPLOY-NOTES.md`
- `docs/general/auditorias-y-patches/AUDIT-00-inventario.md`
- `docs/general/auditorias-y-patches/AUDIT-01-rf-cu-normalizados.md`
- `docs/general/auditorias-y-patches/AUDIT-02-bd-modelo-real.md`
- `docs/general/auditorias-y-patches/AUDIT-03-bd-huerfanos-y-uso.md`
- `docs/general/auditorias-y-patches/AUDIT-04-mapa-de-uso-codigo.md`
- `docs/general/auditorias-y-patches/AUDIT-05-matriz-cobertura.csv`
- `docs/general/auditorias-y-patches/AUDIT-06-gaps-y-parches.md`
- `docs/general/auditorias-y-patches/AUDIT-08-rls-informe.md`
- `docs/general/auditorias-y-patches/rls_patch_notes.md`
- `ONG/AGENTS.md` (indexado, no movido)
- `ONG/supabase/functions/_shared/http.ts` (indexado, no movido)
- `ONG/supabase/functions/_shared/supabase.ts` (indexado, no movido)

## POR VALIDAR

- `docs/general/auditorias-y-patches/AUDIT-07-rls-recomendado.sql`

## LEGACY

- `docs/legacy/referencias-antiguas/README_MIGRATION.md`
- `docs/legacy/referencias-antiguas/home.md`
- `docs/legacy/referencias-antiguas/operacion.md`
- `docs/legacy/referencias-antiguas/admision.md`
- `docs/legacy/referencias-antiguas/personas-proyectos-salud.md`
- `docs/legacy/referencias-antiguas/recursos.md`
- `ONG/README.md` (indexado, no movido)
