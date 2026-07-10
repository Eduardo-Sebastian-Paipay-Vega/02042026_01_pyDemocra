# Plantilla: Requisito Funcional (RF)
> **Transversal | Plantillas** | Formato Estandarizado

Utilice esta plantilla para documentar nuevos requisitos funcionales descubiertos o solicitados, garantizando consistencia con la documentación de Democra.

```markdown
# RF-[ID]: [Nombre Corto y Descriptivo]

## 1. Descripción General
[Descripción clara de qué debe hacer el sistema, redactada en formato: "El sistema debe ser capaz de..."]

## 2. Precondiciones
- [Estado requerido del sistema o del actor antes de ejecutar la función]

## 3. Entradas
| Dato | Tipo | Obligatorio | Validación/Restricción |
|------|------|-------------|------------------------|
| [Campo 1] | [String/Int] | Sí/No | [Ej. Máx 50 chars, Validar regex] |

## 4. Flujo Principal (Camino Feliz)
1. El usuario [Acción]
2. El sistema valida [Regla]
3. El sistema [Reacción]

## 5. Excepciones / Flujos Alternativos
- **Excepción 1:** Si [Condición], entonces el sistema [Comportamiento].

## 6. Salidas / Postcondiciones
- [Qué cambia en el sistema, en la Base de Datos o qué información se retorna al usuario]

## 7. Criterios de Aceptación (DoD)
- [ ] [Criterio 1]
- [ ] [Criterio 2]

## 8. Trazabilidad
- **RU Asociado:** RU-[ID]
- **Módulo:** [Nombre del Módulo]
```
