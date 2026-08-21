# GLOBAL UI DESIGN RULE
## Democra Education Visual System

Esta regla define EXCLUSIVAMENTE el lenguaje visual y de diseño de toda la aplicación.

El objetivo es transformar visualmente TODO el sistema actual para que adopte el lenguaje visual de un SaaS empresarial profesional inspirado en la interfaz de Democra.pro.

IMPORTANTE:

- Esta regla afecta únicamente PRESENTACIÓN, UI, UX VISUAL, LAYOUT, ESTILOS, COMPONENTES Y DESIGN SYSTEM.
- NO modificar lógica de negocio.
- NO modificar funcionalidades.
- NO modificar endpoints.
- NO modificar APIs.
- NO modificar modelos de datos.
- NO modificar consultas.
- NO modificar permisos.
- NO modificar autenticación.
- NO modificar rutas salvo que sea estrictamente necesario para aplicar el layout visual.
- NO eliminar funcionalidades existentes.
- NO cambiar nombres funcionales de módulos.
- NO introducir nuevas funcionalidades.
- NO alterar comportamiento funcional existente.
- NO inventar componentes innecesarios.
- NO rediseñar la aplicación como una landing page.
- NO utilizar patrones visuales típicos de dashboards generados automáticamente por IA.

La interfaz debe sentirse como un producto SaaS empresarial real, maduro, consistente y desarrollado como parte de una familia de software.

==================================================
1. REFERENCIA VISUAL
==================================================

La referencia visual principal es la interfaz de Democra.pro mostrada en la captura proporcionada.

No copiar contenido, textos, nombres, logos, datos, branding ni información específica de Democra.

COPIAR ÚNICAMENTE EL LENGUAJE VISUAL:

- estructura visual
- densidad
- jerarquía
- proporciones
- espaciado
- tratamiento de superficies
- navegación lateral
- tarjetas
- tablas
- botones
- inputs
- estados
- tipografía
- bordes
- radios
- colores
- iconografía
- comportamiento visual
- distribución de información
- sensación de producto enterprise

El resultado debe parecer perteneciente a la MISMA FAMILIA DE SOFTWARE, pero adaptado al producto educativo.

==================================================
2. PRINCIPIO FUNDAMENTAL
==================================================

La aplicación NO debe parecer una plantilla de dashboard.

Debe parecer un SaaS empresarial construido deliberadamente.

Evitar completamente:

- gradientes decorativos
- glassmorphism
- blobs
- fondos abstractos
- tarjetas flotantes exageradas
- sombras enormes
- neumorphism
- exceso de redondeo
- colores saturados
- interfaces excesivamente espaciosas
- diseños tipo Dribbble
- estética "AI dashboard"
- exceso de iconos
- ilustraciones decorativas innecesarias
- animaciones llamativas
- efectos visuales que no aporten información

Priorizar:

- precisión
- densidad informativa
- claridad
- consistencia
- sobriedad
- jerarquía
- funcionalidad
- apariencia enterprise
- sensación de sistema consolidado

==================================================
3. TEMA OSCURO
==================================================

El modo principal del sistema será DARK.

La interfaz debe utilizar una jerarquía de superficies oscuras.

No utilizar negro absoluto como único color.

Crear diferentes niveles de superficie:

Nivel 0:
background principal de la aplicación.

Nivel 1:
sidebar, header y zonas estructurales.

Nivel 2:
cards, paneles, tablas y contenedores.

Nivel 3:
inputs, elementos interactivos y superficies elevadas.

Nivel 4:
hover, focus y elementos seleccionados.

La diferencia entre superficies debe ser SUTIL.

No utilizar contrastes exagerados.

El fondo debe sentirse negro/casi negro con ligeros matices cálidos o neutros.

Referencia aproximada:

- App background: #0C0B0A / #0D0C0B
- Surface: #121110 / #151311
- Elevated surface: #181614
- Input surface: #211F1C
- Border: rgba(255,255,255,0.08)
- Border strong: rgba(255,255,255,0.12)

Estos valores son REFERENCIA VISUAL y pueden ajustarse ligeramente para mantener coherencia con el sistema existente.

==================================================
4. COLOR
==================================================

Utilizar una paleta principalmente monocromática.

La mayoría de la interfaz debe utilizar:

- negro
- gris muy oscuro
- gris
- gris claro
- blanco

Los colores deben reservarse para estados y acciones.

Primary action:
azul eléctrico/profesional similar al botón "Actualizar" de la referencia.

Success:
verde brillante pero contenido.

Warning:
amarillo/naranja.

Error:
rojo.

Info:
azul.

Los colores de estado deben comunicar información, NO decorar.

Nunca utilizar múltiples colores saturados simultáneamente.

==================================================
5. SIDEBAR
==================================================

La navegación lateral es un elemento fundamental del sistema.

Debe ser:

- oscura
- compacta
- vertical
- estructurada
- empresarial
- persistente

La sidebar debe contener:

- identidad del producto
- navegación principal
- grupos de módulos
- iconos pequeños
- labels
- estados activos
- submenús expandibles cuando corresponda

El elemento activo debe tener:

- contraste visual suficiente
- icono destacado
- texto claro
- fondo ligeramente diferente

No utilizar enormes bloques de navegación.

No utilizar iconos gigantes.

No convertir la sidebar en una barra decorativa.

La navegación debe sentirse como un panel administrativo real.

==================================================
6. TOP BAR
==================================================

El header superior debe ser extremadamente limpio.

Debe poder contener:

- contexto actual
- breadcrumb o identificación del módulo
- búsqueda global
- acciones globales
- notificaciones
- configuración
- perfil del usuario

La referencia utiliza una búsqueda global prominente pero discreta.

Los elementos deben permanecer alineados horizontalmente.

Evitar headers gigantes.

Altura aproximada:
56px - 64px.

==================================================
7. CONTENEDOR PRINCIPAL
==================================================

El contenido principal debe utilizar una estructura consistente.

Patrón:

SIDEBAR
    ↓
TOP BAR
    ↓
CONTENT

El contenido debe tener márgenes moderados.

No utilizar un canvas excesivamente vacío.

La interfaz debe aprovechar correctamente pantallas grandes.

La densidad de información debe ser MEDIA/ALTA.

El sistema debe sentirse eficiente.

==================================================
8. ENCABEZADOS DE PÁGINA
==================================================

Cada módulo debe comenzar con:

- título
- descripción breve
- acciones principales

Ejemplo conceptual:

[TÍTULO]
Descripción funcional breve.

                         [Acción primaria]

El título debe ser claramente dominante.

La descripción debe utilizar menor contraste.

No utilizar enormes títulos tipo landing page.

Tamaño aproximado:

H1:
28px - 32px

Subtítulo:
13px - 14px

==================================================
9. CARDS
==================================================

Las cards deben ser discretas.

No utilizar:

- sombras fuertes
- grandes radios
- gradientes
- efectos flotantes

Utilizar:

- fondo ligeramente diferente al background
- borde fino
- radio pequeño/moderado
- padding consistente

Border radius recomendado:

6px - 10px.

La referencia visual utiliza superficies relativamente cuadradas.

Las cards deben parecer módulos de software, no tarjetas de marketing.

==================================================
10. MÉTRICAS / KPI
==================================================

Los indicadores superiores deben utilizar cards compactas.

Cada KPI debe tener:

LABEL
VALUE
opcionalmente contexto/estado

Ejemplo:

Estudiantes activos
12,450

No sobrecargar con gráficos decorativos.

El número debe tener mayor peso visual que el label.

Los KPI deben alinearse en grid.

==================================================
11. TABLAS
==================================================

Las tablas son un componente prioritario.

Deben tener estética enterprise.

Características:

- encabezados pequeños
- filas compactas
- divisores sutiles
- hover discreto
- alineación precisa
- estados mediante badges
- acciones agrupadas

No utilizar tablas gigantes con exceso de padding.

No utilizar bordes excesivamente visibles.

La tabla debe permitir visualizar bastante información sin sentirse comprimida.

Header:

uppercase opcional
font-size pequeño
tracking ligeramente aumentado
color secundario

Rows:

altura aproximada 48px - 60px.

==================================================
12. BADGES Y ESTADOS
==================================================

Los estados deben utilizar indicadores compactos.

Ejemplo:

● Activo
● Pendiente
● Revocado
● Expirado

Utilizar:

- pequeño punto
- texto
- color contextual

No utilizar badges enormes.

No convertir cada dato en una píldora.

Las pills deben utilizarse solamente cuando realmente representen un estado o categoría.

==================================================
13. BOTONES
==================================================

Los botones deben ser compactos y profesionales.

Primary:

- azul sólido
- texto claro
- radio moderado
- altura aproximada 34px - 40px

Secondary:

- superficie oscura
- borde sutil
- texto claro

Ghost:

- transparente
- hover discreto

Danger:

- utilizar rojo solamente cuando sea necesario.

Evitar botones gigantes.

Evitar botones excesivamente redondeados.

NO usar estilo "pill button" salvo que tenga una función clara.

==================================================
14. INPUTS
==================================================

Los campos deben utilizar superficies oscuras.

Características:

- fondo ligeramente más claro que el background
- borde sutil
- texto claro
- placeholder gris
- focus mediante borde/acento
- altura compacta

Radio:

6px - 8px.

Los inputs deben sentirse integrados al sistema.

No utilizar inputs blancos en modo dark.

==================================================
15. ICONOGRAFÍA
==================================================

Utilizar una única familia de iconos consistente.

Preferentemente:

Lucide / equivalente minimalista.

Características:

- stroke fino
- tamaño pequeño/mediano
- apariencia técnica
- sin iconos 3D
- sin emojis como iconos de interfaz
- sin mezcla de diferentes familias

Tamaño habitual:

16px - 18px.

Los iconos deben complementar el texto, no competir con él.

==================================================
16. TIPOGRAFÍA
==================================================

La tipografía debe ser moderna, limpia y altamente legible.

Prioridad:

Inter / Geist / equivalente sans-serif moderna.

Jerarquía:

H1:
28-32px

H2:
20-24px

H3:
16-18px

Body:
14px

Secondary:
12-13px

Labels:
11-12px

La aplicación puede utilizar tamaños relativamente pequeños porque es un sistema enterprise.

No utilizar tipografías decorativas.

No utilizar fuentes futuristas.

==================================================
17. ESPACIADO
==================================================

Utilizar un sistema de spacing consistente basado en múltiplos de 4px.

Ejemplo:

4
8
12
16
20
24
32
40
48

No colocar elementos arbitrariamente.

La interfaz debe tener ritmo visual.

Preferir:

padding 16-24px

gap 8-16px

secciones 24-32px

==================================================
18. BORDES
==================================================

Los bordes son importantes para separar superficies.

Utilizar bordes:

- muy sutiles
- finos
- consistentes

Preferentemente:

1px solid rgba(255,255,255,0.06-0.10)

Nunca utilizar bordes blancos fuertes alrededor de todo.

La separación debe sentirse elegante y silenciosa.

==================================================
19. SOMBRAS
==================================================

Utilizar sombras mínimamente.

En muchas zonas NO se necesita sombra.

Prioridad:

CONTRASTE DE SUPERFICIES
+
BORDES SUTILES

antes que:

SOMBRAS GRANDES.

Si una superficie necesita elevación, utilizar una sombra muy suave.

==================================================
20. DENSIDAD
==================================================

La interfaz debe tener una densidad similar a software administrativo profesional.

No aumentar artificialmente los espacios para que "se vea moderno".

No dejar enormes espacios vacíos.

No convertir cada sección en una tarjeta.

La información relacionada debe permanecer agrupada.

El usuario debe poder visualizar gran cantidad de información sin hacer scrolling innecesario.

==================================================
21. RESPONSIVE
==================================================

Mantener el mismo lenguaje visual en:

- desktop
- laptop
- tablet
- mobile

En mobile:

- sidebar puede convertirse en drawer
- tablas pueden transformarse en layouts adecuados
- acciones pueden agruparse
- grids pueden colapsar

PERO:

NO cambiar la identidad visual.

==================================================
22. ANIMACIONES
==================================================

Animaciones mínimas.

Utilizar solamente para:

- hover
- focus
- apertura/cierre
- loading
- feedback

Duración recomendada:

120ms - 220ms.

No utilizar:

- parallax
- animaciones constantes
- partículas
- efectos luminosos
- entradas exageradas
- elementos flotantes
- animaciones de marketing

El producto debe sentirse rápido.

==================================================
23. MODALES
==================================================

Los modales deben utilizar el mismo sistema de superficies.

Características:

- fondo oscuro
- overlay discreto
- borde sutil
- radio moderado
- header
- contenido
- footer de acciones

No utilizar modal blanco dentro de una aplicación dark.

==================================================
24. DROPDOWNS / POPOVERS
==================================================

Deben utilizar:

- superficie elevada
- borde
- sombra mínima
- opciones compactas
- hover discreto

Deben alinearse perfectamente con el elemento origen.

==================================================
25. SEARCH
==================================================

Los campos de búsqueda deben tener apariencia de herramienta enterprise.

Utilizar:

[icono] Buscar...

Placeholder discreto.

La búsqueda global puede ubicarse en el top bar.

No hacer que el buscador parezca un elemento de landing page.

==================================================
26. FORMULARIOS
==================================================

Los formularios deben seguir:

LABEL
INPUT
HELPER TEXT / ERROR

con spacing consistente.

Los labels deben tener contraste suficiente pero no competir con el contenido.

Los errores deben utilizar rojo de forma informativa.

Los campos obligatorios deben identificarse claramente.

==================================================
27. ESTADOS VACÍOS
==================================================

Evitar empty states gigantes con ilustraciones.

Utilizar:

Título breve
Descripción
Acción

Ejemplo:

No hay estudiantes registrados.

[Agregar estudiante]

Minimalista.

==================================================
28. LOADING STATES
==================================================

Utilizar skeletons discretos o loaders pequeños.

No utilizar pantallas de carga excesivamente animadas.

==================================================
29. NOTIFICACIONES
==================================================

Toasts y alertas deben ser compactos.

Utilizar color únicamente para indicar:

success
warning
error
info

Mantener consistencia con el sistema dark.

==================================================
30. CONSISTENCIA GLOBAL
==================================================

TODAS las páginas deben parecer hechas por el mismo equipo.

Si existe actualmente:

- un módulo con estilo diferente
- otra sidebar
- otro tipo de botón
- otro sistema de cards
- diferentes radios
- diferentes inputs
- diferentes tablas
- diferentes tamaños de títulos

debe normalizarse al nuevo Design System.

No crear excepciones visuales sin una razón funcional.

==================================================
31. REGLA DE COMPONENTIZACIÓN VISUAL
==================================================

Antes de diseñar un componente nuevo:

1. Buscar si ya existe un componente equivalente.
2. Reutilizarlo.
3. Si necesita una variante, crear una variante del sistema.
4. Evitar duplicar componentes visualmente equivalentes.

El objetivo es crear un lenguaje visual centralizado.

Los cambios visuales globales deben poder controlarse desde:

- tokens
- variables
- theme
- componentes base
- primitives

según la arquitectura existente.

==================================================
32. DESIGN TOKENS
==================================================

Centralizar como mínimo:

colors
backgrounds
surfaces
borders
text colors
muted colors
primary
success
warning
danger
radius
spacing
font sizes
shadows
transitions

NO hardcodear valores diferentes para cada página si existe un token equivalente.

==================================================
33. REGLA ANTI-"AI UI"
==================================================

La interfaz NO debe parecer generada automáticamente por una IA.

Evitar específicamente:

- demasiadas cards
- exceso de rounded-xl / rounded-2xl
- gradientes violetas/azules
- glassmorphism
- sombras exageradas
- iconos grandes
- enormes números decorativos
- layouts excesivamente centrados
- dashboards con 15 widgets innecesarios
- headings gigantes
- exceso de whitespace
- colores arbitrarios
- pills para todo
- gráficos decorativos
- copywriting de marketing dentro del sistema

El diseño debe parecer el resultado de un Design System empresarial mantenido durante años.

==================================================
34. REGLA DE ADAPTACIÓN AL PRODUCTO EDUCATIVO
==================================================

Aunque el lenguaje visual proviene de la familia Democra, el sistema educativo debe conservar su propia identidad funcional.

Por ejemplo:

- estudiantes
- docentes
- cursos
- matrículas
- aulas
- evaluaciones
- calificaciones
- periodos académicos
- asistencia
- reportes
- administración

DEBEN mantener sus propios nombres, iconos y estructura funcional.

Lo que se comparte es el lenguaje visual.

No convertir el sistema educativo en una copia temática de Democra.

==================================================
35. REGLA DE PRIORIDAD
==================================================

Cuando exista conflicto entre diseño actual y esta regla:

ESTA REGLA GANA EN TODO LO VISUAL.

Cuando exista conflicto entre esta regla y funcionalidad existente:

LA FUNCIONALIDAD GANA.

Nunca romper funcionalidad para conseguir fidelidad visual.

==================================================
36. REGLA DE IMPLEMENTACIÓN
==================================================

Antes de modificar páginas individuales:

1. Auditar el sistema visual existente.
2. Identificar componentes globales.
3. Identificar tokens existentes.
4. Identificar duplicaciones.
5. Crear/adaptar el Design System.
6. Adaptar layout global.
7. Adaptar navegación.
8. Adaptar componentes base.
9. Después adaptar páginas y módulos.

NO comenzar página por página creando estilos aislados.

Primero establecer el lenguaje visual global.

==================================================
37. CRITERIO FINAL DE CALIDAD
==================================================

Antes de considerar terminado un cambio visual, comprobar:

[ ] ¿Parece un SaaS empresarial real?
[ ] ¿Mantiene la estética dark de la referencia?
[ ] ¿La densidad visual es adecuada?
[ ] ¿Los componentes parecen pertenecer al mismo sistema?
[ ] ¿Los bordes son sutiles?
[ ] ¿Los radios están controlados?
[ ] ¿Los botones son compactos?
[ ] ¿La sidebar tiene estructura enterprise?
[ ] ¿Las tablas son densas y legibles?
[ ] ¿Los estados utilizan color de forma semántica?
[ ] ¿Hay ausencia de gradientes innecesarios?
[ ] ¿Hay ausencia de glassmorphism?
[ ] ¿Hay ausencia de decoración AI-genérica?
[ ] ¿Se respetó la funcionalidad existente?
[ ] ¿No se introdujo ningún cambio funcional?
[ ] ¿El sistema educativo conserva su identidad funcional?
[ ] ¿Todas las páginas parecen pertenecer al mismo producto?

Si alguna respuesta es NO, corregirla antes de finalizar.

==================================================
38. OBJETIVO VISUAL FINAL
==================================================

El resultado final debe transmitir:

ENTERPRISE
+
DARK
+
PROFESIONAL
+
DENSO
+
PRECISO
+
SOBRIO
+
MODERNO
+
CONSISTENTE

Debe sentirse como una plataforma SaaS empresarial consolidada, no como una plantilla de dashboard ni como una interfaz generada automáticamente.

La referencia de Democra.pro es el estándar visual de calidad para esta familia de software.

IMPORTANTE:
Esta instrucción es una REGLA DE DISEÑO GLOBAL.
No debe utilizarse para cambiar funcionalidades, arquitectura, datos o lógica del sistema.