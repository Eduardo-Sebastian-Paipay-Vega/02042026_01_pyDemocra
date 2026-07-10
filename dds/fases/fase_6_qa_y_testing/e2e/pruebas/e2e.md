# Pruebas End-to-End (E2E)

*Fuente de verdad: `package.json`*

### Estado Actual: No Implementado

El análisis del proyecto revela la ausencia total de frameworks de pruebas End-to-End como Cypress, Playwright, o Selenium. 
No existen scripts en `package.json` relacionados a E2E ni carpetas `cypress/` o `tests/e2e/`.

**Recomendación:** Incorporar Playwright para probar los flujos críticos (Autenticación OTP + Escaneo de QR), ya que abarcan el backend Express, Supabase Auth y la interfaz de usuario.
