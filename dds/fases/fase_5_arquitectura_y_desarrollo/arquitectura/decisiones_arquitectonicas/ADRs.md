# Decisiones Arquitectónicas (ADR)

*Fuente de verdad: `README.md`, `AUDIT_REPORT_S1.md`, Arquitectura del Repositorio*

El siguiente documento registra las Decisiones Arquitectónicas clave (ADRs - Architecture Decision Records) inferidas a partir del análisis del código y la estructura de base de datos actual del proyecto Democra.

---

## ADR 001: Aislamiento Multi-tenant mediante Row Level Security (RLS)

**Contexto:** Democra es una plataforma SaaS que sirve a múltiples ONGs. Es crítico evitar la fuga de datos entre organizaciones.
**Decisión:** Se ha decidido implementar el aislamiento (Multi-tenancy) a nivel lógico en una única base de datos PostgreSQL mediante el uso intensivo de **Row Level Security (RLS)**. Cada tabla dependiente incluye una columna `tenant_id` y las políticas exigen que coincida con el valor retornado por `public.fn_current_tenant_id()`.
**Consecuencias:**
*   **Positivas:** Reducción de costos de infraestructura (una sola BD). Seguridad reforzada a nivel de base de datos en lugar de depender exclusivamente de la capa de API.
*   **Negativas:** Mayor complejidad en la redacción de migraciones y scripts. El `Service Role Key` se vuelve un secreto extremadamente crítico, ya que su uso salta todas las barreras RLS.

---

## ADR 002: Acceso a Datos directo y sin ORM (Supabase Client)

**Contexto:** La elección de herramientas para interactuar con la base de datos desde el frontend y el backend Node.js.
**Decisión:** Se descarta el uso de ORMs pesados tradicionales (como Prisma, Sequelize o TypeORM). En su lugar, el sistema depende de la biblioteca cliente `@supabase/supabase-js` (que actúa sobre la API PostgREST de Supabase) junto a tipos de TypeScript gestionados manualmente en `app-database.ts`.
**Consecuencias:**
*   **Positivas:** Menor abstracción y consultas más cercanas al SQL nativo. Compatibilidad inmediata con el modelo de autenticación y RLS de Supabase.
*   **Negativas:** Obliga a los desarrolladores a mantener los tipos TypeScript sincronizados a mano con las migraciones, lo cual representa riesgo de desincronización (como se evidencia con los tipos ACE en la app independiente).

---

## ADR 003: Backend Distribuido (Express API para Seguridad y Edge Functions para Hooks)

**Contexto:** Necesidad de implementar lógica compleja de Autenticación, MFA y Motor de Riesgos que escapa a las capacidades estándar (fuera de la caja) de Supabase Auth.
**Decisión:**
1.  Se mantiene un **Servidor Express (API)** centralizado (puerto 8787) usando Node.js para las funciones de Identity and Access Management (IAM), gestión de PINs, evaluación de riesgo de accesos y auditoría privilegiada.
2.  Las **Edge Functions (Deno)** se reservan exclusivamente para automatizaciones específicas y ganchos de eventos, como el consumo de códigos de invitación y el aprovisionamiento de administradores.
**Consecuencias:**
*   **Positivas:** Permite una gestión de seguridad (Risk Engine) altamente granular y protegida que no podría escribirse fácilmente solo con políticas SQL.
*   **Negativas:** Rompe la homogeneidad del modelo "100% Serverless/BaaS", obligando al equipo a mantener infraestructura para un servidor Node.js independiente.

---

## ADR 004: Trazabilidad Forense por Triggers de Base de Datos

**Contexto:** Necesidad de cumplimiento regulatorio y auditoría estricta de quién modifica qué dato.
**Decisión:** Implementar la auditoría a través del trigger genérico `fn_trigger_audit_universal()`, que se adjunta a todas las tablas sensibles e inserta directamente en `auditoria.audit_log`.
**Consecuencias:**
*   **Positivas:** Inmutabilidad superior; incluso si un administrador altera datos mediante la consola SQL o el cliente, el cambio queda registrado y no depende de llamadas explícitas en el código del servidor.
*   **Negativas:** Aumenta la latencia (I/O) en cada operación de escritura en tablas auditadas.

---

## ADR 005: Motor ACE (Access & Context Engine) vs. Invitaciones Legacy

**Contexto:** Evolución de la lógica de invitaciones y membresías a ONGs.
**Decisión:** El sistema ha evolucionado de un modelo legacy de códigos (`rrhh.codigos_registro_voluntario`) a un nuevo modelo universal de enlaces (`public.access_links`).
**Consecuencias:**
*   *Deuda Técnica Actual:* La migración es parcial (se realizó un *snapshot* inicial), pero ambos motores siguen conviviendo en el código, generando un conflicto de doble fuente de verdad que debe ser depurado en iteraciones futuras.

---
*Fin del documento.*
