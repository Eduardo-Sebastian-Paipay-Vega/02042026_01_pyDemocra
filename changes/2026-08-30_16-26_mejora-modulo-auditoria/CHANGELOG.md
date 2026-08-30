# CHANGELOG

- **Fecha y hora:** 2026-08-30 16:26
- **Objetivo del cambio:** Solucionar errores críticos funcionales y de UI/UX en el módulo de Audit Log.
- **Contexto del problema:** Fuga de información en la UI, querys rotos por columnas inexistentes (schema_name) y UI sobrecargada.
- **Motivo de la modificación:** Pésima experiencia de usuario, violaciones de seguridad (exposición de datos internos) y sistema inutilizable.
- **Solución implementada:** 
  - Refactor del componente UI (AuditLog.tsx) utilizando Popovers para aislar filtros.
  - Fix en DB layer (udit.service.ts) apuntando al esquema validado en BD.json.
  - Conditional rendering estricto para estados.
- **Riesgos identificados:** Mínimos. Se usaron componentes del sistema de diseño core.
- **Impacto esperado:** Sistema de logs de auditoría 100% funcional.
- **Módulos afectados:** Gobernanza / Auditoría.
- **Dependencias involucradas:** @/core/components/ui/popover, lucide-react.
- **Posibles efectos secundarios:** N/A.
- **Estado del cambio:** Completado.
