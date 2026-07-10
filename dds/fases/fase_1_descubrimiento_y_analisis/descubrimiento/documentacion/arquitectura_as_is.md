# Arquitectura As-Is

*Fuente de verdad: `README.md`, `AUDIT_REPORT_S1.md`, `package.json`*

## 1. Visión General del Sistema

Democra es una plataforma SaaS multi-tenant de gobernanza democrática con IA para ONGs y organizaciones. Permite votaciones, deliberación, gestión de voluntariado y toma de decisiones en tiempo real. 

El sistema está compuesto por tres piezas principales que se ejecutan en conjunto durante el desarrollo y se despliegan de forma independiente en producción.

## 2. Componentes Principales

### 2.1. Aplicación Principal (Frontend Admin)
*   **Ruta en repositorio:** `src/`
*   **Puerto de desarrollo:** `5173`
*   **Stack Tecnológico:** React 18, TypeScript, Vite 6, Tailwind CSS 4, Radix UI, React Router 7.
*   **Descripción:** Contiene la Landing page, la página "Nosotros" y el módulo ONG integrado (`src/modules/ong/`). Esta versión del módulo ONG cuenta con soporte para el motor **ACE** (Access & Context Engine).

### 2.2. Aplicación ONG (Frontend Independiente)
*   **Ruta en repositorio:** `ONG/`
*   **Puerto de desarrollo:** `5174`
*   **Stack Tecnológico:** React 18, Vite.
*   **Descripción:** Aplicación independiente para la gestión de ONGs. Es un proyecto propio con su propio `package.json`. Representa una versión más antigua del módulo ONG (sin tipos ACE), pero sigue activa.

### 2.3. API (Backend Express)
*   **Ruta en repositorio:** `server/`
*   **Puerto de desarrollo:** `8787`
*   **Stack Tecnológico:** Node.js 26 (testeado en 20+), Express 5.
*   **Descripción:** Backend encargado de gestionar la lógica que no se delega a Supabase directamente. Incluye:
    *   Gestión de Identidad y Accesos (IAM).
    *   Autenticación complementaria (MFA / OTP).
    *   Motor de evaluación de riesgos (Risk Engine).
    *   Auditoría de eventos.
*   **Acceso a Base de Datos:** Utiliza `SUPABASE_SERVICE_ROLE_KEY` para operaciones privilegiadas.

### 2.4. Base de Datos y Backend-as-a-Service (BaaS)
*   **Plataforma:** Supabase (PostgreSQL 16).
*   **ORM:** Ninguno. El acceso se realiza de forma directa mediante `@supabase/supabase-js`.
*   **Multi-tenancy:** Aislamiento lógico de datos implementado a nivel de base de datos usando **Row Level Security (RLS)**. El contexto del tenant se obtiene mediante la función PostgreSQL `fn_current_tenant_id()`.
*   **Esquemas:** La base de datos abarca 11 esquemas lógicos (`public`, `ong`, `rrhh`, `finanzas`, `donaciones`, `clinico`, `academico`, `gamificacion`, `impacto`, `comunicaciones`, `auditoria`).

## 3. Seguridad y Control de Acceso

*   **Autenticación Base:** Supabase Auth.
*   **Capa de Seguridad Adicional:** Motor propio de MFA (Multi-Factor Authentication), envío de OTP vía Resend, manejo de `mfa_challenges` y `auth_events`.
*   **Autorización:** Gestionada por catálogos de permisos (`cat_permissions`, `role_permissions`, `user_roles_sedes`).
*   **Access & Context Engine (ACE):** Motor introducido para manejar links y membresías contextuales.

## 4. Infraestructura Adicional (Supabase)

*   **Storage:** 3 buckets identificados (`avatars` público, `evidence` privado por tenant, `id_templates` público).
*   **Edge Functions:** 3 funciones ubicadas en `ONG/supabase/functions/` encargadas de aprovisionamiento admin, revocación de sesiones y consumo de códigos de registro legacy.
*   **Migraciones:** El esquema se gestiona vía archivos `.sql` en `supabase/migrations/` y `ONG/supabase/migrations/`.

## 5. Decisiones Arquitectónicas Identificadas

*   **Despliegue Desacoplado:** El frontend y el backend Express se despliegan por separado.
*   **Seguridad delegada a BD (RLS):** Gran parte de la seguridad de los datos depende de las políticas RLS en PostgreSQL, no solo de validaciones en la capa de API.
*   **Doble Frontend para ONGs:** Coexistencia de `src/modules/ong/` y `ONG/`.

*Fin del documento.*
