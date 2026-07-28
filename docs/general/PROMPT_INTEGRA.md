TAREA MAESTRA: INTEGRAR UN MÓDULO EXTERNO / PARALELO DENTRO DE DEMOCRA SIN ROMPER EL SISTEMA, DOCUMENTANDO TODO LO APRENDIDO, TODOS LOS ERRORES PASADOS Y TODOS LOS RIESGOS FUTUROS

OBJETIVO PRINCIPAL
Quiero que integres un módulo desarrollado en paralelo o en otro directorio/proyecto dentro de la app principal Democra, de forma segura, incremental y reusable.

Pero esta tarea NO es solo “copiar código”.
Quiero una integración profesional que:
- recopile errores visibles
- detecte errores invisibles
- anticipe errores futuros
- preserve login, auth, tenant bootstrap, rutas, módulos y permisos
- documente las lecciones técnicas de todo el proceso
- evite repetir exactamente los problemas que ya sufrimos en el caso ONG

Quiero que trabajes con mentalidad de:
- auditor técnico
- integrador de arquitectura
- cirujano de frontend
- revisor preventivo de regresiones

==================================================
CONTEXTO GENERAL DEL PROYECTO
==================================================

El proyecto principal es una plataforma SaaS multi-tenant llamada Democra.
Ya existe una arquitectura core basada en:
- tenants
- profiles
- roles
- role_permissions
- user_roles_sedes
- tenant_modules
- system_modules
- permissions por tenant
- bootstrap del tenant
- lógica por industria (`industry_type_id`)
- shell integrado
- rutas internas tipo `/app/...`

Ya pasamos por una integración conflictiva con un módulo paralelo: ONG.

Ese módulo ONG originalmente existía como una app separada dentro del repositorio, con su propio:
- `src/`
- `package.json`
- `vite.config.ts`
- `dist`
- `.env`
- `node_modules`
- entrypoint separado
- runtime separado

Eso generó problemas porque el sistema no estaba realmente integrado: eran dos apps en la misma casa.

==================================================
LECCIONES APRENDIDAS DEL CASO ONG
==================================================

Debes asumir como conocimiento obligatorio todo lo siguiente y NO repetir errores equivalentes:

1. ERROR ARQUITECTÓNICO ORIGINAL
El módulo ONG estaba metido como subproyecto independiente dentro del repo principal, no como módulo real integrado.
Consecuencia:
- blanco total al abrir `/ONG/`
- el dev server principal no lo montaba como parte del runtime real
- había doble Vite, doble package, doble entrypoint, doble árbol posible

2. APRENDIZAJE CLAVE
Un módulo paralelo NO debe integrarse como mini app separada si el objetivo es que todo funcione como un solo sistema.
Debe absorberse dentro del frontend principal con:
- un solo package.json
- un solo vite.config
- un solo main/entrypoint
- un solo router principal
- un solo runtime React
- una sola sesión
- un solo bootstrap del tenant

3. ERROR DE RUNTIME REACT
Durante la integración apareció:
- `ReferenceError: React is not defined`
- localizado en `routes.tsx`
Esto enseñó que:
- incluso con import aparente, puede haber conflictos de runtime JSX
- puede haber mezcla de runtime clásico y automático
- hay que revisar imports reales, JSX en rutas, fragmentos y símbolos React usados solo de forma implícita
- hay que validar el bundle runtime, no solo el build

4. ERROR DE BOOTSTRAP BLOQUEANTE REPETIDO
Después de integrar, el sistema volvía a mostrar la pantalla completa de carga al navegar internamente.
No era porque el router se desmontaba, sino porque:
- `reload()` del bootstrap hacía siempre `setLoading(true)`
- el provider volvía a tapar toda la UI aunque ya hubiera contexto válido
Lección:
- distinguir entre `loading` inicial bloqueante y `refreshing` silencioso
- no volver a bloquear la app si ya existe contexto usable
- hidratar desde caché y refrescar en segundo plano

5. PÉRDIDA DE ESTADO DE TRABAJO
Al cambiar de pantalla:
- filtros se perdían
- búsquedas se borraban
- borradores se destruían
Lección:
- el estado local puro no basta
- hay que persistir al menos lo crítico usando una capa reusable
- usar sessionStorage o estrategia equivalente por módulo/página

6. PANTALLA DE CARGA
La pantalla de carga puede ser editable, reusable y más elegante.
Pero el objetivo principal NO es solo “hacerla bonita”, sino:
- hacer que aparezca menos
- usar modo fullscreen solo en bootstrap real
- usar refresh inline o skeletons cuando ya existe contexto

7. TENANT / INDUSTRIA / MÓDULOS
La app debe decidir qué shell abrir según:
- tenant
- `industry_type_id`
- módulos activos
- permisos
No se debe hardcodear toda la app solo para ONG, aunque ONG sea el caso prioritario actual.

8. RUTAS LEGACY
Se pueden dejar redirects legacy, pero el runtime activo debe ser uno solo.
Nunca depender nuevamente de abrir un subproyecto separado como `/ONG/` si el módulo ya fue absorbido.

9. NO TOCAR LO FUNCIONAL SI NO ES NECESARIO
Durante documentación y reorganización aprendimos que:
- no mover cosas sensibles a ciegas
- mejor indexar que romper
- no tocar auth, login, `.env`, runtime o migraciones por capricho
- conservar cuando haya duda

10. VALIDACIÓN REAL
No basta con que “build pase”.
Hay que validar también:
- runtime navegador
- rutas internas
- deep links
- bootstrap
- navegación interna
- permisos
- persistencia
- no recargas duras
- no referencias legacy

==================================================
OBJETIVO DE ESTA TAREA MAESTRA
==================================================

Quiero que, para el módulo conflictivo actual o futuro, hagas todo esto al mismo tiempo:

1. Auditar el módulo paralelo
2. Auditar la app principal
3. Detectar incompatibilidades
4. Detectar errores visibles actuales
5. Detectar errores invisibles o latentes
6. Detectar riesgos futuros
7. Proponer integración segura
8. Ejecutar integración incremental
9. Validar regresiones
10. Generar documentación de aprendizaje y memoria técnica

NO QUIERO UNA INTEGRACIÓN CIEGA.
QUIERO UNA INTEGRACIÓN CON MEMORIA Y PREVENCIÓN.

==================================================
DEFINICIÓN DE ERRORES QUE DEBES BUSCAR
==================================================

Debes recopilar y clasificar errores en al menos estas categorías:

A. ERRORES VISIBLES
- pantallas en blanco
- rutas rotas
- componentes que no renderizan
- errores en consola
- imports rotos
- módulos que no cargan
- login o redirect roto
- loaders bloqueantes innecesarios
- pérdida visible de filtros o formularios
- assets/imágenes que no cargan
- menús vacíos o mal armados

B. ERRORES INVISIBLES
- doble runtime
- doble provider
- doble supabase client
- doble router
- doble inicialización de auth
- navegación dura escondida
- uso de `<a href>` en vez de navegación SPA
- remount innecesario del provider
- recarga de bootstrap sin necesidad
- consultas redundantes
- contextos no memoizados
- imports legacy que siguen vivos pero no deberían
- estado local no persistido en zonas críticas
- alias inconsistentes
- build que pasa pero runtime que falla
- dependencias duplicadas o incompatibles

C. ERRORES FUTUROS / RIESGOS
- arquitectura demasiado acoplada a una sola industria
- rutas hardcodeadas sin registro reusable
- shell demasiado específico
- menús armados a mano en vez de generados desde configuración
- nuevas industrias imposibles de enchufar sin cirugía
- bundle creciendo sin modularización
- falta de lazy loading
- falta de persistencia reusable
- sobreuso de sessionStorage sin estrategia clara
- falta de versionado de estado persistido
- legacy no retirado que puede confundir futuras integraciones
- deep links que funcionen en dev pero no en producción sin rewrite
- formularios complejos que todavía no preservan borrador
- dependencias del módulo paralelo a configuraciones propias antiguas

==================================================
RESTRICCIONES CRÍTICAS
==================================================

NO HACER:
- no romper login
- no romper auth
- no romper middleware
- no romper bootstrap funcional actual
- no romper las rutas ya estables
- no borrar cosas delicadas sin evidencia
- no mover backend o migraciones si no es estrictamente necesario
- no hacer un refactor masivo ornamental
- no inventar soluciones si no hay evidencia
- no asumir que build OK = integración OK

SI HAY DUDA:
- conservar
- aislar
- documentar
- indexar
- proteger
- validar antes de tocar

==================================================
FASE 1. AUDITORÍA COMPLETA DEL MÓDULO EXTERNO / PARALELO
==================================================

Primero audita el módulo que quiero integrar.

Quiero que identifiques:
1. si es una app separada o ya un módulo reusable
2. si tiene package, vite, env, router, entrypoint y runtime propios
3. qué piezas son:
   - reutilizables
   - absorbibles
   - peligrosas
   - obsoletas
4. qué dependencias arrastra
5. qué supuestos arquitectónicos trae
6. qué acoplamientos fuertes trae al proyecto donde nació

Debes inspeccionar:
- entrypoints
- routing
- providers
- cliente de datos
- auth
- configuración de estilos
- librerías UI
- hooks
- layout
- sidebars
- permisos
- servicios
- tipos
- formularios
- loaders
- estados globales
- persistencia local
- uso de storage

ENTREGABLE INTERNO
Un mapa claro de:
- qué se puede absorber
- qué debe descartarse como infraestructura vieja
- qué puede romper la app principal
- qué conflictos se anticipan

==================================================
FASE 2. AUDITORÍA COMPLETA DE LA APP PRINCIPAL
==================================================

Antes de integrar, audita el frontend principal.

Necesito que detectes:
- router principal
- bootstrap del tenant
- auth/session
- layout/shell actual
- estrategia de permisos
- industry handling
- module handling
- estado persistente ya existente
- pantallas de carga
- deep link handling
- rewrites esperados
- providers globales
- cliente de datos global
- shared libs
- compatibilidad de estilos y librerías

ENTREGABLE INTERNO
Dime:
- dónde debe vivir el módulo integrado
- dónde NO debe meter mano
- cuál es la zona segura para absorber código
- qué abstracciones conviene reutilizar ya

==================================================
FASE 3. COMPARATIVA ENTRE MÓDULO EXTERNO Y CORE PRINCIPAL
==================================================

Haz una comparación explícita entre ambos mundos.

Quiero que detectes conflictos en:
- package manager / dependencias
- React runtime
- Vite / bundler
- alias
- estilos
- providers
- estado global
- cliente de Supabase o backend
- router
- layouts
- permisos
- navegación
- assets
- storage
- persistencia
- uso de URLs legacy
- nombre de rutas
- expectativas de basePath

CLASIFICA CADA CONFLICTO COMO:
- menor
- moderado
- crítico
- bloqueante

Y para cada conflicto:
- explica por qué existe
- qué riesgo tiene
- cómo lo resolverías
- si conviene resolverlo ahora o después

==================================================
FASE 4. RECOPILAR TODAS LAS LECCIONES Y PATRONES DEL CASO ONG
==================================================

Debes usar como memoria técnica del sistema todo lo aprendido del caso ONG e incorporarlo como reglas operativas.

REGLAS QUE DEBES RESPETAR:
- no integrar apps paralelas como si fueran solo carpetas dentro del repo
- absorber módulos en el runtime principal
- unificar router
- unificar session/auth
- unificar entrypoint
- evitar doble provider
- distinguir loading inicial de refreshing posterior
- cachear contexto del tenant
- proteger estado de trabajo del usuario
- usar pantalla de carga reusable y no invasiva
- validar rutas reales en navegador
- validar no recargas duras
- validar no pérdida de estado
- dejar legacy claro pero no activo

==================================================
FASE 5. PROPUESTA DE INTEGRACIÓN SEGURA
==================================================

Antes de tocar nada, propón un plan de integración incremental.

QUIERO QUE LA PROPUESTA INCLUYA:
1. qué se absorbe primero
2. qué se deja legacy temporal
3. qué se reemplaza
4. qué se adapta
5. qué se envuelve o encapsula
6. qué se deja para fase 2
7. qué validaciones deben correrse tras cada paso

La propuesta debe cubrir:
- arquitectura
- runtime
- rutas
- shell
- permisos
- bootstrap
- loaders
- persistencia
- menús
- assets
- formularios
- estados

NO EJECUTES TODO DE GOLPE.
Primero traza la cirugía.

==================================================
FASE 6. EJECUCIÓN DE LA INTEGRACIÓN
==================================================

Cuando ejecutes, hazlo de forma incremental y segura.

OBJETIVOS DE IMPLEMENTACIÓN:
- un solo runtime real
- un solo router real
- una sola sesión real
- un solo bootstrap del tenant
- un solo cliente de datos
- módulos absorbidos, no apps paralelas
- rutas internas integradas
- shell coherente por industria
- permisos reutilizados
- pantallas de carga no invasivas
- estado crítico preservado

REGLAS:
- no romper ONG actual
- no romper lo ya funcional
- no reescribir por gusto
- no dejar dependencias fantasmas
- no mezclar dos fuentes de verdad

==================================================
FASE 7. HARDENING TÉCNICO Y DETECCIÓN DE ERRORES INVISIBLES
==================================================

Después de integrar, ejecuta una pasada de hardening.

BUSCA ESPECÍFICAMENTE:
- archivos con JSX y runtime dudoso
- referencias a React no seguras
- providers duplicados
- múltiples clients del backend
- navegación dura escondida
- `window.location`
- `<a href>` donde debería ir SPA navigation
- remount del bootstrap
- recargas innecesarias
- contexto no memoizado
- caché inconsistente
- menús hardcodeados
- rutas legacy aún activas sin querer
- estado local crítico sin persistencia
- formularios que perderían trabajo
- build warnings relevantes
- chunks gigantes o puntos de división de bundle
- imports legacy muertos
- archivos obsoletos que pueden confundir al equipo
- dependencia del módulo a su viejo `.env`, `vite.config`, `package`, `index.html`

QUIERO QUE DETECTES PROBLEMAS AUNQUE TODAVÍA NO EXPLOTEN.

==================================================
FASE 8. HARDENING DE EXPERIENCIA DE USUARIO
==================================================

No quiero solo que “funcione”.
Quiero que se sienta sólido.

VALIDA:
- si la pantalla de carga aparece demasiado
- si el shell parpadea
- si al cambiar de ruta se pierde trabajo
- si los filtros se preservan
- si la búsqueda se preserva
- si los formularios importantes guardan borrador
- si el usuario entiende lo que se está cargando
- si el refresh puede ser inline en lugar de fullscreen
- si el módulo nuevo se siente parte del sistema y no un injerto

==================================================
FASE 9. VALIDACIÓN TÉCNICA FINAL
==================================================

Corre validaciones reales.

VALIDAR COMO MÍNIMO:
1. `npm install`
2. `npm run dev`
3. `npm run build`
4. rutas principales
5. deep links
6. navegación interna SPA
7. shell correcto por tenant/industria
8. menús correctos por permisos
9. auth/login estables
10. bootstrap estable
11. refreshing no bloqueante
12. persistencia mínima de estado
13. imágenes/assets principales
14. ausencia de errores graves en consola
15. ausencia de referencias activas al subproyecto viejo si ya fue absorbido

Y además:
- revisar `git diff --stat`
- listar exactamente qué archivos se tocaron
- separar archivos nuevos, modificados y legacy

==================================================
FASE 10. MEMORIA TÉCNICA Y DOCUMENTACIÓN DE APRENDIZAJE
==================================================

Al final, quiero un entregable muy completo que documente todo lo aprendido.

DEBE INCLUIR:

A. RESUMEN EJECUTIVO
- qué se integró
- cómo estaba antes
- cómo quedó ahora
- qué fue lo más delicado

B. ERRORES ENCONTRADOS
Separados en:
- visibles
- invisibles
- futuros

C. LECCIONES APRENDIDAS
Qué enseñó esta integración sobre:
- arquitectura
- bootstrap
- runtime
- rutas
- permisos
- persistencia
- UX
- legacy

D. PARCHES Y NO PARCHES
Quiero que distingas entre:
- solución estructural real
- parche temporal aceptable
- parche peligroso que evitamos
- no parche que se decidió conscientemente no meter

E. PUNTOS DE NO RETORNO
Qué decisiones ya deben considerarse estándar del sistema para futuras integraciones

F. CHECKLIST REUSABLE
Una checklist que podamos usar en el próximo módulo paralelo para no repetir errores

==================================================
FORMATO DE RESPUESTA FINAL ESPERADA
==================================================

Quiero que me entregues un informe final en este formato:

1. Diagnóstico inicial
2. Arquitectura previa detectada
3. Conflictos entre módulo y core
4. Errores visibles encontrados
5. Errores invisibles encontrados
6. Riesgos futuros detectados
7. Lecciones del caso ONG reaplicadas
8. Plan de integración elegido
9. Cambios ejecutados
10. Validaciones corridas
11. Qué quedó estable
12. Qué quedó como legacy
13. Qué quedó pendiente para fase 2
14. Recomendaciones para el próximo módulo paralelo
15. Checklist maestra para futuras integraciones

==================================================
PRIORIDAD ABSOLUTA
==================================================

No romper lo ya funcional.
No repetir el error de tener dos apps pegadas.
No bloquear la UI si ya existe contexto válido.
No perder trabajo del usuario al navegar.
No confiar ciegamente en que un build exitoso significa integración correcta.
No dejar deuda silenciosa sin documentar.

Quiero que trates esta tarea como una integración con memoria histórica, prevención de regresiones y preparación para crecimiento real del sistema.