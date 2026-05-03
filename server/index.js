import "dotenv/config";
import express from "express";
import { assertServerConfig, config } from "./config.js";
import authRoutes from "./routes/auth.js";
import auditRoutes from "./routes/audit.js";
import iamRoutes from "./routes/iam.js";
import onboardingRoutes from "./routes/onboarding.js";

assertServerConfig();

const app = express();

app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "ai-security-copilot",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/security", auditRoutes);
app.use("/api/iam", iamRoutes);
app.use("/api/onboarding", onboardingRoutes);

app.use((req, res) => {
  res.status(404).json({
    error_code: "IAM-004",
    error_type: "routing",
    message: `Ruta no encontrada: ${req.method} ${req.path}`,
    severity: "low",
    retry_allowed: false,
  });
});

app.listen(config.port, () => {
  console.log(
    `[api] AI Security Copilot escuchando en http://localhost:${config.port}`
  );
});
