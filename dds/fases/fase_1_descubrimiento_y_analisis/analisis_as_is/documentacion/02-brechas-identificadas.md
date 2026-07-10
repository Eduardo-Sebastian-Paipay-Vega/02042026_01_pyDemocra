# Brechas Identificadas (Gaps) — Democra
> **Fase 1 | Descubrimiento** | Fecha de análisis: 2026-07-09

---

Este documento detalla las brechas y áreas de riesgo identificadas durante el análisis del estado actual del sistema, junto con su impacto y sugerencias de mitigación.

| GAP-001 | Módulo de Votaciones / Deliberación Ausente |
|---------|---------------------------------------------|
| **Descripción** | El README principal del proyecto destaca un módulo para deliberación y votaciones democráticas internas como parte del valor diferencial del sistema. No se ha encontrado ninguna implementación (rutas, tipos TypeScript, tablas BD) que soporte esto. |
| **Impacto** | **Alto**. Falsa expectativa funcional sobre una característica clave. |
| **Probabilidad** | Ocurrencia 100% (confirmado). |
| **Mitigación Sugerida** | Clarificar con stakeholders la hoja de ruta. Actualizar la documentación para removerlo si fue descartado, o planificar su diseño (DDD, Modelo) para un sprint futuro. |

---

| GAP-002 | Desactualización de Especificación OpenAPI |
|---------|------------------------------------------|
| **Descripción** | El archivo `openapi.yaml` documenta el API, pero la rápida iteración de los módulos de onboarding y auth sugiere que podría no estar 100% alineado con el código actual (e.g. nuevos parámetros del motor de riesgo o respuestas del módulo de auditoría IA). |
| **Impacto** | **Medio**. Dificulta la integración de posibles clientes externos o el desarrollo de aplicaciones de terceros. |
| **Probabilidad** | Media. |
| **Mitigación Sugerida** | Implementar `swagger-jsdoc` o un generador automático desde el código (TSON/Zod) para mantener sincronizada la documentación con la implementación Express. |

---

| GAP-003 | Coexistencia de Dos Codebases ONG |
|---------|-----------------------------------|
| **Descripción** | El repositorio contiene una versión nueva y activa (`src/modules/ong/`) y una versión aparentemente legacy (`ONG/`). La presencia de ambas crea confusión arquitectónica y aumenta el tamaño del repositorio. |
| **Impacto** | **Alto**. Riesgo de aplicar correcciones de errores en la rama equivocada, aumentando severamente la deuda técnica y los tiempos de compilación. |
| **Probabilidad** | Ocurrencia 100% (confirmado). |
| **Mitigación Sugerida** | Documentar un plan de retiro formal (Deprecation Plan) para la carpeta `ONG/`. Archivar dependencias legacy y eliminar el código muerto del repositorio principal tras verificar la portabilidad total. |

---

| GAP-004 | Ausencia de Pruebas E2E e Integración |
|---------|---------------------------------------|
| **Descripción** | A pesar de tener un sistema complejo de autenticación (step-up MFA) y lógica multi-tenant crítica, no hay evidencia de pruebas End-to-End (E2E) con Playwright/Cypress, y escasa cobertura de integración. |
| **Impacto** | **Alto**. Elevado riesgo de regresión de seguridad o pérdida de funcionalidad crítica en despliegues a producción. |
| **Probabilidad** | Alta (en cualquier refactor futuro). |
| **Mitigación Sugerida** | Priorizar la creación de una suite E2E para flujos críticos: (1) Bootstrap de organización, (2) Login con OTP, y (3) Admisión de Voluntario. Integrarlo en el pipeline de GitHub Actions. |

---

| GAP-005 | Solapamiento de Funciones (Aprobaciones vs. Finanzas) |
|---------|-------------------------------------------------------|
| **Descripción** | La documentación funcional previa mencionaba un módulo aislado de "Aprobaciones", sin embargo, el flujo de aprobación está embebido dentro del módulo de Finanzas (tipos TypeScript `FinancialEgresoResolutionInput`). La separación de responsabilidades no está clara. |
| **Impacto** | **Bajo**. Ambigüedad documental que no afecta el funcionamiento del software. |
| **Probabilidad** | Ocurrencia 100% (confirmado). |
| **Mitigación Sugerida** | Actualizar la documentación y el modelo de dominios (DDD) para aclarar si "Aprobaciones" es un Bounded Context independiente (Shared Kernel) o si es exclusivo del contexto Financiero. |

---

| GAP-006 | Lógica de Negocio en el Frontend (Direct to DB) |
|---------|-------------------------------------------------|
| **Descripción** | Los módulos funcionales de la ONG (Personas, Proyectos, Recursos) interactúan directamente con Supabase (vía `supabase-js`) sin una capa de API intermedia. Toda la validación lógica y la autorización descansa en las políticas RLS. |
| **Impacto** | **Medio**. Aunque RLS es seguro, las lógicas transaccionales complejas pueden volverse difíciles de mantener si se replican en el cliente web, abriendo vulnerabilidades si RLS se configura mal. |
| **Probabilidad** | Media (Riesgo arquitectónico futuro). |
| **Mitigación Sugerida** | Evaluar la migración de transacciones complejas (ej. movimientos de inventario que afectan stock) a Edge Functions o extender el backend de Express para exponer estas acciones como RPC seguras. |

---

| GAP-007 | Edge Functions No Documentadas en OpenAPI |
|---------|-------------------------------------------|
| **Descripción** | El proyecto hace uso de funciones ejecutadas en el entorno Deno de Supabase (como `admin-provision-user`), pero estos endpoints no se reflejan en la documentación de OpenAPI, ocultando parte de la superficie de ataque del backend. |
| **Impacto** | **Bajo**. Falta de visibilidad de endpoints administrativos. |
| **Probabilidad** | Ocurrencia 100% (confirmado). |
| **Mitigación Sugerida** | Incluir una sección separada en la especificación OpenAPI que detalle los contratos de solicitud y respuesta de todas las Edge Functions desplegadas. |

---

| GAP-008 | Sin Interfaz Administrativa para el Motor de Riesgo |
|---------|-----------------------------------------------------|
| **Descripción** | El motor de riesgo es parametrizable (umbrales y pesos de decisión), pero depende enteramente de variables de entorno estáticas (`.env`). No existe una interfaz para que los administradores modifiquen estos umbrales dinámicamente ante un ataque inminente. |
| **Impacto** | **Bajo**. Rigidez en la respuesta operativa a incidentes. |
| **Probabilidad** | Baja. |
| **Mitigación Sugerida** | Migrar la configuración del motor de riesgo a la base de datos (tabla de configuración global) y crear una vista en el panel de administración (Settings) para ajustar la sensibilidad del motor en tiempo real. |
