# Guía de Incorporación de Módulos Externos (Arquitectura Monolítica Core-Ramas)

> **Documento creado:** 21/08/2026
> **Propósito:** Definir el estándar arquitectónico y los pasos operativos para integrar aplicaciones o repositorios externos (ej. módulo de Educación, módulo ONG) dentro del ecosistema central (Core) de Democra. 

## 1. Filosofía Arquitectónica: Core y Ramas

El proyecto Democra sigue un modelo de **Monolito Centralizado**. Esto significa que existe un único "Core" (la raíz del proyecto) y los distintos módulos de negocio actúan como "Ramas".

**Reglas Inquebrantables de esta arquitectura:**
- **Un único repositorio Git (`.git`):** Los módulos externos pierden su independencia de control de versiones al integrarse. No deben existir sub-repositorios anidados.
- **Un único `package.json` maestro (No instalar NPM en subcarpetas):** Todas las dependencias (tanto del Core como de las ramas) se declaran y resuelven en la raíz. Ningún submódulo debe tener su propia carpeta `node_modules` ni un `package.json` activo que fragmente el gestor de paquetes.
- **Un único archivo de entorno (`.env`):** No se permite la dispersión de secretos. Las variables de configuración de todos los módulos convergen en el `.env` raíz.

---

## 2. Pasos para Integrar un Módulo Externo

Cuando se reciba un proyecto externo (por ejemplo, `core_educacion` o `ONG`) para ser añadido al ecosistema de Democra, se deben ejecutar obligatoriamente los siguientes pasos:

### Fase 1: Limpieza Estructural del Módulo Entrante
Antes de copiar el módulo externo dentro de la carpeta raíz de Democra:
1. **Eliminar el control de versiones local:** Borrar la carpeta `.git` del proyecto externo.
2. **Eliminar dependencias locales:** Borrar cualquier carpeta `node_modules`.
3. **Eliminar gestores de entorno aislados:** Borrar archivos como `.env`, `.env.local` o `.env.example`. Copiar manualmente sus claves necesarias y tenerlas listas para la Fase 3.
4. **Desactivar gestores de paquetes anidados:** Si el proyecto usa arquitecturas Turborepo, Yarn Workspaces o similares, borrar los `package.json` anidados o combinarlos lógicamente.

### Fase 2: Traslado e Inserción
1. Mover la carpeta limpia del módulo externo hacia la raíz del proyecto Democra (por convención, usando nombres en minúsculas como `ong/`, `educacion/`, `gym/`).
2. Para el código de Backend/APIs, el código debe integrarse dentro de `server/domains/{nombre_modulo}/`, ya que `api/server.js` sirve como el adaptador Serverless unificado. Las ramas no tienen sus propios servidores Express independientes.
3. Para el código Frontend, las páginas se integran al enrutador unificado de Vite (como aplicaciones MPA o SPA montadas en subrutas de Vite).

### Fase 3: Unificación de Dependencias y Entorno
1. **Fusión de `package.json`:** Tomar las librerías exclusivas que necesitaba el módulo externo e instalarlas desde la raíz del proyecto Democra (`npm install nombre-paquete`).
2. **Fusión de Variables:** Añadir las claves que el módulo requiere (URLs, Keys, Secrets) al archivo `.env` de la raíz del proyecto.
3. **Mapeo de Base de Datos:** Si el módulo traía sus propias tablas, estas deben documentarse e integrarse a la instancia única de Supabase (verificando que no rompan el RLS nativo del Core). Cualquier validación debe seguir usando `storageKey: 'sb-democra-auth-token'`.

### Fase 4: Auditoría de Seguridad (AppSec)
1. **Limpieza de Secretos:** Revisar rigurosamente los archivos fuente (JS, TS, Python) del módulo externo buscando tokens, UUIDs o llaves quemadas en código duro (hardcoded). Sustituirlos por invocaciones a `process.env`.
2. Todo módulo recién importado debe someterse a revisión de inyección de dependencias (SQLi) y exposición de datos, siguiendo las normativas del archivo `AGENTS.md`.

---

## 3. Ejemplo Histórico (Caso: Módulo de Educación)

En agosto de 2026, el módulo `core_educacion` fue importado. El proceso requirió:
1. Destruir la estructura `.git` anidada que bloqueaba a Git (`index.lock`).
2. Mover todos los secretos de 5 scripts de prueba harcodeados hacia `process.env`.
3. Borrar múltiples `.env` redundantes que causaban colisión.
4. Integrar sus tablas en Supabase bajo el mismo paraguas del Core, confirmando que las directivas RLS del Tenant principal funcionaban con el nuevo módulo.

*Cualquier agente que manipule la arquitectura del proyecto debe leer y respetar esta guía antes de proceder con migraciones, integraciones o creación de submódulos.*
