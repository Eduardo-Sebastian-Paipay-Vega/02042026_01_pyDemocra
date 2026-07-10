# Resumen ejecutivo

## Qué se hizo
Se reemplazó el correo electrónico y el avatar de iniciales fijas del
Topbar por el nombre completo y la foto real del usuario (con fallback de
iniciales dinámicas), se corrigió el solapamiento de textos en pantallas
angostas, se dejó un slot listo (pero no conectado, por falta de columna en
producción) para el logo del tenant, y se crearon dos vistas reales de
cuenta: "Perfil" (consulta) y "Configuración" (edición de nombre y foto).

## Por qué se hizo
REQ-001/002/003 de `REQ004.md` y REQ-004/005 de `REQ005.md` pedían unificar
la identidad visible del usuario en el shell autenticado y darle un destino
funcional real a las opciones del menú de cuenta, que antes no hacían nada.

## Qué beneficio aporta
- El usuario se reconoce a sí mismo en la barra superior (nombre y foto
  reales), no por su credencial de acceso.
- "Perfil" y "Configuración" dejan de ser botones muertos.
- Se detectó y evitó a tiempo un pedido que no tenía respaldo real en la
  base de datos (logo del tenant) en vez de construir sobre una columna
  inexistente.

## Qué funcionalidades quedaron afectadas
Ninguna existente se rompió: el cierre de sesión, las notificaciones, el
buscador global y el control de intensidad visual del Topbar no se
tocaron. Es funcionalidad nueva (páginas de cuenta) sumada sin gate de
permisos de módulo, por ser información propia del usuario autenticado.

## Pendiente para una iteración futura (fuera de alcance de esta tanda)
Agregar una columna de logo a `public.tenants` (o tabla equivalente) si se
quiere mostrar un logo real de la ONG en el Topbar — hoy no existe ese dato
en producción.
