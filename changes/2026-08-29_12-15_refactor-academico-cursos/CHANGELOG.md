# Changelog

**Fecha y Hora:** 2026-08-29 12:15  
**Objetivo del Cambio:** Refactorizar el módulo de Cursos para resolver problemas de enrutamiento y mejorar drásticamente el UX/UI alineado a Antigravity Design Skills.

**Contexto del Problema:**  
El módulo de Cursos estaba enrutado erróneamente en el *sidebar* bajo una ruta que se mezclaba con dominios inapropiados (o simplemente necesitaba una categoría "Académico"). Además, la UI mezclaba los mensajes de error y listados vacíos, los CTAs estaban mal posicionados en el footer, el listado carecía del número de inscritos para dar valor real y el modal de creación carecía de manejo de error visual y controles UI modernos (Switch de activo vs Checkbox).

**Motivo de la Modificación:**  
Atender el "Prompt Táctico" de auditoría y diseño UX, garantizando que el listado represente fielmente los datos (añadiendo join a `inscripciones`) y tenga un nivel superior de pulido visual.

**Solución Implementada:**  
- **Rutas:** Modificado `ong/src/app/routes.tsx` (`academico/cursos`) y `ong/src/app/tenant/navigation.tsx` (creando el NAV_GROUP "academico").
- **Service:** Editado `cursos.service.ts` -> Función `listCursos` ejecuta ahora un subquery (manual grouping en TS sobre un select .in("id_curso")) para anexar `inscritosCount`.
- **UX/UI Courses:** Se rediseñó el Action bar, los modales de ingreso y los Empty/Error states en `Courses.tsx`.
- Se incluyó la validación local estricta antes de invocar la promesa hacia Supabase, coloreando de rojo la UI (bordes/fondos) sobre campos con errores.

**Riesgos Identificados:**  
Bajo riesgo. Los cambios al servicio utilizan un query secundario en vez de un sub-select `(count)` puro de Postgres debido a limitaciones de la vista, pero están fuertemente tipados. El router reaccionará limpiamente al cambio del URL path.

**Impacto Esperado:**  
Cualquier URL vieja a "Cursos" podría requerir navegación desde el menú de la interfaz para reactualizarse, pero el sidebar dirige al nuevo camino oficial de forma transparente. A nivel usuario, la experiencia mejora notablemente.

**Estado del Cambio:** Completado.
