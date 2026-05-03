# Documentacion Centralizada

Esta carpeta centraliza la documentacion del repositorio sin tocar logica, runtime ni configuraciones sensibles.

## Regla operativa de esta reorganizacion

- Solo se movieron archivos claramente documentales y seguros.
- No se movieron rutas funcionales ni archivos usados en ejecucion.
- `supabase/`, `ONG/supabase/`, `.env`, login, auth, middleware, hooks, providers y codigo de app quedaron fuera de cualquier cambio estructural.
- Cuando hubo conflicto entre documentacion general y documentacion de `ONG/`, se priorizo `ONG/` como fuente mas reciente, salvo evidencia clara en contra.

## Estructura

- `general/`: documentacion transversal del SaaS y del core multi-tenant.
- `ong/`: documentacion propia del modulo ONG y su capa funcional vigente.
- `legacy/`: referencias historicas, material superado o documentos que ya no deben usarse como fuente principal.

## Estados documentales

- `VIGENTE`: fuente principal recomendada.
- `VIGENTE PARCIAL`: util como complemento, pero no alcanza por si sola.
- `LEGACY`: historico, no usar como fuente principal.
- `POR VALIDAR`: requiere confirmacion antes de asumirse vigente.

## Orden recomendado de consulta

1. `docs/ong/` para todo lo especifico del modulo ONG.
2. `docs/general/` para arquitectura, auth, auditorias y base de datos transversal.
3. Indices de `docs/general/base-datos/supabase/README.md` y `docs/ong/base-datos/README.md` para ubicar migraciones y funciones que no se movieron.
4. `docs/legacy/` solo para contexto historico.

## Archivos guia

- `MAPA_DOCUMENTAL.md`: trazabilidad completa de origen, destino o indice, categoria y estado.
- `FUENTES_VIGENTES.md`: jerarquia de consulta y lista consolidada de fuentes actuales.

## Nota de seguridad

La reorganizacion fue hecha para documentacion unicamente. Si un archivo generaba duda operativa, no se movio y solo se dejo indexado.
