# DEMOCRA - TEST MASTER PLAN (Frontend)
**Objetivo:** Alcanzar una cobertura masiva (>90%) en el frontend (`src/` y `ong/`) mediante la implementación de ~200 escenarios de pruebas unitarias y de integración.

## Arquitectura de Testing Propuesta
Dado que el frontend utiliza Vite, se configurará **Vitest** + **React Testing Library** para asegurar compatibilidad nativa con ESM y alias (`@ong/*`), separando este entorno del Jest actual (`server/`).

---

## TANDA 1: Servicios Core y Helpers (Lógica de Negocio Pura)
*Objetivo: Validar integración con Supabase, priorizando Tolerancia Cero a Fallos (Sad Paths, Inyecciones, Timeouts, Auth Breaches).*

**`ong/src/lib/db/ong/` (Core Supabase)**
1. `client.ts`: `ongClient` instanciado con `SHARED_AUTH_STORAGE_KEY`. Simular tokens corruptos.
2. `client.ts`: `fetchOngVolunteersPreview` - Casos límite: payloads maliciosos y caídas 503.
3. `client.ts`: `fetchOngVolunteerStates` - Retorno vacío y errores asíncronos.

**`ong/src/app/services/academico/`**
4. `cursos.service.ts`: `fetchCursos`, `createCurso`, `updateCurso`.

**`ong/src/app/services/admision/`**
5. `solicitudesAdmision.service.ts`: Flujos de aprobación y rechazo de solicitudes.
6. `volunteerRegistration.service.ts`: Registro público de voluntarios.
7. `form-adapters.ts`: Transformación de datos del formulario a la DB.

**`ong/src/app/services/clinico/`**
8. `medicalRecords.service.ts`: `getFichaMedica`, actualización de alergias/condiciones.
9. `medicalAudit.service.ts`: Registro de accesos sensibles a fichas médicas.
10. `form-adapters.ts`: Adaptación de datos clínicos.

**`ong/src/app/services/configuracion/`**
11. `roles.service.ts`: CRUD de roles y permisos.
12. `security.service.ts`: Validaciones de sesión y políticas de acceso.
13. `systemUsers.service.ts`: Manejo de usuarios del sistema y asignación de sedes.

**`ong/src/app/services/gobernanza/`**
14. `audit.service.ts`: Registro inmutable de logs de auditoría.
15. `sensitiveAccess.service.ts`: Manejo de "Break Glass" o accesos de emergencia.
16. `catalogs.service.ts`: Obtención de catálogos cacheados (estados, tipos).
17. `retention.service.ts`: Políticas de borrado lógico vs físico.

**`ong/src/app/services/notificaciones/`**
18. `create.service.ts`: Encolamiento de notificaciones in-app y email.
19. `history.service.ts`: Paginación del historial de notificaciones del usuario.
20. `templates.service.ts`: Renderizado de plantillas de notificación con variables.

**`ong/src/app/services/operacion/`**
21. `actividades.service.ts`: Creación y control de cupos de actividades.
22. `aprobaciones.service.ts`: Flujo multi-nivel de aprobación de horas.
23. `asignacionesActividad.service.ts`: Inscripción y des-inscripción de voluntarios.
24. `asistencias.service.ts`: Escaneo de QR / marcado manual de asistencia.
25. `evidencias.service.ts`: Subida y validación de URLs de evidencia (Storage).
26. `horas.service.ts`: Cálculo y sumatoria de horas por periodo.

**`ong/src/app/services/personas/`**
27. `beneficiaries.service.ts`: CRUD y vinculación a programas.
28. `volunteers.service.ts`: Perfiles, cambio de estado (activo/inactivo).
29. `idCards.service.ts`: Generación de credenciales digitales.

**`ong/src/app/services/proyectos/`**
30. `projects.service.ts`: Ciclo de vida del proyecto (Draft -> Active -> Completed).
31. `tasks.service.ts`: Tablero Kanban (To Do -> In Progress -> Done).

**`ong/src/app/services/recursos/`**
32. `inventarioMovimientos.service.ts`: Entradas, salidas y mermas (stock dinámico).
33. `transaccionesFinancieras.service.ts`: Ingresos y egresos, validación de balance.
34. `reportesFinancieros.service.ts`: Agrupación por categoría mensual.

**`ong/src/app/utils/`**
35. `generateCode.ts`: Funciones generadoras de códigos alfanuméricos únicos.

---

## TANDA 2: Hooks de Estado y Lógica de UI (React Hooks)
*Objetivo: Validar reglas de negocio que dependen del ciclo de vida de React (useQuery, useEffect, estados complejos).*

36-50. Hooks de autenticación (`useAuth`), membresías (`useMemberships`), accesos directos (`useAccessLinks`).
51-65. Hooks de formularios (Zod validaciones, envío, estados de carga).
66-80. Hooks de debouncing (`useDebouncedValue`), paginación y filtrado.

---

## TANDA 3: Proveedores de Contexto y Shell (Bootstrapping)
*Objetivo: Asegurar la correcta inicialización del Tenant, hidratación de caché y protección de rutas.*

81-85. `ong/src/app/tenant/bootstrap.ts`: Lógica de resolución de tenant, caché v2, etc.
86-90. `ong/src/app/tenant/TenantBootstrapProvider.tsx`: Montaje de contexto y sync multi-pestaña.
91-95. `ong/src/app/tenant/permissions.ts`: Funciones de comprobación de RBAC (`hasPermission`).
96-100. `ong/src/app/tenant/navigation.tsx`: Resolución de la primera ruta según permisos.

---

## TANDA 4: Componentes de Interfaz Compartidos (UI Library)
*Objetivo: Asegurar que los componentes "tontos" rendericen correctamente, apliquen variantes y manejen accesibilidad (a11y).*

101-130. Botones, Inputs, Modales (Dialogs), Tablas genéricas, Badges, Indicadores de estado.
131-150. Layouts (AppShell, PageHeader, FilterBar).

---

## TANDA 5: Páginas Completas y Vistas (Integración Frontend)
*Objetivo: Asegurar que las páginas ensamblan correctamente los componentes, llaman a los hooks y muestran los datos/errores adecuados.*

151-160. Login, Landing, AccessCodeRedeemPage, VolunteerRegistrationPage.
161-180. Dashboard (Métricas y Gráficos), ProjectsWorkspace.
181-200. Tablas complejas: Voluntarios, Beneficiarios, Finanzas, Inventario, Roles.

---

**NOTA:** Cada archivo `.test.ts(x)` incluirá configuración de mocks aislados (ej. `vi.mock('../../supabaseClient')`) para asegurar que el frontend no dependa de una base de datos real durante CI/CD.
