# DDS + IA (Design Documentation System + Artificial Intelligence)

Este directorio raíz (`dds/`) actúa como la **Única Fuente de Verdad (SSOT)** del proyecto. Aísla toda la documentación y contexto de diseño del código fuente funcional, manteniendo el repositorio limpio y desacoplado.

## Propósito Arquitectónico

1. **Single Source of Truth (SSOT) & Alta Cohesión**: Al encapsular toda la información de diseño y contexto de IA bajo la carpeta `dds/`, se consolida un único punto de referencia para humanos y agentes de inteligencia artificial. Ningún documento reside huérfano en la raíz del repositorio, garantizando el principio de orden del sistema.
2. **Desacoplamiento Funcional**: Los archivos de código del proyecto y la documentación viven en espacios separados. Esto evita la contaminación de los empaquetados de software y previene que los agentes de IA se confundan al analizar ficheros de código frente a especificaciones de diseño.
3. **Habilitación de Agentes Multitarea (Multi-Agent Safety)**: Al modularizar los artefactos dentro de subcarpetas específicas (`prompts/`, `especificaciones/`, `pruebas/`, `evidencias/`) dentro de cada fase, diferentes agentes de IA pueden escribir y leer en paralelo en distintos contextos sin provocar conflictos de merges ni sobrescrituras de ficheros.
4. **Trazabilidad y Versionado Determinista**: La jerarquía numerada y estructurada facilita la navegación a nivel de Git. Permite la revisión de cambios históricos estructurada por fase del ciclo de vida, sirviendo como un registro inmutable del crecimiento del sistema.

## Estructura Principal

* `fases/`: Contiene las fases del ciclo de vida y la evolución del software (desde el descubrimiento hasta el despliegue).
* `prompts/`: Repositorio centralizado de prompts de IA utilizados y validados a lo largo del proyecto, clasificados por áreas técnicas (análisis, arquitectura, testing, etc.).
* `contexto_ia/`: Espacio exclusivo para proveer el contexto del sistema a agentes inteligentes autónomos (reglas, glosarios, estándares, restricciones).
* `plantillas/`: Modelos y plantillas estandarizados para generar artefactos documentales consistentes (casos de uso, historias BDD, OpenAPI, ADR).
* `evidencias/`: Almacén para guardar trazas de auditoría técnica del repositorio (capturas, queries SQL, esquemas de tablas).
* `decisiones/`: Directorio dedicado a los **Architecture Decision Records (ADR)** del proyecto, manteniéndolos aislados del flujo evolutivo funcional.
* `diagramas/`: Repositorio consolidado de diagramas técnicos que representan estáticamente y dinámicamente el comportamiento e infraestructura del sistema.
* `reportes/`: Consolidado de auditorías, reportes de cobertura, validaciones de código y resúmenes ejecutivos.

La base estructural está lista para que la organización y los agentes inteligentes comiencen a poblar el sistema de documentación de forma escalable y segura.
