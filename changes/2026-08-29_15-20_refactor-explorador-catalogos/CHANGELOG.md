# CHANGELOG

## 2026-08-29 15:20 - Refactorización del Explorador de Catálogos (Gobernanza)

- **Objetivo del cambio:** Refactorizar la UI del explorador de catálogos para solucionar problemas de sobrecarga cognitiva, limpiar la exposición de detalles técnicos (tablas SQL y políticas) a los usuarios, y mejorar el diseño de la tabla retirando información redundante, siguiendo estrictamente el Prompt Táctico recibido.
- **Contexto del problema:** La vista de catálogos presentaba 13 "píldoras" (Tabs) apiladas para la selección, lo cual rompía la estética y no escalaba. El banner de advertencia mostraba nombres reales de tablas SQL (`public.cat_permissions`) violando la regla de UX de no mostrar logs o jerga técnica. La tabla repetía "Solo lectura" en cada fila.
- **Motivo de la modificación:** Cumplir con los RF (Requisitos Funcionales) y asegurar que el sistema se vea profesional, libre de jerga técnica y con una interfaz limpia que escala ante un aumento en la cantidad de catálogos.
- **Solución implementada:** 
  1. Se reemplazó el listado mapeado de `<GradientButton>` / `<OutlineButton>` por un componente `<Select>` (Combobox) estilizado e integrado usando `lucide-react` y `@/core/components/ui/select`.
  2. Se reescribió el Alert (Banner) para explicar en términos de negocio que los catálogos son administrados por el sistema central y son de solo lectura, omitiendo nombres de tablas.
  3. Se eliminó la columna "Soporte" de la tabla.
  4. Se removió el bloque de "Fuente documental" en el modal de detalle que filtraba paths internos (`guidelines/BD/...`).
- **Riesgos identificados:** Ninguno grave. La tabla sigue conectada de forma normal y los queries se mantienen intactos a través del hook y servicio existentes.
- **Impacto esperado:** Interfaz limpia, mayor facilidad de navegación, nula fuga de información sensible sobre arquitectura de la base de datos al cliente.
- **Módulos afectados:** Módulo ONG -> Gobernanza -> Catálogos (`src/modules/ong/app/pages/Catalogs.tsx`).
- **Dependencias involucradas:** `@/core/components/ui/select`, `lucide-react`.
- **Posibles efectos secundarios:** Ninguno.
- **Estado del cambio:** Completado.
