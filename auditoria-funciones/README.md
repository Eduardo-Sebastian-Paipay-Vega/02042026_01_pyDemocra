# Catálogo Técnico de Protocolos Reutilizables

Este directorio contiene auditorías técnicas profundas de las funciones, procesos, protocolos y contratos de este sistema y ecosistema.

## Propósito

El objetivo principal de estas auditorías es descubrir, reconstruir, documentar y convertir en conocimiento reutilizable la arquitectura implícita y explícita del sistema. No se trata simplemente de documentar código, sino de entender cómo funcionan los contratos, permisos, aislamiento multi-tenant y reglas de negocio para asegurar una correcta integración o reimplementación en otros sistemas.

## Convenciones y Estructura

- Cada archivo Markdown (ej. `LOGIN.md`, `TENANT.md`) representa la auditoría de un flujo, protocolo o componente específico.
- Se utiliza un formato estandarizado para garantizar consistencia.
- Se documenta con evidencia rastreable al código fuente, base de datos y configuraciones.

## Sistema de Versionado

- Si una auditoría se actualiza de forma mayor, se puede versionar el archivo (ej. `LOGIN.v2.md`) o actualizar el documento existente si así se requiere.

## Diferencia entre Auditoría e Implementación

- **Auditoría:** Proceso de Solo Lectura. Implica análisis, mapeo de flujo, identificación de componentes, evaluación de seguridad y generación de contratos. No modifica código.
- **Implementación:** Acción de escribir o modificar código basada en el contrato y recomendaciones de una auditoría, ejecutada solo bajo petición explícita.
