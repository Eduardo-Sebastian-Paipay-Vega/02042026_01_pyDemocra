# TEST HISTORY LOG (Auditoría de Resiliencia)

Este documento es una bitácora inalterable (append-only) diseñada bajo la filosofía de "Zero-Fail Tolerance".
Registra cada vulnerabilidad estructural detectada durante la generación masiva de pruebas de estrés (Sad Paths) y su resolución técnica.

## Formato Estándar
- **ID del Caso:** `TST-ERR-[00X]`
- **Componente / API Afectada:** Ruta del archivo fuente.
- **Escenario de Estrés Aplicado:** Condición límite simulada (Ej. inyección, timeout, JWT expirado).
- **Comportamiento Inicial / Excepción:** Log de error arrojado por el sistema.
- **Resolución Técnica e Impacto:** Qué modificación se implementó en la aplicación o el entorno para mitigar la falla de forma definitiva.

---

*(Las entradas se añadirán de manera autónoma conforme se descubran brechas y vulnerabilidades durante la ejecución de las pruebas masivas).*

### Tanda 1: Servicios Clínicos
- **ID del Caso:** `TST-ERR-005`
- **Componente / API Afectada:** `ong/src/app/services/clinico/medicalRecords.service.ts`
- **Escenario de Estrés Aplicado:** Falla de red asíncrona simulando una caída de la infraestructura de Supabase (Error 503) durante una cadena fluida de consultas múltiples con `Promise.all()`.
- **Comportamiento Inicial / Excepción:** El mock inicial no podía simular el fallo, generando `order is not a function`. Si esto llegara crudo desde la DB, la capa de servicios arrojaría una excepción fatal rompiendo la hidratación de estado de React.
- **Resolución Técnica e Impacto:** Se implementó un "Thenable" en la arquitectura de testing que replica exactamente cómo Supabase inyecta errores asíncronos en los query builders. El servicio procesa el error y lanza un `Error(message)` controlado que permite a los componentes UI (React Error Boundaries) interceptar el fallo sin colapsar el DOM.

### Tanda 1: Servicios de Configuración
- **IDs de Caso:** `TST-ERR-006` a `TST-ERR-021`
- **Componentes / APIs Afectadas:** `ong/src/app/services/configuracion/roles.service.ts`, `security.service.ts`, `systemUsers.service.ts`
- **Escenarios de Estrés Aplicados:** Inyección de payloads corruptos o nulos (roleIds y sessionIds vacíos, contraseñas temporales cortas), manipulación de token JWT sin tenant, prevencion de race condition en cierres de sesión concurrentes, asignación de roles o sedes que no existen, vulnerabilidad de auto-revocación (Self-Delete/Self-Revoke Prevention), timeouts y caídas de infraestructura en cadenas `Promise.all()`.
- **Comportamiento Inicial / Excepción:** Errores de sintaxis crudos por `query.order(...).range is not a function`, o `Cannot read properties of undefined` si el query builder caía.
- **Resolución Técnica e Impacto:** Se introdujo una arquitectura de mock de schema estricta que encadena limpiamente los metodos (`select().eq().order().limit()`). Se aplicó la abstracción de "Thenable" a las respuestas Promise.all, lo cual obliga a la capa UI a usar un ErrorBoundary en lugar de tirar al suelo toda la app cuando un nodo Supabase o Edge Function da timeout 503.

### Tanda 1: Servicios de Gobernanza
- **IDs de Caso:** `TST-ERR-022` a `TST-ERR-037`
- **Componentes / APIs Afectadas:** `ong/src/app/services/gobernanza/areas.service.ts`, `audit.service.ts`, `catalogs.service.ts`, `retention.service.ts`, `sensitiveAccess.service.ts`
- **Escenarios de Estrés Aplicados:** Caídas de red (503 Timeout) en Promise.all, tokens expirados, payloads corruptos/inyección SQL en código y CIDR/IP, prevención de escalada de privilegios intentando restaurar datos borrados lógicamente (soft deletes) sin ser Tenant Admin, mutación de restricciones de rol sin permisos, y caídas masivas en bitácoras de auditoría públicas/legacy.
- **Comportamiento Inicial / Excepción:** Las vistas (catalogs, sensitive logs) colapsaban completamente si UNA de las fuentes fallaba (un unhandled promise rejection tiraba todo). Posibles inyecciones de CIDR o fallos al revocar promesas devueltas por `resolveProfileLabels.catch()`.
- **Resolución Técnica e Impacto:** Se implementó resiliencia (Graceful Degradation). Si una fuente de un dashboard (ej. legacy vs public audit logs) falla, se absorbe el error asíncrono devolviendo null o array vacío para que el componente React pinte la tabla y solo acumule el error en el array de `warnings`. Se probó que un fallo en `catch()` se evita mockeando explícitamente `resolveProfileLabels` y verificando que el UI no se quiebre. Se blindó la autorización para que las acciones destructivas y de restauración evalúen `canManageConstraints` o `isTenantAdmin`.

### Tanda 1: Servicios de Notificaciones
- **IDs de Caso:** `TST-ERR-038` a `TST-ERR-046`
- **Componentes / APIs Afectadas:** `ong/src/app/services/notificaciones/create.service.ts`, `history.service.ts`, `templates.service.ts`
- **Escenarios de Estrés Aplicados:** Inputs nulos forzados para violar restricciones DB, fallos 503 en queries secundarios asincronos (ej. resolucion de canales y perfiles dentro del `Promise.all` del history), inyección de un JSON corrupto (String malformado) en las `variablesJson` de plantillas, y canal de notificaciones no existente.
- **Comportamiento Inicial / Excepción:** Un JSON mal formado (`JSON.parse` sin atrapar) hubiese tirado la app (Next.js server action crash); fallos de red en perfiles hacían fallar la carga principal del historial por estar sin un `.catch()` aislado en el `Promise.all`.
- **Resolución Técnica e Impacto:** Se verificó que `parseVariablesJson` está blindado con try-catch devolviendo un Error controlado para la UI. En el history, se mockeó un error en una consulta subsidiaria para validar que se acumula como `warning` sin abortar la data troncal. La inserción rechaza limpiamente las restricciones (como canal no existente) mapeando a errores legibles.

### Tanda 1: Servicios de Proyectos
- **IDs de Caso:** `TST-ERR-081` a `TST-ERR-089`
- **Componentes / APIs Afectadas:** `ong/src/app/services/proyectos/assignments.service.ts`, `projects.service.ts`, `tasks.service.ts`
- **Escenarios de Estrés Aplicados:** Creación de asignaciones sin rol u objetivo válido, proyectos sin fecha o código inválido, edición de tareas con payloads vacíos, y caídas 503 en eliminación lógica (soft delete).
- **Comportamiento Inicial / Excepción:** Operaciones asíncronas crudas hubiesen colapsado con fallos en la DB por violaciones de clave foránea o nulos.
- **Resolución Técnica e Impacto:** Se establecieron bloqueos estrictos en el backend Node (`throw new Error()`) antes de tocar Supabase. Para fallos de red, se aseguran los bloques try-catch que mapean a `toProjectsError(...)` (o su equivalente), garantizando que React reciba un Error estándar capturable.

### Tanda 1: Servicios de Recursos
- **IDs de Caso:** `TST-ERR-090` a `TST-ERR-124`
- **Componentes / APIs Afectadas:** `categoriasFinancieras`, `cuentasFinancieras`, `comprobantesFinancieros`, `inventarioMovimientos`, `items`, `reportesFinancieros`, `transaccionesFinancieras`, `ubicaciones`
- **Escenarios de Estrés Aplicados:** Inyección de montos/cantidades negativas, tipos de transacción inválidos, comprobantes sin metadata, reportes financieros excediendo límites y fallando por timeout de red, ítems o ubicaciones con nombres vacíos, rechazo de egresos sin comentarios, e inactividad forzada de ítems referenciados.
- **Comportamiento Inicial / Excepción:** Un mock incompleto de chains complejos (e.g. `limit(1).eq(...)`) generó colapsos de test por `query.eq is not a function`. Egresos sin comentarios habrían inyectado inconsistencias de estado.
- **Resolución Técnica e Impacto:** Se implementó el patrón *Generic Query Chain Mock* (builder que auto-retorna todos los métodos de Supabase y resuelve con `then()`), permitiendo estresar consultas altamente anidadas sin romper el entorno de tests. Las validaciones de negocio bloquean payloads corruptos (montos <= 0, rechazos sin justificación) y los fallos de DB lanzan la excepción aislada que el UI atrapa vía `toOperationError`.

### Tanda 3: Proveedores de Contexto y Bootstrapping
- **IDs de Caso:** `TST-ERR-200` a `TST-ERR-215`
- **Componentes / APIs Afectadas:** `ong/src/app/tenant/*.ts(x)`
- **Escenarios de Estrés Aplicados:** Inyección de JSON corruptos en `localStorage` (Cache Hydration v2), tenants que no existen o son eliminados mientras el JWT sigue activo, fallas (503) de base de datos durante la resolución de perfiles y rpc de permisos, evaluación de dependencias implícitas en módulos, y resolución prioritaria de rutas seguras.
- **Comportamiento Inicial / Excepción:** Errores de des-serialización (`JSON.parse` fallando con inyecciones del caché) romperían la hidratación reactiva; fallas de red asíncronas podrían tirar toda la web a un 'white screen of death' antes del primer render; usuarios varados si el LastRoute no es accesible.
- **Resolución Técnica e Impacto:** El hidratador en memoria usa lazily inicializadores en `useState` (sin flickers) soportando JSONs corruptos (`try/catch`). Se aplicó degradación suave (*Graceful Degradation*) si falla un RPC para prevenir colapsos. La política financiera se mapeó para que la UI resista fallos de lectura, y el ruteo fallback direcciona a rutas seguras asegurando Zero-Fail Tolerance.

### Tanda 4: Componentes de Interfaz Compartidos
- **IDs de Caso:** `TST-ERR-300` a `TST-ERR-315`
- **Componentes / APIs Afectadas:** `ong/src/app/components/ui/button.tsx`, `modal-shell.tsx`, `DataTable.tsx`
- **Escenarios de Estrés Aplicados:** Inyección de XSS en children y propiedades de columnas (`<script>`, `<img>`), renderizado sin datos o `null` en estructuras iterables como arreglos de tablas y validaciones de accesibilidad (a11y) con atributos crudos perdidos, componentes esqueleto.
- **Comportamiento Inicial / Excepción:** Las tablas (`DataTable.tsx`) colapsaban lanzando un error fatal al calcular `data.length` si el arreglo de datos venía nulo o indefinido. 
- **Resolución Técnica e Impacto:** Se implementó protección directa `if (!data || data.length === 0)` previniendo crasheos por null-pointers en el UI, devolviendo un componente de estado vacío estilizado (`emptyMessage`). Se verificó exhaustivamente que React sanitize por defecto ataques XSS enviados en el árbol virtual como strings escapados y se añadieron selectores `.animate-pulse` robustos para tests de loaders esqueléticos. Se confirmó el estado *Zero-Fail Tolerance* con un pase de pruebas impecable en entorno `jsdom` (Vitest + React Testing Library).

### Tanda 2: React Hooks de Estado y L�gica de UI
- **ID del Caso:** `TST-ERR-300` a `TST-ERR-305`
- **Componentes / APIs Afectadas:** `ong/src/app/modules/people/hooks/useVolunteerMutations.ts`, `ong/src/app/modules/settings/hooks/useSecurityMutations.ts` y hooks de lista (paginaci�n).
- **Escenarios de Estr�s Aplicados:** Llamadas concurrentes as�ncronas simulando un doble clic (race conditions) en mutaciones y fallos de red durante el fetch de estado.
- **Comportamiento Inicial / Excepci�n:** Las promesas de mutaci�n permit�an la ejecuci�n paralela porque el flag useState de \isSaving\ no se actualizaba lo suficientemente r�pido (batching as�ncrono), lo que generaba solicitudes duplicadas en backend.
- **Resoluci�n T�cnica e Impacto:** Se inyectaron useRef para comprobaciones at�micas s�ncronas antes de habilitar el estado de \isSaving\. Esto bloquea instant�neamente cualquier intento de solicitud m�ltiple garantizando la resiliencia Zero-Fail Tolerance. Los fallos de fetch en las listas se capturan actualizando el estado error limpiamente.

 # # #   T a n d a   5 :   P � g i n a s   C o m p l e t a s   y   V i s t a s   I n t e g r a d a s 
 -   * * I D s   d e   C a s o : * *   \ T S T - E R R - 5 0 0 \   a   \ T S T - E R R - 5 3 5 \ 
 -   * * C o m p o n e n t e s   /   A P I s   A f e c t a d a s : * *   \ o n g / s r c / a p p / p a g e s / * . t s x \   ( D a s h b o a r d ,   A c t i v i t i e s ,   A t t e n d a n c e ,   e t c . ) 
 -   * * E s c e n a r i o s   d e   E s t r � s   A p l i c a d o s : * *   S i m u l a c i � n   d e   c a � d a s   d e   h o o k s   d e   c o n t e x t o   ( \ u s e T e n a n t B o o t s t r a p \ ,   \ u s e A u t h \ ) ,   f a l l o s   m a s i v o s   e n   l l a m a d a s   a   s e r v i c i o s   ( P r o m e s a s   r e c h a z a d a s   s i m u l a n d o   5 0 3   T i m e o u t   o   N e t w o r k   F a i l u r e ) ,   e s t a d o s   d e   c a r g a   i n f i n i t o s ,   y   r e n d e r i z a d o   c o n d i c i o n a l   c o n   p e r m i s o s   b l o q u e a d o s . 
 -   * * C o m p o r t a m i e n t o   I n i c i a l   /   E x c e p c i � n : * *   M u c h o s   c o m p o n e n t e s   f a l l a b a n   r u i d o s a m e n t e   s i n   c a p t u r a r   e x c e p c i o n e s   c u a n d o   l o s   s e r v i c i o s   d e   c a r g a   i n i c i a l   f a l l a b a n ,   o   c u a n d o   \ u s e T e n a n t B o o t s t r a p \   s e   e j e c u t a b a   f u e r a   d e   s u   P r o v i d e r ,   g e n e r a n d o   \ U n c a u g h t   E r r o r :   u s e T e n a n t B o o t s t r a p   d e b e   u s a r s e   d e n t r o   d e   T e n a n t B o o t s t r a p P r o v i d e r \   q u e   c o l a p s a b a   e l   D O M   d e   R e a c t . 
 -   * * R e s o l u c i � n   T � c n i c a   e   I m p a c t o : * *   S e   c r e a r o n   p r u e b a s   e x h a u s t i v a s   ( Z e r o - F a i l   T o l e r a n c e )   p a r a   c a d a   c o m p o n e n t e   i n t e g r a n d o   \ E r r o r B o u n d a r y \   p a r a   a s e g u r a r   l a   r e c u p e r a c i � n   d e   f a l l o s   c r � t i c o s .   S e   a i s l a r o n   l a s   a c c i o n e s   d e s t r u c t i v a s   y   s e   s i m u l �   e l   b l o q u e o   d e   r e d .   S e   m o c k e a r o n   l o s   c o n t e x t o s   g l o b a l e s   ( \ T e n a n t B o o t s t r a p P r o v i d e r \ ,   \ A u t h C o n t e x t \ )   p e r m i t i e n d o   p r u e b a s   p u r a s   y   v a l i d a n d o   q u e   l o s   e r r o r e s   d e   r e d   s e   d e g r a d a n   a   a d v e r t e n c i a s   v i s u a l e s   ( \ 	 o a s t . e r r o r \ )   e n   l u g a r   d e   t i r a r   l a   U I .  
 
### TST-ERR-006: Inserci�n Fallida por Constraints NOT NULL (Espacios No Llenados)
*   **Contexto:** Los m�dulos CRUD enviaban campos opcionales o vaciados ("") al cliente de Supabase transformados agresivamente en \
ull\ debido a \sanitizeText() || null\.
*   **Problema:** PostgreSQL rechaza \
ull\ en columnas de texto configuradas como \NOT NULL\, arrojando error 23502. Los mocks est�ticos en los test (v�a \i.mock\) ignoraban esta validaci�n al simular inserciones exitosas (200 OK) ciegamente, causando falsos positivos masivos.
*   **Soluci�n Aplicada (Zero-Fail):**
    1. Se elimin� el patr�n t�xico \|| null\ en todos los servicios (\ong/src/app/services/**/*.ts\), dejando que \sanitizeText\ env�e su \""\ nativo.
    2. Se introdujeron *smart mocks* en todos los archivos \.test.ts\ para \insert\ y \update\. Estos interceptores inspeccionan el payload simulado y, si detectan un \
ull\, emulan proactivamente el c�digo de error Postgres 23502.
*   **Impacto:** Se erradicaron los falsos positivos. Ahora el entorno de desarrollo atrapa "espacios no llenados" al instante si alg�n developer introduce accidentalmente un nulo indebido.

## 2026-07-08 (Creaci�n de ONG)
- **Test:** ong/src/app/pages/landing/create-tenant.test.tsx`n- **Resultado:** PASSED (267 test en total).
- **Contexto:** Se verific� el UI interactivo para la creaci�n de un nuevo tenant con validaci�n de RUC y error handling contra /api/onboarding/bootstrap-tenant.

