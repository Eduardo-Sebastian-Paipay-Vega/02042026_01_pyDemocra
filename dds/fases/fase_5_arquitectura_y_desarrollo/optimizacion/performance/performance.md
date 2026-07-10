# Optimización y Performance

*Fuente de verdad: `vite.config.js`*

El proyecto implementa un esfuerzo explícito en la optimización del tiempo de carga (Load Time) y el manejo de recursos en el cliente.

## 1. Code Splitting Agresivo (Manual Chunks)
La configuración de Rollup en `vite.config.js` (`build.rollupOptions.output.manualChunks`) fragmenta intencionalmente las dependencias de terceros en "buckets" específicos:
*   `vendor-supabase`: El SDK pesado de Base de datos.
*   `vendor-icons`: Lucide React.
*   `vendor-mui` / `vendor-radix`: Componentes de interfaz.
*   `vendor-charts`: Recharts y D3 (usualmente muy pesados).

**Beneficio:** Evita un solo archivo masivo `vendor.js`. El navegador paraleliza las descargas, y si una página no carga gráficos, no descarga D3.

## 2. Caché Persistente Compartida
Al empaquetar de esta forma, un usuario que navega del landing page (`/`) hacia el módulo ONG (`/ong`) no vuelve a descargar el motor de React, Radix o Supabase; el navegador ya tiene los chunks cacheados, logrando tiempos de transición casi instantáneos a pesar de ser un MPA.
