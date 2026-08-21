# Manual de Configuración y Dependencias (Democra)

Este documento detalla las herramientas globales, dependencias del sistema y configuraciones requeridas para mantener el proyecto Democra operativo, mapeado y completamente actualizado.

## 1. Dependencias Globales a Descargar e Instalar

Para trabajar en el ecosistema Democra, el desarrollador (o agente de IA) debe asegurarse de tener instaladas las siguientes herramientas a nivel de sistema operativo (estas no se instalan automáticamente con `npm install`):

### A. Entorno Base
- **Node.js (v20 o superior):** Requerido para ejecutar el entorno local, Vite y Express. Probado actualmente con versiones superiores. Descargar desde [nodejs.org](https://nodejs.org/).
- **Git:** Para el control de versiones y auditoría de cambios. Descargar desde [git-scm.com](https://git-scm.com/).

### B. Herramientas de Despliegue y Mapeo
- **Vercel CLI:** Obligatorio para ejecutar despliegues directos desde local hacia producción o preview.
  ```bash
  npm install -g vercel
  ```
- **Graphify (Clave para IA):** Herramienta que genera un Knowledge Graph (Grafo de Conocimiento) del código. Esto es **fundamental** para que la Inteligencia Artificial no pierda el contexto del proyecto y no tenga que leer todos los archivos en cada sesión.
  - El proyecto almacena sus resultados en la carpeta `graphify-out/`.
  - **Mantenimiento obligatorio:** Cada vez que se integren módulos nuevos o se hagan refactorizaciones, se debe actualizar el grafo corriendo:
    ```bash
    graphify update .
    ```

## 2. Configuración Inicial del Proyecto

Una vez que el entorno global está listo, los pasos exactos para configurar el clon local son:

1. **Instalación Centralizada de Paquetes:**
   - Ejecutar estrictamente en la raíz del proyecto. Está totalmente prohibido hacer esto dentro de módulos como `ong/`.
     ```bash
     npm install
     ```
2. **Sincronización del Entorno (`.env`):**
   - El ecosistema funciona con un único punto de verdad para las credenciales:
     ```bash
     cp .env.example .env
     ```
   - Se deben colocar los valores reales de Supabase (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`). Sin ellos, el backend aplica un "fail-fast" y destruye el arranque.

3. **Mapeo de la Base de Datos:**
   - El archivo `BD.json` ubicado en la raíz actúa como nuestro "pivote de conocimiento" para el modelo de datos real (actualizado al 21/08/2026). Cualquier alteración en Supabase debe reflejarse en este esquema.

## 3. Mantenimiento del Código y Flujo de Trabajo

Para mantener el código actualizado y libre de errores residuales de caché, el `package.json` incluye herramientas críticas de limpieza:

- **Restablecimiento del entorno:** Si los puertos se traban o Vite no refleja los cambios, limpia todo con:
  ```bash
  npm run clean
  ```
  O si es crítico, forzar reconstrucción:
  ```bash
  npm run dev:force
  ```
- **Verificación de integridad:** Antes de hacer push a producción, comprueba la salud de todos los endpoints:
  ```bash
  npm run validate
  ```
- **Chequeo de Tipos estricto:** Tras integrar ramas (módulos externos) corre siempre:
  ```bash
  npm run typecheck
  ```

## 4. Estándar de Integración Continua

Para asegurar que todo agente y desarrollador mantenga la base de código limpia:
1. No usar dependencias anidadas (Regla Core-Ramas).
2. Si cambias el código de manera estructural, actualiza el mapa del sistema con `graphify update .`.
3. Todo cambio gigante debe documentarse en la carpeta de auditoría `changes/` según lo dictan las reglas del archivo `AGENTS.md`.
