# Resumen ejecutivo

## Qué se hizo

Se dejó el repositorio funcional de punta a punta en una máquina nueva: dependencias instaladas (con `package-lock.json` nuevo), `.env` configurado contra el proyecto Supabase `PT_solaris`, Vercel CLI enlazado al proyecto de despliegue, y dos bugs corregidos que impedían que `npm run dev`/`npm run build` y la suite Vitest funcionaran:

1. Error de sintaxis (`?? ` mezclado con `||` sin paréntesis) en `ProjectsWorkspace.tsx` que rompía el arranque de Vite.
2. Mock de Supabase incompleto en `cursos.service.test.ts` que hacía fallar 2 tests.

Además se creó `SETUP.md` (mini manual de entorno) y una regla nueva en `CLAUDE.md` para que futuras sesiones verifiquen este checklist automáticamente.

## Por qué se hizo

El repo se clonó sin `node_modules`, sin `.env` y sin Vercel enlazado, y al intentar levantarlo aparecieron fallos reales de código (no solo de configuración) que bloqueaban tanto el desarrollo local como potencialmente el build de producción.

## Qué beneficio aporta

- `npm run dev` y `npm run build` funcionan sin errores.
- `npm test` y `npm run test:web` quedan en verde (280/280 y 268/268 respectivamente) como señal confiable de salud del proyecto.
- Despliegue a Vercel disponible directamente desde este entorno.
- Onboarding futuro más rápido gracias a `SETUP.md` y la regla en `CLAUDE.md`.

## Qué funcionalidades quedaron afectadas

- **Subida de imagen de proyectos** (módulo ONG, `ProjectsWorkspace.tsx`): el nombre de la ruta de almacenamiento ahora resuelve correctamente `editingProjectId` → `projectForm.name` → `"nuevo"` como fallback, en vez de fallar la compilación.
- **Ninguna funcionalidad productiva** se vio afectada por el fix del mock de test (solo el archivo de test, no el servicio real).
