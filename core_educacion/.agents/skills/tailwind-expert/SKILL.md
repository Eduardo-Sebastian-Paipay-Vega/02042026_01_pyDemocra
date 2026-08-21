---
name: tailwind-expert
description: Expert Tailwind CSS guidance for EDUCACION OS. Use when writing or reviewing any Tailwind class in components, pages, or layouts. Ensures correct utility usage, prevents class redundancy, enforces best practices for Tailwind v3/v4, and maintains readability and maintainability of class strings.
---

# Tailwind Expert — EDUCACION OS

> **Prioridad: 4.** Tailwind bien escrito es Tailwind semántico, ordenado y sin redundancias.

---

## 📋 1. Orden Canónico de Clases

Siempre aplicar clases en este orden (facilita lectura y evita especificidad inesperada):

```
1. Layout         → flex, grid, block, hidden, overflow
2. Position       → relative, absolute, fixed, sticky, z-index
3. Sizing         → w-, h-, min-w-, max-w-, aspect-
4. Spacing        → p-, m-, gap-, space-
5. Typography     → text-, font-, leading-, tracking-, truncate
6. Color          → bg-, text-, border-, ring-
7. Visual         → rounded-, shadow-, opacity-, blur-
8. Transitions    → transition-, duration-, ease-, animate-
9. States         → hover:, focus:, active:, disabled:
10. Responsive    → sm:, md:, lg:, xl:, 2xl:
11. Dark mode     → dark:
```

**Herramienta recomendada:** Usar `prettier-plugin-tailwindcss` para auto-ordenar.

---

## 🚫 2. Anti-Patrones Prohibidos

```tsx
// ❌ MAL: Clases redundantes
<div className="flex flex-row">        // flex ya implica row por defecto
<div className="text-left">           // text-left es el default
<div className="bg-transparent">      // transparent es el default en la mayoría de casos
<div className="border-0">            // sin border es el default

// ❌ MAL: Valores mágicos en lugar de tokens
<div className="mt-[13px] p-[7px]">   // Usar mt-3 o mt-4 en su lugar
<div className="w-[248px]">           // Usar w-60 (240px) o w-64 (256px)

// ❌ MAL: Duplicación de lógica responsive
<div className="text-base md:text-base lg:text-base"> // Solo text-base es suficiente
```

---

## ✅ 3. Buenas Prácticas

```tsx
// ✅ BIEN: Group hover para elementos relacionados
<div className="group">
  <div className="opacity-0 group-hover:opacity-100 transition-opacity" />
</div>

// ✅ BIEN: Peer para estados condicionales
<input className="peer" />
<label className="peer-focus:text-primary peer-invalid:text-destructive" />

// ✅ BIEN: Container queries con @container (Tailwind v3.3+)
<div className="@container">
  <div className="@sm:flex @lg:grid-cols-3" />
</div>

// ✅ BIEN: Arbitrary properties solo cuando sea necesario
<div className="[mask-image:linear-gradient(to_bottom,black,transparent)]" />
```

---

## 🎨 4. Uso de Tokens del Design System

```tsx
// ❌ MAL: Colores hardcodeados
<button className="bg-indigo-600 hover:bg-indigo-700 text-white">

// ✅ BIEN: Tokens semánticos del sistema
<button className="bg-primary hover:bg-primary/90 text-primary-foreground">

// ❌ MAL: Grises arbitrarios
<p className="text-gray-500">

// ✅ BIEN: Token semántico
<p className="text-muted-foreground">
```

---

## 📱 5. Mobile-First Correcto

```tsx
// ❌ MAL: Desktop-first (overrides innecesarios)
<div className="grid-cols-4 md:grid-cols-2 sm:grid-cols-1">

// ✅ BIEN: Mobile-first (solo añadir, no sobreescribir)
<div className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
```

---

## 🔄 6. Variantes con `cn()` (clsx + tailwind-merge)

```tsx
import { cn } from '@/lib/utils';

// ✅ Siempre usar cn() para clases condicionales
function StatusBadge({ status }: { status: 'active' | 'risk' | 'inactive' }) {
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
      status === 'active' && 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      status === 'risk' && 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      status === 'inactive' && 'bg-muted text-muted-foreground',
    )}>
      {status}
    </span>
  );
}
```

---

## ✅ Checklist Tailwind

- [ ] Clases en orden canónico (o usar prettier-plugin-tailwindcss)
- [ ] Sin clases redundantes o que repiten el default
- [ ] Sin valores mágicos (`[13px]`) salvo casos justificados
- [ ] Usando tokens semánticos (`bg-primary`, `text-muted-foreground`)
- [ ] Mobile-first (clases base para mobile, `sm:` `md:` `lg:` para escalado)
- [ ] `cn()` para clases condicionales
