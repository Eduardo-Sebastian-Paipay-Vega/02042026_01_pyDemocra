---
name: responsive-expert
description: Responsive design expert for EDUCACION OS. Use when creating any layout, page, or component that must work across screen sizes. Enforces Mobile-First strategy (320px to 4K), fluid typography, adaptive layouts, and proper breakpoint usage. Mandatory for all UI work.
---

# Responsive Expert — EDUCACION OS

> **Prioridad: 6.** EDUCACION OS debe funcionar en: teléfonos de docentes (320px), tablets administrativas (768px), laptops de coordinadores (1280px) y monitores de sala de reuniones (1920px+).

---

## 📐 1. Estrategia Mobile-First Obligatoria

```
Mobile First = diseñar desde el breakpoint más pequeño y escalar hacia arriba.
Nunca diseñar desktop-first y luego "adaptar" para mobile.
```

**Breakpoints de Tailwind (referencia):**

| Token | Ancho | Dispositivo típico |
|-------|-------|-------------------|
| (base) | < 640px | Smartphone (320px - 640px) |
| `sm:` | ≥ 640px | Tablet pequeño |
| `md:` | ≥ 768px | Tablet / landscape |
| `lg:` | ≥ 1024px | Laptop |
| `xl:` | ≥ 1280px | Desktop |
| `2xl:` | ≥ 1536px | Desktop grande / TV |

---

## 📱 2. Grid Responsivo Estándar

```tsx
// ✅ Patrón base para dashboards EDUCACION OS
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
  {/* Stats cards */}
</div>

// ✅ Layout de 2 columnas con sidebar
<div className="flex flex-col lg:flex-row gap-6">
  <aside className="w-full lg:w-64 xl:w-80 flex-shrink-0">
    <Sidebar />
  </aside>
  <main className="flex-1 min-w-0"> {/* min-w-0 evita desbordamiento en flex */}
    <Content />
  </main>
</div>

// ✅ Tabla responsiva (scroll horizontal en mobile)
<div className="overflow-x-auto rounded-lg border">
  <Table className="min-w-[640px]">
    ...
  </Table>
</div>
```

---

## 🔡 3. Tipografía Fluida

```tsx
// ✅ Escalar tipografía con breakpoints
<h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold">
  Dashboard EWS
</h1>

// ✅ Para textos de héroe/landing (fluid typography)
<h1 className="text-[clamp(1.75rem,4vw,3.5rem)] font-bold leading-tight">
  Educación que predice, previene y personaliza.
</h1>
```

---

## 🧩 4. Componentes Adaptativos por Tamaño

```tsx
// ✅ Sidebar colapsable a drawer en mobile
function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex">
      {/* Overlay sidebar en mobile */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="lg:hidden w-64">
          <Sidebar />
        </SheetContent>
      </Sheet>

      {/* Sidebar permanente en desktop */}
      <aside className="hidden lg:flex w-64 flex-col">
        <Sidebar />
      </aside>

      <main className="flex-1">...</main>
    </div>
  );
}

// ✅ Menú hamburguesa en mobile, nav horizontal en desktop
<nav>
  <div className="flex lg:hidden">
    <MobileMenuButton />
  </div>
  <div className="hidden lg:flex gap-6">
    <NavLinks />
  </div>
</nav>
```

---

## 🖼️ 5. Imágenes y Media Responsivos

```tsx
// ✅ Next.js Image component siempre
import Image from 'next/image';

<Image
  src="/hero-educacion.jpg"
  alt="Estudiantes en plataforma EDUCACION OS"
  fill
  sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
  className="object-cover"
  priority // Solo para imágenes above-the-fold
/>

// ✅ Aspect ratios para embeds
<div className="aspect-video w-full">
  <iframe className="w-full h-full" src="..." />
</div>
```

---

## 📊 6. Gráficos y Dashboards Responsivos

```tsx
// ✅ Recharts con ResponsiveContainer siempre
import { ResponsiveContainer, AreaChart, Area } from 'recharts';

<ResponsiveContainer width="100%" height={300}>
  <AreaChart data={data}>
    ...
  </AreaChart>
</ResponsiveContainer>
```

---

## 🚫 7. Anti-Patrones Prohibidos

- ❌ Anchos fijos en px para layouts: `w-[1200px]`
- ❌ Posición absoluta para layouts de página
- ❌ `overflow-hidden` en contenedores que hacen scroll
- ❌ Fuentes fijas sin escalar en viewports pequeños
- ❌ Tablas sin `overflow-x-auto` en contenedor
- ❌ Media queries custom en CSS cuando Tailwind breakpoints son suficientes

---

## ✅ Checklist Responsivo

- [ ] Probado en 320px (mobile pequeño)
- [ ] Probado en 768px (tablet)
- [ ] Probado en 1280px (laptop)
- [ ] Probado en 1920px (desktop)
- [ ] Tipografía escala apropiadamente
- [ ] Tablas con scroll horizontal en mobile
- [ ] Sidebar se convierte en drawer en mobile
- [ ] Imágenes con `sizes` apropiado en Next.js
- [ ] Gráficos con `ResponsiveContainer`
- [ ] Sin anchos fijos en el layout
