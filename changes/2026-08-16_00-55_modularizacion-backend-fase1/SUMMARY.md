# Resumen: Fase 1 (Modularización Backend)

- **Qué se hizo:** Se reorganizó la carpeta de servicios (`server/services/`) dividiéndola lógicamente en `server/core/services/` (módulos técnicos transversales) y `server/domains/ong/services/` (reglas de negocio exclusivas del vertical ONG). Además, se actualizaron las referencias e importaciones para no romper la aplicación.
- **Por qué se hizo:** Para permitir que la plataforma principal (`DEMOCRA.PRO`) pueda evolucionar y sostener múltiples verticales (ej. Retail, Gym) reutilizando los mismos cimientos de base de datos e identidad, sin mezclar módulos propietarios entre rubros distintos.
- **Qué beneficio aporta:** Separa claramente el código de aplicación (dominio) del código de infraestructura (core), previniendo deuda técnica conforme crece la aplicación.
- **Qué funcionalidades quedaron afectadas:** Todas las funcionalidades que dependen de Auth, envío de emails, OCR, firmas biométricas, y webhooks, pero la funcionalidad lógica se mantuvo idéntica, solo varió su ubicación física.
