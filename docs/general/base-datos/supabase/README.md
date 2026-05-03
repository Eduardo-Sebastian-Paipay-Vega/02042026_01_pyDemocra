# Indice Supabase General

Esta carpeta documenta rutas funcionales de Supabase que no se movieron por seguridad.

## No movido por ser funcional

- `supabase/migrations/20260301120000_ai_security_copilot.sql`
- `supabase/migrations/20260302125000_fix_bootstrap_audit_tenant_null.sql`
- `supabase/migrations/20260305100000_schema_guard.sql`
- `supabase/migrations/20260305110000_rls_hardening_p0.sql`
- `supabase/migrations/20260305_rls_hardening.sql`

## Fuentes documentales consolidadas para interpretarlas

- `../../scripts-maestros/Parte 1- Script maestro documental del Core SUBS public.txt` (`VIGENTE`)
- `../modelo-global/SUBS-05-Base-De-Datos-BD-supabase.md` (`VIGENTE PARCIAL`)
- `../migraciones-documentadas/SUBS-06-Act-BD.md` (`VIGENTE PARCIAL`)
- `../migraciones-documentadas/todocorridoensupabase.md` (`VIGENTE PARCIAL`)
- `../../auditorias-y-patches/AUDIT-02-bd-modelo-real.md` (`VIGENTE PARCIAL`)
- `../../auditorias-y-patches/AUDIT-07-rls-recomendado.sql` (`POR VALIDAR`)
- `../../auditorias-y-patches/AUDIT-08-rls-informe.md` (`VIGENTE PARCIAL`)
- `../../auditorias-y-patches/rls_patch_notes.md` (`VIGENTE PARCIAL`)

## Nota

No existe `supabase/functions/` en la raiz general del repositorio en este snapshot. Las edge functions detectadas viven en `ONG/supabase/functions/` y estan indexadas desde `../../../ong/base-datos/README.md`.
