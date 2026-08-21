# Changelog - Separación del Frontend (Fase 3)

**Fecha y Hora:** 2026-08-16 11:14
**Objetivo del cambio:**
Transformar la aplicación monolítica de frontend en un Monorepo de NPM Workspaces, dividiendo la compilación y lógica de Vite en proyectos aislados (`apps/web-core` y `apps/web-ong`).

**Contexto del problema:**
Bajo la estructura anterior, Core y ONG compartían un solo archivo `vite.config.js` y estaban obligados a compilarse juntos, limitando la escalabilidad del sistema hacia nuevos verticales como GYM. 

**Solución implementada:**
1. Habilitación de NPM Workspaces en `package.json` raíz (`"workspaces": ["apps/*", "packages/*"]`).
2. Traslado íntegro de la aplicación Core hacia `apps/web-core` con su respectivo `vite.config.js` independiente y `package.json`.
3. Traslado íntegro de la aplicación ONG hacia `apps/web-ong` con su respectivo `vite.config.js` independiente y `package.json`.
4. Borrado del `vite.config.js` monolítico de la raíz.
5. Ajuste del `tsconfig.json` global y creación de sub-configuraciones para aislar de forma segura los alias de ruta (`@/`).

**Riesgos identificados:**
- **Rompimiento de Vercel (CI/CD):** Puesto que `index.html` ya no reside en la raíz y la carpeta `ong` física se movió, las reescrituras de Vercel fallarán hasta que se configure el dashboard para tratar a `apps/web-core` y `apps/web-ong` como proyectos separados en Vercel. 
- **Symlinks en Node.js:** En sistemas Windows o Docker inestables, NPM podría requerir limpiado de caché antes de reconocer exitosamente a `@democra/ui` desde las sub-apps. Se ejecutó `npm install` forzado para mitigar.

**Impacto esperado:**
- Tiempos de compilación más rápidos (aislados).
- Capacidad de enchufar la futura aplicación GYM sin afectar al Core ni ONG.
- Verdadero aislamiento de dependencias frontend por vertical.

**Módulos afectados:**
- `package.json` raíz
- Todo el código de Frontend (`src/`, `ong/`, `index.html`, `vite.config.js`, `tsconfig.json`)

**Estado del cambio:** Completado
