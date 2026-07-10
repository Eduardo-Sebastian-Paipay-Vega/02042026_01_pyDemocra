# Arquitectura de Tipos y Context Packages

*Fuente de verdad: `AUDIT_REPORT_S1.md`, Arquitectura de TypeScript*

Dado que Democra no utiliza un ORM (como Prisma) para inferir tipos de la base de datos de manera automatizada al vuelo, el proyecto confía en un archivo maestro de tipos generados.

## 1. El Archivo Maestro de Tipos (SSOT de Tipado)

*   **Ubicación:** `src/modules/ong/lib/db/ong/app-database.ts` (Versión Integrada) vs `ONG/src/lib/db/ong/app-database.ts` (Versión Legacy).
*   **Propósito:** Contiene las interfaces TypeScript (`interface Database`) que mapean las 100+ tablas de PostgreSQL, permitiendo al cliente de Supabase (`@supabase/supabase-js`) inferir las formas de los datos durante la escritura de consultas.
*   **Gestión de Versiones:** La auditoría revela que el módulo integrado posee la versión más moderna de los tipos (incluyendo los del sistema ACE de accesos), mientras que el proyecto independiente se encuentra desactualizado.

## 2. Tipos Fundamentales Inferidos

*   `Tenant`: Representa la organización (UUID, RUC, Plan).
*   `Profile`: El perfil del usuario (conectado a auth.users).
*   `Membership`: Entidad ACE para resolución polimórfica (Usuario <-> Organización/Sede/Proyecto).
*   `Voluntario` y `Beneficiario`: Actores principales de los módulos operativos, con datos demográficos basados en los catálogos de `Generos`, `TiposDocumento` y `Paises`.
*   JSONB: El esquema depende fuertemente del tipado laxo (JSON) en tablas como `mfa_challenges.context` o `id_card_templates.template_config` (versión 2), requiriendo validaciones adicionales en tiempo de ejecución.

## 3. Context Packages (Capa de Contexto React)

*   Para inyectar la información transversal en el frontend (el ID del tenant, el perfil del usuario, los permisos en memoria), la arquitectura React utiliza `React.Context` u stores de estado local. La función SQL `v_user_session_context` expone esta información agrupada, lo que se debe mapear a un objeto TypeScript como `SessionContext` consumido en toda la aplicación.
