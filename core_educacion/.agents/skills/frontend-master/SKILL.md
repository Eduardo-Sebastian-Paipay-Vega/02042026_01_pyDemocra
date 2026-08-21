---
name: frontend-master
description: Master orchestrator for all Frontend/UI work in EDUCACION OS. Activates automatically for ANY task involving UI, components, pages, dashboards, layouts, forms, tables, or visual design. Coordinates all other frontend skills in priority order and enforces non-negotiable quality gates. This is the primary entry point for all frontend development tasks.
---

# Frontend Master — EDUCACION OS

> **Skill Maestra. Prioridad: ABSOLUTA.**
> Se activa automáticamente en CUALQUIER tarea relacionada con Frontend, UI, componentes, páginas, layouts, o diseño visual.
> Coordina las 10 skills de Frontend y garantiza que el resultado sea de **nivel profesional enterprise**.

---

## ⚡ 1. Activación Automática

Esta skill se activa cuando la tarea menciona cualquiera de estos términos:
- "componente", "component", "pantalla", "screen", "página", "page"
- "dashboard", "panel", "table", "tabla", "formulario", "form"
- "diseño", "design", "layout", "UI", "UX", "interfaz", "interface"
- "botón", "card", "modal", "sidebar", "nav", "header", "footer"
- "Landing", "hero", "SaaS", "admin", "portal"
- "Next.js", "React", "Tailwind", "shadcn"

---

## 🎯 2. Orden de Ejecución de Skills

Cuando se implementa cualquier componente o página, aplicar las skills en este orden:

```
1. ui-ux-pro          → Jerarquía visual, colores, espaciado, estados
2. react-design-patterns → Arquitectura, composición, hooks
3. design-system-enforcer → Reutilización, tokens, no duplicar
4. tailwind-expert    → Clases correctas, mobile-first, cn()
5. accessibility-expert → ARIA, teclado, contraste WCAG AA
6. responsive-expert  → 320px → 4K, fluid layout, tablas móvil
7. browser-testing    → Verificación visual con screenshots
8. modern-web-guidance → Core Web Vitals, SEO, Lighthouse ≥ 95
9. frontend-code-review → TypeScript, performance, bundle
10. shadcn-ui-expert  → Componentes correctos, cva(), formularios
```

---

## 🚧 3. Guardrails Estrictos (No Negociables)

### ❌ PROHIBIDO ABSOLUTAMENTE:
1. **Grid absoluto:** Nunca usar `position: absolute` para crear layouts de página. Usar CSS Grid o Flexbox.
2. **Componentes duplicados:** Nunca crear un componente que ya existe en shadcn/ui o en `components/ui/`.
3. **Colores hardcodeados:** Nunca `bg-[#4f46e5]`, `text-[#ffffff]`. Siempre tokens del sistema.
4. **Sin estados de carga:** Nunca dejar pantalla en blanco durante fetching. Siempre `<Skeleton />`.
5. **Sin estados vacíos:** Nunca dejar una lista vacía sin componente de empty state.
6. **Sin estados de error:** Nunca silenciar errores. Siempre mostrar mensaje + acción.
7. **`any` en TypeScript:** Prohibido. Tipos correctos o `unknown` + type guard.
8. **Prop drilling > 2 niveles:** Usar Context o Zustand.
9. **Desktop-first:** Todo responsive es Mobile-First (base → `sm:` → `md:` → `lg:` → `xl:`).
10. **Sin Dark Mode:** Todo componente debe funcionar en light y dark mode.

---

## ✅ 4. Quality Gates (Puertas de Calidad)

Antes de considerar TERMINADA cualquier tarea frontend, verificar:

### Diseño Visual
- [ ] El resultado "parece diseñado en Figma" (no como un MVP crudo)
- [ ] Jerarquía tipográfica clara (H1 → H2 → body → caption)
- [ ] Espaciado en múltiplos de 4px, consistente
- [ ] Dark mode funcional
- [ ] Sin colores hardcodeados (todo tokens del sistema)

### Funcionalidad
- [ ] Estado de carga implementado (Skeleton o Spinner)
- [ ] Estado vacío implementado (Empty State con ilustración + mensaje + CTA)
- [ ] Estado de error implementado (mensaje claro + botón de reintentar)
- [ ] Estado de éxito implementado (confirmación visual)

### Técnico
- [ ] Sin `any` en TypeScript
- [ ] Sin `console.log` en código
- [ ] Componentes en carpeta correcta según arquitectura feature-based
- [ ] DTOs de `@educacion/shared-types` en lugar de tipos duplicados

### Responsive
- [ ] Layout no roto en 320px (mobile pequeño)
- [ ] Layout correcto en 768px (tablet)
- [ ] Layout correcto en 1280px (laptop)

### Accesibilidad
- [ ] Todos los botones de icono tienen `aria-label`
- [ ] Formularios con `<label>` visible
- [ ] Focus ring visible (`focus-visible:ring-2`)
- [ ] Estados no comunicados solo por color

### Performance
- [ ] Imágenes con `next/image`
- [ ] Lighthouse ≥ 95 (verificar antes de PR)

---

## 🎨 5. Estándar Visual EDUCACION OS

**El diseño de EDUCACION OS debe transmitir:**
- **Confianza institucional:** Limpio, organizado, profesional
- **Inteligencia:** Datos bien presentados, visualizaciones claras
- **Accesibilidad:** Fácil para docentes con poca experiencia digital
- **Urgencia controlada:** Alertas EWS claras pero no alarmistas

**Paleta de referencia:**
```
Primary:     Indigo oscuro (hsl(250, 95%, 64%)) — acción, navegación
Success:     Verde esmeralda — datos positivos, completado
Warning:     Ámbar — advertencias, riesgo medio
Danger:      Rojo — alertas EWS críticas, eliminar
Neutral:     Grises HSL — texto secundario, bordes
Background:  Slate oscuro en dark, blanco frío en light
```

---

## 🔄 6. Flujo de Trabajo Estándar

Para cada tarea Frontend:

```
1. ANALIZAR → Entender qué se necesita, identificar componentes reutilizables
2. PLANIFICAR → ¿Qué skills aplican? ¿Qué existe ya?
3. IMPLEMENTAR → Código con todos los guardrails aplicados
4. VERIFICAR → Screenshots con browser_subagent
5. REVISAR → Checklist de quality gates
6. REPORTAR → Actualizar walkthrough.md con resultado
```

---

## 📋 7. Referencia Rápida de Skills

| Skill | Trigger Principal |
|-------|------------------|
| ui-ux-pro | Cualquier componente nuevo |
| react-design-patterns | Arquitectura de feature/componente |
| design-system-enforcer | "¿Ya existe este componente?" |
| tailwind-expert | Escribir/revisar clases CSS |
| accessibility-expert | Forms, tables, modales, navs |
| responsive-expert | Layouts, páginas completas |
| browser-testing | Tras implementar cualquier UI |
| modern-web-guidance | Performance, SEO, Core Web Vitals |
| frontend-code-review | Review, PR, refactor |
| shadcn-ui-expert | Formularios, tablas, variantes |
