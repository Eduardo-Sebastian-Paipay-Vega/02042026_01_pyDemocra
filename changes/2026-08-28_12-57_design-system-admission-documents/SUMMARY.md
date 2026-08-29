# SUMMARY — Design System: Admission Documents

## Qué se hizo
Se aplicó el Design System dark mode (paleta warm-dark) proporcionado por el usuario a la página de Documentos de Admisión, siguiendo el patrón de scoped themes del proyecto.

## Por qué se hizo
El usuario solicitó que la página adoptara los tokens de diseño especificados: colores de fondo `#100F0D`/`#171512`, bordes `#26231F`, tipografía `#F9F7F3`/`#A4A29F`/`#686561`, y acentos semánticos (emerald, amber, purple). La implementación previa usaba las variables CSS genéricas sin un scope dedicado.

## Qué beneficio aporta
- **Identidad visual cohesiva**: la página ahora usa tokens exactos del Design System del usuario.
- **KPIs en tiempo real**: fila de 4 tarjetas con métricas reales (total solicitudes, pendientes, tasa aprobación, rechazados).
- **Empty states mejorados**: ícono desaturado en contenedor soft, texto centrado — fiel al Design System.
- **Cero mock data**: todos los valores provienen de hooks conectados a Supabase.

## Qué funcionalidades quedaron afectadas
- Vista de Documentos de Admisión (`/ong/app/admission/documents`) — solo visual, CRUD intacto.
- Estilos CSS del módulo ONG (`index.css`) — se agregó un nuevo scope sin tocar los existentes.
