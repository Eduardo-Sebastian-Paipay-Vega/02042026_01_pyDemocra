# Inventario Maestro de Recursos Visuales — Tesis Democra

> **Archivo de control técnico (SSOT visual).** Cataloga todas las imágenes y diagramas
> que el documento LaTeX `proyecto_final_corregido.tex` invoca mediante
> `\includegraphics{imagenes/<archivo>}`. Los nombres de archivo son **case-sensitive** y
> deben coincidir EXACTAMENTE con las llamadas del `.tex`. Deposita aquí los archivos
> físicos antes de la compilación final.

---

## 1. Convenciones

- **Carpeta destino:** `imagenes/` (misma raíz que `proyecto_final_corregido.tex`).
- **Formato preferido:** vectorial `.pdf` para diagramas (nitidez infinita en LaTeX) o `.png`
  a ≥ 300 ppp para capturas de pantalla.
- **Paleta del documento** (para coherencia con el `.tex`): azul oscuro `#003366`
  (darkblue), azul de acento `#0066CC` (accent), gris claro `#F2F2F2` (fondos), texto
  `#1A1A1A`. Fondos blancos, sin sombras cargadas, estilo sobrio y minimalista.
- **Llamada LaTeX estándar:**
  ```latex
  \begin{figure}[H]
      \centering
      \includegraphics[width=0.85\linewidth]{imagenes/NOMBRE_EXACTO}
      \caption{Descripcion.}
      \label{fig:etiqueta}
  \end{figure}
  ```
- **Nota:** las figuras `fig:arquitectura` y `fig:flujo` del `.tex` están hechas en TikZ
  (vectoriales, no requieren archivo). Este inventario cubre los recursos que SÍ deben
  suministrarse como imagen externa o que reemplazarán a los diagramas TikZ por versiones
  profesionales si así se decide.

---

## 2. Inventario y Especificaciones

### 2.1 Diagramas de arquitectura y estructura

| # | Archivo (exacto) | `\label` sugerido | Propósito |
|---|------------------|-------------------|-----------|
| 1 | `fig_c4_contexto.pdf` | `fig:c4_contexto` | C4 Nivel 1 (Contexto): Democra frente a actores y sistemas externos. |
| 2 | `fig_c4_contenedores.pdf` | `fig:c4_contenedores` | C4 Nivel 2 (Contenedores): SPA, API Express, Supabase, Resend, OpenAI. |
| 3 | `fig_der_multiesquema.pdf` | `fig:der` | Diagrama Entidad-Relación del modelo multi-esquema (public/ong/finanzas/…). |
| 4 | `fig_despliegue.pdf` | `fig:despliegue` | Diagrama de despliegue: Vercel serverless + Supabase + dominio único. |
| 5 | `fig_dir_frontend.pdf` | `fig:dir_frontend` | Arquitectura de directorios del frontend (pages/components/modules/services). |
| 6 | `fig_dir_backend.pdf` | `fig:dir_backend` | Arquitectura de directorios del backend (routes/security/services/utils). |
| 7 | `fig_stack_capas.pdf` | `fig:stack_capas` | Diagrama estructural del stack por capas con versiones. |

**Prompt #1 — `fig_c4_contexto.pdf`:**
Diagrama C4 de contexto (nivel 1), estilo Simon Brown, fondo blanco. Caja central azul oscuro
"Democra — Plataforma SaaS ONG". Actores alrededor (personas, cajas redondeadas grises):
"Administrador de tenant", "Voluntario", "Beneficiario", "Operador de terminal (PIN)". Sistemas
externos (cajas azul acento): "Supabase (Auth + PostgreSQL)", "Resend (Email/OTP)", "OpenAI
(resúmenes de auditoría)", "Servicio fiscal RUC", "Vercel (hosting serverless)". Flechas
etiquetadas con el tipo de interacción (HTTPS/REST, SQL/RLS, SMTP-API). Tipografía sans-serif,
líneas limpias.

**Prompt #2 — `fig_c4_contenedores.pdf`:**
Diagrama C4 de contenedores (nivel 2). Dentro del límite "Democra": contenedor "SPA Web
(React + TypeScript + Vite)", contenedor "API REST (Node.js + Express)", contenedor "Base de
datos (Supabase/PostgreSQL, esquemas public/ong/finanzas/rrhh/clinico/…)". Externos: Resend,
OpenAI, servicio RUC. Flechas: SPA→API (JSON/HTTPS Bearer), SPA→Supabase (anon key + RLS),
API→Supabase (service role), API→Resend, API→OpenAI. Colores de la paleta, fondo blanco.

**Prompt #3 — `fig_der_multiesquema.pdf`:**
Diagrama Entidad-Relación (notación crow's foot) agrupado por esquema con recuadros de color
por dominio. Esquema `public` (núcleo): tenants, sedes, profiles, roles, role_permissions,
user_roles_sedes, audit_logs. Esquema `ong`: voluntarios, beneficiarios, proyectos, tareas,
actividades, asignaciones_actividad, asistencias, horas_actividad, evidencias_actividad, items,
ubicaciones, transacciones_inventario. Esquema `finanzas`: cuentas_financieras,
categorias_financieras, transacciones_financieras, comprobantes_financieros. Mostrar PK (UUID),
FK y el atributo transversal `tenant_id` en tablas tenant-bound. Relaciones 1:N claramente
marcadas. Fuente monoespaciada para nombres de tabla. [PENDIENTE: confirmar cardinalidades
exactas contra `supabase/migrations/*.sql`].

**Prompt #4 — `fig_despliegue.pdf`:**
Diagrama de despliegue UML. Nodo "Navegador cliente" (SPA React). Nodo "Vercel Edge Network"
con artefacto "Función Serverless (Express app)" y "Assets estáticos SPA" bajo dominio único
`democra.pro` (rewrite `/api/:path*`). Nodo "Supabase Cloud" con "PostgreSQL + RLS", "GoTrue
Auth", "PostgREST". Servicios externos "Resend" y "OpenAI". Conexiones HTTPS etiquetadas.

**Prompt #5 — `fig_dir_frontend.pdf`:**
Árbol de directorios estilizado (tipo explorador de archivos) del frontend: `ong/src/app/`
con hijos `pages/`, `components/ (ui, shared, layout)`, `modules/*/hooks`, `services/*`,
`lib/db/`. Anotaciones a la derecha indicando la responsabilidad de cada capa. Sobrio, monoespaciado.

**Prompt #6 — `fig_dir_backend.pdf`:**
Árbol de directorios del backend `server/`: `routes/ (auth, iam, audit, onboarding, sedes)`,
`security/ (ai-client, risk-engine, audit)`, `services/email/ (templates, resend.client)`,
`middleware/`, `utils/ (http, security, tenant-scope)`, `config.js`, `supabase.js`. Anotaciones
de responsabilidad por carpeta.

**Prompt #7 — `fig_stack_capas.pdf`:**
Diagrama de bloques por capas horizontales con logos/nombres y versiones: Presentación (React
18.3, TypeScript 6, Vite 6, Tailwind 4.1, Radix UI); Negocio/API (Node.js, Express 5.2,
helmet, cors, express-rate-limit); Datos (Supabase, PostgreSQL, RLS); Calidad (Jest, Vitest,
supertest, Lighthouse). Flechas verticales de dependencia. Paleta del documento.

### 2.2 Diagramas de comportamiento y flujo

| # | Archivo (exacto) | `\label` sugerido | Propósito |
|---|------------------|-------------------|-----------|
| 8  | `fig_seq_peticion.pdf` | `fig:seq_peticion` | Secuencia UI→hook→servicio→Supabase→feedback. |
| 9  | `fig_seq_auth_otp.pdf` | `fig:seq_auth` | Secuencia de autenticación con motor de riesgo y step-up OTP. |
| 10 | `fig_risk_decision.pdf` | `fig:risk` | Diagrama de decisión del motor de riesgo (ALLOW/REQUIRE_OTP/BLOCK). |
| 11 | `fig_estados_admision.pdf` | `fig:estados_admision` | Diagrama de estados del ciclo de una solicitud de admisión. |
| 12 | `fig_actividad_onboarding.pdf` | `fig:actividad_onboarding` | Diagrama de actividad del onboarding de tenant (bootstrap-tenant). |
| 13 | `fig_pipeline_dds.pdf` | `fig:pipeline_dds` | Pipeline de ingeniería inversa documental / ciclo de vida DDS (8 fases). |

**Prompt #8 — `fig_seq_peticion.pdf`:**
Diagrama de secuencia UML. Participantes (lifelines): "Componente UI", "Hook de módulo",
"Servicio", "Supabase (PostgREST + RLS)". Mensajes: acción de usuario → hook (setLoading) →
servicio (query tipada con filtro tenant_id) → Supabase (SELECT con política RLS) → respuesta
mapeada → hook (setData/estado) → UI (render + toast). Incluir nota de RLS filtrando por
`fn_current_tenant_id()`.

**Prompt #9 — `fig_seq_auth_otp.pdf`:**
Diagrama de secuencia del login con evaluación de riesgo. Participantes: "Cliente", "API
/auth/risk-evaluate", "Motor de riesgo", "Servicio OTP (Resend)", "API /auth/step-up/verify-otp",
"Supabase". Flujo: cliente solicita → motor evalúa → si REQUIRE_OTP: genera challenge, envía OTP
por email; cliente verifica código → sesión step-up creada. Ramas ALLOW (sesión directa) y BLOCK
(rechazo con blocked_until). Incluir límite de 5 intentos / 15 min.

**Prompt #10 — `fig_risk_decision.pdf`:**
Diagrama de flujo/decisión del motor de riesgo. Entrada: evento (tenant_id, tipo_evento,
user_agent, geo_country, device_fingerprint, criticidad de acción). Rombos de decisión que
derivan en tres salidas coloreadas: ALLOW (verde), REQUIRE_OTP (ámbar), BLOCK (rojo). Mostrar
reason_codes y blocked_until. [PENDIENTE: extraer umbrales exactos de
`server/security/risk-engine.js`].

**Prompt #11 — `fig_estados_admision.pdf`:**
Diagrama de estados UML de una solicitud de admisión de voluntario: Solicitud recibida →
Documentos en revisión → Entrevista programada → Entrevista realizada → Onboarding → Voluntario
activo; con transiciones de Rechazo/Observación. [PENDIENTE: confirmar estados exactos en
`ong/src/app/modules/admission/types.ts`].

**Prompt #12 — `fig_actividad_onboarding.pdf`:**
Diagrama de actividad del onboarding de tenant: validar RUC (servicio fiscal) → ¿activo/habido?
→ invocar `fn_bootstrap_tenant` (crea tenant + profile + sede Principal + rol Owner +
asignación, idempotente) → retornar tenant_id. Incluir ramas de error TEN-001/TEN-002.

**Prompt #13 — `fig_pipeline_dds.pdf`:**
Diagrama horizontal del ciclo de vida DDS en 8 fases numeradas (0 a 7): Developer Experience →
Descubrimiento y Análisis → Innovación y Validación → Diseño y Definición → UI/UX → Arquitectura
y Desarrollo → QA y Testing → Despliegue y Operaciones. Bajo cada fase, 2-3 artefactos clave.
Arriba, una banda "SSOT (dds/)" que atraviesa todas las fases. Estilo cronograma limpio, paleta
del documento.

### 2.3 Capturas de pantalla de la aplicación (evidencia real)

> Todas son capturas reales que debe tomar el autor ejecutando la app localmente
> (`npm run dev`). Resolución mínima 1440 px de ancho, `.png`.

| # | Archivo (exacto) | `\label` sugerido | Módulo / Vista |
|---|------------------|-------------------|----------------|
| 14 | `cap_dashboard.png` | `fig:cap_dashboard` | Inicio — Dashboard de indicadores. |
| 15 | `cap_operacion.png` | `fig:cap_operacion` | Operación — Actividades/Asistencias/Horas. |
| 16 | `cap_proyectos.png` | `fig:cap_proyectos` | Proyectos — Proyectos/Tareas/Asignaciones. |
| 17 | `cap_personas.png` | `fig:cap_personas` | Personas — Voluntarios/Beneficiarios. |
| 18 | `cap_aprobaciones.png` | `fig:cap_aprobaciones` | Aprobaciones — Bandeja/Aprobación de horas. |
| 19 | `cap_admision.png` | `fig:cap_admision` | Admisión — Solicitudes/Documentos/Entrevistas. |
| 20 | `cap_recursos.png` | `fig:cap_recursos` | Recursos — Inventario/Finanzas/Cursos. |
| 21 | `cap_notificaciones.png` | `fig:cap_notificaciones` | Notificaciones — Plantillas/Historial. |
| 22 | `cap_gobernanza.png` | `fig:cap_gobernanza` | Gobernanza — Catálogos/Auditoría/Datos sensibles. |
| 23 | `cap_configuracion.png` | `fig:cap_configuracion` | Configuración — Usuarios/Roles/Seguridad. |
| 24 | `cap_swagger.png` | `fig:cap_swagger` | Documentación viva de la API (`/api/docs`, Swagger UI). |
| 25 | `cap_lighthouse.png` | `fig:lighthouse` | Reporte real de auditoría Lighthouse (Cap. Resultados). |

**Prompt/instrucción capturas #14–#24:**
Capturar cada vista con datos de ejemplo (seed local), navegador maximizado, tema claro,
recortar la barra del navegador. Mantener consistencia de zoom. Nombrar exactamente según la
tabla. No exponer datos personales reales.

**Instrucción #25 — `cap_lighthouse.png`:**
Ejecutar Lighthouse sobre el build de producción (`npm run build` + `npm run preview`) y
capturar el panel de puntuaciones (Performance, Accessibility, Best Practices, SEO) y las Web
Vitals (LCP, CLS, TBT). Esta figura reemplaza el placeholder `fig:lighthouse` del Capítulo de
Resultados.

---

## 3. Estado de aprovisionamiento

| Recurso | Estado |
|---------|--------|
| Diagramas 1–13 | [PENDIENTE: generar con herramienta de diagramas o modelo visual usando los prompts] |
| Capturas 14–24 | [PENDIENTE: capturar de la app en ejecución local] |
| Lighthouse 25 | [PENDIENTE: ejecutar auditoría y capturar] |

> Una vez depositados los archivos con el nombre exacto, el `.tex` compilará las figuras sin
> cambios adicionales. Mientras tanto, las llamadas `\includegraphics` correspondientes deben
> permanecer comentadas o protegidas para no romper la compilación (ver marcadores
> `% PENDIENTE` en el `.tex`).
