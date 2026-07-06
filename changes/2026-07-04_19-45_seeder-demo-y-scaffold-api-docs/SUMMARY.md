# SUMMARY — Seeder de demostración ong↔gym y estructura base de documentación de API

## Qué se hizo

Se creó un script SQL de referencia que simula datos de prueba para demostrar que los esquemas `ong` y `gym` pueden coexistir sobre el mismo tenant/core compartido, y se dejó lista la estructura base (OpenAPI + colección Postman) para documentar la API interna de Express.

## Por qué se hizo

Era el último paso pendiente del encargo: verificar (de forma reproducible, aunque no ejecutable en este entorno) la integración entre ambos esquemas, y dejar preparada, no improvisada, la documentación de API para Postman/Swagger.

## Qué beneficio aporta

- El seeder da un caso de prueba concreto y verificable (con sus propias consultas de verificación) para el equipo de consolidación, sin necesitar que GYMsos exista en este repo.
- La documentación de API refleja los endpoints reales del código, lista para importar en Postman o pegar en Swagger Editor, sin haber agregado ninguna dependencia nueva al proyecto.

## Qué funcionalidades quedaron afectadas

Ninguna. Son artefactos de referencia/documentación nuevos; ningún archivo de código de la aplicación fue modificado.
