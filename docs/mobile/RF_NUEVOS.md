# RF NUEVOS — Oportunidades Mobile First

Fecha: 2026-07-04. Cada RF nace de una capacidad nativa que mejora un flujo existente o habilita uno nuevo.

## Leyenda
- **Prioridad:** Alta / Media / Baja (valor operativo en campo).
- **Complejidad:** Baja / Media / Alta (esfuerzo técnico).

---

### RF-NEW-01 · Escaneo QR para asistencia
- **Descripción:** Registrar asistencia escaneando el QR de la credencial ID del voluntario/beneficiario.
- **Beneficio:** Elimina la búsqueda manual; asistencia en segundos en eventos masivos. Potencia RF-OPER-02.
- **Prioridad:** Alta · **Complejidad:** Media
- **Dependencias:** RF-OPER-02, RF-PERS-03 (credenciales ID), permiso `attendance.scan`.
- **Módulos afectados:** operation, people, idcards.
- **Tecnologías:** `expo-camera` / `expo-barcode-scanner`, `vision-camera`.

### RF-NEW-02 · Captura de evidencia con cámara + geolocalización
- **Descripción:** Tomar fotos de evidencia directamente y adjuntar coordenadas GPS y timestamp verificable.
- **Beneficio:** Evidencia georreferenciada y con menor fricción. Potencia RF-OPER-04.
- **Prioridad:** Alta · **Complejidad:** Media
- **Dependencias:** RF-OPER-04, Storage `evidence`.
- **Módulos:** operation.
- **Tecnologías:** `expo-camera`, `expo-location`, `expo-image-manipulator` (compresión).

### RF-NEW-03 · Notificaciones Push (FCM/APNs)
- **Descripción:** Push real para nuevas notificaciones, aprobaciones pendientes y asignaciones.
- **Beneficio:** Alcance inmediato aunque la app esté cerrada; hoy solo hay realtime in-app (RF-NOTI-01).
- **Prioridad:** Alta · **Complejidad:** Media
- **Dependencias:** RF-NOTI-01; requiere tabla `push_tokens` + Edge Function/trigger (ver BASE_DATOS_MOVIL.md).
- **Módulos:** notifications, comunicaciones.
- **Tecnologías:** `expo-notifications`, Supabase Edge Function.

### RF-NEW-04 · Modo Offline First para captura en campo
- **Descripción:** Capturar asistencia, horas y evidencias sin conexión y sincronizar al reconectar.
- **Beneficio:** Operatividad en zonas sin señal (común en ONG de campo). Ver OFFLINE_FIRST.md.
- **Prioridad:** Alta · **Complejidad:** Alta
- **Dependencias:** RF-OPER-02/03/04.
- **Módulos:** operation, storage, offline.
- **Tecnologías:** SQLite (`expo-sqlite`/WatermelonDB), TanStack Query persist, cola de operaciones.

### RF-NEW-05 · Biometría para desbloqueo y acciones críticas
- **Descripción:** Face ID / huella para reabrir la app y como *step-up* alternativo al OTP en acciones críticas.
- **Beneficio:** Seguridad + rapidez; complementa RF-AUTH-03/04.
- **Prioridad:** Media · **Complejidad:** Media
- **Dependencias:** RF-AUTH-01/03, SecureStore.
- **Módulos:** auth.
- **Tecnologías:** `expo-local-authentication`, `expo-secure-store`.

### RF-NEW-06 · Credencial ID digital con QR (wallet)
- **Descripción:** Mostrar la credencial del usuario en pantalla con QR dinámico; opción de añadir a Apple/Google Wallet.
- **Beneficio:** Identificación sin credencial física; sinergia con RF-NEW-01.
- **Prioridad:** Media · **Complejidad:** Alta
- **Dependencias:** RF-PERS-03.
- **Módulos:** idcards, people.
- **Tecnologías:** `react-native-qrcode-svg`, PassKit/Google Wallet API.

### RF-NEW-07 · Deep Links / Universal Links
- **Descripción:** Abrir directamente una entidad (proyecto, solicitud, notificación) desde un enlace o push.
- **Beneficio:** Navegación contextual desde emails/push; onboarding por código (RF-ADMI-05).
- **Prioridad:** Media · **Complejidad:** Baja
- **Dependencias:** RF-NEW-03, navegación.
- **Módulos:** navigation, admission, notifications.
- **Tecnologías:** Expo Router linking, `expo-linking`.

### RF-NEW-08 · Escaneo de documentos (admisión)
- **Descripción:** Escanear DNI/documentos con detección de bordes y recorte, para subir a admisión.
- **Beneficio:** Calidad y velocidad en RF-ADMI-02/04.
- **Prioridad:** Media · **Complejidad:** Media
- **Dependencias:** RF-ADMI-02, Storage documentos.
- **Módulos:** admission.
- **Tecnologías:** `vision-camera` + document scanner, `expo-document-picker`.

### RF-NEW-09 · Firma digital en pantalla
- **Descripción:** Capturar firma manuscrita para consentimientos/actas de onboarding y aprobaciones.
- **Beneficio:** Cierra flujos que hoy requieren papel.
- **Prioridad:** Media · **Complejidad:** Media
- **Dependencias:** RF-ADMI-04, RF-APRO-01, Storage.
- **Módulos:** admission, approvals.
- **Tecnologías:** `react-native-signature-canvas`.

### RF-NEW-10 · Compartir e imprimir (share sheet)
- **Descripción:** Compartir reportes/credenciales/enlaces vía share nativo; descargar PDF localmente.
- **Beneficio:** Distribución rápida de información.
- **Prioridad:** Baja · **Complejidad:** Baja
- **Dependencias:** RF-RECU-02, RF-PERS-03.
- **Módulos:** resources, people.
- **Tecnologías:** `expo-sharing`, `expo-file-system`, `expo-print`.

### RF-NEW-11 · Sincronización automática y estado de sync
- **Descripción:** Sincronización en background al recuperar red + indicador visible de estado (pendiente/sincronizando/ok/error).
- **Beneficio:** Transparencia y confianza en el modo offline (RF-NEW-04).
- **Prioridad:** Alta · **Complejidad:** Alta
- **Dependencias:** RF-NEW-04.
- **Módulos:** offline, sync.
- **Tecnologías:** `@react-native-community/netinfo`, `expo-background-task`, cola con reintentos.

### RF-NEW-12 · Selección desde galería y subida optimizada
- **Descripción:** Elegir imágenes de galería con compresión antes de subir a Storage.
- **Beneficio:** Menos datos móviles; potencia evidencias/documentos/avatares.
- **Prioridad:** Media · **Complejidad:** Baja
- **Dependencias:** RF-OPER-04, RF-ADMI-02.
- **Módulos:** operation, admission, storage.
- **Tecnologías:** `expo-image-picker`, `expo-image-manipulator`.

### RF-NEW-13 · Mapa de sedes/actividades
- **Descripción:** Ver sedes y actividades en mapa; cómo llegar.
- **Beneficio:** Contexto geográfico para voluntarios de campo.
- **Prioridad:** Baja · **Complejidad:** Media
- **Dependencias:** datos de `sedes`, `actividades`.
- **Módulos:** operation.
- **Tecnologías:** `react-native-maps`, `expo-location`.

### RF-NEW-14 · Recordatorios en calendario del dispositivo
- **Descripción:** Añadir actividades/entrevistas al calendario nativo.
- **Beneficio:** Reduce ausencias; integra con la vida del voluntario.
- **Prioridad:** Baja · **Complejidad:** Baja
- **Dependencias:** RF-OPER-01, RF-ADMI-03.
- **Módulos:** operation, admission.
- **Tecnologías:** `expo-calendar`.

### RF-NEW-15 · Caché de imágenes y assets
- **Descripción:** Cachear avatares/evidencias vistas para reducir consumo y mejorar percepción.
- **Beneficio:** Rendimiento y ahorro de datos.
- **Prioridad:** Media · **Complejidad:** Baja
- **Dependencias:** Storage.
- **Módulos:** storage, ui.
- **Tecnologías:** `expo-image` (caché integrada).

---

## Priorización sugerida (MoSCoW para MVP móvil)

- **Must:** RF-NEW-01 (QR asistencia), RF-NEW-02 (evidencia + GPS), RF-NEW-03 (push), RF-NEW-04 (offline), RF-NEW-11 (sync).
- **Should:** RF-NEW-05 (biometría), RF-NEW-07 (deep links), RF-NEW-12 (galería), RF-NEW-15 (caché imágenes).
- **Could:** RF-NEW-06 (credencial wallet), RF-NEW-08 (escaneo doc), RF-NEW-09 (firma), RF-NEW-13 (mapa).
- **Won't (v1):** RF-NEW-10 (share/print), RF-NEW-14 (calendario).
