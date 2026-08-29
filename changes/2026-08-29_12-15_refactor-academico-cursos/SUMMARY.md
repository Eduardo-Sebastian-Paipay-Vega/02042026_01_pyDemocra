# Resumen Ejecutivo: Refactorización Módulo Académico (Cursos)

## Qué se hizo
- **Corrección de Ruta:** Se migró el enrutamiento del módulo `Courses.tsx` de la ruta `resources/courses` a `academico/cursos` para corregir la inconsistencia de dominio. 
- **Actualización de Navegación:** Se introdujo el grupo "Académico" en el sidebar (`NAV_GROUPS`) y se reubicó el acceso de "Cursos y certificados" allí (utilizando el icono `BookOpen`).
- **Estados de la UI Excluyentes:** Se reimplementó el renderizado condicional en `Courses.tsx` (Loading, Error, Empty, Success), evitando que los estados de error y vacío se sobrepongan.
- **Micro-interacciones y UI:** El estado de error ahora presenta una alerta con fondo semántico (`bg-red-500/10`) y un botón de reintento, mientras que el "Empty State" cuenta con un contenedor centralizado de borde punteado y un ícono (`Inbox`).
- **Reubicación de Acciones:** El botón de "Nuevo curso" se integró al `PageHeader` principal como un *Call to Action* principal, y la acción de "Refrescar" se movió a un ícono de control alineado.
- **Enriquecimiento de Datos:** Se ajustó la consulta a Supabase en `cursos.service.ts` para ejecutar un conteo en la tabla `academico.inscripciones`, lo que permitió agregar el *Badge* de "Número de inscritos" en el listado principal de los cursos.
- **Formulario (UX Design Skills):** El Modal de creación fue modernizado con manejo de estados de error por campo (`cursoFormErrors`), bordes rojos contextuales, asteriscos requeridos, y un toggle nativo con Tailwind para el campo `activo`.

## Funcionalidades Afectadas
- `routes.tsx`: Enrutamiento protegido actualizado a `academico/cursos`.
- `tenant/navigation.tsx`: Menú lateral (nuevo grupo y nueva ruta base).
- `cursos.service.ts`: El `CursoRow` retorna la propiedad `inscritosCount` tras un left-join/count.
- `Courses.tsx`: UI general y Modales reescritos por completo.
