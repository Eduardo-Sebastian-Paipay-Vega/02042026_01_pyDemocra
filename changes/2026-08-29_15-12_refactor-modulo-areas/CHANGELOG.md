# Changelog: Refactorización del Módulo de Áreas Organizacionales

- **Fecha y hora:** 2026-08-29 15:12
- **Objetivo del cambio:** Refactorizar el módulo de Áreas Organizacionales según el "Prompt Táctico", conectando la interfaz con el backend de manera segura y siguiendo las reglas de BD.
- **Contexto del problema:** La vista carecía de componentes integrados con la BD (`ong.areas`), faltaban acciones (Editar, Activar/Desactivar) y no mostraba información relacional sobre proyectos (`ong.proyectos`).
- **Motivo de la modificación:** Requerimiento directo para llevar el módulo al estándar de producción y mejorar la UI/UX.
- **Solución implementada:**
  - Creación del servicio `areas.service.ts` con consultas Supabase y uso de `ongSchema()`, conectando con el CRUD completo (Create, Read, Update, ToggleStatus) de `ong.areas`.
  - Creación del hook `useAreas.ts` integrando llamadas asíncronas con feedback vía toast.
  - Creación del componente UI principal `Areas.tsx` que maneja el datatable, la lógica de búsqueda con debounce y el Modal interactivo para creación/edición.
  - Modificación de `registry.tsx` para inyectar correctamente la nueva ruta `/ong/app/governance/areas` en el grupo `gobernanza`.
- **Riesgos identificados:** El conteo de proyectos requiere que la FK `id_area` en `ong.proyectos` exista y los permisos RLS estén configurados correctamente para el rol en curso.
- **Impacto esperado:** Gestión completa y fluida de áreas para la ONG sin tocar directamente la base de datos.
- **Módulos afectados:** Gobernanza (`governance`).
- **Dependencias involucradas:** Supabase JS client, `lucide-react`, componentes base de Antigravity (ModalShell, DataTable, etc).
- **Posibles efectos secundarios:** Ninguno significativo, la ruta fue agregada junto a las demás rutas administrativas.
- **Estado del cambio:** Completado.
