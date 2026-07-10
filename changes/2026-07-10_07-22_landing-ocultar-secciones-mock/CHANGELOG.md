# Changelog — Ocultar secciones mock de la Landing Page

## Fecha y hora
2026-07-10, 07:22 (hora local del entorno de desarrollo)

## Objetivo del cambio
Ocultar temporalmente, de forma no destructiva y reversible, las secciones de la
Landing Page (`democra.pro`) que hoy muestran datos simulados ("mock"/"humo"):
la sección de confianza (logos de organizaciones + contadores) y todo el
contenido inferior subsecuente, manteniendo intacta la sección Hero y el
Footer.

## Contexto del problema
`dds/MEJORAS/09072026/REQ001.md` (REQ-001) reporta que la Landing Page carga
lento y muestra contenido de relleno sin datos reales todavía: el bloque
"+2.400 organizaciones confían en democra.pro", el carrusel de logos
(Y Combinator, Shopify, Stripe, etc.) y las tarjetas de estadísticas
("2,400+", "18M", "99.9%", "4.9"), además de las secciones posteriores
(Features, VisualShowcase, VisualImpact, HowItWorks, Pricing, FinalCTA), que
también son contenido de demostración para esta fase del despliegue.

## Motivo de la modificación
El usuario (dueño del producto) solicitó explícitamente que este contenido no
se muestre públicamente hasta contar con datos reales, sin perder el código
para poder reactivarlo cuando existan métricas reales que mostrar.

## Solución implementada
En `src/pages/landing/LandingPage.tsx` se introdujo una constante booleana
`SHOW_MOCK_SECTIONS = false` y se envolvieron los componentes
`<TrustSection />`, `<Features />`, `<VisualShowcase />`, `<VisualImpact />`,
`<HowItWorks />`, `<Pricing />` y `<FinalCTA />` en un renderizado
condicional (`{SHOW_MOCK_SECTIONS && (...)}`). El `<Footer />` se dejó fuera
de la condición y sigue renderizando siempre, inmediatamente después de la
sección Hero, cumpliendo el riesgo señalado en el propio requerimiento de no
ocultar accidentalmente un elemento compartido esencial.

No se eliminó ningún archivo ni bloque de código: reactivar las secciones es
un cambio de una sola línea (`SHOW_MOCK_SECTIONS = true`).

## Riesgos identificados
- Si en el futuro alguien reactiva el flag sin revisar el contenido, volverán
  a mostrarse datos de ejemplo (Y Combinator, Shopify, etc.) — mitigado
  dejando el flag y su comentario explicativo bien visibles en el archivo.
- Ninguno de los componentes ocultos exporta lógica de negocio ni efectos
  secundarios (son puramente presentacionales), por lo que no hay riesgo de
  romper flujos de autenticación, pagos ni de datos.

## Impacto esperado
La Landing Page pública termina visualmente tras los botones de la sección
Hero y el Footer aparece inmediatamente después, sin espacios en blanco
residuales ni contenido de relleno. Tiempo de carga percibido menor al
eliminarse el montaje de 7 componentes (incluyendo animaciones `motion/react`
y el marquee de logos).

## Módulos afectados
- Landing Page pública (`src/pages/landing/`).

## Dependencias involucradas
Ninguna dependencia nueva. No se tocó `TrustSection.tsx` ni el resto de los
componentes ocultados — siguen existiendo tal cual, solo dejan de montarse.

## Posibles efectos secundarios
Ninguno detectado: Hero y Footer no dependen de los componentes ocultados
(cada uno es una sección hermana independiente en el árbol JSX).

## Estado del cambio
Completado. Verificado con `tsc --noEmit` (sin errores nuevos; los 5 errores
preexistentes que arroja el typecheck pertenecen a `src/modules/ong/app/`, un
módulo duplicado obsoleto que no forma parte del build de Vite y es ajeno a
este cambio). No se realizó verificación visual con navegador headless en
esta sesión (ver nota de entorno en `SUMMARY.md`).
