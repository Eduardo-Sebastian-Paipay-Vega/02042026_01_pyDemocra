# Documentación de la API Interna — Democra (v1.0.0)

Este documento detalla el estado actual de la API interna de Democra, la especificación de OpenAPI (OAS 3.0) y la ejecución del servidor de documentación a partir de los routers reales definidos en el código.

---

## Ejecución del Proceso y Consola

A continuación se muestra la salida obtenida en la terminal al inicializar el servidor de desarrollo y de documentación de la API:

```bash
PS D:\espelo> npm run docs

> vanilla-migrated@1.0.0 docs
> node server/index.js

[api] AI Security Copilot escuchando en http://localhost:8787
[api] Documentacion (Swagger UI): http://localhost:8787/api/docs
PS D:\espelo> 

```

---

## Información General de la API

* **Nombre del Sistema:** Democra — API interna (`server/`)
* **Versión de la API:** `1.0.0`
* **Especificación:** OpenAPI Specification (OAS) 3.0
* **Archivo de Entrada Principal:** `server/index.js`
* **Origen de Datos:** Routers reales en `server/routes/*.js`

> **Nota de Sincronización:** Este documento describe la estructura base extraída directamente del código fuente de la aplicación. Debe mantenerse actualizado ante cualquier adición, modificación o eliminación de endpoints en la ruta de desarrollo (`server/routes/`).

---

## Servidores y URL de Acceso

| Entorno | URL Base | Descripción |
| --- | --- | --- |
| **Desarrollo Local** | `http://localhost:8787/api` | Servidor de desarrollo definido en `server/index.js` (Puerto por defecto en `config.js`) |
| **Documentación interactiva** | `http://localhost:8787/api/docs` | Swagger UI interactivo generado automáticamente |

---

## Seguridad y Autenticación

* **Esquema de Autenticación Global:** Bearer Token (`JWT` de Supabase Auth).
* **Obligatoriedad:** Todos los endpoints requieren que se proporcione un Bearer token válido en la cabecera `Authorization` de la petición, con las siguientes **excepciones explícitas**:
* `terminal-login`
* `validate-ruc`



---

## Catálogo de Endpoints por Módulo

### 1. Módulo `auth` (Autenticación y Seguridad de Acceso)

* **Descripción:** Autenticación de usuarios, evaluación de riesgo del login, procesos de Step-Up OTP y mecanismo de acceso mediante terminal (PIN).

*(No se listan endpoints específicos bajo este tag en la salida provista, pero el módulo se encarga del flujo de Login y Step-Up).*

---

### 2. Módulo `audit` (Auditoría Forense)

* **Descripción:** Procesamiento de logs de auditoría, generación de resúmenes asistidos por Inteligencia Artificial y análisis de métricas de seguridad a nivel de Tenant.

| Método | Endpoint | Descripción |
| --- | --- | --- |
| **POST** | `/audit/summary` | Genera un resumen forense asistido por IA de un evento de auditoría en particular. |
| **GET** | `/audit/metrics` | Obtiene las métricas de seguridad consolidadas del Tenant correspondientes a los últimos 7 días. |

---

### 3. Módulo `iam` (Gestión de Identidad y Accesos)

* **Descripción:** Control y administración de roles, permisos y la relación usuario-rol-sede para el Tenant actual.
* **Control Financiero de Escritura:** Todas las operaciones de escritura (**POST**, **PUT**, **DELETE**) son interceptadas por el middleware `requireFinancialWriteAccess()` (`server/middleware/financial-state.js`).
* **Posibles Errores Globales:**
* `403 Forbidden` (Código: `FIN-001`): Tenant suspendido.
* `403 Forbidden` (Código: `FIN-002`): Tenant configurado en modo solo lectura.





#### Gestión de Roles y Permisos

| Método | Endpoint | Descripción |
| --- | --- | --- |
| **GET** | `/iam/roles` | Lista todos los roles existentes en el Tenant actual. |
| **POST** | `/iam/roles` | Crea un nuevo rol dentro del Tenant actual. *(Requiere acceso de escritura financiero)*. |
| **PUT** | `/iam/roles/{roleId}` | Modifica las propiedades de un rol existente. *(Requiere acceso de escritura financiero)*. |
| **DELETE** | `/iam/roles/{roleId}` | Elimina un rol creado (excluye roles del sistema predefinidos). *(Requiere acceso de escritura financiero)*. |
| **GET** | `/iam/roles/{roleId}/permissions` | Retorna el listado de permisos asignados a un rol específico. |
| **POST** | `/iam/roles/{roleId}/permissions` | Asigna un nuevo permiso a un rol especificado por su `roleId`. *(Requiere acceso de escritura financiero)*. |
| **DELETE** | `/iam/roles/{roleId}/permissions/{permission}` | Revoca un permiso asociado a un rol. *(Requiere acceso de escritura financiero)*. |

#### Asignación de Usuarios

| Método | Endpoint | Descripción |
| --- | --- | --- |
| **GET** | `/iam/user-roles` | Lista las asignaciones de usuario-rol-sede vigentes en el Tenant. |
| **POST** | `/iam/user-roles` | Asocia a un usuario con un rol específico asignado a una sede física determinada. *(Requiere acceso de escritura financiero)*. |
| **DELETE** | `/iam/user-roles/{assignmentId}` | Revoca de forma definitiva una asignación usuario-rol-sede por su ID. *(Requiere acceso de escritura financiero)*. |

---

### 4. Módulo `onboarding` (Inicialización de Tenant)

* **Descripción:** Procesos de validación fiscal e inicialización del entorno de trabajo (Bootstrap) para nuevos Tenants en la plataforma.

| Método | Endpoint | Descripción |
| --- | --- | --- |
| **GET** | `/onboarding/validate-ruc/{ruc}` | Realiza la validación de un RUC de 11 dígitos consumiendo un servicio fiscal externo. *Exento de autenticación*. |
| **POST** | `/onboarding/bootstrap-tenant` | Realiza el aprovisionamiento inicial de un Tenant para el usuario autenticado (retorna el existente si ya ha sido creado). |

---

### 5. Módulo `sedes` (Administración de Sedes)

* **Descripción:** Creación, modificación y desactivación de sedes físicas pertenecientes al Tenant.
* **Control Financiero de Escritura:** Las operaciones de escritura son interceptadas por el middleware `requireFinancialWriteAccess()` y pueden retornar los códigos `FIN-001` o `FIN-002` antes de evaluar permisos específicos.

| Método | Endpoint | Descripción |
| --- | --- | --- |
| **GET** | `/sedes` | Obtiene el listado de sedes asociadas al Tenant actual. |
| **POST** | `/sedes` | Registra una nueva sede física. *(Requiere rol de Administrador del Tenant y permisos de escritura financiero)*. |
| **PUT** | `/sedes/{sedeId}` | Actualiza la información de una sede (nombre o estado). *(Requiere rol de Administrador del Tenant y permisos de escritura financiero)*. |
| **DELETE** | `/sedes/{sedeId}` | Desactiva de forma lógica una sede (`soft-delete`). No se remueve físicamente el registro en la base de datos (ver observaciones y lógica interna en `sedes.js`). *(Requiere rol de Administrador del Tenant y permisos de escritura financiero)*. |