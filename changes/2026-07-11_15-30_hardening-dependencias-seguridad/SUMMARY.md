# SUMMARY — Hardening de dependencias

**Qué se hizo:** Se actualizaron `react-router` (7.13.0→7.18.1), `vite` (6.3.5→6.4.3) y `jspdf` (2.5.2→4.2.1), cerrando las 4 vulnerabilidades que reportaba `npm audit`.

**Por qué se hizo:** Es el primer paso de un pedido de hardening de seguridad. Las 4 vulnerabilidades eran conocidas desde hace días (documentadas y deliberadamente diferidas en una sesión anterior) pero nunca se habían resuelto.

**Qué beneficio aporta:** `npm audit` pasa de 4 vulnerabilidades (1 crítica) a 0. Sin cambios de comportamiento para el usuario final.

**Qué funcionalidades quedaron afectadas:** Ninguna en producción. La exportación de PDF de carnets (`IdCards`) usa ahora `jspdf` v4 internamente — verificado que la misma superficie de API produce PDFs válidos, pero no se pudo probar en navegador real por falta de herramientas de automatización de navegador en este entorno (ver CHANGELOG para el detalle de qué sí se verificó).
