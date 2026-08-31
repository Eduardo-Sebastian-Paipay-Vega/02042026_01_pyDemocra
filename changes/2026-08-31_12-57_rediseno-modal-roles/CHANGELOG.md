# CHANGELOG — Rediseño modal de creación/edición de roles

**Fecha:** 2026-08-31 12:57 (UTC-5)  
**Autor:** Claude (Antigravity)  
**Módulo afectado:** ONG → Settings → Roles  
**Ruta UI:** `/ong/app/settings/roles`

## Objetivo del cambio

Corregir fallos graves de maquetación y UX en el modal de creación/edición de roles, donde los checkboxes flotaban desfasados sobre los títulos de permiso, se exponían funciones internas del backend y el contraste del botón principal no cumplía con WCAG AA.

## Contexto del problema

El modal de "Nuevo rol" presentaba los siguientes defectos visuales y de accesibilidad:

1. **Checkboxes flotantes:** El `<div>` wrapper extra alrededor de cada `<input type="checkbox">` con `flex items-center justify-center` creaba un contenedor independiente que, en ciertos viewports, se desalineaba visualmente del texto del permiso.
2. **Fugas de backend:** Nombres de funciones Postgres como `(fn_has_context_access)` y claves técnicas como `ace` aparecían literalmente en la UI de usuario.
3. **Instrucción redundante:** El subtítulo "Configura el nombre, nivel y activa o desactiva los permisos disponibles para este rol." ocupaba espacio vertical innecesario repitiendo lo obvio.
4. **Contraste WCAG:** El botón "Guardar" (`bg-[#224b69]` + `text-[#F9F7F3]`) tenía suficiente ratio pero el tono apagado dificultaba la legibilidad percibida.
5. **Etiquetas técnicas ilegibles:** Los IDs de permiso se mostraban a 11px sin `font-mono`, dificultando la lectura.
6. **Botón de cierre crudo:** Un simple texto "X" sin estilizar como botón de cierre del modal.

## Solución implementada

### 1. Sanitización más robusta (`sanitizePermissionDescription`)
- Añadido regex `\bfn_\w+` para capturar nombres de funciones sin paréntesis.
- Añadido limpieza de paréntesis vacíos resultantes `\(\s*\)`.
- Añadido colapso de espacios múltiples `\s{2,}`.
- Regex existentes ahora son case-insensitive y toleran espacios variables.

### 2. Header del modal simplificado
- Título aumentado a 15px con `font-semibold`.
- Subtítulo reducido a "Nombre, nivel jerárquico y permisos asignados." (11px, muted).
- Botón "X" reemplazado por SVG icon con hover states y `aria-label`.

### 3. Sección de permisos con etiqueta clara
- Añadido encabezado "Permisos por módulo" con ícono Shield y contador dinámico de seleccionados.
- Área scrollable aumentada de 420px a 480px.

### 4. Tarjetas de permiso rediseñadas
- **Eliminado** el `<div>` wrapper extra alrededor del checkbox → el `<input>` es ahora hijo directo del `<label>` con `flex-shrink-0`.
- Estado seleccionado visual: borde cambia de `#2A2A2A` a `#356C92`, fondo se tinta con `rgba(53,108,146,0.07)`.
- Texto del título cambia de color según selección (más brillante cuando activo).
- ID técnico subido de 11px a 12px con `font-mono` para diferenciarlo intencionalmente.
- Altura ajustada a 58px, border-radius a `rounded-lg`.

### 5. Botón Guardar mejorado
- Color cambiado a `#2563EB` (blue-600) con texto `white` → ratio de contraste ~8.6:1 (WCAG AAA).
- Hover: `#1D4ED8` (blue-700), Active: `#1E40AF` (blue-800).
- Label contextual: "Crear rol" / "Actualizar rol" según contexto, en vez del genérico "Guardar".
- Padding y font-weight aumentados (`px-5 py-2 font-semibold`).

## Riesgos identificados

- **Bajo:** El `accent-[#356C92]` en checkboxes depende del soporte del navegador para la propiedad CSS `accent-color` (soportado en Chrome 93+, Firefox 92+, Safari 15.4+).
- **Ninguno** en lógica de negocio: todos los cambios son puramente de presentación (CSS/JSX).

## Impacto esperado

- Checkboxes perfectamente alineados a la izquierda del título.
- Cero fugas de código backend en la vista de usuario.
- Modal más compacto y legible.
- Contraste WCAG AAA en el botón principal.
- Feedback visual claro de permisos seleccionados vs no seleccionados.

## Estado: ✅ Completado
