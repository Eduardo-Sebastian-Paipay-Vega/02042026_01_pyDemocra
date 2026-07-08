# Plan de Integración UI/UX: Rutas Públicas ONG y Landing Page

Este documento define la estrategia para resolver la desconexión visual y de accesibilidad entre la **Landing Page principal** (`/`) y las **vistas públicas del módulo ONG** (`/ong/join` y `/ong/signup`).

---

## 📋 1. Auditoría de Componentes de Navegación Pública

### Integración en Navbar y Footer (Landing Page)
Actualmente, las rutas `/ong/join` y `/ong/signup` están aisladas y carecen de un punto de entrada público (orphan pages). 

**Estrategia de Exposición:**
1. **Navbar (Desktop & Mobile):** 
   - No sobrecargaremos el menú principal (`Producto`, `Cómo funciona`, etc.). 
   - Añadiremos un menú desplegable (Dropdown) llamado **"Comunidad"** o **"Accesos"** junto a "Iniciar sesión".
   - En versión móvil, se añadirán como enlaces claros debajo de un separador en el menú hamburguesa.
2. **Footer:**
   - Crearemos una nueva columna llamada **"Participa"** o **"Accesos Directos"**.
   - Incluiremos enlaces explícitos a: `Canjear Código de Acceso`, `Registro de Voluntarios` y `Portal de Organizaciones`.

> [!WARNING]
> **Detalle Arquitectónico Crítico:** Dado que el proyecto es una aplicación multi-página (MPA) configurada en Vite (`/` sirve `src/index.html` y `/ong/` sirve `ong/index.html`), los enlaces desde la Landing Page hacia `/ong/join` **deben usar etiquetas ancla HTML estándar (`<a href="...">`)** y no `<Link>` de React Router. Esto obligará al navegador a cargar el entrypoint correcto de la ONG.

### Mapeo de Estilos Actuales (Desconexión Visual)
Se identificaron diferencias drásticas en la implementación UI:
- **Landing Page (`src/`):** Utiliza un diseño inmersivo (Dark mode puro, fondos con `GradientBackground`, `CursorSpotlight`, componentes reutilizables como `Button`, efectos `glassmorphism` avanzados).
- **ONG Pública (`ong/src/`):** Utiliza un fondo estático (`bg-[#070707]`), re-inventa componentes (`GlassCard`, `PillButton`) y no importa el `Navbar` ni el `Footer` global. Las páginas se ven funcionales pero disonantes respecto al branding "premium" de la Landing.

---

## 🎨 2. Unificación Estética (Sistema de Diseño Compartido)

La meta es que el usuario no note que cambió de aplicación (entrypoint) al navegar desde la Landing hacia `/ong/join`.

### Estrategia Técnica: `PublicLayout` Compartido
Aprovechando que Vite permite alias entre directorios (`@/` para `src/` y `@ong/` para `ong/src/`), unificaremos las vistas mediante un Layout público en el módulo ONG.

1. **Creación de `ong/src/app/components/layout/PublicLayout.tsx`:**
   - Este wrapper importará directamente el `<Navbar>` y `<Footer>` de `@/pages/landing/components/`.
   - Incluirá el fondo inmersivo (`<GradientBackground>` y `<CursorSpotlight>`).
   - Renderizará un `<Outlet />` de React Router para inyectar los formularios.

2. **Refactorización de Formularios (`AccessCodeRedeemPage` y `VolunteerRegistrationPage`):**
   - Se eliminarán los contenedores estáticos (`min-h-screen bg-[#070707]`).
   - Se reemplazarán los inputs crudos (`textInputClass`) y botones duplicados (`PillButton`) por la adopción de los tokens de estilo, bordes y fuentes tipográficas usadas en la Landing.
   - Las tarjetas (`GlassCard`) mantendrán la estructura de formulario pero con bordes reactivos e iluminación alineados a los de la Landing (`rgba(0,85,255,0.12)` etc.).

---

## 🛠️ 3. Historial de Cambios y Ruta de Desarrollo

Para ejecutar esta integración con seguridad, dividiremos el trabajo en 3 fases:

### Fase 1: Enlaces y Accesibilidad (Landing Page)
- [x] Modificar `src/pages/landing/components/Navbar.tsx` para incluir un Dropdown/Submenú con enlaces hacia `/ong/join` y `/ong/signup`.
- [x] Modificar el componente `Footer` (en la Landing) para agregar la columna "Accesos Directos".
- [x] Garantizar el uso de `<a href="/ong/join">` para permitir la transición fluida de MPA.

### Fase 2: Layout y Refactorización UI/UX (Módulo ONG)
- [x] Crear el componente `PublicLayout.tsx` en `ong/src/app/components/layout/`.
- [x] Modificar `ong/src/app/routes.tsx` envolviendo los paths `/join`, `/signup` y `/landing/register` dentro de este `<PublicLayout>`.
- [x] Actualizar `AccessCodeRedeemPage.tsx`: Adaptar el estilo para que resida armónicamente dentro del nuevo Layout.
- [x] Actualizar `VolunteerRegistrationPage.tsx`: Aplicar tokens tipográficos (`font-display`, `Sora`) y paletas compartidas de la Landing.

### Fase 3: Pruebas Visuales y de Integración
- [x] **Desktop & Mobile:** Verificar que el Navbar y Footer se rendericen idénticos tanto en la raíz como dentro del ecosistema ONG.
- [x] **Validación Formularios:** Asegurar que los `onChange` y llamados asíncronos (`loadPreview`, `submit`) de la lógica del formulario original sigan funcionando sin alteraciones tras el re-estilizado.
- [x] **Responsive:** Revisar que los modales y tarjetas tengan un padding adecuado en pantallas móviles.
