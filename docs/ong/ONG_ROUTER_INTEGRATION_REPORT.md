# Integración de rutas ONG

## Contexto encontrado en la auditoría

El supuesto del encargo (`src/modules/ong/app/routes.tsx` existe o no existe) no aplicaba: ya existía un sistema de rutas completo y más sofisticado, fuera de `src/modules/ong/`:

- **`src/industries/ong/registry.tsx`** — `ongModuleDefinitions`: 34 rutas ya mapeadas a `/app/ong/*` y `/app/settings/*`, cada una con `path`, `legacyPath`, ícono, `anyPermissions` y `element` ya apuntando a los componentes de página reales.
- **`src/core/tenant/`** (`moduleRegistry.tsx`, `navigation.ts`, `access.ts`, `industryRegistry.tsx`) — aplana el registry, arma el sidebar, resuelve permisos y define la industria "ong" (`basePath: /app/ong`, `shell: OngShell`).
- **`src/industries/ong/OngShell.tsx`** → **`src/core/shell/BaseTenantShell.tsx`** — shell ya construido (Sidebar + Topbar + `<Outlet/>`, atajos de teclado, command palette).
- **`TenantBootstrapProvider`** (`src/modules/ong/app/tenant/TenantBootstrapProvider.tsx`) — provee el contexto de tenant/auth que el shell consume.

Crear un `routes.tsx` nuevo habría duplicado este registry. Se confirmó con el usuario usar la infraestructura existente en su lugar (ver conversación).

## Cambios realizados

- **Archivos modificados:**
  - `src/App.tsx` — reescrito para montar `/app/login` (con el `LoginPage` de `src/modules/ong/app/pages/landing/`) y `/app/ong/*` + `/app/settings/*` (rutas generadas desde `listTenantRoutes("ong")`, montadas bajo una ruta de layout sin `path` cuyo `Component` envuelve `TenantBootstrapProvider` + `OngShell`). Se agregaron redirects `/app` y `/app/ong` → `/app/ong/home`.
  - `src/core/shell/BaseTenantShell.tsx` — corrección de un bug preexistente no relacionado con el routing: 3 referencias a `var(--t-glow-purple)`/`var(--t-glow-orange)` (tokens eliminados en la tarea de Look & Feel anterior porque mi búsqueda de entonces no cubría `src/core/`) reemplazadas por valores fijos en azul/teal; también se actualizó un vignette hardcodeado `rgba(6,6,8,...)` (fondo oscuro anterior) a `rgba(16,14,12,...)` (fondo oscuro actual). Aprobado explícitamente por el usuario antes de tocarlo.
- **Estrategia:** ninguna (Opción A ni B tal como estaban planteadas) — se reutilizó el registry existente (`src/industries/ong/registry.tsx` + `src/core/tenant/`) sin duplicar código.
- **Rutas expuestas:** `/app/ong/*` y `/app/settings/*` (34 rutas del registry) + `/app/login`.
- **No se modificó** ningún archivo bajo `src/modules/ong/app/pages/`, `app/tenant/`, ni `app/services/`.

## Verificación

- [x] `npm run dev`: OK — API (8787), app raíz (5173) y ONG standalone (5174) levantan sin errores.
- [x] `npm run validate`: OK — 8/8 checks.
- [x] `npm run build`: OK — 2974 módulos transformados (subió de 2070 porque el módulo ONG ahora es alcanzable y se incluye en el bundle), sin errores.
- [x] `tsc --noEmit`: mismos 37 errores preexistentes, en los mismos 7 archivos, que ya estaban antes de esta tarea (no introducidos por el routing).
- [x] Navegación en navegador: OK (verificado con Playwright headless — capturas + monitoreo de errores de consola/runtime, no solo códigos HTTP).

## Pantallas verificadas visualmente

- [x] Dashboard (`/app/ong/home`) — sin errores de render; KPIs, gradiente azul→teal en botón "Nueva actividad", fondo oscuro cálido.
- [x] Beneficiarios (`/app/ong/people/beneficiaries`) — sin errores de render; botón "Nuevo beneficiario" y chip de filtro activo en azul.
- [x] Voluntarios (`/app/ong/people/volunteers`) — sin errores de render; mismos patrones de color.
- [x] Login (`/app/login`) — sin errores de render; título "Voluntario" y botón "Ingresar" en azul→teal, resplandores ambientales azul/teal visibles.
- [x] Finanzas (`/app/ong/resources/finance`) — sin errores de **render**; sí hay errores de **datos** esperados (401 / "permission denied for schema finanzas" por falta de sesión autenticada) — exactamente el tipo de error fuera de alcance que anticipaba el encargo.

Ninguna de las 5 pantallas produjo un `pageerror` (excepción de React) ni un error de consola distinto a los 401 de datos.

## Look & Feel observable

Confirmado visualmente en las 5 capturas:
- **Colores:** acento azul (`#3D6BFF`/`#002EFE`) consistente en botones, chips activos, enlaces y estado de navegación — cero morado en ninguna pantalla.
- **Gradiente de marca:** azul→teal (antes naranja→morado→morado oscuro) en los botones principales ("Nueva actividad", "Ingresar", "Nuevo beneficiario", "Nueva cuenta").
- **Tipografía:** Inter en todo el texto visible.
- **Fondo:** oscuro cálido (no negro absoluto), consistente entre el shell y las páginas.
- **Paleta semántica:** visible parcialmente en esta pasada (badges de filtro, banners de error genéricos); una verificación exhaustiva de éxito/advertencia/error/info página por página queda pendiente para una revisión dedicada.

## Pendientes

- El resplandor ambiental del shell (`BaseTenantShell.tsx`) ya no varía según el selector de intensidad (suave/normal/vibrante) — se fijó a un valor constante al re-hueear, en vez de reintroducir tokens de intensidad para el resplandor. Cambio menor, sin impacto funcional, pero distinto del comportamiento original en ese aspecto puntual.
- No se implementaron los redirects de `legacyPath` (`/admin/*`) que expone `listTenantRedirects()` en `src/core/tenant/navigation.ts` — no se pidieron en el alcance de esta tarea y no eran necesarios para cumplir los criterios de verificación solicitados.
- Como se anticipó en el encargo: hay errores de datos (401, "permission denied") en pantallas que consultan Supabase, porque no hay sesión autenticada en este entorno de prueba. Esto es contenido y esperado, no un defecto de la integración de rutas.
