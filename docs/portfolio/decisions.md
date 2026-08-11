# 🧠 Decisiones Técnicas (ADRs) — Democra

En Democra, las decisiones arquitectónicas fueron diseñadas maximizando el aislamiento de datos, reduciendo la superficie de ataque y simplificando la operación.

## ADR-001: Supabase y PostgreSQL sobre alternativas NoSQL (Firebase)

**Contexto**: Las ONGs manejan datos estructurados y altamente relacionales (Proyectos → Actividades → Voluntarios Asignados → Asistencia → Horas validadas). 

**Decisión**: Adoptar PostgreSQL (vía Supabase) como motor principal de base de datos.

**Por qué**:
1. **Row Level Security (RLS)**: En un entorno SaaS Multi-Tenant, aislar inquilinos a nivel de base de datos es la garantía definitiva contra fugas de información. Firebase Firestore no ofrece capacidades RLS equiparables para queries complejas y Joins.
2. **Integridad Relacional**: Constraints, Foreign Keys y operaciones en cascada evitan inconsistencias huérfanas en dominios sociales/médicos críticos.
3. **Funciones RPC y Triggers**: Permite construir un backend "espeso" delegando la auditoría y control financiero directamente al motor SQL, evitando latencias de red.

---

## ADR-002: Monorepo MPA sobre Microservicios

**Contexto**: El proyecto consta de una Landing, un Dashboard SaaS (36+ vistas), y un subsistema de Backend. Separarlos en repositorios independientes incrementaría la fricción operativa.

**Decisión**: Utilizar un monorepo Multi-Page Application (MPA) servido por Vercel con "Rewrites".

**Por qué**:
1. **Zero-CORS**: El Frontend (`/`) y la API (`/api`) comparten exactamente el mismo origen (`democra.pro`). Esto elimina por completo el overhead (pre-flight options) y los riesgos de configuración CORS en producción.
2. **Session Sharing Nartivo**: El token JWT (Supabase Auth) se transmite por la red dentro del mismo dominio, minimizando fugas por third-party cookies en navegadores modernos (Safari ITP, Chrome Privacy Sandbox).
3. **Developer Experience**: Tipado compartido entre capas y un solo comando (`npm run dev` / `npm install`) unifican el entorno para iterar velozmente.

---

## ADR-003: Backend Express 5.0 sobre Next.js API Routes / tRPC

**Contexto**: El framework Vercel incentiva el uso de funciones integradas (API Routes de Next.js o Vite).

**Decisión**: Se implementó una instancia dedicada de Express 5.0 actuando como función Serverless, encapsulada dentro de la topología Vercel (`api/server.js`).

**Por qué**:
1. **Control de Middlewares (Middleware Chain)**: Express permite inyectar cadenas complejas (Helmet → CORS → Rate Limiting Diferenciado → Autenticación → Financial Guard) con control milimétrico sobre la mutación de la petición en cada etapa, algo difícil de componer puramente en API Routes.
2. **Seguridad Defensiva**: Permite separar físicamente la superficie de ataque del backend del bundler de frontend. Los secretos de servicio (Service Role Key) están aislados exclusivamente en el entorno de servidor.
3. **Estabilidad del Ecosistema**: Express posee un ecosistema de middleware para mitigación de riesgos (OWASP) probado y robusto.

---

## ADR-004: Risk Engine e IA (Copiloto) en lugar de Reglas Estáticas

**Contexto**: La autenticación tradicional asume que un inicio de sesión exitoso legitima todas las interacciones subsiguientes de la sesión. Para datos clínicos de ONGs, esto es insuficiente frente a robo de sesiones o uso de dispositivos comprometidos.

**Decisión**: Implementar una capa de Zero-Trust con un "Risk Engine" que reevalúa la sesión antes de mutaciones críticas, integrando una API LLM para ajuste dinámico.

**Por qué**:
1. **Defensa en Profundidad**: Intercepta eventos basados en anomalías de comportamiento (horario inusual, proxy detectado, cambio repentino de región) emitiendo desafíos OTP de paso superior (Step-up MFA).
2. **Resiliencia (Fallback)**: La IA asiste al analista resumiendo el incidente forense o ajustando scores, pero el núcleo de rechazo (`BLOCK` o `REQUIRE_OTP`) opera mediante reglas determinísticas fallback. El SaaS nunca se paraliza si la API LLM cae.
