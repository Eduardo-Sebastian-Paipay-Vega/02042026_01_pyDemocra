import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import { load as loadYaml } from "js-yaml";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { assertServerConfig, config } from "./config.js";
import authRoutes from "./routes/auth.js";
import auditRoutes from "./routes/audit.js";
import iamRoutes from "./routes/iam.js";
import onboardingRoutes from "./routes/onboarding.js";
import sedesRoutes from "./routes/sedes.js";
import tenantSettingsRoutes from "./routes/tenant-settings.js";
import profileRoutes from "./routes/profile.js";
import gymRoutes from "./domains/gym/routes/index.js";
import { initOngDomain } from "./domains/ong/index.js";

// Inicializa dominios que inyectan reglas de negocio al core
initOngDomain();

// process.cwd() en vez de import.meta.url: este servidor siempre se arranca
// desde la raiz del repo (node server/index.js, ver scripts de package.json,
// y api/server.js para Vercel) — evitamos import.meta.url a proposito porque
// Babel (usado por Jest para transformar este ESM a CJS en los tests, ver
// babel.config.cjs) no puede convertirlo y revienta con
// "Cannot use 'import.meta' outside a module".
const openapiDocument = loadYaml(
  readFileSync(join(process.cwd(), "docs", "api", "openapi.yaml"), "utf8")
);

assertServerConfig();

const app = express();

// Vercel siempre pone exactamente un proxy (su edge network) delante de esta
// función serverless. "1" (no `true`) le dice a Express que confíe en UN
// salto de X-Forwarded-For — lo mínimo necesario para que req.ip y
// express-rate-limit lean la IP real del cliente en vez de la IP interna del
// proxy. `true` confiaría en toda la cadena sin límite: express-rate-limit
// v8 lo rechaza en el arranque precisamente porque permite spoofear la IP
// agregando saltos falsos al header.
app.set("trust proxy", 1);

// Oculta X-Powered-By y aplica cabeceras HTTP de seguridad OWASP por defecto de Helmet:
// Content-Security-Policy, HSTS, X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        fontSrc: ["'self'", "data:"],
        connectSrc: ["'self'", "https:"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    frameguard: {
      action: "deny",
    },
    referrerPolicy: {
      policy: "strict-origin-when-cross-origin",
    },
    noSniff: true,
    xssFilter: true,
  })
);

// Inyección de Permissions-Policy y cabeceras de endurecimiento adicionales
app.use((_req, res, next) => {
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("X-Permitted-Cross-Domain-Policies", "none");
  next();
});


// Mismo origen en producción: el frontend y esta función viven bajo el mismo
// dominio via el rewrite "/api/:path*" de vercel.json, así que el navegador
// nunca envía Origin en esas peticiones (no hay CORS de por medio). El
// allowlist existe para los casos que sí cruzan origen: dev local (Vite en
// :5173 proxea a :8787, pero por si alguien pega directo) y previews/otros
// dominios que se agreguen vía ALLOWED_ORIGINS. No se usa un wildcard "*":
// eso aceptaría cualquier sitio, no "nuestro dominio o los permitidos".
const DEFAULT_ALLOWED_ORIGINS = [
  "https://www.democra.pro",
  "https://democra.pro",
  "http://localhost:5173",
];

const allowedOrigins = [...DEFAULT_ALLOWED_ORIGINS, ...config.allowedOrigins];

app.use(
  cors({
    origin(origin, callback) {
      // Sin header Origin = same-origin real, curl, apps nativas, healthchecks.
      // Un navegador NUNCA manda Origin en una petición same-origin.
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      const corsError = new Error(`Origen no permitido por CORS: ${origin}`);
      corsError.isCorsError = true;
      callback(corsError);
    },
  })
);

app.use(express.json({ limit: "1mb" }));

// Health check fuera del rate limit: los servicios de monitoreo/uptime lo
// llaman con frecuencia y no deben poder disparar un 429 falso.
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "ai-security-copilot",
    timestamp: new Date().toISOString(),
  });
});

// Documentacion interactiva (Swagger UI) de docs/api/openapi.yaml. Fuera del
// rate limit general por el mismo motivo que /api/health: cargar la pagina
// dispara varias peticiones de assets estaticos que no deben poder disparar
// un 429 solo por refrescar la pestana de docs.
// removeHeader("Content-Security-Policy"): el CSP por defecto de helmet()
// (linea de arriba) bloquea los <script>/<style> inline que swagger-ui-express
// necesita para pintar la pagina. Se relaja SOLO para esta ruta — el resto de
// la API sigue con el CSP estricto de helmet sin cambios.
app.use(
  "/api/docs",
  (_req, res, next) => {
    res.removeHeader("Content-Security-Policy");
    next();
  },
  swaggerUi.serve,
  swaggerUi.setup(openapiDocument)
);

// Escudo general: 100 peticiones / 15 min por IP en toda la API.
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error_code: "SEC-429",
    error_type: "rate_limit",
    message: "Demasiadas solicitudes. Intenta de nuevo en unos minutos.",
    severity: "medium",
    retry_allowed: true,
  },
});

app.use(generalLimiter);

// Escudo estricto para fuerza bruta: login y verificación/reenvío de OTP.
// 5 intentos / 15 min por IP. skipSuccessfulRequests: true significa que solo
// los intentos fallidos (status >= 400) cuentan contra el límite — un login
// legítimo repetido (logout/login varias veces) no debe bloquear al usuario.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    error_code: "SEC-429-AUTH",
    error_type: "rate_limit",
    message: "Demasiados intentos de autenticación. Espera 15 minutos antes de volver a intentar.",
    severity: "high",
    retry_allowed: true,
  },
});

// Rutas reales de auth.js expuestas a fuerza bruta: login por credenciales y
// verificación/reenvío de OTP (2FA). Se registran antes del router para que
// el limiter corra primero; /risk-evaluate queda fuera a propósito porque ya
// tiene su propio motor de riesgo/bloqueo (ver security/risk-engine.js) y no
// es en sí mismo un punto de adivinar credenciales.
import educRoutes from "./domains/educ/routes/index.js";

app.use("/api/auth/terminal-login", authLimiter);
app.use("/api/auth/step-up/verify-otp", authLimiter);
app.use("/api/auth/step-up/resend-otp", authLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/security", auditRoutes);
app.use("/api/iam", iamRoutes);
app.use("/api/onboarding", onboardingRoutes);
app.use("/api/sedes", sedesRoutes);
app.use("/api/core/tenant/settings", tenantSettingsRoutes);
app.use("/api/core/profile/preferences", profileRoutes);
app.use("/api/gym", gymRoutes);
app.use("/api/educ", educRoutes);

app.use((req, res) => {
  res.status(404).json({
    error_code: "IAM-004",
    error_type: "routing",
    message: `Ruta no encontrada: ${req.method} ${req.path}`,
    severity: "low",
    retry_allowed: false,
  });
});

// Handler de errores global — SIEMPRE al final (Express lo identifica por
// tener 4 parámetros). Sin esto, cualquier error no capturado (CORS
// rechazado, o cualquier excepción no manejada en una ruta) caía en la
// página de error HTML por defecto de Express, que incluye el stack trace
// completo con rutas de archivo del servidor — una fuga de información real
// que se detectó al probar el rechazo de CORS antes de agregar esto.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return;
  }

  if (err?.isCorsError) {
    res.status(403).json({
      error_code: "SEC-403-CORS",
      error_type: "cors",
      message: "Origen no permitido.",
      severity: "medium",
      retry_allowed: false,
    });
    return;
  }

  console.error("[api] Error no manejado:", err);
  res.status(500).json({
    error_code: "SEC-500",
    error_type: "internal",
    message: "Error interno del servidor.",
    severity: "high",
    retry_allowed: false,
  });
});

// Dev local: escucha en API_PORT. En Vercel (VERCEL=1), este módulo solo se
// importa para tomar `app` como handler de una Serverless Function — nunca
// debe abrir un puerto ahí (ver api/server.js).
if (!process.env.VERCEL) {
  app.listen(config.port, () => {
    console.log(
      `[api] AI Security Copilot escuchando en http://localhost:${config.port}`
    );
    console.log(`[api] Documentacion (Swagger UI): http://localhost:${config.port}/api/docs`);
  });
}

export default app;
