# Análisis Técnico del Estado Actual (As-Is)

*Fuente de verdad: `README.md`, `AUDIT_REPORT_S1.md`, `package.json`*

## 1. Visión General Técnica

El proyecto Democra es una aplicación SaaS distribuida en diferentes componentes (Frontend Admin, Frontend ONG independiente, Backend API y Base de Datos) con un estado actual que presenta características robustas de seguridad pero también importantes oportunidades de consolidación de deuda técnica.

## 2. Análisis por Componentes

### 2.1. Frontend
Existen actualmente dos frentes de desarrollo para la gestión de ONGs que coexisten en el repositorio:
*   **Módulo Integrado (`src/modules/ong/`)**: Representa la iteración más reciente de la UI para ONGs. Soporta los tipos del Access & Context Engine (ACE).
*   **Proyecto Independiente (`ONG/`)**: Representa una versión más antigua del módulo, sin los tipos ACE, que cuenta con su propio `package.json` y dependencias. 
**Hallazgo:** Esta duplicidad representa un riesgo de divergencia técnica.

### 2.2. Backend (Express API)
La API de Node.js (Express 5) expuesta en el puerto 8787 se encarga de lógicas críticas que no se manejan de manera serverless:
*   **Motor IAM y MFA:** Administra la autenticación complementaria mediante pines/OTP (usando Resend).
*   **Risk Engine:** Evalúa sesiones y eventos de autenticación, manejando bloqueos temporales por intentos fallidos.
*   **Auditoría Universal:** Administra la trazabilidad a través de la base de datos de manera privilegiada (Service Role Key).

### 2.3. Base de Datos (Supabase / PostgreSQL)
El núcleo de la persistencia de datos es robusto en cuanto al aislamiento lógico, pero con fricciones en su gestión de estado.

#### 2.3.1. Gestión del Esquema (Migraciones)
*   **Baseline Ausente:** No existe en el repositorio un script o migración inicial (baseline) ejecutable que cree la estructura fundamental de tenants y perfiles (el `docs/general/scripts-maestros/Parte 1` contiene errores sintácticos y es meramente documental). Por consiguiente, un despliegue limpio desde el repo actual fallaría.
*   **Doble Trail de Migraciones:** Las migraciones están separadas en dos carpetas con convenciones de versionado inconsistentes:
    1. `supabase/migrations/` (10 archivos).
    2. `ONG/supabase/migrations/` (4 archivos).

#### 2.3.2. Modelo de Seguridad (Row Level Security)
*   El aislamiento lógico multi-tenant es altamente dependiente de la función de base de datos `fn_current_tenant_id()` y las políticas (RLS) asociadas.
*   Se identifican políticas en módulos sensibles (como `clinico.*`) que solo exigen validación de tenant y carecen de una evaluación estricta de permisos granulares (`fn_has_permission`).

#### 2.3.3. Elementos Muertos y Huérfanos
El reporte de auditoría y la inspección del repositorio identifican varios artefactos sin uso:
*   **Módulos en desuso:** `donaciones`, `gamificacion`, e `impacto` no cuentan con referencias en el código activo.
*   **Conflictos de Definición:** Existen dobles fuentes de verdad para ciertos procesos, notablemente en las invitaciones (conviven `rrhh.codigos_registro_voluntario` y `public.access_links`).

## 3. Conclusión del Análisis

El sistema posee un núcleo operativo (`public core`, `ong`, `rrhh`, `finanzas`) razonablemente endurecido gracias a su modelo de RLS por tenant y hardening P0. No obstante, la carencia de un baseline ejecutable para la base de datos, la divergencia del código frontend ONG y la duplicación de flujos de invitaciones requieren priorización técnica para asegurar la escalabilidad de la solución SaaS.
