# Changelog

**Fecha y Hora:** 2026-08-29 12:05  
**Objetivo del Cambio:** Refactorizar el formulario de creación de ítems para mejorar validaciones visuales, UX, y solucionar errores de codificación en el uploader de imágenes.

**Contexto del Problema:**  
El modal original de "Nuevo Ítem" tenía inputs sin diseño de validación (red borders), un checkbox plano desalineado, ninguna jerarquía clara para campos obligatorios y un `ImageUploadField` que mostraba caracteres rotos (ej: `bot├│n`).

**Motivo de la Modificación:**  
Atender el "Prompt Maestro" de diseño, dotando al sistema de una calidad visual tipo Antigravity: validaciones en vivo, feedback visual claro y componentes de alto estándar.

**Solución Implementada:**  
- Refactorización masiva del `ModalShell` de `itemFormOpen`.
- **Validación Visual:** Agregados bordes rojos y alertas textuales dinámicas a los campos `name`, `unitCode` y `stateCode` en caso de fallar al hacer submit. Se usó el estado `itemFormErrors`.
- **Switch Toggle:** Se reemplazó el `<input type="checkbox">` tradicional por un Custom Switch animado con Tailwind.
- **Botón Inteligente:** Se incluyó un `<RefreshCw className="animate-spin" />` dentro de `GradientButton` para informar de manera clara el estado "Guardando...".
- **ImageUploadField:** Se corrigieron los fallos de codificación en el texto `Suelta la imagen aquí` y `usa el botón`.

**Riesgos Identificados:**  
Ninguno, los cambios son mejoras de presentación de React.

**Impacto Esperado:**  
Un flujo de inserción de recursos mucho más amigable, que previene fricción, doble clics y advierte correctamente los requerimientos de la BD (`nombre`, `estado`, `unidad`).

**Módulos Afectados:**  
Inventario Web (ONG), Componentes UI globales (Image Upload).

**Dependencias Involucradas:**  
`lucide-react` para iconos.

**Estado del Cambio:** Completado.
