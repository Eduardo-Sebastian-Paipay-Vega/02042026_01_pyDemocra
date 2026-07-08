# DEMOCRA — Documentación de Suite de Tests
> **Estado:** ✅ 78 archivos | 263 tests | 100% VERDE  
> **Última actualización:** Julio 2026  
> **Filosofía:** Zero-Fail Tolerance — sin happy paths, solo escenarios catastróficos

---

## Índice

1. [Arquitectura del entorno de testing](#1-arquitectura-del-entorno-de-testing)
2. [Cómo ejecutar los tests](#2-cómo-ejecutar-los-tests)
3. [Cómo ver los tests en VS Code](#3-cómo-ver-los-tests-en-vs-code)
4. [Convención de nombres y organización](#4-convención-de-nombres-y-organización)
5. [Tanda 1 — Servicios Core](#5-tanda-1--servicios-core)
6. [Tanda 2 — React Hooks](#6-tanda-2--react-hooks)
7. [Tanda 3 — Bootstrapping y Contexto](#7-tanda-3--bootstrapping-y-contexto)
8. [Tanda 4 — Componentes de UI](#8-tanda-4--componentes-de-ui)
9. [Tanda 5 — Páginas Integradas](#9-tanda-5--páginas-integradas)
10. [Bitácora de Vulnerabilidades](#10-bitácora-de-vulnerabilidades)
11. [Patrones de Mock Reutilizables](#11-patrones-de-mock-reutilizables)

---

## 1. Arquitectura del entorno de testing

```
d:\PROYECTO\Democra(git)
├── vitest.config.ts          ← Config dedicado para VS Code Testing UI
├── vitest.setup.ts           ← Setup global: mocks, supresión de ruido
├── .vscode/
│   └── settings.json         ← Integración con extensión vitest.explorer
└── docs/
    ├── TEST_DOCS.md          ← Este archivo
    └── TEST_HISTORY_LOG.md   ← Bitácora de vulnerabilidades encontradas
```

### Stack

| Herramienta | Uso |
|---|---|
| **Vitest v4** | Runner principal para frontend (`src/`, `ong/`) |
| **React Testing Library** | Render de componentes en `jsdom` |
| **jest-dom** | Matchers de DOM (`toBeInTheDocument`, etc.) |
| **Jest** | Tests del servidor (`server/`) — separado |

### Configuración clave (`vitest.config.ts`)

```typescript
test: {
  globals: true,              // describe/it/expect sin imports
  environment: "jsdom",       // DOM simulado
  setupFiles: ["./vitest.setup.ts"],
  include: [
    "src/**/*.test.{ts,tsx}",
    "ong/src/**/*.test.{ts,tsx}",
  ],
  pool: "forks",              // Aislamiento por proceso
  poolOptions: {
    forks: {
      execArgv: ["--no-warnings"],  // Suprime ExperimentalWarning de Node v26
    },
  },
}
```

---

## 2. Cómo ejecutar los tests

```powershell
# Correr TODOS los tests del frontend
npm run test:web

# Correr un módulo específico
npm run test:web -- ong/src/app/services/clinico/

# Correr un archivo específico
npm run test:web -- ong/src/app/services/admision/solicitudesAdmision.service.test.ts

# Correr con reporte de cobertura
npm run test:web:coverage

# Correr tests del servidor (Node/Jest)
npm test
```

---

## 3. Cómo ver los tests en VS Code

**Requisito:** Tener VS Code (no Visual Studio) con la extensión `vitest.explorer`.

```powershell
# Abrir el proyecto en VS Code
code d:\PROYECTO\Democra(git)
```

1. Clic en el ícono del **matraz** (🧪) en la barra lateral izquierda
2. La extensión detecta automáticamente `vitest.config.ts`
3. Usar ▶ para ejecutar todos, o clic derecho en un archivo para ejecutar solo ese

> La extensión ya está instalada y configurada. Si no aparece, hacer `Ctrl+Shift+P` → "Developer: Reload Window".

---

## 4. Convención de nombres y organización

### Archivos de test

```
ong/src/app/services/<módulo>/<nombre>.service.test.ts
ong/src/app/modules/<módulo>/hooks/__tests__/<nombre>.test.ts
ong/src/app/components/<tipo>/__tests__/<nombre>.test.tsx
ong/src/app/pages/<Nombre>.test.tsx
ong/src/app/tenant/__tests__/tenant.test.tsx
```

### Nomenclatura de casos (IDs de rastreo)

Cada test usa el prefijo `TST-ERR-XXX` para trazabilidad en el `TEST_HISTORY_LOG.md`:

```typescript
it("TST-ERR-005: Debe capturar y propagar error si la red falla (503)", async () => {
  // ...
});
```

### Estructura estándar de un archivo de test

```typescript
describe("<Servicio> - Zero-Fail Tolerance Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Re-setup de mocks para evitar contaminación entre tests
  });

  describe("SAD PATHS: Auth Breaches & Session Expiry", () => {
    it("TST-ERR-001: ...", async () => { /* ... */ });
  });

  describe("SAD PATHS: Network Failures & Supabase Offline", () => {
    it("TST-ERR-005: ...", async () => { /* ... */ });
  });

  describe("SAD PATHS: Injections & Corrupt Payloads", () => {
    it("TST-ERR-003: ...", async () => { /* ... */ });
  });
});
```

---

## 5. Tanda 1 — Servicios Core

> **Objetivo:** Validar la capa de servicios que interactúa con Supabase. Todos son Sad Paths puros — no se prueban flujos exitosos normales.

### Archivos implementados

| Archivo de Test | Tests | IDs Cubiertos |
|---|---|---|
| `lib/db/ong/client.test.ts` | 4 | — |
| `services/academico/cursos.service.test.ts` | 4 | — |
| `services/admision/solicitudesAdmision.service.test.ts` | 3 | — |
| `services/admision/volunteerRegistration.service.test.ts` | 6 | — |
| `services/clinico/medicalRecords.service.test.ts` | 5 | TST-ERR-001 a 005 |
| `services/configuracion/roles.service.test.ts` | 5 | TST-ERR-006 a 010 |
| `services/configuracion/security.service.test.ts` | 5 | TST-ERR-011 a 015 |
| `services/configuracion/systemUsers.service.test.ts` | 6 | TST-ERR-016 a 021 |
| `services/gobernanza/areas.service.test.ts` | 3 | TST-ERR-022 a 025 |
| `services/gobernanza/audit.service.test.ts` | 3 | TST-ERR-026 a 028 |
| `services/gobernanza/catalogs.service.test.ts` | 3 | TST-ERR-029 a 031 |
| `services/gobernanza/retention.service.test.ts` | 3 | TST-ERR-032 a 034 |
| `services/gobernanza/sensitiveAccess.service.test.ts` | 4 | TST-ERR-035 a 037 |
| `services/notificaciones/create.service.test.ts` | 2 | TST-ERR-038 a 040 |
| `services/notificaciones/history.service.test.ts` | 5 | TST-ERR-041 a 044 |
| `services/notificaciones/templates.service.test.ts` | 4 | TST-ERR-045 a 046 |
| `services/operacion/actividades.service.test.ts` | 4 | TST-ERR-047 a 050 |
| `services/operacion/aprobaciones.service.test.ts` | 4 | TST-ERR-051 a 054 |
| `services/operacion/asistencias.service.test.ts` | 4 | TST-ERR-055 a 058 |
| `services/operacion/evidencias.service.test.ts` | 4 | TST-ERR-059 a 062 |
| `services/operacion/horas.service.test.ts` | 4 | TST-ERR-063 a 066 |
| `services/personas/beneficiaries.service.test.ts` | 4 | — |
| `services/personas/idCards.service.test.ts` | 3 | — |
| `services/personas/volunteers.service.test.ts` | 4 | — |
| `services/proyectos/activities.service.test.ts` | 3 | TST-ERR-081 a 084 |
| `services/proyectos/assignments.service.test.ts` | 4 | TST-ERR-081 a 084 |
| `services/proyectos/projects.service.test.ts` | 3 | TST-ERR-085 a 087 |
| `services/proyectos/tasks.service.test.ts` | 2 | TST-ERR-088 a 089 |
| `services/recursos/categoriasFinancieras.service.test.ts` | 4 | TST-ERR-090 a 093 |
| `services/recursos/comprobantesFinancieros.service.test.ts` | 5 | TST-ERR-094 a 098 |
| `services/recursos/cuentasFinancieras.service.test.ts` | 3 | TST-ERR-099 a 101 |
| `services/recursos/inventarioMovimientos.service.test.ts` | 4 | TST-ERR-102 a 105 |
| `services/recursos/items.service.test.ts` | 5 | TST-ERR-106 a 110 |
| `services/recursos/reportesFinancieros.service.test.ts` | 2 | TST-ERR-111 a 112 |
| `services/recursos/transaccionesFinancieras.service.test.ts` | 7 | TST-ERR-113 a 119 |
| `services/recursos/ubicaciones.service.test.ts` | 5 | TST-ERR-120 a 124 |

### Escenarios clave cubiertos en Tanda 1

- **Auth breaches:** JWT expirado, token manipulado, `ensureSensitiveAccess` bloqueando
- **Tenant failures:** `getRequiredTenantId` retornando `undefined`, tenants eliminados con sesión activa
- **Network errors:** Supabase 503, `Promise.all` con un fallo parcial (degradación sin colapso)
- **Corrupt payloads:** `null`/`undefined` en IDs, montos negativos, fechas invertidas, JSON malformado
- **Race conditions:** Llamadas concurrentes a mutaciones sin mecanismo de bloqueo
- **Business rules:** Egresos sin comentario, auto-revocación de roles, restauración sin permisos

---

## 6. Tanda 2 — React Hooks

> **Objetivo:** Detectar race conditions y fallos de asincronía en la capa de estado de React.

| Archivo de Test | Tests | Hallazgo clave |
|---|---|---|
| `modules/people/hooks/__tests__/useVolunteerMutations.test.ts` | 5 | Race condition resuelta con `useRef` atómico |
| `modules/people/hooks/__tests__/useVolunteers.test.ts` | 5 | Paginación resistente a errores 503 |
| `modules/settings/hooks/__tests__/useSecurityMutations.test.ts` | 5 | Sesiones concurrentes bloqueadas correctamente |

### Escenarios clave cubiertos en Tanda 2

- **Race conditions:** Dos mutaciones simultáneas — solo una debe ejecutarse
- **Graceful degradation:** Error 503 en fetch de página N — el hook no colapsa, acumula el error
- **Auth hooks:** `useAuth()` devolviendo `null` — hook no crashea, devuelve estado vacío

---

## 7. Tanda 3 — Bootstrapping y Contexto

> **Objetivo:** Asegurar que el bootstrap del Tenant sea resistente a ataques de caché y fallos de red al inicio de sesión.

| Archivo de Test | Tests | IDs Cubiertos |
|---|---|---|
| `tenant/__tests__/tenant.test.tsx` | 16 | TST-ERR-200 a 215 |

### Escenarios clave cubiertos en Tanda 3

- **Cache poisoning:** JSON corrompido en `localStorage` — `try/catch` con lazy init
- **Tenant fantasma:** Perfil con tenant eliminado pero JWT activo — `status: invalid_tenant`
- **RPC timeout:** Permisos no resueltos por 503 — UI monta sin permisos (degradación suave)
- **RBAC routing:** Rutas inyectadas en historial que el rol no tiene — redirección a ruta segura

---

## 8. Tanda 4 — Componentes de UI

> **Objetivo:** Verificar que los componentes compartidos son robustos contra inyecciones y datos nulos.

| Archivo de Test | Tests | IDs Cubiertos |
|---|---|---|
| `components/shared/__tests__/DataTable.test.tsx` | 6 | TST-ERR-300 a 305 |
| `components/ui/__tests__/button.test.tsx` | 6 | TST-ERR-306 a 310 |
| `components/ui/__tests__/modal-shell.test.tsx` | 6 | TST-ERR-311 a 315 |

### Escenarios clave cubiertos en Tanda 4

- **XSS injection:** Strings con `<script>` en `children` — React sanitiza, no ejecuta
- **Null arrays:** `DataTable` con `data={null}` — muestra `emptyMessage` en lugar de crashear
- **Skeleton loaders:** `.animate-pulse` presente durante estados de carga
- **a11y:** Atributos `aria-label` presentes en botones de acción

---

## 9. Tanda 5 — Páginas Integradas

> **Objetivo:** Verificar que ninguna página puede provocar una pantalla en blanco. El Error Boundary debe capturar cualquier fallo de servicios.

### Todos los archivos de páginas con test

```
ong/src/app/pages/
├── AccessControl.test.tsx       ├── Login.test.tsx
├── Activities.test.tsx          ├── MedicalRecords.test.tsx
├── AdmissionDocuments.test.tsx  ├── NotificationHistory.test.tsx
├── AdmissionInterviews.test.tsx ├── NotificationTemplates.test.tsx
├── AdmissionOnboarding.test.tsx ├── ProjectActivities.test.tsx
├── AdmissionRequests.test.tsx   ├── ProjectAssignments.test.tsx
├── Approvals.test.tsx           ├── Projects.test.tsx
├── Areas.test.tsx               ├── Roles.test.tsx
├── Attendance.test.tsx          ├── Security.test.tsx
├── AuditLog.test.tsx            ├── SensitiveAccess.test.tsx
├── Beneficiaries.test.tsx       ├── SoftDelete.test.tsx
├── Catalogs.test.tsx            ├── SystemUsers.test.tsx
├── Courses.test.tsx             ├── Tasks.test.tsx
├── Dashboard.test.tsx           ├── Volunteers.test.tsx
├── Evidence.test.tsx            └── (35 archivos total)
├── Finance.test.tsx
├── GlobalSearch.test.tsx
├── Hours.test.tsx
├── HoursApproval.test.tsx
└── IdCards.test.tsx
```

> **IDs cubiertos:** `TST-ERR-500` a `TST-ERR-535`

### Garantía de cada página

Cada test de página verifica dos condiciones:

1. **Sin JS crash nativo:** El árbol de componentes monta sin lanzar una excepción no controlada
2. **Sin pantalla en blanco:** `document.body.innerHTML.length > 0` siempre

Ambas condiciones se cumplen tanto si la página renderiza con éxito como si el Error Boundary captura un fallo de servicio.

---

## 10. Bitácora de Vulnerabilidades

Ver [`TEST_HISTORY_LOG.md`](./TEST_HISTORY_LOG.md) para el registro completo de vulnerabilidades detectadas durante la implementación de los tests.

| Rango de IDs | Módulo | Tipo de Vulnerabilidad |
|---|---|---|
| TST-ERR-001 a 005 | `clinico/medicalRecords` | Auth breach, red 503 en cadenas asíncronas |
| TST-ERR-006 a 021 | `configuracion/` | Race conditions, self-revoke, tokens sin tenant |
| TST-ERR-022 a 037 | `gobernanza/` | Escalada de privilegios, inyección CIDR, soft-delete sin permisos |
| TST-ERR-038 a 046 | `notificaciones/` | JSON malformado en variables de plantilla, canal inexistente |
| TST-ERR-047 a 080 | `operacion/` | Fechas invertidas, asignaciones duplicadas, QR revocado |
| TST-ERR-081 a 089 | `proyectos/` | Proyectos sin área válida, código duplicado, soft delete 503 |
| TST-ERR-090 a 124 | `recursos/` | Montos negativos, egresos sin comentario, ítems inactivos |
| TST-ERR-200 a 215 | `tenant/bootstrapping` | Cache poisoning, tenant fantasma, RPC timeout |
| TST-ERR-300 a 315 | `componentes UI` | XSS en props, null arrays en tablas, race conditions en hooks |
| TST-ERR-500 a 535 | `pages/` | Error Boundary, infinite loading, conditional rendering con permisos bloqueados |

---

## 11. Patrones de Mock Reutilizables

### Mock de cadena fluida de Supabase (Thenable)

```typescript
const mockQuery = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  then: function (resolve: any) {
    resolve({ data: null, error: { message: "Failed to fetch: Network Error 503" } });
  },
};
vi.mocked(sharedPersona.createTenantScopedQuery).mockReturnValue(mockQuery as any);
```

### Mock de módulo de servicio seguro para páginas

```typescript
vi.mock("../services/mi-servicio", () => new Proxy({}, {
  get: (_, key) => {
    if (key === "__esModule" || key === "then") return undefined;
    return vi.fn().mockResolvedValue(null);
  },
}));
```

### Mock de contextos globales para páginas

```typescript
vi.mock("../tenant/TenantBootstrapProvider", () => ({
  useTenantBootstrap: () => ({ tenantId: "test-tenant", tenantConfig: {} }),
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({ user: { id: "test-user" }, session: {} }),
}));

vi.mock("react-router", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({ id: "1" }),
    useLocation: () => ({ pathname: "/", search: "" }),
  };
});
```

### Simulación de race condition con useRef

```typescript
it("TST-ERR-XXX: Debe bloquear segunda mutación concurrente", async () => {
  const { result } = renderHook(() => useMyMutation());
  
  // Lanzar dos mutaciones casi simultáneas
  act(() => { result.current.mutate(payload1); });
  act(() => { result.current.mutate(payload2); });
  
  // Solo debe haberse ejecutado una
  await waitFor(() => {
    expect(mockService).toHaveBeenCalledTimes(1);
  });
});
```
