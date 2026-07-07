# SUMMARY — Configuración de Jest+Supertest y pruebas iniciales de cobertura

## Qué se hizo

Se configuró Jest con transform de Babel (para el ESM del proyecto) y Supertest, y se escribieron 26 pruebas iniciales cubriendo los 5 routers de la API (los 4 preexistentes más el nuevo de sedes), incluyendo los endpoints agregados en esta misma sesión.

## Por qué se hizo

El proyecto no tenía ningún framework de pruebas; el usuario pidió una prueba de cobertura integral cruzando análisis funcional con cobertura de código real via Jest.

## Qué beneficio aporta

28% de cobertura de statements real y verificable (no inventada), con una base reutilizable (mocks de `serviceClient`/`resolveAuthContext`, guard de `VERCEL` para no levantar un puerto real) para seguir agregando pruebas.

## Qué funcionalidades quedaron afectadas

Ninguna. Es infraestructura de testing pura — no se modificó lógica de producción en este cambio.
