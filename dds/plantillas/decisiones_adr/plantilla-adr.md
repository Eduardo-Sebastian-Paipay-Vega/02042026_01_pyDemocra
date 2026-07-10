# Plantilla: Decisión de Arquitectura (ADR)
> **Transversal | Plantillas** | Formato Estandarizado (Inspirado en Michael Nygard)

```markdown
# ADR-[ID]: [Título corto e imperativo de la decisión]

**Estado:** [Propuesto | Aceptado | Rechazado | Deprecado]
**Fecha:** [YYYY-MM-DD]
**Contexto/Módulo:** [Área del sistema afectada]

## Contexto
[¿Cuál es el problema arquitectónico o de negocio que estamos intentando resolver? Describir el entorno, las restricciones técnicas y de negocio, y las alternativas consideradas.]

## Decisión
[¿Qué decidimos hacer exactamente? Debe ser una afirmación clara y directa. Ej. "Usaremos Supabase RLS para el aislamiento Multi-Tenant en lugar de esquemas separados."]

## Consecuencias Positivas
- [Ventaja 1]
- [Ventaja 2]

## Consecuencias Negativas (Trade-offs)
- [Desventaja o nuevo riesgo que debemos asumir 1]
- [Deuda técnica o complejidad agregada 2]

## Mitigaciones
- [Cómo planeamos mitigar las consecuencias negativas identificadas]

## Notas Adicionales
- [Enlaces a tickets, PRs o documentación externa de soporte]
```
