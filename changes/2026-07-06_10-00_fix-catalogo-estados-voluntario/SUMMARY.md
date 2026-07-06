# SUMMARY — Fix: catálogo ong.estados_voluntario incompleto (falta 'en_proceso')

## Qué se hizo

Se identificó que el script de seed documentado para `ong.estados_voluntario` siempre estuvo incompleto (le faltaba el valor `'en_proceso'`, aunque el propio comentario de la tabla lo documentaba como esperado) y se entregó el `INSERT` corregido con los 4 valores.

## Por qué se hizo

El usuario probó en real el flujo de canje de código de `/join` (tras aplicar el fix anterior de ACE) y obtuvo una violación de FK en `ong.voluntarios.codigo_estado`, porque `fn_complete_access_onboarding()` usa `'en_proceso'` como estado inicial y ese valor nunca estuvo en el catálogo.

## Qué beneficio aporta

Destraba el registro de voluntarios vía código de acceso end-to-end, sin modificar ninguna función ni tabla — solo completa datos de catálogo que faltaban desde antes de esta sesión.

## Qué funcionalidades quedaron afectadas

Ninguna negativamente. Es un INSERT aditivo; no se modifica ni elimina ninguna fila existente.
