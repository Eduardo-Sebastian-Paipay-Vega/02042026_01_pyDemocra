# CHANGELOG — Refactorización UI Paso 2 y Guardia de Navegación Onboarding

**Fecha y hora:** 2026-07-30 18:35 (GMT-5)  
**Módulo:** Onboarding / Create Tenant (`/ong/create`)  
**Estado:** Completado 100% — Pruebas Vitest (3/3) y Jest (32/32) Pasadas

---

### Contexto y Motivo
Se refactorizó la interfaz del Paso 2 (Identidad del Representante Legal) para resolver problemas de inconsistencia de estilos en autocompletado de navegador, sincronizar el Navbar superior con la Landing Page principal y enriquecer la experiencia de usuario con validación RENIEC, medidor de fortaleza de contraseña e interceptación de navegación no guardada.

---

### Solución Implementada
1. **Guardia de Navegación No Guardada:**
   - Intercepta clics en los enlaces del Navbar (`/`, `/#producto`, `/login`, etc.) cuando el formulario contiene datos no guardados.
   - Despliega modal de confirmación con opciones `[ Cancelar ]` y `[ Salir sin guardar ]`.

2. **Corrección de CSS para Autocompletado (Dark Mode):**
   - Reglas `-webkit-autofill` estrictas inyectadas en `index.css` y `styles.css` para evitar fondos amarillos/blancos en Chrome/Safari.

3. **Validación DNI RENIEC & Fortaleza de Contraseña:**
   - Botón `[ 🔍 Validar ]` junto al Número de Documento para consulta/autocompletado desde RENIEC.
   - Toggle de visibilidad de contraseña con icono de ojo (`Eye`/`EyeOff`).
   - Medidor dinámico de Fortaleza de Contraseña (Débil, Media, Fuerte) con checklist.
   - Checkboxes de notificaciones por WhatsApp y copia de resumen por correo.

4. **Stepper e Indicador de Tiempo:**
   - Header `Paso 2 de 5 • ⏱️ ~4 min restantes`.
   - Pasos interactivos clickeables para navegación hacia atrás.
