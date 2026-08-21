---
name: modern-web-guidance
description: Google's modern web standards for EDUCACION OS. Use when creating web pages, ensuring Core Web Vitals compliance, implementing performance optimizations, or following Google's best practices for Next.js/React web applications. Covers Lighthouse scores, Web Vitals (LCP, CLS, FID/INP), SEO, and progressive enhancement.
---

# Modern Web Guidance — EDUCACION OS

> **Prioridad: 8.** Seguir los estándares modernos de la web garantiza que EDUCACION OS sea rápido, encontrable y confiable.

---

## 🚀 1. Core Web Vitals (Objetivos)

| Métrica | Objetivo | Descripción |
|---------|----------|-------------|
| **LCP** (Largest Contentful Paint) | < 2.5s | Velocidad de carga del contenido principal |
| **INP** (Interaction to Next Paint) | < 200ms | Respuesta a interacciones del usuario |
| **CLS** (Cumulative Layout Shift) | < 0.1 | Estabilidad visual durante la carga |
| **FCP** (First Contentful Paint) | < 1.8s | Primera pintura de contenido |
| **TTFB** (Time to First Byte) | < 800ms | Velocidad del servidor |

**Objetivo Lighthouse Global: ≥ 95 en Performance, Accessibility, Best Practices, SEO.**

---

## ⚡ 2. Optimización de Performance

### Imágenes
```tsx
// ✅ Siempre next/image con sizes y priority apropiados
import Image from 'next/image';

// Above the fold → priority={true}
<Image src="/hero.jpg" alt="..." width={1200} height={600} priority />

// Below the fold → lazy loading automático (default)
<Image src="/feature.jpg" alt="..." width={800} height={400} />

// Formato moderno obligatorio: WebP o AVIF (next/image lo maneja automáticamente)
```

### Fuentes
```tsx
// ✅ next/font para fuentes sin Layout Shift
import { Inter, Outfit } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap', // Evita FOIT (Flash of Invisible Text)
  variable: '--font-inter',
});

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
```

### Carga de Scripts Externos
```tsx
// ✅ next/script con strategy correcta
import Script from 'next/script';

// Analytics: afterInteractive (no bloquea render)
<Script src="..." strategy="afterInteractive" />

// Herramientas de terceros no críticas: lazyOnload
<Script src="..." strategy="lazyOnload" />
```

---

## 🗂️ 3. SEO Obligatorio (Next.js Metadata API)

```tsx
// app/layout.tsx — Metadata base
export const metadata: Metadata = {
  title: {
    default: 'EDUCACION OS — Sistema Operativo Educativo',
    template: '%s | EDUCACION OS',
  },
  description: 'La infraestructura inteligente que transforma cómo las instituciones educan, previenen la deserción y optimizan el aprendizaje.',
  keywords: ['educación', 'deserción escolar', 'IA educativa', 'EWS'],
  openGraph: {
    type: 'website',
    locale: 'es_PE',
    url: 'https://educacion.os',
    siteName: 'EDUCACION OS',
  },
  robots: {
    index: true,
    follow: true,
  },
};

// app/dashboard/page.tsx — Metadata específica
export const metadata: Metadata = {
  title: 'Dashboard EWS',
  description: 'Panel de alertas tempranas de deserción escolar.',
};
```

---

## 🔄 4. Estrategias de Rendering (Next.js App Router)

```
Static (SSG)          → Páginas de marketing, landing pages, docs
Server (SSR)          → Dashboards con datos en tiempo real, autenticación
Incremental Static    → Páginas con datos que cambian cada X tiempo
Client Component      → Interactividad pura (filtros, formularios, estados locales)
```

```tsx
// ✅ Streaming para mejorar TTFB percibido
import { Suspense } from 'react';

export default function Dashboard() {
  return (
    <main>
      <h1>Dashboard EWS</h1>
      <Suspense fallback={<StatsSkeleton />}>
        <StatsSection />  {/* Carga en paralelo */}
      </Suspense>
      <Suspense fallback={<TableSkeleton />}>
        <AlertsTable />
      </Suspense>
    </main>
  );
}
```

---

## 🔒 5. Seguridad Headers (next.config.ts)

```ts
// next.config.ts
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig = {
  headers: async () => [
    { source: '/(.*)', headers: securityHeaders },
  ],
};
```

---

## ✅ Checklist Modern Web

- [ ] Lighthouse Performance ≥ 95
- [ ] Lighthouse Accessibility ≥ 95
- [ ] Lighthouse SEO ≥ 95
- [ ] LCP < 2.5s, CLS < 0.1, INP < 200ms
- [ ] next/image para todas las imágenes
- [ ] next/font para fuentes Google
- [ ] Metadata configurada en cada page.tsx
- [ ] Open Graph tags
- [ ] Streaming con Suspense para secciones pesadas
- [ ] Security headers configurados
