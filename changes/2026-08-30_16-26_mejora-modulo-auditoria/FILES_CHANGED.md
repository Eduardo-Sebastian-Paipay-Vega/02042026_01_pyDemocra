# Archivos Modificados

- src/modules/ong/app/pages/AuditLog.tsx: Refactor de UI/UX, integración de Popover para filtros y corrección de state-collisions y fuga de datos internos.
- src/modules/ong/app/services/gobernanza/audit.service.ts: Fix crítico del query SQL. Se reemplazaron las consultas a schema_name y 	able_name por 
esource_name, al igual que event_type, ctor_id basándose en el modelo de base de datos actual.
