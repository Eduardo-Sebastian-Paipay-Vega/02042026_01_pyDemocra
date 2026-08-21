---
name: frontend-code-review
description: Frontend code quality and performance review for EDUCACION OS. Use when reviewing, refactoring, or auditing any React/Next.js code. Checks for performance issues, bundle size, dead code, anti-patterns, TypeScript type safety, and code maintainability. Trigger before every PR merge or when asked to "review", "audit", or "improve" frontend code.
---

# Frontend Code Review — EDUCACION OS

> **Prioridad: 9.** El código que funciona no es suficiente. Debe ser mantenible, performante y correcto en tipos.

---

## 🔍 1. Checklist de Code Review Completo

### TypeScript y Tipado
- [ ] Sin `any` explícitos (usar `unknown` + type guard, o tipo correcto)
- [ ] Props de componentes tienen interfaces definidas (no inline)
- [ ] Callbacks y event handlers tipados correctamente
- [ ] DTOs de `@educacion/shared-types` usados en lugar de tipos duplicados
- [ ] Tipos de API response tipados, no asumidos

### Performance
- [ ] Sin re-renders innecesarios (verificar con React DevTools Profiler)
- [ ] `useEffect` con dependencias correctas (sin dependencias faltantes o excesivas)
- [ ] Sin fugas de memoria (cleanup en useEffect cuando corresponde)
- [ ] Listas largas con virtualización (`react-virtual` o `@tanstack/virtual`)
- [ ] Imágenes con `next/image` y `sizes` apropiado
- [ ] Bundle no aumenta sin justificación (verificar con `@next/bundle-analyzer`)

### Código Muerto y Deuda Técnica
- [ ] Sin imports no usados
- [ ] Sin variables declaradas pero no usadas
- [ ] Sin `console.log` en código de producción
- [ ] Sin `TODO` sin issue de GitHub asociado
- [ ] Sin código comentado (usar Git para historia)

### Seguridad
- [ ] Sin `dangerouslySetInnerHTML` sin sanitización
- [ ] Sin secrets o API keys en código cliente
- [ ] Variables de entorno cliente prefijadas con `NEXT_PUBLIC_`

---

## ⚡ 2. Detección de Anti-Patrones de Performance

```tsx
// ❌ MAL: Crear objeto/función en JSX (re-crea en cada render)
<Component style={{ margin: '10px' }} onClick={() => doSomething()} />

// ✅ BIEN: Extraer fuera o memoizar
const styles = { margin: '10px' } as const;
const handleClick = useCallback(() => doSomething(), []);
<Component style={styles} onClick={handleClick} />

// ❌ MAL: useEffect para derivar estado (causa render extra)
const [fullName, setFullName] = useState('');
useEffect(() => {
  setFullName(`${firstName} ${lastName}`);
}, [firstName, lastName]);

// ✅ BIEN: useMemo o computación directa
const fullName = useMemo(() => `${firstName} ${lastName}`, [firstName, lastName]);
// O simplemente:
const fullName = `${firstName} ${lastName}`;

// ❌ MAL: Fetch sin manejo de errores o loading
useEffect(() => {
  fetch('/api/students').then(r => r.json()).then(setStudents);
}, []);

// ✅ BIEN: Con React Query / SWR / manejo de estados completo
const { data: students, isLoading, error } = useQuery({
  queryKey: ['students', tenantId],
  queryFn: () => fetchStudents(tenantId),
});
```

---

## 🏗️ 3. Revisión de Estructura

```
Para cada PR de Frontend, verificar:

1. ¿El componente está en la carpeta correcta?
   - features/{nombre}/ → Lógica de negocio específica
   - components/ui/     → Primitivos del Design System
   - components/shared/ → Componentes compartidos sin lógica de negocio

2. ¿El archivo tiene el nombre correcto?
   - Componentes: PascalCase.tsx (StudentCard.tsx)
   - Hooks: camelCase con prefijo 'use' (useStudentAlerts.ts)
   - Utilidades: camelCase.ts (formatDate.ts)
   - Tipos: types.ts o {nombre}.types.ts

3. ¿El componente es reutilizable o está acoplado a datos específicos?
```

---

## 📦 4. Análisis de Bundle

```bash
# Añadir al package.json del frontend:
"analyze": "ANALYZE=true next build"

# Verificar en bundle-analyzer:
# - Ningún paquete de node_modules > 100KB sin justificación
# - Moment.js → reemplazar con date-fns o dayjs
# - lodash completo → usar lodash-es o imports individuales
# - Icons: solo importar iconos necesarios de lucide-react
```

---

## 🔖 5. Convenciones de Nombres

| Elemento | Convención | Ejemplo |
|----------|-----------|---------|
| Componente | PascalCase | `StudentRiskCard` |
| Hook | camelCase + `use` | `useEwsAlerts` |
| Utilidad | camelCase | `formatRiskLevel` |
| Constante | SCREAMING_SNAKE | `MAX_RISK_SCORE` |
| Tipo/Interface | PascalCase | `StudentRiskDto` |
| Enum | PascalCase | `RiskLevel.HIGH` |
| CSS class custom | kebab-case | `risk-badge--high` |

---

## ✅ Checklist Final Code Review

- [ ] Sin `any` en TypeScript
- [ ] Sin imports no usados
- [ ] Sin `console.log` en producción
- [ ] Performance: sin re-renders innecesarios evidentes
- [ ] Bundle: no hay paquetes enormes sin justificación
- [ ] Seguridad: sin secrets en cliente
- [ ] Convenciones de nombre correctas
- [ ] Estructura de carpetas correcta
- [ ] DTOs de shared-types en lugar de tipos duplicados
