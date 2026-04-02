# 1. Nombre del documento
- `Cierre integral del repositorio`

## 2. Objetivo
- Consolidar el estado final del repo despues de las fases de sincronizacion multi-schema, cierre funcional y endurecimiento de seguridad.
- Dejar trazabilidad unica de:
  - build final.
  - revision de rutas nuevas.
  - revision de mocks remanentes.
  - verificacion de loading / empty / error en los modulos tocados.
  - checklist final por modulo.

## 3. Fuente de verdad auditada
- `AGENTS.md`
- `package.json`
- `src/app/routes.tsx`
- `src/app/components/layout/AppShell.tsx`
- `src/app/components/layout/Sidebar.tsx`
- `src/app/components/ui/command-palette.tsx`
- `guidelines/documentacion-navegacion/01-home.md`
- `guidelines/documentacion-navegacion/02-operacion.md`
- `guidelines/documentacion-navegacion/04-personas.md`
- `guidelines/documentacion-navegacion/05-aprobaciones.md`
- `guidelines/documentacion-navegacion/06-admision.md`
- `guidelines/documentacion-navegacion/07-recursos.md`
- `guidelines/documentacion-navegacion/08-notificaciones.md`
- `guidelines/documentacion-navegacion/08-gobernanza.md`
- `guidelines/documentacion-navegacion/10-configuracion.md`
- `guidelines/BD/Parte 1- Script maestro documental del Core SUBS public.txt`
- `guidelines/BD/Parte 2 - Script maestro documental de ONG modulos complementarios.txt`
- `guidelines/BD/Parte 4- Script maestro documental de ONG modulos complementarios.txt`

## 4. Verificacion tecnica final
- `package.json` solo define `build` y `dev`; no existen scripts de lint o test en el repo.
- `npm run build` se ejecuto el `2026-03-28` en `America/Lima`: compilacion satisfactoria.
- El build mantiene la advertencia no bloqueante de chunk grande en `dist/assets/index-*.js`.
- No se detectaron errores de compilacion ni tipos rotos en la pasada final.
- Se elimino el mock legacy huerfano `src/app/data/mockData.ts`; la busqueda final de `mock` en modulos/paginas/services ya no encuentra datos fake en el flujo operativo del admin.

## 5. Rutas y navegacion revisadas
- Rutas nuevas confirmadas en `src/app/routes.tsx`:
  - `/landing/register`
  - `/admin/id-cards`
  - `/admin/notifications/history`
  - `/admin/audit-log`
  - `/admin/security`
- Integracion de shell confirmada en:
  - `src/app/components/layout/AppShell.tsx`
  - `src/app/components/layout/Sidebar.tsx`
  - `src/app/components/ui/command-palette.tsx`
- Riesgo residual visible:
  - `/admin/courses` sigue usando `PlaceholderPage` en `src/app/routes.tsx`; no se maquillo como modulo terminado.

## 6. Estados UX verificados
- Los modulos tocados mantienen `loading`, `empty`, `error` y `retry` en sus pantallas principales.
- La verificacion se hizo sobre:
  - `Dashboard.tsx`
  - `Activities.tsx`
  - `Attendance.tsx`
  - `Hours.tsx`
  - `HoursApproval.tsx`
  - `Approvals.tsx`
  - `AdmissionRequests.tsx`
  - `AdmissionDocuments.tsx`
  - `AdmissionInterviews.tsx`
  - `AdmissionOnboarding.tsx`
  - `Volunteers.tsx`
  - `MedicalRecords.tsx`
  - `IdCards.tsx`
  - `Finance.tsx`
  - `Inventory.tsx`
  - `NotificationTemplates.tsx`
  - `NotificationHistory.tsx`
  - `Catalogs.tsx`
  - `AuditLog.tsx`
  - `SensitiveAccess.tsx`
  - `SoftDelete.tsx`
  - `SystemUsers.tsx`
  - `Roles.tsx`
  - `Security.tsx`

## 7. Checklist final por modulo
### Home
- [x] `Dashboard` usa datos reales del tenant y ya no depende de `HomeDatabase`.
- [x] `approvalsPending` sale de `ong.aprobaciones`.
- [x] la busqueda global tiene deep-link real por entidad.
- [x] el topbar consume historial real de notificaciones.
- [x] loading / empty / error verificados.

### Operacion
- [x] `Actividades`, `Asistencias`, `Horas` y `Evidencias` operan contra schemas reales.
- [x] `Asistencias` usa `ong.asistencias` con detalle, alta manual, incidencia y soft delete.
- [x] el escaneo QR usa `ong.id_cards` + `ong.fn_register_attendance_scan`.
- [x] loading / empty / error verificados.

### Aprobaciones
- [x] la bandeja usa `ong.aprobaciones`.
- [x] `HoursApproval` persiste comentario de resolucion en `ong.aprobaciones` y `ong.horas_actividad.comentario_resolucion`.
- [x] lectura de estados reales verificada.
- [x] loading / empty / error verificados.

### Proyectos
- [x] rutas existentes siguen integradas en `Sidebar` y `routes.tsx`.
- [x] el deep-link desde Home abre contexto real en `ProjectsWorkspace`.
- [ ] no hubo rehacer funcional completo del dominio en esta ronda; queda fuera del cierre contractual actual.

### Personas
- [x] `Voluntarios` y `Beneficiarios` siguen sobre servicios reales.
- [x] `Ficha medica sensible` usa permisos finos y bitacora sensible.
- [x] `Credenciales ID` opera con `ong.id_card_templates`, `ong.id_card_template_fields`, `ong.id_cards`.
- [x] exportacion PNG y canvas reales verificados.
- [x] loading / empty / error verificados.

### Admision
- [x] solicitudes usan `id_voluntario_vinculado`.
- [x] documentos usan `verified_by` y `verified_at`.
- [x] entrevistas usan `puntaje`.
- [x] onboarding usa `evidencia_url`.
- [x] generacion de codigo usa `rrhh.fn_generate_registration_code`.
- [x] pantalla publica/controlada `/landing/register` quedo conectada a consumo backend seguro.
- [x] loading / empty / error verificados.

### Recursos
- [x] `Inventario` y `Finanzas` compilan y siguen conectados a servicios reales.
- [x] `Finanzas` usa `finanzas.cat_tipos_cuenta`.
- [x] `Finanzas` usa `finanzas.aprobaciones_transaccion`.
- [x] loading / empty / error verificados.
- [ ] `Cursos y certificados` sigue pendiente como placeholder en `/admin/courses`.

### Notificaciones
- [x] `Plantillas` usa `variables` y `codigo_evento`.
- [x] `Historial` usa `codigo_canal`, `estado_entrega`, `error_mensaje`, `id_plantilla`, `payload`.
- [x] `Topbar` y `Home` consumen historial real cuando corresponde.
- [x] loading / empty / error verificados.

### Gobernanza
- [x] `Catalogos` usa permisos finos nuevos.
- [x] `Accesos sensibles` incluye bitacora de voluntario.
- [x] `Soft delete / Retencion` expone restore real solo para whitelist documentada.
- [x] loading / empty / error verificados.

### Configuracion
- [x] `Usuarios del sistema` usa `admin-provision-user`.
- [x] `Seguridad` usa `admin-revoke-user-sessions` y `public.fn_remote_revoke_app_session`.
- [x] `settings.sessions.read` y `settings.sessions.terminate` quedaron alineados y documentados.
- [x] `Roles y permisos` sigue sobre Core real.
- [x] loading / empty / error verificados.

## 8. Riesgos residuales visibles
- `src/app/routes.tsx`: `/admin/courses` continua como `PlaceholderPage`.
- `dist/assets/index-*.js`: warning de chunk grande en build final; no bloquea release tecnica, pero conviene code splitting posterior.
- `guidelines/documentacion-navegacion/`: todavia conviven documentos historicos sin numeracion consolidada (`home.md`, `operacion.md`, `admision.md`, `recursos.md`, `personas-proyectos-salud.md`); no bloquean build, pero no deben tomarse como fuente principal frente a los docs numerados.

## 9. Resultado final
- El repositorio queda compilando y documentado tras las fases ejecutadas.
- No quedaron mocks activos en el flujo principal del admin; el mock legacy aislado se elimino.
- La navegacion nueva queda trazada y el unico placeholder residual queda explicitado.
