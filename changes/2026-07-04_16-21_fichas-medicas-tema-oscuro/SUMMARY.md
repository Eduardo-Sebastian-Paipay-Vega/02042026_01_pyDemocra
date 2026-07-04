# SUMMARY — Tema oscuro navy/cyan para Fichas Médicas

## Qué se hizo

Se aplicó la paleta navy/cyan de la landing page (`#0a0e27`, `#1a1f3a`, `#4a9fd8`, etc.) al sistema de fichas médicas sensibles del módulo ONG (`localhost:5174`), pero **solo cuando el usuario tiene el modo oscuro activado**. En modo claro, la pantalla se ve exactamente igual que antes.

## Por qué se hizo

El usuario pidió consistencia visual entre la landing y esta sección específica del sistema, sin querer un cambio global de tema (que ya se había hecho en tareas anteriores para el resto de la app).

## Qué beneficio aporta

- Coherencia visual entre la landing y el módulo clínico/sensible en modo oscuro.
- Sin riesgo de romper el resto de la aplicación: el cambio está aislado a un único scope CSS, no toca componentes compartidos globalmente.
- Se corrigió de paso un bug real (badge morado sin relación con ninguna paleta del proyecto), sin expandir el alcance a otros módulos que usan el mismo componente.

## Qué funcionalidades quedaron afectadas

Ninguna funcionalidad cambió — es un cambio puramente visual (CSS + una clase agregada en JSX). Los formularios, validaciones, permisos y llamadas a datos de fichas médicas siguen exactamente igual.
