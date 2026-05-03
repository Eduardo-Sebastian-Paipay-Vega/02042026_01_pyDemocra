# Modulo Aprobaciones

## Objetivo
- Exponer una bandeja operativa real para horas leyendo `ong.aprobaciones` como fuente principal.

## Fuentes auditadas
- `AGENTS.md`
- `guidelines/BD/Parte 4- Script maestro documental de ONG módulos complementarios.txt`
- `guidelines/documentacion-navegacion/02-operacion.md`

## Paginas y services impactados
- `src/app/pages/Approvals.tsx`
- `src/app/services/operacion/aprobaciones.service.ts`
- `src/app/services/operacion/horas.service.ts`

## Tablas y funciones reales usadas
- `public.fn_current_tenant_id()`
- `ong.aprobaciones`
- `ong.horas_actividad`
- `ong.actividades`
- `ong.proyectos`
- `ong.voluntarios`

## Decision actual
- La bandeja lista directamente `ong.aprobaciones` filtrando `entidad_schema='ong'` y `entidad_tabla='horas_actividad'`.
- `ong.horas_actividad` se usa solo como contexto vinculado para mostrar voluntario, actividad, proyecto, duracion y comentario sincronizado.
- La persistencia de la resolucion se sincroniza con `ong.aprobaciones`, `ong.horas_actividad.id_aprobacion` y `ong.horas_actividad.comentario_resolucion`.

## Acciones disponibles
- listar aprobaciones reales con filtro por estado, voluntario vinculado, fecha y texto.
- ver detalle contextual del registro de horas vinculado a cada aprobacion.
- devolver un registro a estado pendiente.
- aprobar horas.
- rechazar horas.
- guardar comentario de resolucion en `ong.aprobaciones.comentario` y `ong.horas_actividad.comentario_resolucion`.

## Restricciones y riesgos
- la vista sigue especializada en horas; otras entidades de `ong.aprobaciones` todavia no tienen UI operativa cerrada en este modulo.
- no existe contrato documental de aprobacion para evidencias en los scripts auditados.
- la adopcion de `ong.aprobaciones` sigue parcial a nivel de bandeja generica multi-entidad, pero para horas ya quedo cerrada.
