# Documento Maestro SSOT (Single Source of Truth)
> **Fase 3 | Diseño y Definición** | Fecha de análisis: 2026-07-09

---

## 1. Definición del SSOT

El principio de "Single Source of Truth" (Única Fuente de Verdad) es crítico en Democra para evitar discrepancias entre lo que el sistema "hace" (código) y lo que el sistema "debería hacer" (documentación).

Este documento establece formalmente **dónde** reside la verdad absoluta para cada dimensión del proyecto.

## 2. Mapa de Fuentes de Verdad

Si existe un conflicto o discrepancia entre dos documentos o entre el código y la documentación, el elemento en la columna "Fuente de Verdad (SSOT)" tiene la prioridad absoluta y el otro elemento debe corregirse.

| Dimensión / Área | Fuente de Verdad (SSOT) | Ubicación Física | Qué hacer en caso de cambio |
|------------------|-------------------------|------------------|-----------------------------|
| **Modelo de Datos (Esquema)** | Migraciones SQL | `supabase/migrations/*.sql` | Nunca modificar una migración ya aplicada. Crear una nueva migración. |
| **Contrato de Datos (Domain)** | Tipos TypeScript | `src/modules/ong/app/modules/*/types.ts` | Si la BD cambia, los tipos TS DEBEN actualizarse inmediatamente. |
| **Contrato de API (Backend)** | OpenAPI Specification | `docs/api/openapi.yaml` | Si se añade/modifica una ruta Express en `server/routes/`, actualizar el YAML. |
| **Reglas de Negocio Centrales** | Documento DDS RN | `dds/fases/fase_1_.../03-reglas-de-negocio.md` | Las RN son inmutables a menos que el product owner apruebe explícitamente el cambio. |
| **Flujos y Casos de Uso** | Documento Análisis CU | `docs/analisis/05-casos-de-uso.md` | Si se altera un flujo UI, actualizar este documento. La documentación DDS solo hace referencia a este archivo. |
| **Requerimientos Iniciales** | Análisis RU y RF | `docs/analisis/03-requerimientos...` | Estos representan el alcance acordado. No modificar sin revisión de alcance. |

## 3. Reglas de Mantenimiento Documental (DDS)

Para asegurar que la estructura `dds/` se mantenga útil y no se convierta en deuda técnica:

1. **No Duplicar:** La carpeta `dds/` no debe copiar textualmente el contenido extenso de la carpeta `docs/analisis/`. Debe utilizar referencias cruzadas (enlaces Markdown) hacia `docs/analisis/` para detalles granulares (como la lista de 20 Casos de Uso).
2. **Artefactos Especializados:** La carpeta `dds/` es el hogar exclusivo de artefactos arquitectónicos y de ingeniería como:
   - Historias BDD (Gherkin).
   - Decisiones de Arquitectura (ADRs).
   - Diagramas C4 y Mermaid.
   - Paquetes de Contexto para IA.
3. **Flujo de Actualización:**
   `Código (Types/SQL) -> Documentación Analítica (docs/analisis/) -> Documentación de Diseño (dds/)`

## 4. Historial de Versiones Documentales

- **v1.0.0 (2026-07-09):** Creación del modelo SSOT y poblamiento inicial de la estructura DDS tras el descubrimiento exhaustivo del código fuente (Ingeniería de Requisitos Inversa).
