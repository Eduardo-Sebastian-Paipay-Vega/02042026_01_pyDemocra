# Historias BDD y Criterios de Aceptación: Autenticación
> **Fase 3 | Diseño y Definición** | Fecha de análisis: 2026-07-09

---

## Épica: Autenticación Basada en Riesgo (Risk-Based Auth)

Como Administrador de Seguridad, quiero que el sistema evalúe dinámicamente el riesgo de cada inicio de sesión para aplicar barreras adicionales (MFA) solo cuando el comportamiento sea sospechoso, equilibrando seguridad y usabilidad.

### Feature: Evaluación de Riesgo Dinámico en Login

**Background:** 
Dado que el motor de riesgo está activo y configurado con los umbrales de la ONG.

**Scenario:** Login Seguro (Bajo Riesgo)
```gherkin
Given que el usuario 'admin@democra.app' tiene una sesión anterior exitosa desde la IP '192.168.1.100'
And el dispositivo está registrado en la base de datos de confianza
When el usuario intenta hacer login con contraseña correcta
Then el Motor de Riesgo devuelve la decisión 'ALLOW'
And se crea un registro de evento en auth_events con nivel 'LOW'
And el sistema autentica al usuario sin pasos adicionales
```

**Scenario:** Login Inusual (Riesgo Medio) requiere Step-Up MFA
```gherkin
Given que el usuario intenta login con credenciales correctas
And la petición proviene de una IP nueva no registrada '203.0.113.42'
When el Motor de Riesgo evalúa el contexto de la petición
Then el sistema detiene el proceso de login
And el Motor de Riesgo devuelve la decisión 'REQUIRE_OTP'
And se genera y envía un código OTP de 6 dígitos al correo del usuario
And se almacena un registro en mfa_challenges con el hash HMAC del OTP
And el sistema retorna un JWT temporal con alcance limitado a 'mfa-verification'
```

**Scenario:** Validación Exitosa de Código OTP
```gherkin
Given que existe un desafío MFA activo y no expirado con challenge_id 'abc-123'
And el código enviado al usuario es '847293'
When el usuario ingresa el código '847293' en la interfaz
And envía la solicitud de verificación con el challenge_id
Then el backend calcula el hash HMAC con el pepper local
And comprueba que coincide con el almacenado en base de datos
Then el sistema actualiza el estado del desafío a 'verified: true'
And emite el JWT de sesión final con permisos completos
```

### Feature: Login por Terminal Físico

Como Operador de Sede, quiero ingresar al sistema rápidamente utilizando un panel numérico táctil (Terminal) con un PIN, para evitar escribir usuarios y contraseñas complejas en pantallas públicas.

**Scenario:** Bloqueo de Seguridad por Fuerza Bruta de PIN
```gherkin
Given que el terminal 'TERM-SedeCentral' está configurado y activo
And el usuario 'usr-001' ha fallado la introducción de su PIN 4 veces consecutivas
And la configuración del sistema define MAX_PIN_ATTEMPTS = 5
When el usuario ingresa un PIN incorrecto por quinta vez consecutiva
Then el sistema incrementa el contador de fallos a 5
And el sistema bloquea inmediatamente la cuenta del usuario para el método PIN
And establece un bloqueo temporal por PIN_BLOCK_MINUTES minutos
And registra un evento de seguridad crítico en auth_events
```
