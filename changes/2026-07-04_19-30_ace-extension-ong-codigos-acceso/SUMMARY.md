# SUMMARY — Extensión de ACE en ONG: códigos de acceso y asignación automática de roles

## Qué se hizo

Se auditó cómo GYMsos (Sistema 2) genera roles e invitaciones, se determinó que ese patrón es inconsistente e inseguro (roles fijos sin migración versionada, 3 mecanismos de código redundantes, brecha de enumeración anónima), y en su lugar se completó y conectó el sistema ACE que ya existía en la base de datos de ONG pero no tenía interfaz en la app en uso: se agregó una pantalla de administración para generar códigos de acceso con selector de rol, y una página pública para canjearlos y asignar el rol automáticamente. De paso se encontraron y documentaron (sin aplicar) 2 bugs reales que habrían hecho fallar la asignación automática en el caso más común (código sin sede específica).

## Por qué se hizo

El pedido original era replicar la lógica de S2; la auditoría mostró que replicarla habría sido un retroceso. ONG ya tenía la pieza correcta a medio conectar — completar esa pieza cumple el objetivo real del pedido (admin genera código → registro asigna rol) sin heredar los problemas de S2.

## Qué beneficio aporta

- Los administradores de la ONG podrán generar códigos de acceso para voluntarios, staff o beneficiarios, eligiendo qué rol se les asigna automáticamente al registrarse — algo que hoy no es posible desde ninguna pantalla en uso.
- Se evita duplicar o empeorar la arquitectura con el patrón de S2 (roles fijos, códigos redundantes, hueco de seguridad).
- Se documentaron 2 bugs reales del sistema ACE existente que habrían bloqueado el caso de uso más común, con su fix listo para aplicar.

## Qué funcionalidades quedaron afectadas

El flujo actual de registro de voluntarios por solicitud de admisión (`/signup`, Edge Function `consume-volunteer-registration-code`) no se tocó y sigue funcionando igual. Nada de lo existente cambia de comportamiento; solo se agregan una pantalla de administración y una página pública nuevas. El fix de base de datos requiere un paso manual pendiente (ver CHANGELOG) antes de que la asignación automática de rol funcione de extremo a extremo.
