# Threat Modeling (Metodología STRIDE)

*Fuente de verdad: Evaluación de Riesgos sobre Arquitectura As-Is*

Este documento expone las amenazas estructurales de Democra utilizando el framework STRIDE de Microsoft, centrado en proteger el núcleo Multi-tenant y los datos clínicos sensibles.

| Categoría STRIDE | Amenaza Identificada | Mitigación Implementada | Estado / Riesgo Residual |
| :--- | :--- | :--- | :--- |
| **S**poofing (Suplantación) | Un atacante usa fuerza bruta o intercepta credenciales para suplantar a un administrador. | Motor de Riesgo (Risk Engine) que evalúa `device_fingerprint` e inyecta desafíos MFA vía OTP (`mfa_challenges`). | **Riesgo Medio:** El OTP por email (Resend) es vulnerable a buzones comprometidos. Futuro: Soportar TOTP (Authenticator). |
| **T**ampering (Alteración) | Un usuario autorizado intenta alterar los registros de auditoría para borrar sus acciones. | El trigger `fn_trigger_audit_universal` es ejecutado a nivel de motor de BD. | **Riesgo Crítico:** Las políticas RLS actuales de la tabla `audit_log` permiten `DELETE` a todos los usuarios. Requiere mitigación urgente. |
| **R**epudiation (Repudio) | Un usuario niega haber ejecutado una acción crítica (ej. vaciar una cuenta financiera). | Auditoría inmutable de *payloads* `pre` y `post` con captura obligatoria de `session_id`. | **Riesgo Bajo:** Mientras se corrija la vulnerabilidad de Tampering mencionada arriba. |
| **I**nformation Disclosure (Divulgación) | Fuga cruzada de datos clínicos entre dos ONGs distintas. | Aislamiento RLS en toda la base de datos inyectando el UUID del tenant con `fn_current_tenant_id()`. | **Riesgo Alto:** Las políticas RLS en el esquema `clinico` carecen de chequeo de permisos granulares (`fn_has_permission`), basándose solo en el tenant. |
| **D**enial of Service (DDoS) | Agotamiento de cuota de la capa gratuita/tier de envío de correos OTP o saturación de Base de Datos. | Middleware `express-rate-limit` con límites de 5 intentos/15 min para endpoints de Auth, y 100/15 min globales. | **Riesgo Medio:** Un ataque distribuido en la capa de frontend podría saltarse el rate-limit basado en IP individual. |
| **E**levation of Privilege (Elevación) | "Tenant Hijacking" vía enlace ACE. | N/A (Aislado a `fn_complete_access_onboarding`). | **Riesgo Crítico:** Si el límite de usos de un enlace ACE (`access_links`) se burla, un usuario podría elevarse y capturar el contexto de otro tenant temporalmente. |
