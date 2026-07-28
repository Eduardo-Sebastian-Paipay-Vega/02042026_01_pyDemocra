# LOOK & FEEL — Guía Integral de Diseño del Sistema ONG (Democra.pro)

> **Documento oficial de diseño y experiencia.** Referencia única de identidad visual, emocional y de interacción para el módulo ONG de Democra.pro.
> **Versión:** 1.0
> **Fecha:** Julio de 2026
> **Alcance:** Este documento define *criterios* de diseño y experiencia. No contiene código, tecnologías, librerías ni instrucciones de implementación. Toda decisión aquí registrada se fundamenta exclusivamente en la documentación funcional del proyecto (identidad de marca, propósito de la plataforma, público objetivo, módulos y procesos descritos).

---

## 0. Cómo leer esta guía

Esta guía está organizada de lo abstracto a lo concreto: primero la **filosofía y la personalidad**, luego el **lenguaje visual** (color, tipografía, espacio), después los **componentes** y sus estados, y finalmente las **reglas globales** que nunca deben romperse.

Cada decisión incluye su **justificación**: por qué existe, qué comunica, cuándo usarse y cuándo no. La regla de oro es simple: *si una decisión visual no puede justificarse desde el propósito de la ONG, no pertenece a este sistema.*

Términos que se repiten:

- **Sistema / plataforma:** el módulo administrativo ONG de Democra.pro.
- **Usuario operativo:** la persona de la organización que administra voluntarios, proyectos, horas, admisión, recursos, etc.
- **Postulante / voluntario público:** persona externa que se registra por código o consulta información.
- **Dato sensible:** información clínica o personal protegida (fichas médicas, perfiles de niños y adultos mayores, documentos de admisión).

---

## 1. Contexto del sistema (base documental)

Antes de definir cualquier decisión visual, se resume lo que la documentación establece sobre el sistema. Todo el Look & Feel se deriva de aquí.

### 1.1. Qué es la plataforma

Democra.pro es una **plataforma SaaS multi-tenant de gobernanza democrática asistida por IA para ONG y organizaciones**. El módulo ONG es el **panel operativo** con el que una organización gestiona su trabajo real: voluntariado, proyectos, admisión de personas, horas, aprobaciones, recursos, finanzas, notificaciones, credenciales y gobernanza.

### 1.2. Propósito y misión (según la documentación de identidad)

La marca nace con la misión de **romper las barreras de entrada a la tecnología** y sostiene tres pilares declarados: **democratización** (accesibilidad, interfaces claras y amigables), **tecnología de vanguardia** (estética moderna que sugiere potencia e innovación) y **seguridad** (solidez y confiabilidad). Para el contexto ONG, estos pilares se traducen en un cuarto valor implícito por el dominio: **cuidado de las personas y de sus datos**.

### 1.3. Público objetivo

El sistema atiende a perfiles heterogéneos y no necesariamente expertos en tecnología:

- **Coordinadores y administradores** de la ONG que operan el panel a diario.
- **Aprobadores** que revisan y resuelven horas, admisiones y transacciones.
- **Personal de admisión y RRHH** que gestiona solicitudes, documentos y entrevistas.
- **Responsables de datos sensibles** (perfiles clínicos, fichas médicas) que acceden con motivo y trazabilidad.
- **Postulantes y voluntarios externos** que completan su registro por un flujo público controlado.

Esta diversidad obliga a un diseño **accesible, claro y bajo en fricción**, legible tanto para el usuario experto como para el ocasional.

### 1.4. Módulos que conforman la experiencia

Home (dashboard y búsqueda global), Operación (actividades, asistencias, horas, evidencias), Proyectos (proyectos, tareas, actividades, asignaciones), Personas (voluntarios, beneficiarios, ficha médica sensible), Aprobaciones, Admisión (solicitudes, documentos, entrevistas, onboarding), Recursos (inventario, finanzas, cursos), Notificaciones, Gobernanza (catálogos, auditoría, accesos sensibles, retención/soft-delete), Configuración (usuarios, roles, seguridad), ID Cards y Registro público por código.

### 1.5. Naturaleza emocional del proyecto

No es un software financiero frío ni una red social lúdica. Es una herramienta de **trabajo social organizado**: coordina el esfuerzo de personas que ayudan a otras personas, incluidas poblaciones vulnerables (niños, adultos mayores, beneficiarios con fichas clínicas). El sistema maneja **confianza, transparencia y responsabilidad**. La experiencia debe honrar ese peso: transmitir orden y cuidado sin volverse burocrática ni intimidante.

---

## 2. Filosofía de diseño

### 2.1. Declaración de filosofía

> **El diseño del sistema ONG existe para que personas ocupadas y bien intencionadas hagan un trabajo importante sin fricción, con confianza y con la certeza de que cada dato está tratado con cuidado.**

La interfaz no es protagonista: el protagonista es la **misión de la organización**. El diseño se mide por cuánto reduce el esfuerzo, cuánta claridad aporta y cuánta confianza inspira, no por cuán sofisticado se ve.

### 2.2. Emociones que debe transmitir

- **Confianza:** el usuario debe sentir que el sistema es sólido, predecible y que no perderá su trabajo ni expondrá datos.
- **Calma y control:** pantallas ordenadas, jerarquías claras, ausencia de ruido visual. Nada compite por la atención sin motivo.
- **Cercanía humana:** aunque sea institucional, la interfaz debe sentirse hecha por y para personas, no por una máquina indiferente.
- **Cuidado:** especialmente al tocar datos sensibles, el tono visual debe comunicar respeto y responsabilidad.
- **Optimismo sereno:** el trabajo de una ONG es esperanzador; el sistema acompaña ese ánimo sin caer en la euforia ni en la frivolidad.

### 2.3. Personalidad de la plataforma

La plataforma se comporta como un **colaborador competente y sereno**: organizado, transparente, discreto, que explica lo que hace, avisa antes de que algo salga mal y nunca deja al usuario adivinando. No es un burócrata rígido ni un asistente juguetón: es un profesional confiable.

### 2.4. Qué debe inspirar

Que el trabajo está **bajo control**, que la información es **veraz y trazable**, que la organización es **transparente** y que la tecnología está **al servicio de las personas**, no al revés.

### 2.5. Qué debe evitar transmitir

- **Frialdad corporativa** o distancia burocrática.
- **Saturación** o sensación de complejidad abrumadora.
- **Agresividad visual** (colores estridentes, alarmas innecesarias, urgencia artificial).
- **Frivolidad** o gamificación que trivialice un dominio serio.
- **Opacidad:** nunca debe sentirse que el sistema oculta lo que hace con los datos.
- **Sensación de vigilancia hostil:** la trazabilidad se comunica como responsabilidad, no como amenaza.

### 2.6. Tensiones a resolver (principios de arbitraje)

Cuando dos buenas intenciones chocan, este es el orden de prioridad:

1. **Accesibilidad y claridad** por encima de la estética.
2. **Confianza y trazabilidad** por encima de la rapidez.
3. **Cuidado del dato sensible** por encima de la comodidad de acceso.
4. **Consistencia** por encima de la novedad.

---

## 3. Personalidad de marca

### 3.1. Atributos de marca

La documentación de identidad describe una marca *tech pero accesible*. Para el dominio ONG, los atributos oficiales son:

| Atributo | Qué significa en la interfaz |
|---|---|
| **Confiable** | Comportamiento predecible, sin sorpresas, con retroalimentación en cada acción. |
| **Humana** | Lenguaje cercano, tono empático, foco en las personas detrás de los datos. |
| **Empática** | Reconoce el esfuerzo y el contexto del usuario; los errores no culpan. |
| **Transparente** | Muestra estados, orígenes y consecuencias; nada ocurre "a escondidas". |
| **Solidaria** | Refleja el propósito social; celebra el aporte del voluntariado. |
| **Organizada** | Jerarquía impecable, todo tiene su lugar, densidad controlada. |
| **Tecnológica** | Moderna y capaz, con guiños sobrios a la innovación (IA), sin alardear. |
| **Accesible** | Legible, contrastada, operable por cualquier persona. |
| **Optimista** | Tono positivo y esperanzador, sereno, nunca eufórico. |
| **Profesional** | Institucional sin ser burocrática; seria sin ser rígida. |

### 3.2. Percepción esperada

Tras usar el sistema, el usuario debería describirlo como *"claro, confiable y fácil"* antes que como *"bonito"* o *"impresionante"*. La belleza es un medio; la confianza es el fin.

### 3.3. Arquetipo

El sistema encarna una combinación de **Cuidador** (pone a las personas primero) y **Sabio** (ordena la información y ayuda a decidir bien). No es el **Héroe** que se luce ni el **Mago** que deslumbra: es el aliado competente que sostiene el trabajo.

### 3.4. Relación con la marca madre (Democra.pro)

El módulo ONG hereda la identidad de Democra.pro (azul de marca, tipografía sans-serif geométrica, tarjetas, radios suaves) pero **modula su temperatura emocional**: donde la marca corporativa puede permitirse un aire "tech" enérgico, el módulo ONG prioriza calidez, sobriedad y calma. La coherencia con la marca madre es obligatoria; la interpretación para el dominio social es responsabilidad de esta guía.

---

## 4. Moodboard descriptivo

*No se generan imágenes. Se describe con precisión la sensación visual objetivo para que cualquier diseñador la reproduzca.*

### 4.1. Iluminación y temperatura

Luz clara, difusa y uniforme, como una oficina bien iluminada por luz natural. Sin sombras dramáticas ni contrastes teatrales. La sensación es **diurna, limpia y honesta**: nada se esconde en penumbra. El modo oscuro, cuando exista, mantiene la misma honestidad con superficies profundas pero nunca negras absolutas agresivas.

### 4.2. Estilo general

**Minimalismo cálido.** Superficies planas o casi planas, bordes suavemente redondeados, uso generoso del espacio en blanco. Estética de *tarjetas ordenadas sobre un lienzo tranquilo*. Moderno pero atemporal; evita modas visuales que envejezcan rápido.

### 4.3. Profundidad

Profundidad **sutil y funcional**: sombras muy suaves y difusas que solo sirven para separar planos (una tarjeta del fondo, un modal de la página). La profundidad comunica jerarquía, no decoración. Nada "flota" sin razón.

### 4.4. Composición y espacios

Composición basada en **rejilla y alineación estricta**. Márgenes amplios, aire alrededor de los bloques de contenido, agrupación clara por afinidad. La vista respira. La información crítica ocupa el centro de atención; lo secundario cede espacio.

### 4.5. Densidad visual

**Densidad media-baja, ajustable por contexto.** Las pantallas de lectura y decisión (dashboard, detalle, aprobaciones) son espaciosas. Las pantallas de datos masivos (tablas, historial, auditoría) admiten mayor densidad, pero siempre con separaciones legibles y sin amontonar. Nunca se sacrifica la legibilidad por caber más.

### 4.6. Referencias sensoriales

Piensa en: un **cuaderno bien ordenado**, una **recepción clara y amable**, un **expediente cuidadosamente archivado**. Evita: un **panel de control de nave espacial**, un **dashboard financiero saturado de números rojos**, una **app de juego llena de estímulos**.

---

## 5. Paleta de colores

### 5.1. Fundamento

La paleta parte de la identidad oficial de Democra.pro y se **extiende con criterio para el dominio ONG**: se conserva el azul de marca como color de confianza y acción, y se define un sistema semántico y neutro completo que prioriza el contraste, la calma y la accesibilidad. Los valores heredados de la documentación de identidad son punto de partida; las extensiones se justifican una a una.

> **Nota sobre valores:** los colores heredados (azul de marca, cian, verde, rojo, negro, blanco) provienen de la documentación de identidad. Las variantes de estado, neutros y superficies son extensiones necesarias para una interfaz operativa completa y se expresan como *intención cromática* (qué debe comunicar), no como imposición técnica.

### 5.2. Colores de marca (heredados)

| Rol | Referencia | Comunica | Uso | No usar cuando |
|---|---|---|---|---|
| **Azul de marca (primario)** | Azul eléctrico de identidad (#002EFE) | Confianza, acción, identidad | Acción principal, elementos de marca, foco, enlaces clave | No usarlo para grandes áreas de fondo ni para texto largo; pierde legibilidad y satura. |
| **Cian tecnológico (acento)** | Cian de identidad (#00D1FF) | Innovación, asistencia IA | Resaltar funciones asistidas por IA, detalles puntuales | Nunca como color de acción general ni para semántica de estado; se reserva a lo "inteligente". |
| **Tinta profunda (neutro oscuro)** | Casi negro de identidad (#0A0A0B) | Solidez, seriedad | Texto principal en claro, base de modo oscuro | No usar negro puro para grandes bloques de texto sobre blanco puro: reducir el contraste extremo mejora la lectura prolongada. |
| **Blanco** | #FFFFFF | Limpieza, claridad | Fondo base en modo claro, texto en oscuro | No como único recurso: necesita neutros intermedios para jerarquía. |

### 5.3. Colores institucionales y de apoyo (extensión ONG)

Para reforzar la calidez y el propósito social sin abandonar el azul de marca, se define una familia de apoyo:

- **Color institucional / secundario (azul sereno):** un azul más apagado y profundo que el eléctrico, para cabeceras, navegación y grandes superficies de identidad donde el azul puro cansaría. *Comunica:* institucionalidad calmada. *Cuándo:* barras, encabezados, fondos de marca amplios. *Cuándo no:* para acciones (se confundiría con el primario).
- **Color terciario (verde-azulado / teal sobrio):** puente entre el azul de marca y el verde de éxito, útil para acentos de "progreso" y estados activos neutros. *Cuándo:* etiquetas de estado en curso, indicadores de avance. *Cuándo no:* para éxito definitivo (eso es el verde) ni para acción (eso es el azul).
- **Color de apoyo cálido (arena / ámbar suave):** un tono cálido y bajo en saturación para humanizar zonas vacías, ilustraciones simples y acentos de bienvenida. *Comunica:* cercanía. *Cuándo:* estados vacíos amables, onboarding, mensajes de bienvenida. *Cuándo no:* nunca para advertencias (se confundiría con el ámbar semántico).

### 5.4. Colores semánticos (estado)

| Rol | Referencia | Comunica | Cuándo usar | Cuándo NO usar |
|---|---|---|---|---|
| **Éxito** | Verde esmeralda de identidad (#10B981) | Confirmación, completado | Guardado correcto, aprobación, estado activo/vigente | No para meramente "informar"; el éxito implica que algo salió bien. |
| **Advertencia** | Ámbar / amarillo cálido | Atención, acción reversible pendiente | Datos incompletos, pendientes, acciones que requieren revisión | No para errores reales ni para acciones destructivas. |
| **Error / peligro** | Rojo de identidad (#EF4444) | Fallo, riesgo, acción destructiva | Errores de validación, fallos de sistema, eliminar/revocar | No para advertencias leves ni para decorar; el rojo debe ser escaso y significativo. |
| **Informativo** | Azul claro / celeste sereno | Contexto neutro, ayuda | Tips, notas, mensajes del sistema sin urgencia | No para acciones (se confunde con el primario) ni para éxito. |

> **Principio semántico:** el color de estado nunca es el único portador de significado. Siempre se acompaña de icono y texto (ver Accesibilidad, §16). El rojo, en particular, se administra con avaricia: si todo alarma, nada alarma.

### 5.5. Neutros: fondos, superficies, bordes y texto

Una escala neutra de grises **ligeramente cálidos** (no fríos absolutos) sostiene toda la interfaz. La calidez evita el aire clínico y refuerza la cercanía humana.

| Rol | Intención | Uso | No usar cuando |
|---|---|---|---|
| **Fondo de aplicación** | Gris muy claro y cálido (casi blanco) | Lienzo base sobre el que descansan tarjetas y paneles | No usar blanco puro como fondo global: los blancos puros conviene reservarlos para las superficies elevadas. |
| **Superficie / tarjeta** | Blanco o casi blanco | Tarjetas, paneles, modales, filas de tabla | No aplicar sombras fuertes; la elevación es sutil. |
| **Superficie hundida** | Gris claro | Zonas de agrupación, campos, fondos de sección | No para contenido primario. |
| **Borde / divisor** | Gris claro de bajo contraste | Separar tarjetas, filas, secciones, inputs | No usar bordes oscuros o gruesos que endurezcan la interfaz. |
| **Texto principal** | Tinta profunda con contraste alto pero no negro absoluto | Títulos y cuerpo | No usar gris medio para texto esencial: compromete la accesibilidad. |
| **Texto secundario** | Gris medio-oscuro | Descripciones, metadatos, ayudas | No para información crítica. |
| **Texto deshabilitado / placeholder** | Gris medio | Placeholders y estados inertes | Nunca para contenido real; solo señala ausencia o inactividad. |

### 5.6. Colores por función de interacción

- **Botones:** el primario usa el azul de marca; los demás niveles se construyen con neutros y el propio azul en menor intensidad (ver §9).
- **Iconografía:** hereda el color del texto o del estado que acompaña; los iconos no introducen colores nuevos.
- **Enlaces:** azul de marca, subrayado o con indicador claro; distinguibles del texto por más que el color.
- **Estado activo (navegación, selección):** azul de marca aplicado con moderación (indicador lateral, fondo azul muy tenue).
- **Hover:** oscurecimiento o aclarado leve del color base, más una elevación o realce sutil; nunca un cambio brusco de color.
- **Focus:** anillo de foco visible y de alto contraste (azul de marca) alrededor del elemento; obligatorio para accesibilidad.
- **Deshabilitado:** desaturación y reducción de opacidad; el elemento se ve claramente inerte pero legible.

### 5.7. Psicología del color — por qué esta paleta representa a una ONG

- **Azul** es el color de la **confianza, la calma y la institucionalidad**. En un sistema que administra datos de personas vulnerables y decisiones democráticas, el azul comunica seriedad y fiabilidad sin agresividad. Es, además, la herencia directa de la marca.
- **Verde** aporta la nota de **crecimiento, aprobación y bienestar**, natural en el trabajo social: cada aprobación de horas o admisión es un pequeño avance de la misión.
- **Cian**, reservado a la IA, mantiene el guiño **tecnológico** de la marca sin invadir la semántica: la innovación acompaña, no domina.
- **Neutros cálidos** en lugar de grises fríos evitan el tono clínico o corporativo distante y refuerzan la **cercanía humana**.
- **Rojo escaso** respeta la **serenidad**: en un dominio sensible, abusar del rojo generaría ansiedad. Se reserva para lo verdaderamente crítico.
- **Acento cálido (arena/ámbar suave)** humaniza los vacíos y las bienvenidas, recordando que detrás del sistema hay una comunidad, no una máquina.

En conjunto, la paleta dice: *seria pero cálida, tecnológica pero humana, transparente y confiable* — exactamente los atributos de marca.

---

## 6. Tipografía

### 6.1. Familia tipográfica

La identidad establece una **sans-serif moderna, geométrica y legible, con aire técnico pero amigable** (referencia: Inter o Montserrat). Se mantiene una **única familia** para toda la interfaz institucional: la unidad tipográfica refuerza la sensación de orden y confianza. Solo se admite una segunda familia monoespaciada para datos técnicos puntuales (códigos, identificadores, montos alineados), nunca para contenido general.

Criterios irrenunciables: **excelente legibilidad en tamaños pequeños**, buen soporte de acentos y caracteres del español, y formas abiertas que faciliten la lectura a usuarios no expertos.

### 6.2. Jerarquía y escala

La escala se organiza por **contraste de tamaño y peso**, no por color. Una jerarquía se debe entender aunque todo el texto sea del mismo color. Escala de referencia (heredada y extendida):

| Nivel | Uso | Tamaño relativo | Peso | Notas |
|---|---|---|---|---|
| **H1** | Título de página / módulo | Muy grande (~3rem / 48px) | Bold (700) | Uno por pantalla. Ancla la ubicación del usuario. |
| **H2** | Sección mayor dentro de la página | Grande (~2.25rem / 36px) | Bold/Semibold | Divide grandes bloques. |
| **H3** | Subsección, título de tarjeta | Medio (~1.5rem / 24px) | Semibold (600) | Encabeza tarjetas y grupos. |
| **H4** | Título menor, cabecera de bloque | Medio-pequeño (~1.25rem / 20px) | Semibold | Etiqueta bloques dentro de una tarjeta. |
| **Texto (body)** | Contenido general | Base (~1rem / 16px), interlínea 1.6 | Regular (400) | Nunca por debajo de 16px para lectura prolongada. |
| **Descripción** | Texto de apoyo, subtítulos | Pequeño (~0.9375rem / 15px) | Regular | Color secundario. |
| **Ayuda / hint** | Textos de ayuda bajo campos | Pequeño (~0.875rem / 14px) | Regular | Color secundario; tono amable. |
| **Etiquetas (labels)** | Rótulos de campos y metadatos | Pequeño (~0.875rem / 14px) | Medium (500) | Claros, en caso natural (evitar TODO MAYÚSCULAS extenso). |
| **Badges / chips** | Estados y categorías | Muy pequeño (~0.75rem / 12px) | Medium/Semibold | Siempre acompañado de color + texto legible. |
| **Botones** | Acciones | Base o pequeño (~0.9375–1rem) | Semibold (600) | Peso que transmita accionabilidad sin gritar. |
| **Tablas** | Celdas de datos | Pequeño-base (~0.875–1rem) | Regular; cabecera Medium | Cabecera diferenciada por peso, no solo por color. |
| **Formularios (input)** | Texto que el usuario escribe | Base (~1rem / 16px) | Regular | 16px mínimo evita zoom involuntario en móvil. |
| **Errores** | Mensajes de validación | Pequeño (~0.875rem) | Medium | Color de error + icono; nunca solo color. |
| **Alertas** | Mensajes de banner | Base | Regular/Medium | Título en Semibold si la alerta lo requiere. |

### 6.3. Reglas de legibilidad

- **Interlínea generosa** en cuerpo de texto (≈1.5–1.6) para lectura cómoda.
- **Longitud de línea** controlada en textos largos (aprox. 60–80 caracteres); no se dejan párrafos que crucen toda una pantalla ancha.
- **Pesos limitados:** Regular, Medium, Semibold y Bold. Evitar Light para textos pequeños (pierde contraste) y evitar más de cuatro pesos (fragmenta la identidad).
- **Mayúsculas** solo en etiquetas muy cortas; nunca en frases o párrafos (dificultan la lectura y endurecen el tono).
- **Números:** para datos tabulares y montos, preferir cifras de ancho fijo (tabulares) para que las columnas alineen.
- **Jerarquía autosuficiente:** la estructura debe entenderse en escala de grises. El color es refuerzo, no soporte de la jerarquía.

---

## 7. Espaciado y ritmo

### 7.1. Principio de rejilla base

Todo el espaciado se deriva de una **unidad base coherente** (referencia: múltiplos de 4/8 px). Un ritmo consistente es lo que hace que una interfaz se sienta "ordenada" aunque el usuario no sepa por qué. No se usan valores arbitrarios: cada separación pertenece a la escala.

Escala de espaciado recomendada (relativa): 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64. Los saltos grandes separan secciones; los pequeños, elementos relacionados.

### 7.2. Espacio interno (padding)

- **Tarjetas y paneles:** padding amplio y uniforme (referencia 24px) para que el contenido respire.
- **Botones:** padding horizontal mayor que el vertical; el texto nunca toca el borde.
- **Inputs:** altura cómoda (área táctil suficiente) con padding interno que centre el texto.
- **Celdas de tabla:** padding suficiente para separar filas visualmente sin inflar la densidad.

### 7.3. Espacio externo (margin) y separaciones

- **Entre secciones mayores:** separación amplia (32–48px) que marque el cambio de tema.
- **Entre elementos relacionados:** separación pequeña (8–12px) que indique pertenencia al mismo grupo.
- **Ley de proximidad:** lo que está junto se percibe relacionado. El espacio agrupa y separa mejor que las líneas; se prefiere el aire a los divisores cuando basta.

### 7.4. Densidad por contexto

- **Vistas de decisión** (dashboard, detalle, formularios): densidad baja, mucho aire.
- **Vistas de datos** (tablas, historial, auditoría): densidad media; se permite compactar filas, pero manteniendo separadores legibles y zonas de descanso visual.
- **Nunca** densidad tan alta que obligue a esfuerzo para distinguir un elemento de otro.

### 7.5. Jerarquía visual mediante espacio

La importancia se comunica también con espacio: lo importante tiene **más aire alrededor** y aparece **más arriba/a la izquierda** en el flujo de lectura. Lo secundario cede espacio y se agrupa. El vacío es una herramienta de diseño, no un desperdicio.

---

## 8. Iconografía

### 8.1. Estilo

Iconos **de línea (outline), minimalistas y de trazo uniforme**, coherentes con la estética limpia y moderna de la marca. Nada de iconos rellenos pesados, tridimensionales o con estilo antiguo (biseles, sombras). El relleno se reserva, si acaso, para el estado activo/seleccionado del mismo icono.

### 8.2. Peso, tamaño y proporción

- **Trazo uniforme** en toda la familia; un único grosor visual.
- **Tamaños en escala** (referencia 16 · 20 · 24 px) según contexto: 16 en línea de texto, 20–24 en botones y navegación.
- **Proporción consistente:** todos los iconos ocupan una caja óptica equivalente para que no "salten" de tamaño percibido.
- **Alineación óptica** con el texto que acompañan (centrado vertical con la línea base del texto).

### 8.3. Consistencia y uso

- **Una sola familia** de iconos en todo el sistema. Mezclar estilos rompe la identidad.
- **Significado estable:** un icono significa siempre lo mismo (p. ej., el mismo icono para "aprobar" en todos los módulos).
- **El icono acompaña, no sustituye:** las acciones importantes llevan icono *y* etiqueta de texto. Los iconos sin texto solo se admiten en acciones universales y evidentes, siempre con tooltip.
- **Iconos de estado** comparten la semántica de color (éxito, error, advertencia, info) y nunca introducen colores nuevos.
- **Datos sensibles:** un icono discreto y consistente (p. ej., candado/escudo) señala contenido protegido, reforzando el mensaje de cuidado.

---

## 9. Sistema de botones

### 9.1. Filosofía de acción

Los botones expresan **jerarquía de intención**: en cada pantalla debe existir una sola acción claramente dominante. La cantidad de énfasis visual de un botón es proporcional a la importancia y frecuencia de su acción. Demasiados botones "fuertes" a la vez anulan la jerarquía y generan ruido.

### 9.2. Niveles y variantes

| Variante | Apariencia | Cuándo usar | Prioridad |
|---|---|---|---|
| **Primario** | Fondo azul de marca, texto blanco | La acción principal de la pantalla (guardar, crear, confirmar). Uno por vista/contexto. | Máxima |
| **Secundario** | Borde azul, texto azul, fondo transparente | Acción alternativa relevante junto a la primaria (cancelar con peso, acción secundaria). | Media |
| **Terciario** | Solo texto azul, sin borde | Acción de baja jerarquía o repetida en listas. | Baja |
| **Ghost** | Sin fondo ni borde; fondo sutil al hover | Acciones dentro de tablas/tarjetas, barras de herramientas. | Baja |
| **Outline** | Borde neutro, texto neutro | Acciones neutras que no compiten con el primario. | Baja-media |
| **Danger** | Rojo (o borde rojo para menos peso) | Acciones destructivas: eliminar, revocar, rechazar. Requiere confirmación. | Contextual, escaso |
| **Success** | Verde | Confirmar acciones positivas explícitas (aprobar), cuando conviene reforzar el resultado. | Contextual |
| **Neutral** | Gris/superficie | Acciones utilitarias sin carga semántica. | Baja |

### 9.3. Estados de todo botón

- **Normal:** color base según variante.
- **Hover:** aclarado/oscurecido leve y realce sutil (sombra o elevación); nunca cambio de color drástico.
- **Focus:** anillo de foco visible de alto contraste (accesibilidad obligatoria).
- **Activo (pressed):** ligera compresión visual o tono más profundo; da sensación táctil.
- **Loading:** indicador de progreso dentro del botón, texto atenuado o reemplazado por "Procesando…"; el botón se bloquea para evitar doble envío.
- **Deshabilitado:** desaturado y con opacidad reducida; claramente inerte, con tooltip que explique por qué si no es evidente.

### 9.4. Tamaño, iconos y reglas

- **Tamaños:** grande para acciones principales de página, mediano estándar, pequeño para barras densas y tablas. Área táctil mínima cómoda siempre.
- **Iconos en botones:** opcionales y a la izquierda del texto; refuerzan el significado sin sustituir la etiqueta en acciones importantes.
- **Etiquetas:** verbos claros y honestos ("Guardar cambios", "Aprobar horas", "Rechazar solicitud"), nunca ambiguos ("Aceptar" a secas cuando hay consecuencias).
- **Acciones destructivas:** siempre variante danger + confirmación explícita; nunca la acción destructiva es el botón por defecto ni el más fácil de pulsar por accidente.
- **Retroalimentación obligatoria:** toda pulsación produce una respuesta visible (estado loading, toast, cambio de estado). El usuario nunca queda sin saber si su acción se registró.

---

## 10. Formularios

### 10.1. Filosofía

Los formularios son el corazón operativo del sistema (registrar voluntarios, crear proyectos, admitir postulantes, registrar horas). Deben sentirse **guiados, tolerantes y honestos**: dicen qué se espera, ayudan antes de fallar y explican los errores sin culpar al usuario.

### 10.2. Componentes

- **Inputs de texto:** rótulo siempre visible por encima del campo (no solo placeholder). Altura cómoda, borde neutro en reposo, borde azul en foco. Placeholder como ejemplo, nunca como sustituto de la etiqueta.
- **Selects / desplegables:** mismo alto y estilo que los inputs; opción vacía clara ("Selecciona…"); en listas largas, permitir búsqueda. Para catálogos (documento, género, país, estados), reflejar los catálogos reales del sistema.
- **Checkbox:** para selección múltiple o consentimiento; área de clic amplia que incluya la etiqueta. Estado marcado con el azul de marca.
- **Radio:** para opciones mutuamente excluyentes y pocas; si son muchas, usar select.
- **DatePicker:** calendario claro, con fechas fuera de rango deshabilitadas visiblemente; formato de fecha legible y localizado (español). Útil en fechas de proyecto, entrevistas, límites de tarea.
- **TextArea:** para descripciones, comentarios de resolución y notas; alto inicial suficiente y redimensionable; contador si hay límite.
- **Buscadores:** campo con icono de lupa, respuesta con *debounce* (evitar disparos por cada tecla), mínimo de caracteres antes de buscar, y estado de "buscando…". Coherente con la búsqueda global del Home.
- **Filtros:** agrupados, con estado visible de "filtros activos" y opción de limpiar todo; nunca ocultan cuántos resultados quedan.

### 10.3. Validación, ayudas y mensajes

- **Validación en el momento oportuno:** al salir del campo o al enviar, no golpeando al usuario en cada pulsación. Los requisitos se anticipan (texto de ayuda) antes de convertirse en error.
- **Errores claros y amables:** describen *qué* pasó y *cómo* resolverlo, junto al campo afectado, con color de error + icono + texto. Nunca solo un borde rojo sin explicación. Nunca lenguaje que culpe ("Ingresaste mal"): mejor "El correo debe incluir @".
- **Ayudas (hints):** texto secundario bajo el campo, tono cercano, anticipa el formato esperado.
- **Placeholders:** ejemplos de formato, atenuados, que desaparecen al escribir; jamás contienen información imprescindible.
- **Campos obligatorios:** señalados de forma consistente y visible; se comunica lo obligatorio, idealmente marcando lo opcional cuando la mayoría es requerido.
- **Comentarios obligatorios en decisiones sensibles:** cuando la documentación exige justificación (p. ej., rechazar una solicitud de admisión requiere comentario), el formulario impide continuar sin ella y lo explica con claridad.
- **Estado de envío:** durante el guardado, el formulario se bloquea con indicador de progreso; al terminar, confirma con éxito o detalla el error sin perder los datos ya ingresados.

### 10.4. Datos sensibles en formularios

Los formularios que capturan o muestran datos sensibles (ficha médica, perfiles de niños y adultos mayores) señalan visualmente esa condición, pueden requerir **motivo de acceso** y comunican que la acción quedará registrada. El tono es de responsabilidad y cuidado, no de amenaza.

---

## 11. Tablas

### 11.1. Filosofía

Las tablas presentan el trabajo real (voluntarios, horas, solicitudes, transacciones, auditoría). Deben ser **escaneables, ordenables y accionables** sin abrumar. La legibilidad de una fila prevalece sobre la cantidad de columnas.

### 11.2. Anatomía

- **Cabeceras:** diferenciadas por peso tipográfico (Medium) y fondo sutil, fijas al hacer scroll cuando la tabla es larga. Indican claramente qué columna se puede ordenar.
- **Filas:** separadas por divisores muy suaves o por alternancia mínima de fondo; altura cómoda; alineación coherente (texto a la izquierda, números y montos a la derecha, estados centrados o con badge).
- **Hover de fila:** realce sutil del fondo para seguir la lectura horizontal; nunca un color fuerte.
- **Selección:** checkbox por fila y selección múltiple con barra de acciones contextual; la fila seleccionada se distingue con fondo azul muy tenue.
- **Ordenamiento:** indicador visible (flecha) en la columna activa; un clic ordena, con estado claro asc/desc.
- **Paginación:** control claro con tamaño de página y total de resultados; alternativamente carga progresiva, pero siempre informando cuántos elementos hay.
- **Filtros:** sobre la tabla, con resumen de filtros aplicados y limpieza fácil.
- **Acciones por fila:** agrupadas al final de la fila (iconos ghost con tooltip o menú de acciones); las destructivas se separan y usan semántica danger.

### 11.3. Estados de la tabla

- **Vacía:** mensaje amable que explica por qué no hay datos y ofrece la acción para crear el primero (ver §15).
- **Cargando:** *skeleton* de filas, no un spinner solitario, para preservar la estructura.
- **Sin resultados de filtro/búsqueda:** distinto del vacío inicial; sugiere ajustar filtros o limpiar la búsqueda.
- **Error:** mensaje claro con opción de reintentar, sin perder los filtros aplicados.

---

## 12. Tarjetas (cards)

### 12.1. Rol

Las tarjetas son el contenedor primario de la interfaz (KPIs del dashboard, resúmenes de entidad, paneles de detalle). Organizan la información en **unidades comprensibles y autónomas**.

### 12.2. Estructura y jerarquía interna

Una tarjeta bien formada tiene: **encabezado** (título claro, opcional icono o acción), **cuerpo** (contenido principal con jerarquía tipográfica) y, si aplica, **pie** (acciones o metadatos). El contenido más importante domina; lo secundario cede tamaño y color.

### 12.3. Estilo

- **Radio de borde:** suavemente redondeado (referencia 16px de la identidad, o un valor menor consistente para tarjetas densas), coherente en todo el sistema.
- **Bordes:** trazo fino de bajo contraste que define la estructura sin endurecerla.
- **Sombra:** muy suave y difusa, solo para separar la tarjeta del fondo. La elevación aumenta levemente al hover si la tarjeta es interactiva.
- **Fondo:** superficie blanca/casi blanca sobre el fondo cálido de la aplicación.
- **Espaciado interno:** padding generoso y uniforme; el contenido nunca toca los bordes.

### 12.4. Contenido y acciones

- Una tarjeta comunica **una idea o entidad**; si acumula demasiados propósitos, se divide.
- Las **acciones** de la tarjeta se ubican de forma predecible (esquina superior derecha para acciones de la tarjeta; pie para acciones sobre su contenido).
- Las **tarjetas de métrica (KPI)** priorizan el número, con etiqueta y variación secundarias; el dato clave se lee de un vistazo.
- Las **tarjetas clicables** completas dejan claro que lo son (cursor, hover, foco) y tienen un destino evidente.

---

## 13. Navegación

### 13.1. Principios

La navegación debe responder siempre a tres preguntas del usuario: **dónde estoy, a dónde puedo ir y cómo vuelvo.** Es estable, predecible y consistente entre módulos. Dado que el sistema tiene muchos módulos (Home, Operación, Proyectos, Personas, Aprobaciones, Admisión, Recursos, Notificaciones, Gobernanza, Configuración, ID Cards), la orientación es crítica.

### 13.2. Sidebar (navegación principal)

- Lista los módulos con **icono + etiqueta**, agrupados por afinidad funcional (operación, personas, recursos, gobierno/configuración).
- **Estado activo** claramente destacado (indicador lateral y/o fondo azul tenue) para anclar la ubicación.
- **Submódulos** desplegables o en segundo nivel, sin esconder profundidad excesiva.
- Colapsable para ganar espacio, conservando los iconos y su tooltip.
- Respeta permisos: solo muestra lo que el usuario puede usar; nunca ofrece caminos que terminarán en "acceso denegado" sin explicación.

### 13.3. Navbar / Topbar

- Contiene **búsqueda global**, **notificaciones** (con historial real) y **menú de cuenta** (perfil, configuración, cerrar sesión).
- La búsqueda del topbar abre la búsqueda global real; el atajo de teclado ofrece navegación rápida (paleta de comandos).
- Las notificaciones muestran estado real (canal, entrega) y llevan al historial completo.
- El menú de cuenta ejecuta acciones reales y visibles (nunca opciones decorativas sin función).

### 13.4. Breadcrumb

- Presente en vistas profundas (detalle dentro de un módulo) para mostrar la ruta y permitir volver a niveles superiores.
- Refleja la jerarquía real (Módulo › Sección › Entidad), con cada nivel navegable salvo el actual.

### 13.5. Menús, submenús, pestañas y acordeones

- **Menús contextuales:** agrupan acciones sobre una entidad; separan visualmente las destructivas.
- **Pestañas (tabs):** para vistas paralelas de una misma entidad (p. ej., datos, documentos, historial); la pestaña activa es inequívoca.
- **Acordeones:** para agrupar contenido extenso u opcional (secciones de un formulario largo, detalles avanzados); indican con claridad qué está expandido.
- **Buscador de navegación / paleta de comandos:** acceso rápido por teclado a rutas y acciones frecuentes; complementa, no reemplaza, la navegación visible.

### 13.6. Consistencia de navegación

Todo destino debe tener un **título de página dedicado y correcto** (sin caer en un genérico "Admin"); la falta de títulos claros desorienta y se considera un defecto. La navegación no cambia de lugar entre módulos.

---

## 14. Animaciones y microinteracciones

### 14.1. Filosofía del movimiento

El movimiento **informa, nunca entretiene por entretener**. Sirve para explicar cambios de estado, dar continuidad espacial y confirmar acciones. En un dominio serio y sensible, la animación es **sobria, breve y suave**; nunca genera espera ni distrae de una decisión importante.

### 14.2. Lineamientos

- **Duración:** transiciones cortas (referencia 150–250 ms) para interacciones directas; algo más largas solo para cambios de contexto mayores (apertura de modal). Nada que haga esperar.
- **Suavidad (easing):** curvas naturales de aceleración/desaceleración; nada mecánico ni con rebotes exagerados.
- **Apariciones/desapariciones:** entradas con leve desvanecimiento y desplazamiento corto; salidas rápidas. El contenido nunca "salta" bruscamente.
- **Hover/focus:** respuesta inmediata y sutil (realce, elevación, subrayado).
- **Loading:** *skeletons* y barras/indicadores de progreso serenos; sin animaciones ansiosas o parpadeantes.
- **Microinteracciones:** confirmación de guardado, marcado de notificación leída, checkbox al marcar; pequeñas señales que dan tacto y confianza.

### 14.3. Qué animar y qué no

- **Sí:** cambios de estado, apariciones de modales/toasts, transiciones de carga, retroalimentación de acción, expansión de acordeones.
- **No:** textos que se mueven al leer, decoraciones en bucle, animaciones largas que retrasan el trabajo, efectos llamativos en datos sensibles o en confirmaciones críticas (deben sentirse serios y estables).
- **Accesibilidad del movimiento:** respetar la preferencia de "reducir movimiento"; ninguna información depende exclusivamente de una animación.

---

## 15. Estados del sistema

Cada estado tiene una apariencia definida y consistente. La regla común: **explicar la situación con calma y ofrecer siempre una salida.**

- **Vacío (sin datos aún):** ilustración o icono sencillo y cálido, mensaje amable que explica qué es esta sección y **acción para crear el primer elemento**. Es una oportunidad de guía, no un error. Tono optimista.
- **Cargando:** *skeleton* que preserva la estructura de la vista (tarjetas/filas fantasma); para acciones puntuales, indicador en el propio control. Nunca dejar la pantalla congelada sin señal.
- **Éxito:** confirmación breve (toast o cambio de estado visible) en verde, con mensaje claro de qué se logró. No interrumpe más de lo necesario.
- **Advertencia:** banner o mensaje ámbar para situaciones que requieren atención pero no bloquean (datos incompletos, pendientes de revisión). Explica la consecuencia y la acción sugerida.
- **Error:** mensaje claro y no alarmista que dice qué pasó y cómo continuar, con opción de reintentar; conserva el trabajo del usuario. Distingue tipos: red, permisos, tiempo de espera, validación.
- **Sin resultados (búsqueda/filtro):** distinto del vacío inicial; sugiere ajustar términos o filtros y ofrece limpiarlos.
- **Sin conexión:** aviso sereno de que se perdió la conexión, con reintento; se evita perder datos ingresados.
- **Permisos insuficientes:** mensaje respetuoso que explica que la acción/sección requiere un permiso, sin exponer detalles técnicos ni hacer sentir culpable al usuario; orienta a quién solicitar acceso. La navegación evita, en lo posible, ofrecer caminos que terminen aquí.
- **Datos incompletos:** señala con advertencia qué falta para completar un registro o proceso y guía a completarlo; frecuente en admisión, proyectos y actividades.

---

## 16. Accesibilidad

La accesibilidad es un **requisito, no una mejora opcional**, y prevalece sobre la estética cuando haya conflicto. El público es diverso y muchas veces no experto.

- **Contraste:** cumplir como mínimo los umbrales de contraste reconocidos (referencia WCAG AA: 4.5:1 para texto normal, 3:1 para texto grande y elementos de interfaz). El texto esencial nunca en gris de bajo contraste.
- **Legibilidad:** cuerpo de texto desde 16px, interlínea amplia, longitud de línea controlada.
- **Tamaño mínimo táctil/clic:** áreas de interacción cómodas (referencia ~44px) para botones, checkboxes y acciones de fila.
- **Navegación por teclado:** todo elemento interactivo alcanzable y operable con teclado, en orden lógico, con **foco visible** de alto contraste.
- **Jerarquía semántica:** estructura de encabezados coherente; el orden visual coincide con el orden de lectura.
- **El color nunca es el único canal:** todo estado se comunica con color + icono + texto. Un usuario con daltonismo debe distinguir éxito, error y advertencia sin depender del matiz.
- **Iconos con significado:** acompañados de texto o de etiqueta accesible; nunca un icono solo carga información crítica sin alternativa textual.
- **Lectores de pantalla:** etiquetas descriptivas en controles, campos, imágenes informativas y estados; los cambios importantes (errores, confirmaciones) se anuncian.
- **Accesibilidad cognitiva:** lenguaje simple y directo, pasos claros, una acción principal por pantalla, ausencia de saturación; se reduce la carga mental para usuarios ocasionales y en contextos de estrés.
- **Movimiento:** respetar la reducción de movimiento; ninguna información depende solo de animación.
- **Formularios accesibles:** rótulos asociados, errores anunciados y vinculados al campo, instrucciones claras antes de fallar.

---

## 17. Componentes generales

Lineamientos de aspecto y comportamiento para los componentes transversales. Todos comparten la paleta, la tipografía y el sistema de espaciado ya definidos.

- **Modales:** para tareas o confirmaciones enfocadas. Fondo oscurecido tenue (overlay), tarjeta centrada con encabezado, cuerpo y acciones claras (primaria + cancelar). Cierre por botón, overlay y tecla de escape. No anidar modales; no usarlos para flujos largos. Los modales de detalle muestran un resumen antes de navegar al módulo completo.
- **Toast / notificación efímera:** mensajes breves de resultado (éxito, error, info) en una esquina, con auto-desaparición y opción de cerrar; no bloquean. Los errores importantes no se confían solo a un toast fugaz.
- **Alertas / banners:** mensajes persistentes en contexto (advertencia de datos incompletos, aviso de estado); usan color semántico + icono + texto, con acción si corresponde.
- **Tooltip:** aclaraciones cortas al hover/focus sobre iconos y controles no evidentes; nunca contienen información imprescindible que no esté también accesible de otro modo.
- **Badges / etiquetas de estado:** píldoras con color semántico suave + texto legible para estados (vigente, pendiente, aprobado, rechazado, cancelado). Consistentes en todo el sistema.
- **Chips:** para filtros activos, tags o selecciones; removibles con una acción clara.
- **Avatares:** representación de personas (voluntarios, usuarios) con iniciales o imagen; forma y tamaño consistentes; nunca la única forma de identificar a alguien (siempre con nombre).
- **Indicadores / puntos de estado:** pequeño punto de color + etiqueta para estados en tablas y listas; refuerzan, no sustituyen, el texto.
- **Barras de progreso:** para procesos con avance medible (onboarding, carga); serenas, con porcentaje o paso actual visible.
- **Skeleton loading:** siluetas de la estructura mientras cargan los datos; preferidos frente a spinners aislados en vistas con estructura conocida.
- **Paginación:** controles claros con total de resultados y tamaño de página; posición y estilo consistentes.
- **Calendarios / date pickers:** claros y localizados en español, con rangos válidos evidentes y hoy destacado.
- **Timeline / historial:** para trazabilidad (estados de admisión, auditoría, actividad reciente); orden cronológico claro, con actor, fecha y descripción del cambio. Refuerza la transparencia.
- **Command palette:** acceso por teclado a navegación y acciones; muestra atajos útiles, sin datos simulados.

---

## 18. Consistencia visual

### 18.1. Qué debe repetirse siempre

- Los **mismos colores** para los mismos significados en todos los módulos.
- El **mismo componente** para el mismo problema (una sola tabla, un solo modal, un solo patrón de formulario).
- Los **mismos iconos** para las mismas acciones y estados.
- El **mismo espaciado** derivado de la escala base.
- El **mismo lenguaje** para las mismas acciones ("Aprobar", "Rechazar", "Guardar cambios").
- La **misma ubicación** de acciones, navegación y estados entre pantallas.

### 18.2. Qué nunca debe hacerse

- Inventar un color, un estilo de botón o un patrón nuevo para un caso puntual cuando ya existe uno.
- Cambiar el significado de un color o icono según el módulo.
- Mezclar familias de iconos o de tipografía.
- Mostrar datos simulados, cifras falsas o enlaces vacíos como si fueran reales.
- Dejar textos obsoletos o contradictorios con el comportamiento actual.
- Presentar caracteres corruptos o mala codificación (mojibake) en la interfaz.

### 18.3. Qué rompe la identidad visual

Sombras duras, bordes gruesos y oscuros, colores estridentes o fuera de paleta, densidad asfixiante, tipografías ajenas, iconos de estilos distintos, animaciones llamativas y cualquier elemento que priorice el lucimiento sobre la claridad.

### 18.4. Errores comunes a evitar

Abusar del color primario hasta anular su jerarquía; usar rojo para todo lo que "llama la atención"; llenar la pantalla porque "hay espacio"; confiar el significado solo al color; ocultar acciones importantes tras iconos sin etiqueta; retroalimentación ausente tras una acción; estados vacíos que no orientan; títulos genéricos que desubican al usuario.

---

## 19. Lenguaje visual y verbal (voz y microcopy)

### 19.1. Tono

**Cercano, claro, respetuoso y sereno.** Institucional sin ser burocrático; humano sin ser informal en exceso. El sistema habla como un colega competente que respeta el tiempo y la inteligencia del usuario.

### 19.2. Nivel de formalidad

Formalidad media: trato de "tú/usted" coherente en todo el sistema (se recomienda un registro uniforme y cercano en español), frases cortas, voz activa, verbos directos. Se evita la jerga técnica, los tecnicismos de base de datos y el lenguaje legal innecesario de cara al usuario.

### 19.3. Estilo comunicacional por contexto

- **Microcopys de acción:** verbos honestos que anticipan la consecuencia ("Aprobar horas", "Rechazar solicitud", "Emitir credencial").
- **Mensajes de confirmación:** claros y positivos ("Horas aprobadas", "Voluntario registrado").
- **Estados vacíos:** cálidos y orientadores ("Aún no hay proyectos. Crea el primero para empezar.").
- **Errores:** explican qué pasó y cómo seguir, sin culpar ni asustar; sin tecnicismos.
- **Confirmaciones de acciones sensibles/destructivas:** describen exactamente qué ocurrirá y piden confirmación explícita.
- **Datos sensibles:** el lenguaje comunica cuidado y responsabilidad ("Este acceso quedará registrado"), nunca amenaza.

### 19.4. Reglas de redacción

Consistencia terminológica (un concepto, una palabra), brevedad, ausencia de exclamaciones excesivas, respeto por el español correcto y localizado, y honestidad: el sistema nunca promete lo que no hará ni oculta lo que hizo.

---

## 20. Experiencia emocional por momento del recorrido

Cómo debe **sentirse** el usuario en cada fase. El diseño se asegura de producir la emoción indicada.

- **Registro / alta (postulante o usuario):** *bienvenida y confianza.* Proceso claro, guiado, sin fricción; la persona siente que dar sus datos es seguro y con propósito.
- **Inicio de sesión / entrada:** *seguridad y familiaridad.* Acceso sobrio y confiable; el sistema transmite solidez desde el primer contacto.
- **Uso diario:** *fluidez y control.* Todo donde se espera, sin sorpresas; el usuario avanza sin pensar en la herramienta.
- **Creación de información (registrar, crear proyecto, admitir):** *acompañamiento.* Guía paso a paso, validación amable, confirmación clara; sensación de logro al completar.
- **Consulta / búsqueda:** *rapidez y certeza.* Encuentra lo que busca pronto y confía en que el dato es real y actual.
- **Seguimiento (horas, admisión, aprobaciones):** *claridad y transparencia.* Ve estados y trazabilidad; entiende en qué punto está cada cosa.
- **Finalización (aprobar, cerrar, emitir):** *satisfacción serena.* Confirmación positiva; sensación de haber cerrado bien un ciclo de la misión.
- **Errores:** *contención, no culpa.* El sistema se hace cargo, explica y ofrece salida; el usuario no se siente responsable ni bloqueado.
- **Confirmaciones:** *tranquilidad.* Certeza de que la acción quedó registrada y es trazable.
- **Acceso a datos sensibles:** *responsabilidad consciente.* El usuario siente el peso del cuidado, con respeto y sin dramatismo.

---

## 21. Principios Inquebrantables

Reglas obligatorias que mantienen la coherencia del diseño. Ante cualquier duda o conflicto, prevalecen estos principios.

1. La **accesibilidad prevalece sobre la estética** cuando ambas entren en conflicto.
2. La interfaz debe **transmitir confianza antes que sofisticación**.
3. **Nunca saturar** una pantalla: el aire es parte del diseño.
4. Mantener **jerarquías visuales claras** en toda vista.
5. **Priorizar la información crítica**; lo secundario cede espacio y énfasis.
6. **Toda acción importante tiene retroalimentación visual** inmediata.
7. El **color nunca es el único portador de significado**; siempre acompañado de icono y texto.
8. Usar **el rojo con avaricia**: solo para errores reales y acciones destructivas.
9. **Una sola acción primaria** dominante por pantalla o contexto.
10. **Evitar colores agresivos o fuera de paleta** sin justificación documentada.
11. **Consistencia por encima de la novedad**: un problema, un patrón.
12. Los **mismos colores e iconos** significan siempre lo mismo en todos los módulos.
13. **Una sola familia tipográfica** para la interfaz; pesos limitados y coherentes.
14. **Una sola familia de iconos**, de estilo y trazo uniformes.
15. Todo **espaciado** proviene de la escala base; nada de valores arbitrarios.
16. **Nunca mostrar datos simulados, cifras falsas o enlaces vacíos** como si fueran reales.
17. **Nunca dejar al usuario sin saber** si su acción se registró.
18. Los **estados vacíos orientan y ofrecen una salida**; no son callejones sin salida.
19. **Todo destino tiene un título de página claro y correcto**; nunca genéricos que desubiquen.
20. El **foco de teclado siempre es visible** y de alto contraste.
21. Todo elemento interactivo es **operable por teclado** en orden lógico.
22. El **texto esencial cumple el contraste mínimo** (referencia AA); nunca gris de bajo contraste.
23. **Cuerpo de texto desde 16px**; no comprometer la lectura por caber más.
24. Las **acciones destructivas** requieren variante *danger* y confirmación explícita; nunca son la opción por defecto.
25. El **dato sensible se señala, se protege y se registra**; su acceso comunica cuidado, no amenaza.
26. La **trazabilidad se muestra como transparencia**, no como vigilancia hostil.
27. La **navegación es estable**: no cambia de lugar entre módulos.
28. **No ofrecer caminos** que terminen en "acceso denegado" sin explicación previa.
29. Los **errores explican qué pasó y cómo seguir**, sin culpar al usuario ni usar tecnicismos.
30. **Conservar el trabajo del usuario** ante errores, timeouts o pérdida de conexión.
31. El **movimiento informa**, nunca entretiene por entretener; sobrio y breve.
32. **Respetar la reducción de movimiento**; ninguna información depende solo de animación.
33. La **profundidad (sombras) es sutil y funcional**; nada flota sin razón.
34. **Bordes finos y suaves**; nunca gruesos u oscuros que endurezcan la interfaz.
35. **Neutros cálidos**, no grises fríos, para preservar la cercanía humana.
36. El **cian se reserva a lo asistido por IA**; no se usa como acción ni como estado.
37. **Radios de borde coherentes** en todo el sistema.
38. **Un componente comunica una idea**; si acumula propósitos, se divide.
39. **Lenguaje claro, cercano y consistente**; una acción, siempre la misma palabra.
40. **Nunca caracteres corruptos** ni codificación defectuosa en la interfaz.
41. **Nunca textos obsoletos** o contradictorios con el comportamiento real del sistema.
42. Los **iconos sin etiqueta** solo en acciones universales y evidentes, siempre con tooltip.
43. Las **tablas priorizan la legibilidad de la fila** sobre la cantidad de columnas.
44. La **densidad se adapta al contexto**, pero nunca al punto de dificultar distinguir elementos.
45. Toda **pantalla responde a: dónde estoy, a dónde voy, cómo vuelvo**.
46. La **retroalimentación de guardado** bloquea el control para evitar envíos dobles.
47. Los **catálogos y estados** mostrados reflejan los reales del sistema, no invenciones visuales.
48. La **coherencia con la marca madre (Democra.pro) es obligatoria**; su modulación cálida para el dominio ONG es responsabilidad de esta guía.
49. Ante conflicto entre principios, el **orden de arbitraje** es: accesibilidad/claridad › confianza/trazabilidad › cuidado del dato sensible › consistencia › novedad.
50. **Si una decisión visual no puede justificarse desde el propósito de la ONG, no pertenece a este sistema.**

---

## 22. Cierre

Esta guía es la **referencia oficial de Look & Feel** del módulo ONG de Democra.pro. Define criterios de diseño y experiencia, no implementación. Debe leerse por encima de decisiones visuales previas cuando exista conflicto, y actualizarse cuando la documentación funcional del sistema evolucione.

Todo el sistema converge en una sola idea: **una herramienta seria, cálida, transparente y accesible, al servicio de personas que ayudan a personas.** Cada color, tipografía, componente y microcopy debe reforzar esa idea. Cuando surja una decisión no contemplada aquí, se resuelve preguntando: *¿esto aumenta la claridad, la confianza y el cuidado hacia las personas y sus datos?* Si la respuesta es no, la decisión no pertenece a este sistema.

---

*Documento de criterios de diseño y experiencia. No contiene código ni instrucciones de implementación. Fundamentado en la documentación funcional y de identidad del proyecto.*
