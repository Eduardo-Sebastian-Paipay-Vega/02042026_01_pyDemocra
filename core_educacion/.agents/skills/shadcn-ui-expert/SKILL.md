---
name: shadcn-ui-expert
description: Expert guidance for shadcn/ui and Radix UI components in EDUCACION OS. Use when installing, customizing, or extending shadcn/ui components. Covers correct CLI usage, theming, variant creation with cva(), component composition, and integration with Radix UI primitives. Always prefer shadcn/ui over custom implementations.
---

# Shadcn/UI Expert — EDUCACION OS

> **Prioridad: 10.** shadcn/ui + Radix UI es el sistema de componentes base de EDUCACION OS. No reinventar la rueda.

---

## 📦 1. Instalación de Componentes

```bash
# shadcn/ui CLI (desde apps/web/)
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add dialog
npx shadcn@latest add form
npx shadcn@latest add table
npx shadcn@latest add data-table  # Con TanStack Table integrado

# Instalar múltiples a la vez
npx shadcn@latest add badge input select tabs skeleton alert avatar progress toast
```

---

## 🎨 2. Theming con CSS Variables

```css
/* apps/web/src/app/globals.css */
/* Los colores de shadcn usan HSL sin hsl() wrapper en Tailwind */

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --primary: 250 95% 64%;        /* Indigo — EDUCACION OS brand */
    --primary-foreground: 0 0% 100%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 250 95% 64%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    /* ... colores dark mode ... */
  }
}
```

---

## 🧩 3. Variantes con `cva()` (Class Variance Authority)

```tsx
// ✅ Extender componentes con variantes tipadas
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const riskBadgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
  {
    variants: {
      level: {
        high:   'bg-destructive/15 text-destructive border border-destructive/30',
        medium: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30',
        low:    'bg-green-500/15 text-green-700 dark:text-green-400 border border-green-500/30',
        none:   'bg-muted text-muted-foreground',
      },
    },
    defaultVariants: {
      level: 'none',
    },
  }
);

interface RiskBadgeProps extends VariantProps<typeof riskBadgeVariants> {
  className?: string;
  children: React.ReactNode;
}

export function RiskBadge({ level, className, children }: RiskBadgeProps) {
  return (
    <span className={cn(riskBadgeVariants({ level }), className)}>
      {children}
    </span>
  );
}
```

---

## 📊 4. DataTable con TanStack Table

```tsx
// ✅ Patrón DataTable para EDUCACION OS
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table';

// Siempre incluir:
// - Ordenamiento por columna
// - Filtro global
// - Paginación
// - Selección de filas (para acciones en lote)
// - Estado vacío
// - Estado de carga (skeleton)
```

---

## 📝 5. Formularios con React Hook Form + Zod + shadcn

```tsx
// ✅ Patrón estándar de formulario EDUCACION OS
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const studentFormSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  codigo: z.string().regex(/^\d{4}-\d{3}$/, 'Formato: YYYY-NNN'),
  nivel_riesgo: z.enum(['alto', 'medio', 'bajo']),
});

type StudentFormValues = z.infer<typeof studentFormSchema>;

export function StudentForm() {
  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: { nivel_riesgo: 'bajo' },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="nombre"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre completo</FormLabel>
              <FormControl>
                <Input placeholder="Juan Pérez García" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Guardar estudiante</Button>
      </form>
    </Form>
  );
}
```

---

## 🔔 6. Toasts y Notificaciones

```tsx
// ✅ Usar Sonner (recomendado por shadcn v2) o shadcn/toast
import { toast } from 'sonner';

// En acciones
try {
  await saveStudent(data);
  toast.success('Estudiante guardado correctamente');
} catch (error) {
  toast.error('Error al guardar', {
    description: error.message,
  });
}
```

---

## ✅ Checklist Shadcn/UI

- [ ] Componentes instalados via CLI (no copiar/pegar manual)
- [ ] Variantes creadas con `cva()` y tipadas
- [ ] Formularios con react-hook-form + zod + shadcn Form
- [ ] DataTable con TanStack Table + sorting + filtering + pagination
- [ ] Toasts con Sonner
- [ ] Theming via CSS variables (no hardcoded)
- [ ] Sin componentes custom donde shadcn/ui tiene solución
