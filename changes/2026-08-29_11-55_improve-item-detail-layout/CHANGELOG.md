# Changelog

**Fecha y Hora:** 2026-08-29 11:55  
**Objetivo del Cambio:** Mejorar la jerarquía visual, la legibilidad y el microcopy de los modales de detalles en el módulo de Inventario.

**Contexto del Problema:**  
El diseño de la pantalla de detalles carecía de jerarquía visual (textos pequeños y uniformes). El contenedor central estaba desaprovechado y presentaba grandes bloques grises. El microcopy necesitaba ser más profesional.

**Motivo de la Modificación:**  
Atender la crítica de diseño de UI/UX enviada por el usuario para refinar la presentación visual del catálogo.

**Solución Implementada:**  
- Refactorización de `<DetailField>`: se modificó globalmente a un formato "stacked" con etiqueta pequeña en uppercase y valor grande destacado.
- Implementación de un layout de catálogo de 2 columnas (`grid-cols-[240px_1fr]`) en los detalles de `Ítem` y `Ubicación`.
- Inserción de la imagen o placeholder del recurso en la columna izquierda.
- Se agregó una cabecera con el título dinámico (ej: `Detalles del Ítem: Casaca`) a los modales.
- Refinamiento de etiquetas: "Codigo" -> "Código de Ítem", "Unidad" -> "Unidad de Medida", "Stock derivado" -> "Stock Disponible", "Descripcion" -> "Detalles Adicionales".
- Se rediseñó el `empty state` de la tabla de movimientos recientes con un layout amigable de bordes punteados.

**Riesgos Identificados:**  
Ninguno. Sólo afecta la presentación visual en React.

**Impacto Esperado:**  
Los modales de detalle se verán mucho más legibles y organizados, con una apariencia clara de catálogo.

**Módulos Afectados:**  
Frontend Web (Módulo ONG - Inventario).

**Dependencias Involucradas:**  
TailwindCSS para el rediseño.

**Posibles Efectos Secundarios:**  
El cambio en `<DetailField>` mejora automáticamente todos los lugares del archivo que lo usan (modales de item, location y movement).

**Estado del Cambio:** Completado.
