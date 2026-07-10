# Pruebas Unitarias y TDD

*Fuente de verdad: `vitest.config.ts`, `jest.config.js`, `supabase/tests/`*

El repositorio asienta bases firmes para el Desarrollo Guiado por Pruebas (TDD) en tres frentes distintos:

## 1. Pruebas de Base de Datos (pgTAP)
Los tests que residen en `supabase/tests/` (por ejemplo, `fase1_onboarding_test.sql`) representan la validación transaccional nativa. 
**Enfoque:** Validar las políticas RLS y la integridad referencial antes de exponer cualquier dato a la API, asegurando el núcleo del aislamiento multi-tenant.

## 2. Pruebas del API Express (Jest)
El backend de seguridad Node.js utiliza Jest. Esto se evidencia en la presencia de `babel.config.cjs` y las configuraciones típicas para compilar módulos ES y simular endpoints (probablemente con `supertest`).

## 3. Pruebas del Frontend React (Vitest)
El archivo `vitest.config.ts` y su setup file `vitest.setup.ts` indican que los componentes UI son probados unitariamente bajo un entorno JSDOM simulado. `package.json` incluye scripts de cobertura (`coverage: { provider: 'v8' }`), fomentando métricas sólidas de calidad.
