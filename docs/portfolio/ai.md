# 🤖 Inteligencia Artificial — Democra

Democra integra IA de dos maneras distintas: como funcionalidad nativa del producto (AI-driven features) y como herramienta de desarrollo del software (AI-assisted development).

---

## 1. IA como funcionalidad del producto

El producto utiliza OpenAI GPT-4.1-mini para resolver problemas donde la lógica determinística es rígida o insuficiente, específicamente en el ámbito de seguridad y auditoría.

El cliente de IA está centralizado en `server/security/ai-client.js`.

### A. Copiloto forense de seguridad (`summarizeForensicEvent`)
Los administradores del tenant necesitan entender incidentes de seguridad (logs de auditoría). La IA analiza eventos técnicos crudos y devuelve un resumen comprensible.

- **Input**: Evento de seguridad con metadatos.
- **Prompt Constraint**: *"Eres un copiloto forense de seguridad SaaS multi-tenant. Resume hechos, no inventes datos. No reveles secretos ni PII sensible."*
- **Output**: Un JSON con `summary`, `reasoning` y `confidence` (0 a 1).
- **Endpoint**: `GET /api/audit/forensic-summary`

### B. Análisis contextual de riesgo (`explainRiskDecisionWithAi`)
El Risk Engine Zero-Trust evalúa reglas determinísticas (IP nueva, horario inusual) y calcula un "base score". Luego, la IA analiza este contexto para ajustar el riesgo, actuando como una segunda opinión humana.

- **Input**: `event`, `baseScore`, `reasonCodes`, `rawSignals`.
- **Comportamiento seguro**: El ajuste de la IA (un valor numérico) siempre está limitado (`Math.max(-10, Math.min(10, adjustment))`) para evitar manipulaciones (prompt injection) que bajen artificialmente el riesgo a niveles inseguros.
- **Output adicional**: Genera un `user_message` contextual y `extra_reason_codes`.

### C. Explicador de errores (`error-explainer.js`)
Un módulo compartido (frontend/backend) que toma códigos técnicos de la API (`SEC-429`, `IAM-004`, `FIN-001`) y devuelve explicaciones en lenguaje natural accionables para el usuario final.

### Fallback Determinístico (Graceful Degradation)
El sistema **nunca** falla catastróficamente si la IA no está disponible o el API key no está configurado.

```javascript
// Si OPENAI_API_KEY no existe o hay error de red:
return {
    summary: "Fallo en IA: No se pudo generar resumen automático.",
    reasoning: "fallback-deterministic",
    confidence: 0
};
```

---

## 2. IA en el Desarrollo (AI-Assisted Development)

El código fuente de Democra fue construido colaborando estrechamente con IA (Claude / Antigravity).

El historial de este proceso está documentado exhaustivamente en **53 changelogs de auditoría** ubicados en el directorio `/changes`.

### Ejemplos de colaboración documentada
- **Diseño arquitectónico**: Modelado de datos multi-tenant y configuración de RLS (Row Level Security).
- **Generación de código defensivo**: Creación de los triggers de auditoría universal en PL/pgSQL y de la cadena de middlewares de Express.
- **Refactorizaciones complejas**: Consolidación del módulo de vinculaciones ACE (Access & Context Engine) para evitar lógica duplicada en el registro de beneficiarios y voluntarios.
- **Debugging de producción**: Resolución de conflictos de puertos y optimización de configuraciones CORS/Helmet en entornos serverless.

Esta documentación prueba una competencia clave para perfiles modernos: **la capacidad de dirigir, guiar y auditar el código generado por IA**, asegurando la calidad y alineación con la arquitectura del sistema.
