# Archivos modificados

## Creados

- `SETUP.md` — mini manual de entorno de desarrollo (instalación, `.env`, tests, Vercel, troubleshooting).
- `package-lock.json` — lockfile de npm, no existía en el repo antes de esta sesión.
- `changes/2026-07-10_15-17_setup-entorno-y-fix-vite-build/` — esta carpeta de auditoría (`CHANGELOG.md`, `SUMMARY.md`, `FILES_CHANGED.md`).

## Modificados

- `CLAUDE.md` — se agregó la sección "Regla obligatoria: entorno de desarrollo al iniciar sesión de trabajo", que remite a `SETUP.md` y exige verificar dependencias, `.env`, Vercel CLI y tests al empezar a trabajar en el repo.
- `package.json` — se agregó `happy-dom` (`^20.10.6`) a `devDependencies`; lo requiere `vitest.config.ts` (`environment: "happy-dom"`) y no estaba declarado.
- `.gitignore` — `vercel link` agregó automáticamente las entradas `.vercel` y `.env*` (redundante con reglas previas, pero inofensivo).
- `ong/src/app/modules/projects/ProjectsWorkspace.tsx` (línea 612) — se agregaron paréntesis para desambiguar `??` y `||`:
  ```diff
  - pathSegments: ["proyectos", editingProjectId ?? projectForm.name || "nuevo"],
  + pathSegments: ["proyectos", (editingProjectId ?? projectForm.name) || "nuevo"],
  ```
  Este error de sintaxis hacía que `esbuild` (usado por Vite en dev y build) abortara al escanear dependencias, rompiendo `npm run dev` y `npm run build` por completo.
- `ong/src/app/services/academico/cursos.service.test.ts` — se simplificaron los mocks de `insert` y `update` del cliente Supabase mockeado, de funciones que resolvían una `Promise` directamente a `vi.fn().mockReturnThis()`, igual que `select`/`eq`/`in`/`order`/`range`. El servicio real (`cursos.service.ts`) encadena `.insert(...).select(...).single()`, que el mock anterior no soportaba (`TypeError: ...select is not a function`).

## No committeados (intencionalmente, fuera del alcance de este cambio)

- `.env` — credenciales reales, ya cubierto por `.gitignore`.
- `.vercel/` — metadata local de enlace a Vercel, ya cubierto por `.gitignore`.
- `.claude/scheduled_tasks.lock` — artefacto de runtime de la sesión de Claude Code (PID + timestamp), no versionado deliberadamente por ser efímero y ajeno al código del proyecto.
- `node_modules/`, `dist/` — ya cubiertos por `.gitignore`.
