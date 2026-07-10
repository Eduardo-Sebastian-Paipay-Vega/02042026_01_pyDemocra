# Estilo, Look and Feel y Mocking (UI/UX)

*Fuente de verdad: `package.json`, `vite.config.js`*

## 1. Estilizado General (Look and Feel)
*   **Motor CSS:** Tailwind CSS v4 (`@tailwindcss/vite`). Al utilizar la versión 4, el proyecto descansa fuertemente sobre el JIT compiler y las variables CSS modernas en lugar de extensos archivos de configuración JS.
*   **Fusión de Clases:** Se utiliza `clsx` y `tailwind-merge`. Esto es un indicador directo de que el proyecto construye componentes reutilizables donde las propiedades `className` pasadas por el consumidor pueden sobreescribir las clases base (un patrón típico para evitar conflictos de especificidad en Tailwind).

## 2. Visualización de Datos
*   **Gráficos:** El proyecto incorpora `recharts`, una librería basada en D3 diseñada específicamente para React. Esto sostiene el módulo de métricas y tableros (dashboards) gerenciales.

## 3. Mocking
La carpeta de Mocking está planificada en el DDS para alojar diseños o prototipos de datos simulados (JSON). Sin embargo, el repositorio actual no presenta un servidor de mocks dedicado (tipo MSW - Mock Service Worker) ya que el desarrollo depende de una conexión directa a proyectos de Supabase (local o en la nube). 

*Nota:* Se recomienda a futuro la integración de MSW para pruebas unitarias de componentes aislados que dependen del API de Express.
