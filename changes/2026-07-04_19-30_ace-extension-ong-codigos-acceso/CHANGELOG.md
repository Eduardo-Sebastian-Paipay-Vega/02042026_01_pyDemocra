# CHANGELOG — Extensión de ACE en ONG: generación de códigos de acceso y asignación automática de roles

**Fecha:** 2026-07-04
**Hora:** 19:30 (America/Lima)
**Autor:** Claude Sonnet 5 (Claude Code)
**Estado:** Completado (con 2 pasos manuales pendientes, ver "Impacto esperado")

## Objetivo del cambio

Dar al Administrador de la ONG (`ONG/`, la app en vivo) una interfaz para generar códigos de acceso dinámicos que, al ser usados en el registro público, asignen automáticamente el rol correspondiente a voluntarios, staff o beneficiarios — reutilizando y completando el sistema ACE (`access_links` / `fn_complete_access_onboarding`) que ya existía en la base de datos pero no estaba conectado a ningún frontend en uso.

## Contexto del problema

Se pidió inicialmente auditar cómo el Sistema 2 (GYMsos) implementa "roles dinámicos" y códigos de invitación, para replicar esa lógica en ONG. La auditoría (contra `s2/AUDIT_REPORT_S2.md`, `s2/DATABASE_MASTER_SCRIPT_S2.md`) mostró que S2 **no tiene roles dinámicos** (son 7 roles fijos sembrados a mano, sin migración versionada) y que su sistema de códigos está duplicado en 3 mecanismos redundantes, con funciones huérfanas y una brecha de seguridad documentada (enumeración anónima de códigos activos). Replicar ese patrón habría sido una regresión.

En cambio, ONG (Sistema 1) ya tenía un sistema superior y ya construido para esto — ACE (`public.access_links`, `public.memberships`, `fn_validate_access_code()`, `fn_complete_access_onboarding()`, migraciones `20260510*`) — pero:
- Su UI de administración (`AccessControl.tsx`) solo existía en `src/modules/ong/`, un árbol de código **no conectado al router** de ninguna app en uso.
- La app real (`ONG/`, puerto histórico 5174, ahora unificada en el mismo origen) usa un sistema de códigos distinto y más angosto (`rrhh.codigos_registro_voluntario` + Edge Function `consume-volunteer-registration-code`), específico para conversión de solicitudes de voluntariado, sin selector de rol.
- Incluso la UI de ACE existente no tenía selector de rol en el formulario de creación — el `assigned_role_id` existía en el backend pero ninguna pantalla lo exponía.

## Motivo de la modificación

Cerrar la brecha real: dar a ONG un flujo funcional de "generar código → el registro asigna el rol automáticamente", usando el sistema ya diseñado para esto (ACE) en vez de duplicar o empeorar con el patrón de S2.

## Solución implementada

1. **2 bugs corregidos en `fn_complete_access_onboarding()`** (documentados como script de referencia, NO aplicado a la base de datos real — ver `docs/consolidacion/ace_fix_membership_context_type_mapping.sql`):
   - `memberships.context_type` (español: PROYECTO/SEDE/PROGRAMA/ACTIVIDAD) no admitía `'GLOBAL'`, pero `access_links.target_type` (inglés: PROJECT/PROGRAM/ACTIVITY/SEDE/GLOBAL) se insertaba ahí directamente — cualquier código de auto-registro sin sede específica (el caso típico) fallaba por la restricción CHECK.
   - `memberships.context_id` es `NOT NULL`, pero un link `GLOBAL` tiene `target_id = NULL` a propósito — segundo fallo de restricción en el mismo INSERT.
   - Fix: se amplía el CHECK de `context_type` para admitir `'GLOBAL'`, se traduce `target_type` (inglés) → `context_type` (español) explícitamente, y se usa `tenant_id` como `context_id` para membresías `GLOBAL`.
2. **Port del sistema ACE de `src/modules/ong/` a `ONG/`** (la app en vivo): tipos (`access_links`, `memberships`, `fn_validate_access_code`, `fn_complete_access_onboarding`) agregados a `ONG/src/lib/db/ong/app-database.ts`; `ace.service.ts`, `useAccessLinks.ts`, `useMemberships.ts` portados con las mismas rutas de import ajustadas a `ONG/`.
3. **`AccessControl.tsx` recreado en `ONG/`, con una mejora real sobre el original**: se agregó el selector de **rol a asignar** (`listAssignableRoles()`) y de **sede** (`listAssignableSedes()`) al formulario de creación de código — la pieza que faltaba para que "asignar rol automáticamente" fuera literalmente posible desde la UI, no solo desde el backend.
4. **Ruta y entrada de menú nuevas**: `access-control` agregado a `ONG/src/app/tenant/navigation.tsx` (registro de rutas data-driven — el ítem de Sidebar aparece automáticamente vía `buildTenantSidebar()`, no requiere tocar `Sidebar.tsx`), y wireado en `ONG/src/app/routes.tsx` en `/app/ong/settings/access-control`, protegido por el permiso `ace.access_links.manage` (ya sembrado por la migración ACE Fase 0).
5. **Página pública nueva `AccessCodeRedeemPage.tsx`** en `/join`: valida el código (`fn_validate_access_code`, anónimo), crea la cuenta (`supabase.auth.signUp`) y consume el código (`fn_complete_access_onboarding`) para completar el ciclo de auto-asignación de rol — para códigos `STAFF_JOIN`/`BENEFICIARY_JOIN`/`GENERIC`. El flujo existente de voluntarios por solicitud de admisión (`/signup`, Edge Function `consume-volunteer-registration-code`) se dejó intacto, sin modificar.

## Riesgos identificados

- **El fix de `fn_complete_access_onboarding()` NO se aplicó a la base de datos real** — vive como script de referencia en `docs/consolidacion/` (mismo patrón que el baseline de consolidación), porque este repo tiene un proyecto Supabase real vinculado y no hay Docker/psql en este entorno para probarlo de extremo a extremo. **Sin aplicar este fix manualmente, el flujo de auto-registro con rol seguirá fallando** para códigos `GLOBAL` (el caso más común).
- **Permiso `ace.access_links.manage` debe estar asignado a algún rol** (vía `/app/ong/settings/roles`) para que un administrador vea la nueva pantalla en el Sidebar — no se asignó a ningún rol automáticamente, para no alterar permisos de roles existentes sin instrucción explícita.
- **`ONG/src/app/routes.tsx` tenía cambios previos no relacionados** (de un trabajo de "migración MPA unificada" ya en curso, no realizado por mí) — mis 2 adiciones (rutas `access-control` y `/join`) quedan en el mismo commit que esos cambios preexistentes porque no es posible separar un archivo por autor a nivel de `git add`. El resto de esa migración (`App.tsx`, `Sidebar.tsx`, `AppShell.tsx`, `server/*`, `vite.config.js`, etc.) se dejó deliberadamente fuera de este commit.
- **No se pudo probar el flujo autenticado completo** (login real, crear un código, canjearlo) por no contar con credenciales de un tenant real en este entorno. Se verificó en su lugar: `tsc --noEmit` limpio para todos los archivos nuevos/modificados, y renderizado sin errores de consola de `/ong/join` (formulario de código) y `/ong/app/ong/settings/access-control` (redirige correctamente a `/ong/login` al no haber sesión) vía Playwright contra el servidor de desarrollo real.

## Impacto esperado

- Cero impacto inmediato en producción: el fix de base de datos no se aplicó; el resto son archivos de frontend nuevos o un módulo de rutas no invasivo (agrega, no modifica, rutas existentes de otras páginas).
- **Pendiente para que el Administrador de la ONG pueda usar esto de punta a punta**:
  1. Aplicar manualmente `docs/consolidacion/ace_fix_membership_context_type_mapping.sql` contra el proyecto Supabase real.
  2. Asignar el permiso `ace.access_links.manage` a los roles administrativos correspondientes.

## Módulos afectados

- `ONG/src/lib/db/ong/app-database.ts`
- `ONG/src/app/services/ace/ace.service.ts` (nuevo)
- `ONG/src/app/modules/settings/hooks/useAccessLinks.ts` (nuevo)
- `ONG/src/app/modules/settings/hooks/useMemberships.ts` (nuevo)
- `ONG/src/app/pages/AccessControl.tsx` (nuevo)
- `ONG/src/app/pages/landing/AccessCodeRedeemPage.tsx` (nuevo)
- `ONG/src/app/tenant/navigation.tsx`
- `ONG/src/app/routes.tsx` (incluye cambios previos ajenos a este trabajo, ver "Riesgos")
- `docs/consolidacion/ace_fix_membership_context_type_mapping.sql` (nuevo, referencia)

## Dependencias involucradas

Ninguna nueva (reutiliza `@supabase/supabase-js`, `lucide-react`, `motion/react`, componentes compartidos ya existentes en `ONG/`).

## Posibles efectos secundarios

- El formato de `resource_name` en `public.audit_logs` (poblado por `fn_trigger_audit_universal`, no por esta función) no cambia con este trabajo.
- Ningún otro consumidor de `KpiCard`, `DataTable`, `ModalShell`, etc. se ve afectado — son reutilizados sin modificarlos.

## Verificación realizada

- `npx tsc --noEmit` desde la raíz: 0 errores nuevos en cualquier archivo bajo `ONG/src/` (los ~578 errores preexistentes están todos en `src/modules/ong/`, árbol no relacionado).
- Playwright contra `npm run dev:web`: `/ong/join` renderiza el formulario de código sin errores de consola; `/ong/app/ong/settings/access-control` redirige correctamente a `/ong/login` (guard de autenticación funcionando).
- Revisión manual línea por línea del script SQL de fix (no ejecutado contra ninguna base de datos real).

## Cómo revertir

`git revert` del commit `feat(ong): extiende ACE con generacion de codigos de acceso y asignacion automatica de roles`. Si ya se aplicó manualmente `ace_fix_membership_context_type_mapping.sql` en Supabase, revertir también esa restricción/función a mano (no hay rollback automático de SQL ya aplicado).
