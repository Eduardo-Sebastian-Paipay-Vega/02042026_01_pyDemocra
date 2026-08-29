# Archivos Modificados

- `ong/src/app/routes.tsx`
  - Se modificó la ruta que carga el componente de Cursos: de `resources/courses` a `academico/cursos`.
- `ong/src/app/tenant/navigation.tsx`
  - Se añadió la categoría "Académico" (`academico`) a los `NAV_GROUPS`.
  - Se modificó la definición de ruta `courses` para que apunte al nuevo `path` y grupo, incorporando su respectivo ícono `BookOpen`.
- `ong/src/app/services/academico/cursos.service.ts`
  - Se modificó la interfaz `CursoRow` para incluir `inscritosCount: number`.
  - Se actualizó `listCursos` para que, mediante los IDs obtenidos, traiga las inscripciones y cuente el total por curso.
- `ong/src/app/pages/Courses.tsx`
  - Componente completo refactorizado: Modales con Tailwind Switches, validación visual nativa (`cursoFormErrors`), Componentes `ErrorBlock` y `EmptyState` optimizados visualmente, *Action Bar* movida a `PageHeader` y Tabs re-diseñados.
