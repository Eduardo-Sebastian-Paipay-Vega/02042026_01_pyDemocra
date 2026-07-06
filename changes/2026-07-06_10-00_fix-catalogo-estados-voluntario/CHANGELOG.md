# CHANGELOG — Fix: catálogo ong.estados_voluntario incompleto (falta 'en_proceso')

**Fecha:** 2026-07-06
**Hora:** 10:00 (America/Lima)
**Autor:** Claude Sonnet 5 (Claude Code)
**Estado:** Completado (script de referencia — el usuario ya aplicó el fix anterior de ACE y reportó este error nuevo al probar en real)

## Objetivo del cambio

Proveer el `INSERT INTO` faltante para poblar `ong.estados_voluntario` con el valor `'en_proceso'`, que faltaba en el catálogo real del usuario y hacía fallar el canje de códigos de acceso (`/join`) con una violación de FK.

## Contexto del problema

El usuario aplicó manualmente `ace_fix_membership_context_type_mapping.sql` (confirmó que resolvió el problema de contextos) y, al probar el flujo real de canje de código en `/join`, obtuvo:

```
violación de la restricción de clave externa "voluntarios_codigo_estado_fkey" en la tabla "voluntarios"
```

## Motivo de la modificación

`fn_complete_access_onboarding()` inserta `ong.voluntarios.codigo_estado = 'en_proceso'` por defecto para todo voluntario creado por onboarding vía código de acceso (paso 5 de la función, tipo `VOLUNTEER_JOIN`). Se confirmó la causa raíz comparando dos fuentes:
- El comentario de columna de `ong.estados_voluntario.codigo` en `DATABASE_MASTER_SCRIPT_S1.md:718` documenta 4 valores esperados: `'activo','inactivo','suspendido','en_proceso'`.
- El script de seed documentado (`docs/ong/scripts/Parte 2 - Script maestro documental de ONG módulos complementarios.md:536-540`) solo inserta 3 de esos 4 — `'en_proceso'` nunca fue sembrado en ninguna fuente del repositorio.

Es decir: el catálogo del usuario no está "mal armado" por su cuenta — el propio script de seed documentado en este repositorio ya venía incompleto desde antes de esta sesión.

## Solución implementada

Se entregó (en el chat) y se dejó como script de referencia el `INSERT INTO ong.estados_voluntario` con los 4 valores completos (agregando `en_proceso` con `orden_visual = 1`, como estado inicial antes de `activo`), usando `ON CONFLICT (codigo) DO NOTHING` para que sea seguro de ejecutar aunque el usuario ya tenga las otras 3 filas sembradas.

## Riesgos identificados

- Ninguno: es un INSERT puramente aditivo (agrega catálogo, no modifica ni borra filas existentes).
- No se pudo ejecutar contra la base de datos real del usuario desde este entorno (sin Docker/psql) — el usuario debe ejecutarlo manualmente, como ya hizo con el fix anterior.

## Impacto esperado

Una vez ejecutado, el canje de códigos `VOLUNTEER_JOIN` vía `/join` (o cualquier otro flujo que cree un voluntario con `codigo_estado = 'en_proceso'`) dejará de fallar por la FK.

## Módulos afectados

- `docs/consolidacion/seed_ong_estados_voluntario_fix.sql` (nuevo, referencia)

## Dependencias involucradas

Ninguna nueva.

## Posibles efectos secundarios

Ninguno.

## Verificación realizada

- Confirmado por contraste directo entre el comentario de columna de la tabla (4 valores esperados) y el script de seed documentado (solo 3 valores) — no es una suposición, es una comparación de dos fuentes del propio repositorio.
- No ejecutado contra la base de datos real (el usuario lo aplicará manualmente).

## Cómo revertir

`DELETE FROM ong.estados_voluntario WHERE codigo = 'en_proceso';` — pero esto rompería de nuevo el mismo flujo que se está arreglando, por lo que no se recomienda revertir sin also revertir `fn_complete_access_onboarding()` a no usar ese valor.
