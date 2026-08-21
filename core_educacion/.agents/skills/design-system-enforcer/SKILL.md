---
name: design-system-enforcer
description: Enforces the EDUCACION OS Design System consistency. Use when creating any UI component, button, card, form, table, badge, or layout element. Prevents component duplication, ensures visual consistency through tokens, and mandates reuse of existing components before creating new ones.
---

# Design System Enforcer — EDUCACION OS

> **Prioridad: 3.** Nunca inventar componentes. Nunca duplicar estilos. Siempre reutilizar y extender el sistema de diseño existente.

---

## 🔑 1. Regla de Oro

**Antes de crear CUALQUIER componente, preguntar:**
1. ¿Ya existe este componente en `packages/ui` o `components/ui` (shadcn/ui)?
2. ¿Puedo extenderlo con variantes en lugar de crear uno nuevo?
3. ¿Puedo componerlo a partir de componentes existentes?

Solo si las tres respuestas son NO, crear uno nuevo.

---

## 🎨 2. Design Tokens Obligatorios

Los tokens de diseño deben definirse en `packages/ui/src/tokens.ts` y usar CSS variables:

```css
/* En globals.css / design-tokens.css */
:root {
  /* Colores Primarios */
  --primary: 250 95% 64%;           /* hsl - Indigo */
  --primary-foreground: 0 0% 100%;

  /* Semánticos */
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --card: 222.2 84% 4.9%;
  --border: 217.2 32.6% 17.5%;
  --muted: 217.2 32.6% 17.5%;
  --muted-foreground: 215 20.2% 65.1%;
  --accent: 217.2 32.6% 17.5%;
  --destructive: 0 62.8% 30.6%;

  /* Educacion OS Brand */
  --brand-ews: 0 84% 60%;           /* Rojo alerta EWS */
  --brand-success: 142 71% 45%;     /* Verde éxito */
  --brand-warning: 38 92% 50%;      /* Amarillo advertencia */

  /* Espaciado */
  --radius: 0.5rem;
}
```

**Nunca hardcodear colores** como `bg-[#4f46e5]` — usar `bg-primary`.

---

## 📦 3. Inventario de Componentes Base (shadcn/ui)

Estos componentes YA EXISTEN. Usar siempre antes de crear uno nuevo:

| Componente | Uso correcto |
|------------|-------------|
| `<Button>` | Toda acción de usuario — variantes: `default`, `destructive`, `outline`, `ghost`, `link` |
| `<Card>` | Contenedor de información — con `CardHeader`, `CardTitle`, `CardContent`, `CardFooter` |
| `<Badge>` | Estados, etiquetas, roles — variantes: `default`, `secondary`, `destructive`, `outline` |
| `<Table>` | Datos tabulares — con `TableHeader`, `TableBody`, `TableRow`, `TableCell` |
| `<Dialog>` | Modales — siempre con `DialogHeader`, `DialogTitle`, `DialogDescription` |
| `<Form>` | Formularios — con `FormField`, `FormLabel`, `FormControl`, `FormMessage` |
| `<Input>` | Campos de texto |
| `<Select>` | Dropdowns |
| `<Tabs>` | Navegación por pestañas |
| `<Skeleton>` | Estados de carga |
| `<Avatar>` | Fotos de usuario |
| `<Progress>` | Barras de progreso |
| `<Alert>` | Notificaciones inline |

---

## 🧩 4. Variantes en lugar de Duplicación

```tsx
// ❌ MAL: Crear un nuevo botón en lugar de usar variante
function DangerButton({ children }) {
  return <button className="bg-red-500 text-white px-4 py-2">{children}</button>;
}

// ✅ BIEN: Usar variante del sistema
<Button variant="destructive">Eliminar Estudiante</Button>

// ❌ MAL: Card personalizada sin sistema
function StatsCard({ value, label }) {
  return <div className="bg-gray-800 p-4 rounded-lg">...</div>;
}

// ✅ BIEN: Componer con los primitivos del sistema
<Card>
  <CardContent className="p-6">
    <p className="text-3xl font-bold">{value}</p>
    <p className="text-sm text-muted-foreground">{label}</p>
  </CardContent>
</Card>
```

---

## 📐 5. Sombras y Elevación

Sistema de sombras consistente (no inventar valores):

```
Nivel 0 (Flat): sin sombra → bordes con `border`
Nivel 1 (Card): `shadow-sm` → tarjetas sobre fondo
Nivel 2 (Dropdown): `shadow-md` → dropdowns, popovers
Nivel 3 (Modal): `shadow-lg` → modales y dialogs
Nivel 4 (Toast): `shadow-xl` → notificaciones flotantes
```

---

## 🔠 6. Iconografía

```tsx
// Solo usar Lucide React (integrado con shadcn/ui)
import { AlertTriangle, BookOpen, Users, TrendingDown } from 'lucide-react';

// Tamaños consistentes:
// Inline text: w-4 h-4
// Botones: w-4 h-4
// Headers: w-5 h-5
// Feature icons: w-8 h-8
// Hero icons: w-12 h-12
```

---

## ✅ Checklist Design System

- [ ] Se verificó existencia del componente antes de crearlo
- [ ] Se usan tokens CSS/Tailwind en lugar de valores hardcodeados
- [ ] Variantes usadas correctamente (no componentes paralelos)
- [ ] Sombras del sistema (no valores arbitrarios)
- [ ] Iconografía de Lucide React
- [ ] Sin duplicación de componentes en el proyecto
