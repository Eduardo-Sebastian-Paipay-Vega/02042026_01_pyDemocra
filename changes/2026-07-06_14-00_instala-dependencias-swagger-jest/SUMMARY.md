# SUMMARY — Instalación de dependencias: Swagger UI y Jest/Supertest

## Qué se hizo

Se instalaron `swagger-ui-express`/`js-yaml` (para servir documentación interactiva) y `jest`/`supertest`/`babel-jest`/`@babel/core`/`@babel/preset-env` (para pruebas automatizadas de la API), y se agregaron los scripts `docs`, `test` y `test:coverage` a `package.json`.

## Por qué se hizo

Eran el prerrequisito explícito para exponer Swagger UI en local y para poder escribir y correr pruebas de cobertura sobre la API Express, ambos pedidos por el usuario.

## Qué beneficio aporta

Deja el proyecto listo para documentación interactiva y testing automatizado sin pasos de instalación pendientes.

## Qué funcionalidades quedaron afectadas

Ninguna. Solo se agregan dependencias y scripts; no se modifica código de la aplicación en este cambio.
