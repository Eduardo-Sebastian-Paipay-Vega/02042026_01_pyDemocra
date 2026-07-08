# Vercel Troubleshooting

## ERR-001-AUTH-REDIRECT-LOOP

**Síntoma:**
Tras ingresar credenciales correctas en la página de Login en producción, el usuario es expulsado inmediatamente de vuelta a la Landing Page principal (`/`). Localmente (`npm run dev`) funciona correctamente y redirige a `/ong/`. Si se introducen credenciales incorrectas, sí se muestran los errores de base de datos.

**Diagnóstico Técnico:**
El problema se debe a una divergencia de **case-sensitivity** (mayúsculas vs minúsculas) al momento de enrutar los archivos estáticos en Vercel, que opera bajo un sistema de archivos Linux (case-sensitive), a diferencia del entorno local (Windows/macOS en la mayoría de casos, que son case-insensitive).

1. La carpeta física en el repositorio se llama `ONG` (en mayúsculas).
2. Durante el proceso de build, Vite empaqueta este submódulo y coloca su archivo principal en `dist/ONG/index.html`.
3. El archivo `vercel.json` define reglas de reescritura que interceptan la ruta pública `/ong` para apuntar a un archivo interno de la build.
4. Cuando `vercel.json` tiene `{ "source": "/ong", "destination": "/ong/index.html" }`, Vercel intenta buscar literalmente el archivo `ong/index.html` (en minúsculas).
5. Como en Linux `ONG` !== `ong`, Vercel **falla silenciosamente** al no encontrar el archivo de destino.
6. Al fallar este `rewrite`, Vercel continúa evaluando las reglas y cae en la regla comodín o catch-all: `{ "source": "/(.*)", "destination": "/index.html" }`.
7. Esta última regla devuelve el HTML de la Landing Page.
8. Una vez que el navegador carga el bundle de la Landing Page en la URL `/ong/`, el router interno (React Router) de la Landing Page detecta que `/ong/` no es una ruta válida dentro de su dominio y redirige al usuario de vuelta a `/`.

Respecto al estado de autenticación (Auth/Persistencia), se ha verificado que ambos bundles (Landing y ONG) comparten exactamente la misma configuración de Supabase:
- Mismo `storageKey` en localStorage: `"sb-democra-auth-token"`.
- Comparten la clave del caché del Bootstrap (`BOOTSTRAP_CACHE_KEY = "democra.tenant.ctx.v2"`).
Por lo que el token sí se está persistiendo correctamente, el fallo es estrictamente de infraestructura y enrutamiento por el sistema de archivos case-sensitive.

**Lista de Verificación (Checklist) para futuros módulos:**
Para evitar que esto vuelva a ocurrir al agregar nuevos submódulos MPA a la plataforma, revisa siempre lo siguiente:
- [ ] **Consistencia Absoluta de Nombres:** Asegurar que el nombre de la carpeta del módulo (ej. `ong`, `admin`, `gym`) se cree **siempre en minúsculas**.
- [ ] **Configuración en `vite.config.js`:** Las rutas de `input` en Rollup deben apuntar exactamente a las carpetas en minúsculas.
- [ ] **Sincronización de Autenticación:** Verificar que el módulo instancie su cliente Supabase con el mismo `storageKey` definido globalmente en la raíz para habilitar SSO (Single Sign-On) local entre SPAs.

## Resolución Aplicada (2026-07-08)
Se corrigió el error en producción ejecutando las siguientes acciones:
1. **Renombrado en Git**: Se renombró la carpeta física de `ONG` a `ong` usando `git mv`.
2. **Actualización de Vite**: Se actualizaron las referencias en `vite.config.js` (`@ong` alias, configuraciones del fallback SPA, y los entry points del build en Rollup) para que generen el código estático en minúsculas.
3. Al compilar y desplegar, ahora Vercel mapea correctamente `{ "source": "/ong", "destination": "/ong/index.html" }` hacia `dist/ong/index.html`, evitando que el router falle. El estado de persistencia de Supabase no fue modificado ya que operaba correctamente bajo `sb-democra-auth-token`.
