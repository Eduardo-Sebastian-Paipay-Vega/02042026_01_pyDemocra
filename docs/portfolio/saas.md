# 🏢 Modelo SaaS Multi-Tenant — Democra

Democra está diseñado desde sus cimientos como una plataforma **SaaS Multi-Tenant** real, donde cada organización no gubernamental obtiene un espacio completamente aislado (tenant).

## 1. Onboarding de Organizaciones

El proceso de registro de una ONG está automatizado y diseñado de forma defensiva para asegurar integridad referencial. 

### Validación Fiscal
El endpoint `/api/onboarding/validate-ruc/:ruc` consulta a la API de SUNAT para verificar la existencia del RUC (11 dígitos). Retorna razón social y estado del contribuyente, evitando el registro de entidades fantasma.

### Bootstrap Idempotente (`fn_bootstrap_tenant`)
Cuando un usuario crea su ONG, la API ejecuta una función almacenada (RPC) en PostgreSQL que realiza las siguientes operaciones en una transacción atómica:

1. Crea el registro en la tabla `tenants`.
2. Crea el usuario administrador en la tabla `profiles`.
3. Crea los roles base en la tabla `roles` (ej. 'Administrador de Sistema').
4. Crea la `sede` matriz de la organización.
5. Asigna el usuario administrador a la sede y rol mediante `user_roles_sedes`.

Esta función es **idempotente**: si el proceso se interrumpe y se reintenta, no duplica registros, asegurando cero inconsistencias durante el alta de clientes.

## 2. Aislamiento de Datos (Tenant Isolation)

Democra no usa el patrón de "un esquema PostgreSQL por tenant", sino el patrón **Pool/Shared Schema** utilizando **Row Level Security (RLS)**.

### Reglas
- TODAS las tablas de negocio incluyen la columna `tenant_id`.
- La función `fn_current_tenant_id()` recupera el tenant del usuario logueado usando el token de autenticación (`auth.uid()`).
- Las políticas de seguridad (RLS) fuerzan que `tenant_id = fn_current_tenant_id()`.

Esto garantiza que incluso si hay un bug o inyección SQL en la capa de la aplicación (API), la base de datos abortará cualquier consulta que intente acceder a datos de otro tenant.

## 3. Jerarquía Interna del Tenant

Dentro de un tenant, existe una arquitectura diseñada para ONG grandes con presencia regional:

- **Sedes**: Una ONG puede operar en Múltiples sedes físicas.
- **RBAC Geolocalizado**: La asignación de permisos no es global, sino vinculada a sedes (tabla `user_roles_sedes`).
  - Ejemplo: Un usuario puede ser 'Coordinador' en la sede Lima, pero solo 'Voluntario' en la sede Cusco.

## 4. Financial State Guard (Protección SaaS Comercial)

El modelo de negocio SaaS implica que los inquilinos tienen planes de facturación (Free, Pro, Enterprise) y estados (Al día, Moroso, Suspendido).

Un middleware especializado (`server/middleware/financial-state.js`) intercepta **todas las peticiones de escritura** (POST, PUT, PATCH, DELETE) a la API:

- Si el tenant está `FIN-SUSPENDED`: Bloquea y responde `403 FIN-001`.
- Si el tenant está `FIN-READONLY` o `FIN-PENDING`: Bloquea y responde `403 FIN-002`.

Las peticiones de lectura (`GET`) siguen funcionando, permitiendo a los usuarios acceder a su historial pero impidiendo el uso activo de la plataforma hasta regularizar su situación, minimizando verificaciones financieras dispersas en el código.

## 5. Módulos Activables

Las ONGs varían enormemente en tamaño y foco (algunas hacen donaciones de inventario, otras apoyo médico).
La aplicación reacciona dinámicamente según la tabla `tenant_modules`. Si el tenant no tiene activo el módulo "Clínico", las rutas del menú, endpoints y accesos a dicho módulo se ocultan y bloquean, logrando una interfaz adaptada a la industria y plan suscrito por el cliente.
