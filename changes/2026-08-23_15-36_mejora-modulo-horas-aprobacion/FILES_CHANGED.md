# Archivos modificados

- `src/modules/ong/app/pages/HoursApproval.tsx`: Modificado. Nuevo layout de filtros, uso de `EmptyState`, avatar, botón de sincronizar actualizado y validación de comentario obligatorio.
- `src/modules/ong/app/components/shared/EmptyState.tsx`: Creado. Componente para ilustrar tablas o estados vacíos.
- `src/modules/ong/app/components/shared/DataTable.tsx`: Modificado. Soporte de ReactNode para emptyMessage.
- `src/modules/ong/app/services/operacion/aprobaciones.service.ts`: Modificado. Se agregó la lógica para verificar evidencias en base a la actividad y voluntario en curso.
- `src/modules/ong/app/modules/operation/types.ts`: Modificado. Se añadió el flag `hasEvidence` a `OperationApprovalRow`.
