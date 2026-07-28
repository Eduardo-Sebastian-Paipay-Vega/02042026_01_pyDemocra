# Glosario de estudio — Sustentación Democra

> Guía de términos de la presentación *Democra — Sustentación*, con la sigla, su significado y una explicación breve. Donde aplica, se indica **qué implica** o **cómo se usa en Democra**. Pensado para repasar antes de sustentar.

---

## 1. Metodología

**DDS** — *Document-Driven SDLC* (en este proyecto). Metodología propia: el **documento de diseño se escribe y aprueba antes de programar**. No confundir con *Data Distribution Service* (protocolo que se descartó). Si te preguntan el nombre formal: *"Ciclo de vida de desarrollo de software guiado por documentación"*.

**SDLC** — *Software Development Life Cycle* = Ciclo de Vida de Desarrollo de Software. Las etapas por las que pasa un software: requisitos → diseño → construcción → pruebas → operación. Tus 8 fases son una implementación del SDLC.

**Document-Driven** — "guiado por documentación": el documento es la **compuerta** (gate); no se codifica hasta tenerlo aprobado. Lo opuesto a "documentar después".

**document-as-gate** — "documento como compuerta". El principio de fondo del DDS: ningún desarrollo pasa sin su documento de diseño aprobado. Es el estándar de Amazon, Google, Uber y Stripe.

**SSOT** — *Single Source of Truth* = Única Fuente de Verdad. Un solo lugar (la carpeta `dds/`) que gobierna cada decisión; si dos documentos se contradicen, se define cuál manda. Evita que la IA genere documentación inconsistente (tu "Lección 1").

**ADN Semilla (Fase 0)** — metáfora: la Fase 0 (Developer Experience) es el "ADN" del proyecto porque define las reglas base de las que "brota" todo lo demás. Es transversal: no se toca.

**DX** — *Developer Experience* = Experiencia del Desarrollador (Fase 0). Reglas de trabajo, *stack*, convenciones de código, linters y CI/CD para que cualquiera (humano o IA) se incorpore con fricción mínima.

**Multi-Agent Safety** — "seguridad multi-agente". Principio del DDS: al modularizar la documentación por fases y subcarpetas, varios agentes de IA pueden trabajar en paralelo sin pisarse ni sobrescribirse.

**ADR** — *Architecture Decision Record* = Registro de Decisión de Arquitectura. Documento corto y estandarizado que deja constancia de una decisión técnica importante y sus alternativas. Tu proyecto tiene 5 ADR (Fase 3/5).

**Working Backwards / PR-FAQ** — método de Amazon: antes de construir se redacta un comunicado de prensa (PR) y unas preguntas frecuentes (FAQ) simulados; si el documento no convence, el proyecto no se aprueba. (Bryar & Carr, 2021.)

**Design Docs** — documentos de diseño obligatorios en Google antes de codificar (exponen la estrategia y las decisiones con sus compensaciones). (Ubl, 2020.)

**RFC / ERD** — *Request for Comments* / *Engineering Review Docs*. Flujo de Uber/Stripe: el ingeniero escribe el diseño (datos, APIs, riesgos), los pares lo revisan sobre el papel y solo entonces se programa. (Orosz, 2019.)

**Parnas & Clements (1986)** — base académica del enfoque: *"A Rational Design Process: How and Why to Fake It"* (IEEE). Sostiene que documentar el diseño como si el proceso fuera racional permite que otros reconstruyan el razonamiento sin esfuerzo heroico.

**STRIDE / Red Teaming** — STRIDE es un método de *modelado de amenazas* (Spoofing, Tampering, Repudiation, Information disclosure, Denial of service, Elevation of privilege). *Red Teaming* = ejercicio de atacar el propio sistema para hallar fallos. Se hace en Fase 1, antes de escribir código nuevo.

**BDD** — *Behavior-Driven Development* = Desarrollo Guiado por Comportamiento. Se describen los casos como escenarios en lenguaje natural (Dado/Cuando/Entonces) antes de implementarlos.

---

## 2. Arquitectura y stack (con qué implica cada elección)

**SaaS** — *Software as a Service* = Software como Servicio. Se accede por web, sin instalar; una sola plataforma sirve a muchos clientes.

**Multi-tenant** — "multi-inquilino": una misma aplicación y base de datos atienden a muchas ONGs (tenants), pero cada una ve solo sus datos. **Implica** el reto central: aislar tenants sin duplicar infraestructura.

**SPA** — *Single Page Application* = Aplicación de Página Única. La web carga una vez y actualiza contenido sin recargar. **Implica** navegación fluida y sensación de app; el frontend maneja el estado.

**API REST** — interfaz web por la que el frontend pide datos al backend usando HTTP (GET/POST/…). **Implica** desacoplar cliente y servidor: cada uno evoluciona por separado.

**React (18)** — librería de Meta para construir interfaces por componentes. **Implica**: UI reactiva y reutilizable, gran ecosistema, y un *Virtual DOM* que actualiza solo lo que cambia (mejor rendimiento percibido → tu SUS 83.5).

**Vite (6)** — herramienta de compilación/servidor de desarrollo muy rápida para el frontend. **Implica** recargas casi instantáneas al programar y *builds* optimizados.

**TS / TypeScript** — JavaScript con **tipado estático**. **Implica**: los errores de tipo se detectan al escribir, no en producción; menos bugs y mejor autocompletado. Es tu "QA con tipado estricto".

**JS / JavaScript** — el lenguaje del navegador (y de Node.js en el servidor). **Implica** un mismo lenguaje en front y back; TS le añade la red de seguridad de los tipos.

**Tailwind (4)** — framework de estilos por "clases utilitarias" (escribes el estilo en el HTML). **Implica** diseño consistente y rápido sin escribir CSS a mano.

**Radix UI** — librería de componentes accesibles sin estilo predefinido. **Implica** accesibilidad (teclado, lectores de pantalla) resuelta de base.

**Express (5)** — framework mínimo para construir la API REST sobre Node.js. **Implica** control fino de rutas, *middleware* y seguridad del servidor.

**Node.js** — entorno para ejecutar JavaScript en el servidor. **Implica** un modelo asíncrono no bloqueante (ver *Event Loop*).

**Event Loop (Node.js)** — mecanismo de un solo hilo que atiende muchas peticiones concurrentes sin bloquearse. **Implica** que soportes 10k usuarios concurrentes con bajo error (tu prueba de rendimiento).

**Supabase** — plataforma que empaqueta PostgreSQL + autenticación + APIs. **Implica** base de datos, *Auth* y *storage* listos, con RLS nativo (clave para tu multi-tenancy).

**PostgreSQL (16)** — el motor de base de datos relacional. **Implica** integridad de datos, funciones/triggers y Row Level Security a nivel de kernel.

**Resend** — servicio para enviar correos (p. ej. los OTP). **Implica** entrega de emails sin montar tu propio servidor de correo.

**Vercel / CDN** — Vercel es el *hosting* del frontend; CDN (*Content Delivery Network*) = red de servidores que sirve la web desde el nodo más cercano al usuario. **Implica** carga rápida y despliegue automático.

**OpenAPI 3.0** — estándar para describir una API REST en un archivo (contrato). **Implica** documentación de la API generada y verificable, y clientes que se pueden autogenerar.

---

## 3. Datos y multi-tenancy

**RLS** — *Row Level Security* = Seguridad a Nivel de Fila. PostgreSQL decide, por cada fila, si el usuario puede verla. **Es tu decisión central**: garantiza matemáticamente que una ONG no vea datos de otra, con solo +4.22% de sobrecarga (vs. +501% de filtrar en la app).

**Schema (esquema)** — "carpeta" lógica dentro de PostgreSQL que agrupa tablas. Democra tiene 11 schemas (`public`, `ong`, `rrhh`, `finanzas`, `clinico`, `comunicaciones`…).

**tenant_id** — identificador único de cada ONG. Es la columna sobre la que RLS filtra para aislar los datos.

**bootstrap_tenant()** — función SQL transaccional e **idempotente** (ejecutarla dos veces no duplica nada) que crea una ONG nueva: su espacio, su admin y su sede matriz, tras validar el RUC.

**Data bleeding** — "fuga/sangrado de datos": que información sensible de un tenant se filtre a otro por falta de control de acceso. Es el problema que RLS previene (en tu slide de Contexto).

**Default-Deny** — "denegar por defecto": si no hay una regla que autorice explícitamente, se niega el acceso. Tu prueba: acceso anónimo → 0 tuplas.

**Overhead** — "sobrecarga": el costo extra (en tiempo/recursos) de aplicar una medida. Tu RLS añade solo +4.22% de overhead.

---

## 4. Seguridad e IAM

**IAM** — *Identity and Access Management* = Gestión de Identidad y Acceso. El módulo que administra usuarios, roles, permisos y sesiones.

**RBAC** — *Role-Based Access Control* = Control de Acceso Basado en Roles. Los permisos se asignan a roles y los roles a personas. **Implica** control granular: cada quien ve/hace solo lo de su rol.

**ACE (Engine)** — *Access & Context Engine* = Motor de Acceso y Contexto (propio de Democra). Gobierna los vínculos de acceso (p. ej. el "enlace ACE" con código para que un voluntario se autoregistre), las membresías contextuales, los formularios dinámicos y los permisos.

**MFA / OTP** — *Multi-Factor Authentication* / *One-Time Password* = Autenticación Multifactor / Contraseña de un solo uso. Un código temporal (por email) que se pide como segundo factor cuando el riesgo es Medium o mayor.

**JWT** — *JSON Web Token*. Credencial firmada que prueba que un usuario inició sesión, sin guardar la sesión en el servidor. **Implica** autenticación *stateless*.

**Motor de Riesgo estocástico** — componente que evalúa cada inicio de sesión y le asigna un nivel (Low/Medium/High/Critical) según señales (dispositivo nuevo, IP nueva…). "Estocástico" = basado en probabilidad. Si el riesgo sube, exige OTP o bloquea.

**Zero-Trust** — "confianza cero": no se confía en nadie por defecto, se verifica cada acceso. **Implica** capas de control aunque el usuario ya esté "dentro".

**Helmet** — *middleware* de Express que fija cabeceras HTTP de seguridad (protege contra ataques web comunes).

**Rate limiting** — límite de peticiones por usuario/tiempo, para frenar abusos y ataques de fuerza bruta.

**HMAC** — *Hash-based Message Authentication Code*. Firma que verifica que un mensaje/token no fue alterado. Tu prueba: firma HMAC alterada → HTTP 401 inmediato.

**SQL Injection / queries parametrizadas** — ataque que inyecta SQL malicioso en un campo; se previene con *queries parametrizadas* (los datos del usuario nunca se mezclan con el código SQL). En tu proyecto: bloqueado.

**Auditoría forense / audit_log / Trigger** — un *trigger* es código que la BD ejecuta automáticamente ante cada cambio; aquí registra toda operación en un `audit_log` inmutable. **Implica** trazabilidad total (quién cambió qué), con 1.2 ms de sobrecarga.

**CDC** — *Change Data Capture* = Captura de Cambios de Datos. Registrar cada cambio de la BD. Tu trigger de auditoría logra 100% CDC.

---

## 5. Dominio y negocio

**SUNAT / RUC** — SUNAT es la autoridad tributaria peruana; RUC es el registro único de contribuyentes. Democra valida el RUC contra SUNAT antes de crear la ONG (evita organizaciones falsas).

**FSM (de Admisión)** — *Finite State Machine* = Máquina de Estados Finitos. Modela el proceso de admisión como estados y transiciones válidas (p. ej. enviado → aprobado). **Implica** que el flujo no puede saltarse pasos ni entrar en estados inválidos.

**Kardex (Inventario)** — registro cronológico de entradas y salidas de un producto. Da control de stock y evita pérdidas/compras innecesarias.

**Carnet digital QR** — credencial de identidad del voluntario con código QR, generada al ser aprobado.

**GAP-001** — identificador de una *brecha* (funcionalidad faltante) documentada honestamente: el módulo de Votaciones/Deliberación no se implementó. Documentarlo es parte de tu metodología (Lección 3).

---

## 6. Testing y métricas

**QA** — *Quality Assurance* = Aseguramiento de la Calidad. El conjunto de prácticas y pruebas para garantizar que el software funciona.

**Tipado estricto** — obligar a declarar y respetar tipos (vía TypeScript). Primera barrera de calidad: atrapa errores antes de ejecutar.

**Jest / Vitest** — *frameworks* de pruebas automatizadas: Jest para el backend, Vitest para el frontend. Ejecutan cientos de casos y reportan fallos.

**Pirámide de pruebas** — modelo: muchas pruebas unitarias (base), menos de integración, pocas E2E (cima). **Implica** feedback rápido y barato en la base.

**E2E** — *End-to-End* = de extremo a extremo. Prueba el flujo completo como lo haría un usuario real (p. ej. admisión con JWT real).

**Cobertura de código** — % del código que las pruebas ejecutan. Tu resultado: 92.44% de sentencias (umbral ≥ 85%).

**SUS** — *System Usability Scale* = Escala de Usabilidad del Sistema. Cuestionario estándar (0–100); >68 es "bueno". Tu resultado: 83.5 ("Excelente").

**Latencia P95** — el tiempo de respuesta por debajo del cual está el 95% de las peticiones. **Implica** medir la experiencia del "peor caso común", no el promedio. Tu umbral: <200 ms.

**Throughput** — peticiones atendidas por segundo (req/s). Mide capacidad de carga. Tu pico: 6,850 req/s con 10k usuarios.

---

## 7. Roadmap / trabajo futuro (términos que aparecen)

**PWA offline-first / Service Workers / IndexedDB** — *Progressive Web App* que funciona sin conexión: *Service Workers* (scripts que cachean e interceptan red) + *IndexedDB* (base de datos en el navegador). Resolvería tu dependencia de 4G/5G.

**Event Sourcing / Apache Kafka** — guardar el estado como una secuencia de eventos (no solo el dato final); Kafka es la plataforma de *streaming* de eventos. Da reconstrucción total del historial.

**Chaos Engineering** — inyectar fallos a propósito en producción para verificar que el sistema resiste.

**Criptografía post-cuántica (CRYSTALS-Kyber / Dilithium)** — algoritmos de cifrado/firma resistentes a computadoras cuánticas (estándares del NIST).

**Apache Spark + Deep Learning** — Spark procesa grandes volúmenes de datos; Deep Learning = redes neuronales. Base para "IA predictiva".

**Confidential Computing (Intel SGX / AMD SEV-SNP)** — ejecutar datos cifrados incluso en memoria, dentro de zonas protegidas del procesador (enclaves).

---

## Preguntas rápidas que podrían hacerte (y respuesta corta)

- **¿Por qué RLS y no una BD por ONG?** Porque BD separada no escala; RLS da aislamiento matemático con solo +4.22% de overhead.
- **¿Qué es exactamente el DDS?** Un ciclo de vida guiado por documentación (Document-Driven SDLC): el diseño se aprueba antes de codificar. Formaliza el estándar de Amazon/Google/Uber, con base académica en Parnas & Clements (1986).
- **¿Por qué React + TypeScript?** UI por componentes y rápida (React) con tipado que atrapa errores antes de producción (TS) → menos bugs y mejor usabilidad (SUS 83.5).
- **¿Cómo garantizas que no haya fuga entre ONGs?** RLS a nivel de kernel + Default-Deny; probado con 3 vectores de ataque, 100% de bloqueo.
