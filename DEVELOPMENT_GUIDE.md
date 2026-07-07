# 📘 Guía de Arquitectura Monorepo MPA - Democra

Este repositorio utiliza una arquitectura **Multi-Page Application (MPA)** unificada en un monorepo administrado por **Vite** y desplegado en **Vercel**. Toda la plataforma corre bajo el mismo origen (`same-origin`), eliminando la necesidad de hacks cross-origin para compartir sesiones o cookies.

---

## 🏗️ Estructura del Proyecto

```text
├── .env                  # Variables de entorno unificadas (Raíz, ONG, APIs)
├── package.json          # Único gestor de dependencias del proyecto
├── vercel.json           # Reglas de enrutamiento y Serverless Functions de producción
├── vite.config.js        # Configuración centralizada de empaquetado y alias
├── index.html            # Punto de entrada de la aplicación Raíz (Landing/Login)
├── src/                  # Código fuente de la aplicación Raíz
├── api/
│   └── server.js         # Puente que Vercel envuelve como Serverless Function
├── server/                # Código fuente del Backend (API Express)
│   └── index.js          # App de Express (export default) — puerto local 8787
└── ONG/                  # Submódulo / Aplicación Independiente de la ONG
    ├── index.html        # Punto de entrada exclusivo de la ONG
    └── src/               # Código fuente exclusivo de la ONG
```

> **Nota histórica sobre `ONG/`**: la carpeta física quedó en mayúsculas porque ya existía antes de esta arquitectura. La URL pública es `/ong` (minúsculas) — `vite.config.js` y `vercel.json` hacen ese mapeo explícitamente. **Todo módulo nuevo debe crearse directamente en minúsculas** para no repetir esa deuda (ver Paso 1).

---

## ⚡ Reglas de Oro del Repositorio (Buenas Prácticas)

1. **Cero `package.json` secundarios**: ninguna subcarpeta (como `ONG/`) debe tener su propio `package.json` ni su propia carpeta `node_modules`. Todas las dependencias se instalan en la raíz del proyecto.

2. **Autenticación compartida nativa**: como todos los módulos comparten el mismo dominio, la sesión de Supabase se lee automáticamente entre ellos. Para que eso funcione, **todo** cliente de Supabase (raíz, ONG, y cualquier módulo futuro) debe inicializarse con el mismo `storageKey` explícito:

   ```typescript
   storageKey: 'sb-democra-auth-token'
   ```

   No confiar en el valor por defecto que `supabase-js` deriva de la URL del proyecto — hazlo explícito en cada cliente nuevo.

3. **URLs en minúsculas**: por convención y compatibilidad con servidores de producción, todas las rutas del navegador y nombres de carpetas de módulo deben escribirse estrictamente en minúsculas (ej. `/ong/`, `/api/`, `/votaciones/`).

4. **El backend vive en `server/`, no en `api/`**: `api/server.js` es solo el adaptador que Vercel necesita para desplegar Express como Serverless Function. La lógica real (rutas, config, seguridad) va en `server/`. No dupliques rutas dentro de `api/`.

---

## 🚀 Cómo Agregar un Nuevo Módulo (Paso a Paso)

Si en el futuro deseas agregar un nuevo módulo (por ejemplo, un módulo de votaciones llamado `votaciones`), sigue estrictamente estos pasos:

### Paso 1: Crear la estructura de carpetas

Crea una nueva carpeta en la raíz **en minúsculas** y duplica la estructura base HTML de entrada:

```text
votaciones/
└── index.html
└── src/
    ├── main.tsx
    └── app/
```

> Nota: en `votaciones/index.html`, asegúrate de que la etiqueta `<script>` apunte a su propio archivo de entrada usando una **ruta absoluta**: `<script type="module" src="/votaciones/src/main.tsx"></script>`. Con ruta relativa (`./src/main.tsx`), cualquier ruta anidada de React Router (`/votaciones/dashboard`) cargaría el script equivocado al refrescar.

### Paso 2: Registrar el módulo en `vite.config.js`

Abre `vite.config.js` en la raíz y añade el nuevo punto de entrada en `build.rollupOptions.input`:

```js
// Dentro de build.rollupOptions.input:
input: {
  index: resolve(__dirname, "index.html"),
  ong: resolve(__dirname, "ONG/index.html"),
  votaciones: resolve(__dirname, "votaciones/index.html"), // <-- Nuevo módulo
}
```

### Paso 3: Configurar el basename del router interno

Si el nuevo módulo usa React Router, configura obligatoriamente el `basename` para que coincida con el subpath virtual:

```typescript
const ROUTER_BASENAME = "/votaciones";

const router = createBrowserRouter(routes, {
  basename: ROUTER_BASENAME,
});
```

### Paso 4: Añadir las reglas de reescritura en `vercel.json`

Para evitar errores 404 cuando los usuarios refresquen la página (F5) dentro del nuevo módulo, añade su regla de rewrite **antes** del catch-all de la raíz:

```json
{
  "rewrites": [
    { "source": "/api/:path*", "destination": "/api/server" },
    { "source": "/ong/:path*", "destination": "/ONG/index.html" },
    { "source": "/votaciones/:path*", "destination": "/votaciones/index.html" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

El orden importa: las reglas específicas siempre van antes del catch-all `/(.*)`, porque gana la primera que haga match.

### Paso 5: Actualizar el middleware de desarrollo local (`spaFallback` en `vite.config.js`)

El middleware que simula en dev el comportamiento de los rewrites de Vercel vive en `vite.config.js`. Agrega el nuevo prefijo a su lógica de mapeo, conservando los guards existentes (solo `GET`, y sin tocar internals de Vite ni assets reales — si no, cualquier request a `/votaciones/assets/*.js` se reescribiría por error a `index.html`):

```js
const isOngPath = pathname === "/ong" || pathname.startsWith("/ong/");
const isVotacionesPath =
  pathname === "/votaciones" || pathname.startsWith("/votaciones/");

if (isOngPath) {
  req.url = "/ONG/index.html";
} else if (isVotacionesPath) {
  req.url = "/votaciones/index.html";
} else {
  req.url = "/index.html";
}
```

### Paso 6: Instalar dependencias propias del módulo (si las necesita)

Si `votaciones/` necesita una librería que ningún otro módulo usa, instálala en la raíz (`npm install <paquete>`) — nunca crees un `package.json` dentro de `votaciones/`. Regla de Oro #1 no es negociable.
