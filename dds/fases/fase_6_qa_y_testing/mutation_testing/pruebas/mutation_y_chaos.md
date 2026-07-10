# Mutation Testing y Chaos Engineering

*Fuente de verdad: Repositorio completo*

### Mutation Testing: No Implementado
No se ha detectado el uso de Stryker u otras herramientas de Mutation Testing para el ecosistema JS/TS. La calidad de los tests unitarios depende puramente de la métrica de *Code Coverage* proporcionada por el motor `v8` de Vitest.

### Chaos Engineering: No Implementado
La inyección de fallas (Chaos Monkey, Gremlin) no está presente. Dado que el proyecto reside enteramente en el ecosistema gestionado (Vercel + Supabase administrado), la resiliencia de la infraestructura se delega a los SLAs de dichos proveedores en lugar de requerir inyección activa de fallos por parte del equipo de desarrollo.
