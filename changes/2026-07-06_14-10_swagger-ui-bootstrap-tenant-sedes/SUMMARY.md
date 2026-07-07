# SUMMARY — Swagger UI local, endpoint de bootstrap de tenant y CRUD de sedes

## Qué se hizo

Se expuso la documentación de la API como Swagger UI en `/api/docs`, y se implementaron dos endpoints que el análisis de cobertura funcional identificó como críticos y ausentes: `POST /api/onboarding/bootstrap-tenant` (alta de un tenant nuevo, envolviendo `fn_bootstrap_tenant`) y un CRUD completo de sedes (`GET/POST/PUT/DELETE /api/sedes`).

## Por qué se hizo

El análisis de cobertura mostró que no existía NINGÚN camino (ni Express ni Supabase directo desde el frontend) para que una organización nueva se diera de alta, ni para gestionar sedes de un tenant existente más allá de la sede "Principal" creada como efecto colateral del bootstrap.

## Qué beneficio aporta

Dos flujos de negocio críticos que antes requerían SQL manual ahora son operaciones de API normales, documentadas y con tests.

## Qué funcionalidades quedaron afectadas

Ninguna existente. Se agregaron rutas nuevas; las 14 rutas previas no cambiaron de comportamiento. El gap de "beneficiario ONG inscribiéndose en el Gym" identificado en el mismo análisis **no se resolvió** — está bloqueado porque el esquema `gym.*` no existe en la base de datos de este proyecto (solo documentado para un sistema externo), no por falta de código.
