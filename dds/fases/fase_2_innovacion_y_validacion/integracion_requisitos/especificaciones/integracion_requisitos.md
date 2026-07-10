# Integración de Requisitos Iniciales (Baseline)

*Fuente de verdad: `README.md`, `AUDIT_REPORT_S1.md`*

Este documento traza cómo los requisitos fundamentales identificados en la Fase 1 se han integrado en las primeras decisiones técnicas y arquitectónicas.

## 1. Trazabilidad Requisitos a Arquitectura

| Requisito Funcional | Integración Técnica Implementada | Estado / Riesgo de Integración |
| :--- | :--- | :--- |
| **Aislamiento Multi-tenant** | Inyección de la columna `tenant_id` en todas las tablas sensibles y validación continua mediante `public.fn_current_tenant_id()` dentro de las políticas RLS. | **Cumplido.** Sin embargo, se requiere un baseline (dump sql inicial) para que el entorno sea automatizable en CI/CD. |
| **MFA y Risk Engine** | Creación del servidor Express (`server/index.js`) con middlewares como `express-rate-limit` para bloqueo de IPs y tablas como `mfa_challenges` para almacenar temporalmente los hashes OTP (Resend). | **Cumplido.** El diseño híbrido absorbe este requisito con éxito sin sobrecargar Supabase. |
| **Gestión de Invitaciones** | Evolución hacia el **Access & Context Engine (ACE)** (`public.access_links`). Permite crear links únicos con estado. | **Riesgo:** Conflicto de implementación. La tabla legacy `rrhh.codigos_registro_voluntario` sigue activa, lo cual rompe el requisito de fuente única de verdad para invitaciones. |
| **Auditoría Universal Forense** | Implementación del trigger `fn_trigger_audit_universal()` alimentando `auditoria.audit_log` con el evento, usuario y payloads de pre y post inserción/edición. | **Riesgo:** Contradicción en las políticas RLS que permiten acciones DELETE sobre los registros de auditoría y confusión entre modelos de columnas viejos y nuevos. |
| **Manejo de Datos Clínicos** | Creación del esquema aislado `clinico.*` con auditoría específica de lectura/escritura en `accesos_sensibles_log`. | **Riesgo Crítico:** Las políticas RLS actuales solo validan la pertenencia al tenant, omitiendo el permiso estricto del usuario (`fn_has_permission`). |

> [!NOTE]
> **Trazabilidad:** Los requisitos evaluados en esta matriz derivan directamente de los documentos [requisitos_funcionales.md](../../../fase_1_descubrimiento_y_analisis/requisitos_basicos/especificaciones/requisitos_funcionales.md) y [requisitos_no_funcionales.md](../../../fase_1_descubrimiento_y_analisis/requisitos_basicos/especificaciones/requisitos_no_funcionales.md).

## 2. Conclusión de la Integración

La arquitectura base demuestra una alta sofisticación para resolver los requisitos planteados, especialmente el Multi-tenancy en base de datos PostgreSQL nativa. Sin embargo, la integración técnica sufre de fragmentación documental y de código (deuda técnica), lo que exige una iteración de refactorización centrada exclusivamente en la limpieza de la base de datos (resolución de los hallazgos del [Red Teaming](../../../fase_1_descubrimiento_y_analisis/red_teaming/auditorias/red_teaming_auditoria.md)) antes de seguir escalando módulos.
