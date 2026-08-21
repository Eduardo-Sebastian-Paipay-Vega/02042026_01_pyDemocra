# REGLA GLOBAL DE DISEÑO Y ARQUITECTURA UI EN TODO EL SISTEMA

## OBJETIVO
Reestructurar la arquitectura visual y de layout de TODA la aplicación (todos los módulos y rutas) para adoptar un lenguaje de diseño Enterprise Dark uniforme, denso y compacto (estilo Democra.pro), eliminando los errores visuales globales actuales en la navegación, las métricas y la grilla.

Afecta a TODAS las rutas: `/director`, `/matricula`, `/finanzas`, `/pasaporte-digital`, `/marketplace`, `/agentes-ia`, `/analytics`, `/usuarios`, `/reportes`, `/configuracion` y subsistemas.

==================================================
1. REFACTORIZACIÓN DEL LAYOUT GLOBAL (AppLayout)
==================================================
Centralizar y limpiar la estructura base que envuelve a TODAS las páginas:

- TOP BAR (Header Superior Global):
  * MANTENER ÚNICAMENTE:
    1. Breadcrumb de navegación (`Contexto / Módulo / Vista`).
    2. Buscador global compacto y centrado.
    3. Campana de notificaciones con badge.
    4. Menú desplegable de Perfil de Usuario (Avatar + Nombre + Rol) en la ESQUINA SUPERIOR DERECHA.
  * ELIMINAR del Top Bar:
    - Logos duplicados ("D" u otros marcas).
    - Bloques de usuario repetidos en el cuerpo del header.

- SIDEBAR (Navegación Lateral Global):
  * MANTENER ÚNICAMENTE:
    1. Brand Logo del sistema educativo en la parte superior.
    2. Navegación modular estructurada por categorías con íconos Lucide compactos (16-18px).
    3. Badges contadores numéricos sutiles (ej: `3` en Matrícula, `2` en Agentes IA).
    4. Enlaces de sistema al final (Configuración, Cerrar sesión, info de clima/entorno si aplica).
  * ELIMINAR de la Sidebar:
    - Tarjeta/Bloque de avatar de usuario "Dr. Luis Mendoza" bajo el logo (ya existe en el Top Bar).
    - Bordes de selección blancos o cuadros negros gruesos desalineados.
  * ESTILO DE ÍTEM ACTIVO:
    - Fondo `bg-white/[0.08]` o `bg-zinc-800/60`.
    - Texto blanco (`text-white font-medium`).
    - Indicador sutil de selección lateral o borde suave.

==================================================
2. ERRADICACIÓN DE ERRORES VISUALES EN TODO EL SISTEMA
==================================================
Aplica las siguientes reglas obligatorias a TODOS los componentes y páginas:

- PROHIBIDO EL STRETCH HORIZONTAL EN TARJETAS DE MÉTRICAS (KPIs):
  * NINGUNA tarjeta de métrica debe ocupar el 100% del ancho en una sola fila.
  * Toda sección de indicadores DEBE envolverse obligatoriamente en un Grid Responsive:
    `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4`

- ELIMINAR CONTENEDORES / CAJAS DE ICONOS OBSOLETAS:
  * Eliminar completamente los bloques oscuros o azules cuadrados alrededor de los iconos en las cards.
  * Los iconos deben colocarse limpios sobre la superficie (`w-4 h-4 text-zinc-400` o `text-zinc-500`).

- ELIMINAR LÍNEAS DIVISORIAS QUE CRUZAN LA PANTALLA:
  * Eliminar `border-b` o elementos `<hr>` que atraviesen la pantalla de extremo a extremo.
  * Las separaciones deben lograrse mediante el fondo de las tarjetas (`bg-[#121110]`) y bordes contenidos (`border border-white/[0.08]`).

==================================================
3. ESTÁNDAR GLOBAL DE COMPONENTES BASE
==================================================

[ A ] PAGE HEADER (Encabezado de Módulo):
Todos los módulos deben iniciar con un layout flex normalizado.

[ B ] TARJETAS KPI (KpiCard):
Crear o refactorizar el componente reutilizable `<KpiCard />` para todos los módulos.

[ C ] TABLAS ENTERPRISE (DataTable):
Aplica a listados. Contenedor con borde fino, filas compactas, badges de píldoras pequeñas.

[ D ] BOTONES E INPUTS:
Botón primario azul, botón secundario fantasma con borde suave, inputs oscuros con foco azul.
