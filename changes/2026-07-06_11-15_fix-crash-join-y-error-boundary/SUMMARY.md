# SUMMARY — Fix: pantalla en blanco en /join (insertBefore) + ErrorBoundary

## Qué se hizo

Se corrigió un crash de React (`NotFoundError: insertBefore`) en la página de canje de códigos (`/join`), causado por la falta de atributos `autoComplete` en los campos de correo/contraseña (el autofill del navegador inyecta DOM que React no controla) combinada con un patrón de renderizado condicional por bloques hermanos. Se agregó además un `ErrorBoundary` reutilizable envolviendo esa ruta.

## Por qué se hizo

El usuario probó en real el flujo de registro por código y la pantalla se ponía en blanco justo al completar el registro, con ese error específico en consola.

## Qué beneficio aporta

- El flujo de registro por código ya no crashea en la transición de "enviando" a "éxito".
- Cualquier error de renderizado futuro en esa ruta (esta u otra causa) ahora muestra un mensaje amigable con botón de recarga, en vez de dejar la app en blanco sin pistas.

## Qué funcionalidades quedaron afectadas

Ninguna negativamente. El comportamiento (validar código → crear cuenta → asignar rol → redirigir) es el mismo; solo cambió cómo se estructura el render y cómo se navega al final.
