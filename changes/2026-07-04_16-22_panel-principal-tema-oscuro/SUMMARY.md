# SUMMARY — Tema oscuro navy/cyan para el Panel Principal

## Qué se hizo

Se extendió la paleta navy/cyan de la landing (ya aplicada antes a fichas médicas) al panel principal / Dashboard del módulo ONG, incluyendo sus 8 tarjetas KPI, las secciones Hoy/Pendiente/Control, los botones de acción y los 6 modales asociados — **solo en modo oscuro**.

## Por qué se hizo

Consistencia visual con la landing y con el módulo de fichas médicas ya actualizado, en la pantalla de mayor visibilidad del sistema (home).

## Qué beneficio aporta

- El panel principal y fichas médicas ahora comparten una única definición CSS de la paleta oscura (reutilizada, no duplicada), lo que facilita mantenerlas sincronizadas a futuro.
- Se corrigieron 4 colores que estaban hardcodeados (no habrían respondido al cambio de tema) y un ícono de tarjeta KPI que antes no podía personalizarse sin tocar el componente compartido.
- Cero impacto en otras páginas que usan los mismos componentes compartidos (`KpiCard`, `StatusDot`, `GhostButton`).

## Qué funcionalidades quedaron afectadas

Ninguna. Es un cambio puramente visual — la lógica de métricas, actividades, horas, admisión y sus modales permanece idéntica.
