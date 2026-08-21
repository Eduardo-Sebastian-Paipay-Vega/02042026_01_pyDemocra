# 09 - AUDITORÍA DE DEPENDENCIAS (DEPENDENCY-AUDIT)

## 1. Resultado de `npm audit`

```json
{
  "auditReportVersion": 2,
  "vulnerabilities": {},
  "metadata": {
    "vulnerabilities": {
      "info": 0,
      "low": 0,
      "moderate": 0,
      "high": 0,
      "critical": 0,
      "total": 0
    },
    "dependencies": {
      "prod": 322,
      "dev": 887,
      "optional": 135,
      "total": 1224
    }
  }
}
```

---

## 2. Evaluación de Scripts de Instalación (Supply Chain)
- No se detectaron scripts `preinstall` o `postinstall` maliciosos en `package.json`.
- Todas las dependencias principales provienen del registro oficial `registry.npmjs.org`.
