# SUMMARY — Verificación de drift en openapi.yaml

**Qué se hizo:** Se auditó `docs/api/openapi.yaml` endpoint por endpoint contra el código real de `server/routes/*.js`, y se corrigieron los códigos de estado, campos de request y schemas de respuesta que estaban desactualizados o directamente ausentes.

**Por qué se hizo:** La verificación inicial de esta sesión solo contó que hubiera 16 paths documentados para 22 endpoints reales — eso NO garantiza que el contenido de cada uno sea correcto. Una auditoría más profunda encontró que la documentación ya estaba incompleta desde antes de esta sesión (no es una regresión de las Fases 1-4).

**Qué beneficio aporta:** Ahora el spec documenta con precisión: un 403 FIN-001/FIN-002 transversal en toda escritura de IAM/sedes, un 500 transversal en cualquier endpoint, el status 423 de `terminal-login` (que no existía en el doc), el 403 TEN-002 de "empresa inactiva" en onboarding, y los campos de request/query realmente requeridos (antes marcados como opcionales quedaban con validación 400 no documentada).

**Qué funcionalidades quedaron afectadas:** Ninguna — cambio 100% de documentación, cero código de producción tocado. Verificado que Swagger UI sigue sirviendo el spec sin error.
