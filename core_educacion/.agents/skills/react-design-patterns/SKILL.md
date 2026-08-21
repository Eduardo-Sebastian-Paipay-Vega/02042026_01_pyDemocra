---
name: react-design-patterns
description: Enforces professional React/Next.js architecture patterns for EDUCACION OS. Use when creating or modifying any React component, page, hook, or feature. Ensures clean component composition, separation of concerns, reusability, and scalable architecture. Applies to React, Next.js App Router, and Vite projects.
---

# React Design Patterns — EDUCACION OS

> **Prioridad: 2.** Garantiza arquitectura limpia, componentes reutilizables y separación estricta de responsabilidades.

---

## 🏛️ 1. Principios Arquitectónicos Fundamentales

### Single Responsibility Principle (SRP)
Cada componente hace UNA sola cosa:
```tsx
// ❌ MAL: Un componente que hace todo
function UserDashboard() {
  const [users, setUsers] = useState([]);
  // 200 líneas de fetch, renderizado, lógica de negocio...
}

// ✅ BIEN: Separar responsabilidades
function UserDashboard() {
  return <UserList />;
}
function UserList() {
  const { users, isLoading } = useUsers();
  return <DataTable data={users} columns={userColumns} />;
}
```

---

## 🧱 2. Composición sobre Herencia

**Siempre usar composición (children, slots, render props) en lugar de herencia:**

```tsx
// ✅ Patrón de Composición (Compound Components)
<Card>
  <Card.Header>
    <Card.Title>Estudiantes en Riesgo</Card.Title>
  </Card.Header>
  <Card.Content>
    <EwsTable />
  </Card.Content>
  <Card.Footer>
    <Button>Ver todos</Button>
  </Card.Footer>
</Card>
```

---

## 📁 3. Estructura de Carpetas por Feature

```
apps/web/src/
├── app/                        # Next.js App Router (layouts, pages)
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── estudiantes/
│   │       └── page.tsx
├── features/                   # Lógica de negocio agrupada por dominio
│   ├── ews/                    # Early Warning System
│   │   ├── components/         # Componentes específicos del feature
│   │   ├── hooks/              # Custom hooks del feature
│   │   ├── api/                # Llamadas a API/Supabase
│   │   └── types.ts            # Tipos del feature
│   └── students/
├── components/                 # Componentes UI genéricos compartidos
│   ├── ui/                     # shadcn/ui components
│   └── shared/                 # Componentes comunes del proyecto
├── hooks/                      # Hooks globales reutilizables
├── lib/                        # Utilidades, configuración (supabase client, etc.)
└── types/                      # Tipos TypeScript globales
```

---

## 🪝 4. Custom Hooks — Separar Lógica de UI

```tsx
// ✅ Hook extraído del componente
function useEwsAlerts(tenantId: string) {
  const [alerts, setAlerts] = useState<EwsRiskAlertDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchEwsAlerts(tenantId).then(setAlerts).finally(() => setIsLoading(false));
  }, [tenantId]);

  return { alerts, isLoading };
}

// Componente limpio y simple
function EwsDashboard({ tenantId }: { tenantId: string }) {
  const { alerts, isLoading } = useEwsAlerts(tenantId);
  if (isLoading) return <EwsSkeleton />;
  return <EwsTable alerts={alerts} />;
}
```

---

## 🔄 5. Patrones de Data Fetching (Next.js App Router)

```tsx
// ✅ Server Components para fetching inicial (Next.js)
async function StudentsPage() {
  const students = await getStudents(); // Server-side
  return <StudentTable initialData={students} />;
}

// ✅ Client Components solo cuando se necesita interactividad
'use client';
function StudentSearchFilter() {
  const [query, setQuery] = useState('');
  // ...
}
```

---

## ⚡ 6. Memoización Apropiada

```tsx
// Solo memoizar cuando hay evidencia de problema de performance
const MemoizedChart = React.memo(EwsRiskChart, (prev, next) =>
  prev.data === next.data
);

// useCallback para callbacks pasados a children memoizados
const handleStudentSelect = useCallback((id: string) => {
  router.push(`/estudiantes/${id}`);
}, [router]);

// useMemo para cálculos costosos
const riskStats = useMemo(() =>
  calculateRiskDistribution(alerts), [alerts]
);
```

---

## 🚫 7. Anti-Patrones Prohibidos

- ❌ Prop drilling más de 2 niveles → usar Context o Zustand
- ❌ Lógica de negocio dentro de componentes UI puros
- ❌ Componentes de más de 150 líneas (señal de refactoring necesario)
- ❌ `useEffect` para derivar estado (usar `useMemo`)
- ❌ Fetch directo en `useEffect` del cliente sin loading/error states
- ❌ Duplicar componentes similares en lugar de generalizarlos

---

## ✅ Checklist Pre-entrega React

- [ ] Cada componente tiene una sola responsabilidad
- [ ] Lógica extraída a custom hooks
- [ ] Composición usada correctamente
- [ ] No hay prop drilling mayor a 2 niveles
- [ ] Memoización aplicada solo donde necesario
- [ ] Server Components vs Client Components correctamente separados
- [ ] Estructura de carpetas por feature
