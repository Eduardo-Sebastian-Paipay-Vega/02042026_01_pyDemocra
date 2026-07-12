# SUMMARY — Alcance de la duplicación ong/src vs src/modules/ong

**Qué se hizo:** Se investigó (solo lectura, sin refactor) el alcance real de la divergencia entre `ong/src/app/` (SPA standalone en `/ong`) y `src/modules/ong/app/` (copia embebida del shell multi-industria en `/`), identificada como hallazgo en la Fase 1 de esta sesión.

**Por qué se hizo:** El usuario confirmó que la arquitectura multi-industria es intencional, pero pidió entender el alcance real antes de decidir si/cómo unificar, sin dañar el proyecto.

**Qué se encontró:**
- De 289 archivos que existen en ambas copias con la misma ruta, **135 (47%) ya divergieron** en contenido.
- De esos 135: solo **3 son adaptadores delgados intencionales** (re-exportan desde una capa ya compartida en `src/core/tenant/`) — el patrón correcto, ya aplicado parcialmente. Los otros **132 son duplicados genuinos** con contenido real distinto (confirmado con ejemplos concretos: nombres de campos de base de datos diferentes entre copias para la misma entidad).
- `ong/src` tiene 109 archivos que `src/modules/ong` no tiene en absoluto — incluyendo **todo el sistema de credenciales PDF** y **el 100% de los archivos de test** (los tests nuevos de la Fase 3 de esta sesión no protegen la copia embebida).
- `src/modules/ong` tiene solo 3 archivos propios que `ong/src` no tiene (hooks de notificaciones en tiempo real, login).

**Qué beneficio aporta:** Un mapa preciso y accionable para decidir el camino de unificación en una futura sesión dedicada, con 3 opciones concretas documentadas (extender el patrón de shim ya probado, formalizar como productos distintos, o retirar una de las dos copias) — la decisión requiere input de producto/negocio que no corresponde tomar unilateralmente.

**Qué funcionalidades quedaron afectadas:** Ninguna — es un documento de investigación, cero cambios de código.
