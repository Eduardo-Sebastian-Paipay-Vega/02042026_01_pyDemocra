---
name: accessibility-expert
description: WCAG 2.1 AA accessibility enforcement for EDUCACION OS. Use when creating any form, button, navigation, modal, table, chart, or interactive element. Ensures keyboard navigation, screen reader compatibility, ARIA labels, focus management, and inclusive design. Non-negotiable for any enterprise educational platform.
---

# Accessibility Expert — EDUCACION OS

> **Prioridad: 5.** Accesibilidad no es opcional. EDUCACION OS sirve a estudiantes, docentes y familias con diversas capacidades. WCAG 2.1 AA es el mínimo exigible.

---

## ⌨️ 1. Navegación por Teclado

**Regla absoluta:** Todo lo que se puede hacer con mouse, debe poder hacerse con teclado.

```tsx
// ✅ Skip link al inicio de cada página (para usuarios de teclado)
<a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-primary text-primary-foreground px-4 py-2 rounded">
  Saltar al contenido principal
</a>

// ✅ Focus order lógico (seguir el flujo visual de la página)
// Usar tabIndex solo cuando sea absolutamente necesario (valor > 0 es anti-patrón)

// ✅ Trampas de foco en modales
// shadcn/ui Dialog ya maneja esto automáticamente con Radix UI
```

---

## 🏷️ 2. Semántica HTML Correcta

```tsx
// ❌ MAL: div para todo
<div onClick={handleClick} className="cursor-pointer">Ver más</div>

// ✅ BIEN: elemento semántico correcto
<button type="button" onClick={handleClick}>Ver más</button>
<a href="/estudiantes/123">Ver estudiante</a>

// ✅ Landmarks semánticos
<header role="banner">...</header>
<nav aria-label="Navegación principal">...</nav>
<main id="main-content">...</main>
<aside aria-label="Filtros">...</aside>
<footer role="contentinfo">...</footer>
```

---

## 🔊 3. ARIA Labels y Descripciones

```tsx
// ✅ Botones con solo icono DEBEN tener aria-label
<button aria-label="Cerrar modal" onClick={onClose}>
  <X className="h-4 w-4" />
</button>

// ✅ Formularios con mensajes de error
<div role="alert" aria-live="polite">
  {error && <p className="text-destructive text-sm">{error}</p>}
</div>

// ✅ Tablas de datos
<table>
  <caption className="sr-only">Lista de estudiantes en riesgo EWS</caption>
  <thead>
    <tr>
      <th scope="col">Nombre</th>
      <th scope="col">Nivel de riesgo</th>
      <th scope="col" aria-sort="descending">Fecha de alerta</th>
    </tr>
  </thead>
</table>

// ✅ Gráficos y visualizaciones
<figure>
  <figcaption id="chart-desc">Distribución de riesgo EWS por grado</figcaption>
  <div role="img" aria-labelledby="chart-desc">
    <RiskDistributionChart />
  </div>
</figure>
```

---

## 📊 4. Contraste de Color (WCAG AA)

| Combinación | Ratio mínimo |
|-------------|-------------|
| Texto normal (< 18pt) | 4.5 : 1 |
| Texto grande (≥ 18pt o 14pt bold) | 3 : 1 |
| Componentes UI (botones, inputs) | 3 : 1 |
| Texto decorativo | Sin requisito |

**Herramientas para verificar:**
- Chrome DevTools → Accessibility → Color Contrast
- Extension: axe DevTools
- Sitio: https://webaim.org/resources/contrastchecker/

---

## 📝 5. Formularios Accesibles

```tsx
// ✅ Siempre asociar label con input (nunca usar solo placeholder)
<FormField
  name="student_id"
  render={({ field }) => (
    <FormItem>
      <FormLabel>ID del Estudiante</FormLabel>  {/* Visible, no solo placeholder */}
      <FormControl>
        <Input
          {...field}
          placeholder="Ej: 2024-001"
          aria-describedby="student-id-help"
        />
      </FormControl>
      <FormDescription id="student-id-help">
        Ingresa el código único del estudiante del sistema ERP.
      </FormDescription>
      <FormMessage />  {/* aria-live automático con react-hook-form */}
    </FormItem>
  )}
/>

// ✅ Campos obligatorios marcados
<FormLabel>Nombre <span aria-hidden="true">*</span>
  <span className="sr-only">(requerido)</span>
</FormLabel>
```

---

## 🎨 6. No Depender Solo del Color

```tsx
// ❌ MAL: Solo color para indicar estado
<span className="text-red-500">•</span>

// ✅ BIEN: Color + ícono + texto
<span className="flex items-center gap-1 text-destructive">
  <AlertTriangle className="h-4 w-4" aria-hidden="true" />
  <span>Riesgo Alto</span>
</span>
```

---

## 🔔 7. Live Regions para Actualizaciones Dinámicas

```tsx
// ✅ Anunciar cambios dinámicos a lectores de pantalla
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {successMessage}
</div>

// Para errores críticos usar aria-live="assertive"
<div role="alert" aria-live="assertive" className="sr-only">
  {criticalError}
</div>
```

---

## ✅ Checklist Accesibilidad

- [ ] Skip links al contenido principal
- [ ] Todos los elementos interactivos son elementos nativos HTML (o tienen role + tabIndex)
- [ ] Botones de solo icono tienen `aria-label`
- [ ] Formularios con `<label>` visible asociado (no solo placeholder)
- [ ] Mensajes de error con `role="alert"` o `aria-live`
- [ ] Tablas con `scope`, `caption`, y `aria-sort`
- [ ] Contraste WCAG AA verificado
- [ ] Estado no comunicado solo por color
- [ ] Gráficos tienen descripción de texto alternativa
- [ ] Modales con trampa de foco
