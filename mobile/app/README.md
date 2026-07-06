# app/ — Rutas (Expo Router)

Rutas file-based. Estructura prevista:

```
app/
├── _layout.tsx        # Providers raíz + guard de sesión (Slot)
├── (auth)/            # login, otp-verify, biometric-unlock
└── (tabs)/            # home, operacion, personas, notificaciones, mas
```

Sin implementación en esta fase. Guards por permiso reutilizan `hasPermission` (RBAC compartido).
