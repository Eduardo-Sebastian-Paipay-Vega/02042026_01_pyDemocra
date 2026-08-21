---
name: browser-testing
description: Visual browser testing for EDUCACION OS. Use when validating UI changes, comparing before/after, verifying responsive behavior, or checking visual regressions. Leverages the browser_subagent tool for screenshots, interaction testing, and visual verification. Trigger when a user asks to "verify", "check", "show me", "test visually", or after any significant UI implementation.
---

# Browser Testing — EDUCACION OS

> **Prioridad: 7.** Ver es creer. Siempre verificar visualmente el resultado antes de declarar una tarea como terminada.

---

## 🔍 1. Cuándo Activar Esta Skill

Activar automáticamente cuando:
- Se implementa una nueva página o componente significativo
- Se modifica un layout existente
- Se solicita "verificar", "revisar", "mostrar cómo queda"
- Se completa una tarea de responsive design
- Se implementa dark mode o temas
- Se necesita comparación antes/después

---

## 📸 2. Protocolo de Verificación Visual

### Paso 1: Captura Desktop (1280px)
```
Tarea para browser_subagent:
1. Abrir http://localhost:3000 (o la ruta indicada)
2. Tomar screenshot completo de la página
3. Verificar: jerarquía visual, espaciado, tipografía, colores
4. Reportar cualquier elemento que se vea mal alineado o roto
```

### Paso 2: Verificación Mobile (390px)
```
Tarea para browser_subagent:
1. Redimensionar viewport a 390x844 (iPhone 14)
2. Tomar screenshot de la misma página
3. Verificar: menú hamburguesa, tablas con scroll, tipografía legible
4. Verificar que no haya scroll horizontal no deseado
```

### Paso 3: Verificación Dark Mode
```
Tarea para browser_subagent:
1. Activar dark mode (click en toggle o via DevTools)
2. Tomar screenshot
3. Verificar contraste y que no haya elementos "rotos" en dark mode
```

---

## 🛠️ 3. Uso del browser_subagent

```
SIEMPRE que se use el browser_subagent, especificar:
- URL exacta a visitar
- Acciones a realizar (scroll, click, hover)
- Condición de retorno clara (qué screenshots tomar)
- RecordingName descriptivo en snake_case
```

---

## 📊 4. Lista de Verificación Visual

Para cada pantalla implementada, verificar con screenshot:

| Elemento | ¿Qué verificar? |
|----------|----------------|
| **Espaciado** | Márgenes consistentes, sin elementos pegados |
| **Tipografía** | Jerarquía clara, tamaños apropiados |
| **Colores** | Sistema de color del DDS, contraste suficiente |
| **Alineación** | Grid correcto, sin desalineaciones |
| **Estados** | Hover, focus visible, disabled correcto |
| **Loading** | Skeleton/spinner en lugar de pantalla vacía |
| **Vacío** | Empty state con mensaje y CTA |
| **Mobile** | Layout no roto, texto legible |

---

## 🔄 5. Comparación Antes/Después

Cuando se realiza un cambio visual:
1. Capturar screenshot ANTES del cambio
2. Implementar el cambio
3. Capturar screenshot DESPUÉS
4. Comparar y reportar en el walkthrough.md

---

## ⚡ 6. Testing de Interacciones

```
Para validar interacciones con browser_subagent:
1. Click en botones (verificar hover state)
2. Abrir modales (verificar animación y trampa de foco)
3. Navegación entre páginas (verificar transiciones)
4. Formularios: verificar validación y mensajes de error
5. Filtros y búsqueda: verificar que actualizan la UI
```

---

## ✅ Checklist de Browser Testing

- [ ] Screenshot desktop (1280px) tomado
- [ ] Screenshot mobile (390px) tomado
- [ ] Screenshot dark mode tomado
- [ ] No hay scroll horizontal no deseado en mobile
- [ ] Transiciones suaves (sin flicker)
- [ ] Estados de loading/empty/error visibles
- [ ] Formularios validados visualmente
- [ ] Navegación funcional
