## **UNIVERSIDAD NACIONAL DE SAN CRISTÓBAL DE HUAMANGA** 

## **FACULTAD DE INGENIERÍA DE MINAS GEOLOGÍA Y CIVIL** 

**ESCUELA PROFESIONAL DE INGENIERÍA DE SISTEMAS** 

**Curso** 

**Pruebas y aseguramiento de la calidad de software** 

## **Proyecto** 

## **"Plataforma web de anuncios clasificados para la región de Ayacucho, 2025"** 

PRESENTADO POR: 

DOCENTE: 

## **Mg. Ing. Richard Zapata Casaverde** 

Ayacucho – Perú 

2026 

## Dedicatoria 

Dedico el presente trabajo de investigación a mis padres, quienes han sido mi pilar fundamental y me han brindado su apoyo constante a lo largo de mis estudios universitarios. Este logro es fruto de su amor y sacrificio. 

Asimismo, expreso mi gratitud a mis docentes, por su generosidad al compartir sus enseñanzas y por fortalecer mis conocimientos durante mi formación profesional. 

Finalmente, agradezco a mis amigos, por su compañía leal y su apoyo incondicional en todo momento, quienes hicieron posible que hoy alcance esta meta. 

2 

## **Agradecimiento** 

En primer lugar, agradezco a Dios, por haberme bendecido con la vida, guiar mi camino y darme la fortaleza necesaria para perseverar y superar cada obstáculo a lo largo de mi formación profesional. 

A mi alma mater, la Universidad Nacional de San Cristóbal de Huamanga, y a todos los docentes de la Escuela Profesional de Ingeniería de Sistemas, por su compromiso académico y por haberme impartido los conocimientos que hoy constituyen los cimientos de mi carrera. 

Finalmente, mi gratitud eterna a mis padres, Margarita Guillén y Percy Tineo. Gracias por ser mi ejemplo de esfuerzo, por su amor incondicional y por haber creído siempre en mí. Su apoyo moral y económico ha sido el motor que me impulsó a cumplir este sueño. Este logro profesional es también suyo. 

3 

## **Resumen** 

La presente investigación, de tipo aplicada y nivel descriptivo, tuvo como objetivo general desarrollar una plataforma web de anuncios clasificados de bienes, servicios y oportunidades locales para la región de Ayacucho, materializada en un Producto Mínimo Viable (MVP). Metodológicamente, se empleó un enfoque híbrido ágil, integrando el marco de trabajo Scrum para la gestión iterativa de las fases de análisis, diseño e implementación, junto con prácticas de Extreme Programming (XP) para asegurar la calidad del código. A nivel arquitectónico, se construyó una Single Page Application (SPA) estructurada con React.js en el frontend, Node.js en el backend y MySQL para la base de datos relacional. La evaluación de la plataforma se realizó mediante un diseño transversal enfocado en dos variables. Respecto a la variable Funcionamiento, los resultados obtenidos a través de una Ficha de Análisis Documental evidenciaron un cumplimiento técnico del 100% en la operatividad de los módulos críticos (autenticación JWT, búsquedas parametrizadas y borrado lógico) sin presentar excepciones. Respecto a la variable Usabilidad, la aplicación de la Escala de Usabilidad del Sistema (SUS) a una muestra piloto de 20 usuarios arrojó un Score promedio de 83.5 puntos. Este resultado sitúa a la plataforma en un nivel de usabilidad "Excelente", demostrando la alta efectividad de la arquitectura _Mobile First_ y la optimización de los flujos de interacción y comunicación dentro del ecosistema de comercio electrónico local. Se concluye que la plataforma desarrollada constituye una solución tecnológica viable, segura y altamente aceptada por la muestra evaluada, sentando bases operativas comprobadas para la estructuración y formalización del comercio digital descentralizado en la región. 

**Palabras clave:** Plataforma web, Comercio electrónico C2C, Producto Mínimo Viable, Scrum, React.js, Ayacucho. 

4 

## **Abstract** 

This applied and descriptive research aimed to develop a web platform for classified advertisements of local goods, services, and opportunities for the Ayacucho region, materialized as a Minimum Viable Product (MVP). Methodologically, a hybrid agile approach was employed, integrating the Scrum framework for the iterative management of the analysis, design, and implementation phases, along with Extreme Programming (XP) practices to ensure code quality. At the architectural level, a Single Page Application (SPA) was built, structured with React.js on the frontend, Node.js on the backend, and MySQL for the relational database. The evaluation of the platform was carried out through a crosssectional design focused on two variables. Regarding the Functioning variable, the results obtained through a Documentary Analysis Sheet evidenced 100% technical compliance in the operability of critical modules (JWT authentication, parameterized searches, and logical deletion) without presenting any exceptions. Regarding the Usability variable, the application of the System Usability Scale (SUS) to a pilot sample of 20 users yielded an average score of 83.5 points. This result places the platform at an "Excellent" usability level, demonstrating the high effectiveness of the Mobile First architecture and the optimization of the interaction and communication flows within the local e-commerce ecosystem. It is concluded that the developed platform constitutes a viable, secure, and highly accepted technological solution by the evaluated sample, laying proven operational foundations for the structuring and formalization of decentralized digital commerce in the region. 

**Keywords:** Web platform, C2C E-commerce, Minimum Viable Product, Scrum, React.js, Ayacucho. 

5 

## **Contenido** 

**DEDICATORIA ........................................................................................................................ 2 AGRADECIMIENTO ................................................................................................................ 3 RESUMEN .............................................................................................................................. 4 ABSTRACT ............................................................................................................................. 5 INTRODUCCIÓN ..................................................................................................................... 9 CAPÍTULO I .......................................................................................................................... 11 PLANTEAMIENTO DEL PROBLEMA ....................................................................................... 11** 1.1 DIAGNOSTICO Y ENUNCIADO DEL PROBLEMA ................................................................................. 11 1.2. FORMULACIÓN DEL PROBLEMA.................................................................................................. 13 _1.2.1. Problema General ...................................................................................................... 13 1.2.2. Problemas específicos ................................................................................................ 13_ 1.3. OBJETIVOS ............................................................................................................................. 14 _1.3.1. Objetivo General ........................................................................................................ 14 1.3.2. Objetivos Específicos .................................................................................................. 14_ 1.4. HIPÓTESIS ............................................................................................................................. 14 1.5. JUSTIFICACIÓN Y DELIMITACIÓN DE LA INVESTIGACIÓN ................................................................... 15 _1.5.1 Importancia ................................................................................................................. 15 1.5.2. Justificación ................................................................................................................ 15 1.5.3. Delimitación ............................................................................................................... 16 1.5.4. Limitaciones ............................................................................................................... 16_ **CAPITULO II ......................................................................................................................... 18 MARCO TEÓRICO ................................................................................................................. 18** 2.1. ANTECEDENTES DE LA INVESTIGACIÓN ......................................................................................... 18 _2.1.1. Antecedentes Nacionales ........................................................................................... 18 2.1.2. Antecedentes internacionales .................................................................................... 19_ 2.2. MARCO TEÓRICO .................................................................................................................... 20 _2.2.1. Página Web ................................................................................................................ 20 2.2.2. Aplicaciones de Página Única (SPA) ........................................................................... 24 2.2.3. Comercio Electrónico ................................................................................................. 24 2.2.4. Anuncios Clasificados Digitales .................................................................................. 25 2.2.5. Framework Scrum ...................................................................................................... 26 2.2.6. Entorno de Ejecución Node.js .................................................................................... 32_ 

6 

_2.2.7. Librería React.js y el Virtual DOM .............................................................................. 32 2.2.9. Calidad del Software .................................................................................................. 34 2.2.10. Arquitectura Mobile First ......................................................................................... 36 2.2.11. Extreme Programming (XP) en el Desarrollo Ágil .................................................... 36 2.2.12. Frontend (Capa de Presentación) ............................................................................ 36 2.2.13. Backend (Capa de Lógica y Datos) ........................................................................... 37 2.2.14. Comparación y Justificación del Stack Tecnológico ................................................. 37_ **CAPITULO III ........................................................................................................................ 39 MATERIAL Y MÉTODOS ........................................................................................................ 39** 3.1. TIPO DE INVESTIGACIÓN ........................................................................................................... 39 3.2. NIVEL DE INVESTIGACIÓN .......................................................................................................... 39 3.3. DISEÑO DE INVESTIGACIÓN ....................................................................................................... 39 3.4. POBLACIÓN Y MUESTRA ........................................................................................................... 40 _3.4.1. Población .................................................................................................................... 40 3.4.2. Muestra ...................................................................................................................... 40_ 3.5. VARIABLES E INDICADORES ........................................................................................................ 41 _3.5.1. Definición conceptual de las variables ....................................................................... 41 3.5.2. Definición operacional de las variables ..................................................................... 42_ 3.6. TÉCNICAS E INSTRUMENTOS PARA EL TRATAMIENTO DE DATOS E INFORMACIÓN .................................. 43 _3.6.1. Técnicas para recolectar información ........................................................................ 43 3.6.2. Instrumentos para la recolectar información ............................................................ 45 3.6.3. Herramientas para el tratamiento de datos e información ...................................... 46 3.6.4. Diseño estadístico ...................................................................................................... 47 3.6.5. Análisis e interpretación de datos ............................................................................. 47 3.6.6. Técnicas para aplicar el marco de trabajo Scrum ...................................................... 48_ **CAPITULO IV ........................................................................................................................ 51 RESULTADOS Y DISCUSIÓN .................................................................................................. 51** 4.1. RESULTADOS DE LA INVESTIGACIÓN ............................................................................................ 51 _4.1.1. Resultados de la Fase de Análisis ............................................................................... 51 4.1.2. Resultados de la Fase de Diseño ................................................................................ 54 4.1.3. Resultados de la Fase de Implementación (Variable X3) ........................................... 54 4.1.4. Resultados de la Validación de Funcionamiento (Variable X4) ................................. 87 4.1.5. Resultados de la Evaluación de Usabilidad (Variable X5) .......................................... 89_ 4.2. DISCUSIONES ......................................................................................................................... 90 **CAPITULO V ......................................................................................................................... 96** 

7 

**CONCLUSIONES Y RECOMENDACIONES ................................................................................ 96** 5.1. CONCLUSIONES ...................................................................................................................... 96 5.2. RECOMENDACIONES ................................................................................................................ 98 **REFERENCIAS BIBLIOGRÁFICAS .......................................................................................... 100 ANEXO .............................................................................................................................. 105** ANEXO 1. MATRIZ DE CONSISTENCIA............................................................................................... 105 ANEXO 2: INSTRUMENTOS DE RECOLECCIÓN DE DATOS .......................... **¡ERROR! MARCADOR NO DEFINIDO.** _2.1. Encuesta de percepción ..................................................._ _**¡Error! Marcador no definido.** 2.2. Guía de entrevista ............................................................_ _**¡Error! Marcador no definido.** 2.3. Ficha de Análisis Documental (Evaluación de Funcionamiento – X4)_ _**¡Error! Marcador no definido.** 2.4. Instrumento de Evaluación de Usabilidad y Adopción ....._ _**¡Error! Marcador no definido.**_ ANEXO 3: RESULTADOS ESTADÍSTICOS DE USABILIDAD (ESCALA SUS) ....... **¡ERROR! MARCADOR NO DEFINIDO.** ANEXO 4: DETALLE DE HISTORIAS DE USUARIO DEL PRODUCT BACKLOG ................................................. 106 ANEXO 5: ENTREGABLES DE INGENIERÍA DE SOFTWARE (ARQUITECTURA Y DISEÑO) ................................. 124 _5.1. El Diagrama de Arquitectura ...................................................................................... 124 5.2. El Diagrama Entidad-Relación (DER) de MySQL. ........................................................ 124 5.3. Prototipos de interfaz desarrollados ........................................................................... 125_ 

8 

## **Introducción** 

En la última década, la economía global ha experimentado una transformación radical impulsada por la digitalización. Los mercados digitales han redefinido la manera en que se intercambian bienes y servicios, reduciendo significativamente los costos de transacción y la asimetría de información entre compradores y vendedores. Según Laudon y Traver (2020), los sistemas de información y las plataformas web no solo facilitan el comercio, sino que se han convertido en activos estratégicos indispensables para la supervivencia de los negocios en la era contemporánea, permitiendo que la oferta y la demanda se encuentren en tiempo real sin barreras geográficas. 

En el contexto nacional, el Perú ha mostrado un crecimiento acelerado en la adopción del comercio electrónico. De acuerdo con el reporte de la Cámara Peruana de Comercio Electrónico (CAPECE, 2024), el volumen de ventas online en el país alcanzó cifras históricas, impulsado por la masificación de los pagos digitales y el uso de dispositivos móviles. Sin embargo, este desarrollo presenta una brecha centralista; mientras que la capital concentra la mayoría de plataformas formales, las provincias aún carecen de herramientas tecnológicas propias que estructuren su comercio local. Aterrizando esta realidad en la región de Ayacucho, se observa un escenario dual. Por un lado, existe una alta penetración de conectividad; según el Instituto Nacional de Estadística e Informática (INEI, 2024), más del 90% de los hogares peruanos cuenta con al menos una tecnología de información y comunicación (TIC), siendo el teléfono móvil el dispositivo predominante. No obstante, a pesar de este acceso, la región no cuenta con una plataforma web centralizada para anuncios clasificados. El comercio local _Consumer-to-Consumer_ (C2C) se realiza mayoritariamente de manera informal a través de grupos en redes sociales, lo que genera una profunda desorganización de la información, dificultad en las búsquedas y, sobre todo, riesgos de seguridad vinculados al anonimato. 

Frente a esta situación problemática, surge la pregunta de investigación principal: ¿Cuáles son los resultados del desarrollo de una plataforma web de anuncios clasificados de bienes, servicios y oportunidades locales para la región de Ayacucho, 2025? Para dar respuesta a esta interrogante, el objetivo general del estudio es desarrollar e implementar dicha plataforma web con el propósito de facilitar la conexión entre compradores y vendedores, promoviendo la economía local. De este se desprenden los objetivos específicos, los cuales abarcan determinar los resultados de las fases de análisis, diseño e implementación 

9 

del software, para finalmente validar el correcto funcionamiento de los módulos principales y evaluar la usabilidad de la plataforma mediante la muestra de usuarios piloto. 

La presente investigación se justifica desde una perspectiva tecnológica y social. Prácticamente, provee una herramienta digital escalable (utilizando React.js y Node.js) que resuelve la fricción comunicacional y la desorganización del comercio C2C local. Socialmente, fomenta un entorno de transacciones más seguro mediante el registro de identidades, dinamizando la economía de la región. Metodológicamente, demuestra la viabilidad de hibridar el marco de trabajo ágil Scrum con las prácticas de ingeniería de _Extreme Programming_ (XP) para la construcción de software de calidad por parte de un investigador único. 

En cuanto a sus alcances y delimitaciones, el proyecto se enfoca en el desarrollo de un Producto Mínimo Viable (MVP). Operativamente, la plataforma delega el cierre de transacciones a la API de WhatsApp, excluyendo la implementación de una pasarela de pagos nativa. A nivel de validación, la evaluación de las variables de Funcionamiento y Usabilidad se delimita a un entorno de pruebas controlado y a una muestra piloto no probabilística conformada por 20 usuarios de la región, lo cual es idóneo para esta fase iterativa inicial. 

A nivel metodológico, el estudio se enmarca en una investigación de tipo aplicadatecnológica, con un nivel descriptivo y un diseño no experimental de corte transversal. Las técnicas de recolección de datos incluyeron la entrevista preliminar para el análisis de requerimientos, seguida de una Ficha de Análisis Documental para la auditoría del código y la aplicación de la Escala de Usabilidad del Sistema (SUS) para la evaluación final del MVP. 

Finalmente, la estructura de la tesis se organiza en cinco capítulos: El Capítulo I detalla el planteamiento del problema, los objetivos y la justificación. El Capítulo II desarrolla el marco teórico, abarcando los antecedentes y las bases conceptuales de la ingeniería web y el comercio electrónico. El Capítulo III describe el marco metodológico, el tipo de investigación y la integración de las metodologías ágiles (Scrum y XP). El Capítulo IV expone los resultados del desarrollo por Sprints y la discusión sobre la validación funcional y la evaluación de la usabilidad. Por último, el Capítulo V presenta las conclusiones finales y las recomendaciones para futuras líneas de investigación. 

10 

## **Capítulo I** 

## **Planteamiento del Problema** 

## **1.1 Diagnostico y enunciado del problema** 

La economía digital se ha consolidado como el nuevo paradigma para el intercambio comercial. A nivel global, la transición de los anuncios clasificados impresos hacia plataformas digitales ha democratizado el acceso al mercado, permitiendo que cualquier persona con acceso a internet pueda convertirse en ofertante. Según el informe digital global de DataReportal (2024), más del 66% de la población mundial utiliza internet, y una gran parte de esta interacción tiene fines comerciales. 

En el Perú, este fenómeno ha tenido un crecimiento exponencial, especialmente postpandemia. Según el Instituto Nacional de Estadística e Informática (INEI, 2024), en su informe técnico sobre Estadísticas de las Tecnologías de Información y Comunicación, el acceso a internet en los hogares peruanos ha superado el 90% en áreas urbanas, impulsado masivamente por el uso de dispositivos móviles. Sin embargo, existe una dicotomía tecnológica: mientras el acceso a la red crece, la adopción de plataformas formales y especializadas en las regiones del interior del país avanza a un ritmo más lento que en la capital, Lima. 

Aterrizando el análisis en la región de Ayacucho, se evidencia un comportamiento digital caracterizado por la "informalidad tecnológica". Si bien la población ayacuchana cuenta con conectividad, el ecosistema de comercio electrónico local carece de una infraestructura centralizada. 

El diagnóstico específico revela que el mercado de anuncios clasificados en las categorías de compra/venta de artículos, alquileres, empleos y servicios, ha sido absorbido casi en su totalidad por redes sociales genéricas. Según una observación exploratoria del entorno digital local, se han identificado al menos 30 grupos activos en Facebook con denominaciones como "Compra y Venta Ayacucho Huamanga", “Trabajo Empleos Practicas Y Anuncios Ayacucho Provincia 2025” y " Trabajos - Ayacucho", y otros los cuales superan los 20,000 miembros cada uno, funcionando como sustitutos improvisados de un sistema de clasificados. 

Sin embargo, el uso de estas herramientas generalistas presenta deficiencias críticas para una economía local que demanda eficiencia, las cuales se detallan a continuación: 

11 

1. **Desorganización de la Información y Brevedad del Alcance.** La arquitectura de las redes sociales está diseñada para el consumo inmediato, no para el almacenamiento categorizado. Debido a la saturación y la alta frecuencia de posteos en estos grupos locales, un anuncio nuevo desaparece del feed principal en menos de 24 horas. Esto genera un problema dual: el anunciante pierde exposición rápidamente y el comprador se ve obligado a realizar un scroll infinito, revisando manualmente un promedio de 200 a más publicaciones diarias mezcladas sin orden lógico para encontrar un bien específico. 

2. **Falta de Validación y Exposición a Estafas.** Al no existir un registro formal ni validación de identidad en los grupos de redes sociales, cualquier individuo puede crear un perfil temporal en minutos, lo que eleva significativamente el índice de riesgo en las transacciones C2C. Para dimensionar empíricamente esta problemática, a inicios del año 2025 se aplicó una encuesta de percepción (ver Anexo 2) a una muestra diagnóstica de 40 ciudadanos activos en el comercio digital de la región. Los resultados tabulados de este instrumento revelaron que el 45% de los encuestados reportó haber interactuado o detectado perfiles falsos y publicaciones engañosas. Esta vulnerabilidad estructural del entorno informal se traduce en problemas tangibles y cotidianos: pérdida de tiempo al contactar números telefónicos inexistentes, fricción comercial por productos que ya fueron vendidos pero continúan publicados, o en el escenario más crítico, la exposición directa a estafas mediante solicitudes de depósitos previos sin garantías de entrega, una práctica reportada frecuentemente en la ciudad de Huamanga. 

3. **Experiencia de Usuario (UX) Deficiente** Las herramientas actuales carecen de las funcionalidades mínimas de un marketplace estructurado. La búsqueda de bienes con características precisas por ejemplo: "Toyota Yaris 2018 mecánico en Ayacucho" resulta ineficaz. Los usuarios no cuentan con filtros por categoría, rango de precios, ni geolocalización precisa dentro de la región. Esto frustra la experiencia del usuario, desincentiva el consumo interno y, frecuentemente, deriva en el abandono de la compra o la fuga de capital hacia plataformas de la capital. 

La ausencia de una plataforma web dedicada y estructurada para Ayacucho genera consecuencias negativas tangibles tanto para la economía local como para la sociedad: 

12 

- **Limitación del Alcance Económico:** Los microempresarios y vendedores ocasionales pierden oportunidades de venta al no poder mostrar sus productos en un escaparate digital permanente y ordenado. 

- **Ineficiencia en el Mercado:** Los compradores invierten tiempos excesivos buscando productos o servicios, lo que desincentiva el consumo local y, en ocasiones, deriva en la compra en plataformas de Lima (Mercado Libre), fugando capital de la región. 

- **Inseguridad Digital:** La persistencia de transacciones en entornos no regulados facilita la proliferación de fraudes, ya que no hay mecanismos de reputación ni moderación local efectiva. 

Ante este escenario, se identifica la necesidad urgente de una solución tecnológica que, aprovechando la alta penetración de internet móvil en la región, ofrezca un entorno estructurado, seguro y usable. La propuesta no pretende competir con los gigantes globales, sino ofrecer una solución de nicho, adaptada a la geografía y realidad socioeconómica de Ayacucho, utilizando tecnologías modernas (React y Node.js) que garanticen rapidez y escalabilidad. 

En este sentido expuesto, se formula la siguiente interrogante principal que guió la investigación: ¿Cuáles son los resultados del desarrollo de una plataforma web de anuncios clasificados de bienes, servicios y oportunidades locales para la región de Ayacucho, 2025? 

## **1.2. Formulación del Problema** 

## _**1.2.1. Problema General**_ 

¿Cuáles son los resultados del desarrollo de una plataforma web de anuncios clasificados de bienes, servicios y oportunidades locales para la región de Ayacucho, 2025? 

## _**1.2.2. Problemas específicos**_ 

- a. ¿Cuáles son los resultados de la fase de análisis del desarrollo de la plataforma web de anuncios clasificados para la región de Ayacucho, 2025? 

- b. ¿Cuáles son los resultados de la fase de diseño del desarrollo de la plataforma web de anuncios clasificados para la región de Ayacucho, 2025? 

- c. ¿Cuáles son los resultados de la implementación del desarrollo de la plataforma web de anuncios clasificados para la región de Ayacucho, 2025? 

- d. ¿Cuáles son los resultados de la validación del correcto funcionamiento de los módulos principales de la plataforma web? 

13 

- e. ¿ Cuál es el nivel de usabilidad de la plataforma web desarrollada, tras ser evaluada por los usuarios piloto? 

## **1.3. Objetivos** 

## _**1.3.1. Objetivo General**_ 

Desarrollar una plataforma web de anuncios clasificados de bienes, servicios y oportunidades locales para la región de Ayacucho, con el propósito de facilitar la conexión entre compradores y vendedores, promoviendo así la economía local y mejorando el acceso a ofertas y demandas en la zona. 

## _**1.3.2. Objetivos Específicos**_ 

- a. Determinar los resultados de la fase de análisis del desarrollo de la plataforma web de anuncios clasificados para la región de Ayacucho, 2025. 

- b. Determinar los resultados de la fase de diseño del desarrollo de la plataforma web de anuncios clasificados para la región de Ayacucho, 2025. 

- c. Determinar los resultados de la fase de implementación del desarrollo de la plataforma web de anuncios clasificados para la región de Ayacucho, 2025. 

- d. Validar el correcto funcionamiento de los módulos principales de la plataforma web. 

- e. Evaluar la usabilidad de la plataforma web desarrollada mediante la participación de los usuarios piloto. 

## **1.4. Hipótesis** 

En el ámbito de la investigación científica, la formulación de hipótesis no constituye un requisito universal y obligatorio, sino que obedece estrictamente al propósito y alcance inicial del estudio. De acuerdo con Hernández-Sampieri et al. (2014), las hipótesis son inherentes a las investigaciones cuantitativas cuyos enfoques son correlacionales o explicativos. En el caso de los estudios con alcance descriptivo, la formulación de hipótesis solo es pertinente si el investigador tiene la intención de pronosticar un dato, figura o hecho específico. 

Esta perspectiva metodológica es respaldada por Bernal (2016), quien sostiene que la investigación de tipo descriptivo no requiere comprobar una suposición estructurada mediante 

14 

una hipótesis. En su lugar, el rigor y la dirección del estudio se sostienen en las preguntas de investigación, las cuales se desprenden lógicamente del planteamiento del problema, los objetivos trazados y el marco teórico que fundamenta el proyecto. 

En coherencia con los lineamientos metodológicos citados, y dado que la presente investigación posee un nivel puramente descriptivo orientado a determinar los resultados del desarrollo tecnológico y evaluar el funcionamiento y usabilidad de una plataforma web, no se formuló una hipótesis de investigación. El desarrollo del estudio y la validación de sus resultados estan guiados íntegramente por el cumplimiento de los objetivos específicos planteados. 

## **1.5. Justificación y Delimitación de la Investigación** 

## _**1.5.1 Importancia**_ 

La presente investigación reviste una importancia significativa al proponer una solución tecnológica que moderniza la infraestructura comercial digital de la región. En un contexto donde la transformación digital es irreversible, dotar a Ayacucho de una plataforma propia significa dar un paso hacia la formalización del comercio electrónico local. El proyecto trasciende el ejercicio académico para convertirse en una herramienta de utilidad pública que centraliza la oferta y demanda, reduciendo la brecha tecnológica que separa a la región de la capital. 

## _**1.5.2. Justificación**_ 

**1.5.2.1. Justificación Social.** Socialmente, la investigación busca mejorar la calidad de vida de los ciudadanos al ofrecer un entorno digital más seguro y organizado. Al implementar filtros de categorización y búsqueda, se democratiza el acceso a la información, permitiendo que usuarios con diferentes niveles de habilidades digitales encuentren lo que necesitan sin frustración. Además, al centralizar los anuncios en un entorno validado, se contribuye a mitigar el riesgo de estafas comunes en redes sociales, promoviendo una cultura de confianza digital en la comunidad ayacuchana. 

**1.5.2.2 Justificación Económica.** El impacto económico es directo y tangible. La plataforma actúa como un catalizador para la economía local, reduciendo los "costos de transacción" (tiempo y dinero) asociados a la búsqueda de información. Para las Micro y Pequeñas Empresas (MYPEs) y emprendedores de Ayacucho, esta plataforma representa un 

15 

canal de venta gratuito o de bajo costo con mayor alcance y permanencia que las redes sociales. Al facilitar el encuentro entre oferta y demanda dentro de la misma región, se fomenta el consumo interno y la circulación de capital dentro de Ayacucho. 

**1.5.2.3. Justificación técnica.** Desde la perspectiva de la Ingeniería de Sistemas, este proyecto se justifica por la implementación de una arquitectura de software moderna y robusta. A diferencia de las soluciones genéricas, el desarrollo a medida utilizando el stack MERN/PERN (adaptado con React.js en el frontend y Node.js en el backend) permite crear una _Single Page Application_ (SPA) de alto rendimiento, garantizando tiempos de carga mínimos y una experiencia de usuario fluida, superior a la navegación en sitios web tradicionales. 

Asimismo, el uso de MySQL como gestor de base de datos relacional asegura la integridad y consistencia de la información transaccional de los anuncios y usuarios. La aplicación de la metodología ágil Scrum justifica el enfoque de mejora continua, permitiendo que el software evolucione mediante iteraciones que responden a las necesidades reales detectadas durante el desarrollo. 

## _**1.5.3. Delimitación**_ 

**1.5.3.1. Delimitación Espacial.** El estudio y la implementación del software se circunscriben geográficamente a la región de Ayacucho, provincia de Huamanga, enfocándose en usuarios residentes en esta zona para garantizar la relevancia local de los anuncios. 

**1.5.3.2. Delimitación Temporal.** La investigación abarca el periodo del año 2025, considerando las fases de análisis, diseño, desarrollo y validación de la plataforma. 

**1.5.3.3. Delimitación Temática.** El proyecto se enmarca en la línea de investigación de Ingeniería de Software y Sistemas de Información, específicamente en el desarrollo de aplicaciones web y tecnologías de comercio electrónico. 

## _**1.5.4. Limitaciones**_ 

A pesar de la planificación rigurosa y el sustento teórico del proyecto, se reconocen ciertas restricciones de carácter técnico, metodológico y contextual que delimitan el alcance del presente estudio: 

## **1.5.4.1. Alcance funcional acotado al MVP:** El desarrollo del software se enfoca 

estrictamente en la entrega de un Producto Mínimo Viable con las funcionalidades 

16 

esenciales (registro, publicación y búsqueda de clasificados). Quedan fuera del alcance de esta investigación características avanzadas como pasarelas de pago integradas, chat interno en tiempo real o el desarrollo de una aplicación móvil nativa. 

- **1.5.4.2. Validación en entorno controlado con muestra reducida.** Las pruebas funcionales y de aceptación (encuestas) se aplican a un grupo piloto limitado de 20 sujetos. Al realizarse en condiciones de laboratorio o mediante sesiones guiadas, los resultados podrían no reflejar en su totalidad el comportamiento espontáneo y masivo de los usuarios. 

- **1.5.4.3. Ausencia de validación en entorno real de producción.** La plataforma ha sido desarrollada y evaluada en un entorno local y controlado para fines de la investigación. Durante este periodo, no se realizará un despliegue público masivo ni se medirá el rendimiento del servidor frente a tráfico real o picos de concurrencia en la región. 

- **1.5.4.4. Dependencia de tecnologías en constante evolución.** El _stack_ tecnológico utilizado (React.js, Node.js y MySQL) se encuentra en permanente actualización. El código y la arquitectura generados corresponden al estado y versiones de estas herramientas en el año de desarrollo, lo que eventualmente podría requerir refactorización futura para mantener su compatibilidad. 

- **1.5.4.5. Brecha digital y resistencia al cambio:** Se prevé la existencia de una curva de aprendizaje, especialmente en usuarios habituados a la inmediatez e informalidad de plataformas generalistas (como Facebook Marketplace) o en ciudadanos con menor alfabetización digital, quienes podrían percibir el registro estructurado como una barrera inicial. 

- **1.5.4.6. Dependencia de la infraestructura de conectividad:** La experiencia final del usuario está subordinada a la calidad del servicio de internet de los proveedores locales en Ayacucho. Las posibles fallas de red, latencia o cortes en zonas periféricas escapan al control de esta investigación y pueden afectar la percepción de funcionamiento del sistema. 

17 

## **Capitulo II** 

## **Marco Teórico** 

## **2.1. Antecedentes de la Investigación** 

## _**2.1.1. Antecedentes Nacionales**_ 

En el contexto peruano, diversos autores han propuesto soluciones tecnológicas para descentralizar el comercio electrónico y potenciar los servicios profesionales. 

Chavez Minaya (2024), en su tesis _"Implementación de un sitio web de comercio electrónico para mejorar las ventas en La Tienda Switech – Huaraz; 2024"_ , sustentada en la Universidad Católica Los Ángeles de Chimbote (ULADECH), abordó la problemática de la comercialización informal y la desorganización de la información en un contexto provincial. Mediante un nivel descriptivo de corte transversal y la aplicación de cuestionarios a una muestra piloto, el autor evidenció que más del 72% de los usuarios requieren urgentemente de un ecosistema digital formalizado. El estudio concluyó que la implementación de una arquitectura web centralizada mejora significativamente el control y la satisfacción de los clientes. Este trabajo guarda una estrecha relación con el presente proyecto, ya que demuestra el alto impacto de la inserción de plataformas de comercio digital en realidades demográficas provinciales (como Huaraz) que comparten similitudes socioeconómicas con la región de Ayacucho. 

Orihuela Sucasaire (2024), en su investigación titulada "Uso de plataforma Marketplace Facebook y su impacto en las ventas personales", presentada en la Universidad Peruana Unión (UPeU), tuvo como objetivo evaluar las dimensiones de interacción comercial y las limitaciones dentro del ecosistema de Meta. El estudio, enfocado en las plataformas de comercio electrónico C2C en la era digital, analizó cómo las características estructurales de esta red social interactúan con las ventas personales. Este antecedente resulta fundamental para la presente investigación, ya que diagnostica empíricamente el entorno informal de Facebook Marketplace, justificando así la necesidad metodológica y tecnológica de migrar hacia una plataforma web propia, segura y estructurada  que mitigue las fricciones comerciales derivadas de las redes sociales. 

Encalada y Gómez (2022), en su tesis titulada _"Profesionales Perú: Plataforma digital para publicar anuncios de servicios profesionales y oficios"_ , presentan una solución tecnológica para fortalecer los vínculos laborales a través de una plataforma web y móvil. 

18 

Este sistema permite a los profesionales y técnicos publicar anuncios sobre los servicios que ofrecen, facilitando su visibilidad y conexión con potenciales clientes. Además, la investigación incluyó un análisis de mercado y una evaluación financiera, lo que permitió determinar la viabilidad, rentabilidad y sostenibilidad del modelo de negocio propuesto. Este estudio resalta la importancia del uso de herramientas digitales en la dinamización del mercado laboral, brindando una alternativa accesible y eficiente para la oferta y demanda de servicios profesionales. 

Sánchez y Vergara (2021), en su tesis titulada "Plataforma digital y su influencia en la distribución de multiservicios profesionales", desarrollaron e implementaron una plataforma web denominada " _ContactMe_ ", con el objetivo de optimizar la conexión entre proveedores de servicios y clientes. La investigación, de tipo aplicada, empleó técnicas como encuestas y observación no participante para evaluar el nivel de adopción e impacto de la herramienta. El estudio concluyó que la aplicación cumplió con los requerimientos funcionales y no funcionales previamente definidos y logró una satisfacción de uso superior al 80%, evidenciando así una influencia positiva en la estructuración de los servicios profesionales. 

## _**2.1.2. Antecedentes internacionales**_ 

En el ámbito internacional, se han identificado estudios que validan la necesidad de plataformas de intermediación digital para dinamizar economías locales. 

Pastor (2024), en su trabajo de fin de grado _“Desarrollo de una  plataforma de anuncios clasificados BEEFRIP”_ se centra en la creación de una plataforma de anuncios clasificados con el objetivo de facilitar la publicación, búsqueda y mejorar la  visibilidad  de servicios y negocios, dentro de su trabajo contempla  los procesos desde que los empresarios puedan acceder a capital y talento, asi como la masificación de la red de contactos de los profesionales, hasta la creación de tiendas para la venta de productos. Estas gestiones le han permitido a BEEFRIP  ser una solución segura e innovadora que se adapta a las necesidades actuales  del mercado. 

Calvache (2023), en su trabajo de integración curricular titulado " _Implementación de una página web para la promoción y gestión de arriendos en la ciudad de Guaranda”_ , año 2023", desarrolló una plataforma digital con el propósito de facilitar la búsqueda y oferta de alojamientos. La metodología utilizada se basó en la retroalimentación continua del usuario final, enfocándose en la comunidad de la Universidad Estatal de Bolívar, la cual alberga un gran número de estudiantes foráneos que enfrentan dificultades para encontrar vivienda 

19 

acorde a sus necesidades. La plataforma permite publicar y buscar alojamientos de manera accesible desde cualquier dispositivo y ubicación. Como resultado, se concluyó que la implementación de esta herramienta mejoró significativamente la experiencia de búsqueda de alojamiento para los estudiantes, al tiempo que benefició a los propietarios al optimizar la difusión de sus ofertas y generar ingresos adicionales de forma eficiente. 

Asimismo, en el año 2016, Edison Alexander Rojas León presentó en la Universidad Nacional de Loja su tesis titulada _Desarrollo de una aplicación web para anuncios clasificados de productos y servicios para la ciudadanía lojana, utilizando herramientas libres_ . En este trabajo, el autor buscó responder a la necesidad de contar con un espacio digital confiable que permitiera a los ciudadanos publicar y consultar anuncios de manera organizada. La propuesta se apoyó en tecnologías de software libre, lo que redujo costos y facilitó la adaptación a las necesidades locales. Los resultados mostraron que la aplicación mejoró la visibilidad de los anuncios y fortaleció la interacción entre oferentes y demandantes, constituyéndose en una alternativa tecnológica frente a los medios tradicionales de difusión. Este antecedente es relevante porque demuestra la viabilidad de implementar soluciones web para la gestión de clasificados, aportando un modelo replicable en otros contextos donde se busca formalizar y optimizar el comercio digital. 

## **2.2. Marco teórico** 

## _**2.2.1. Página Web**_ 

Una página web es un documento accesible a través de Internet o la World Wide Web (WWW), desarrollado con un lenguaje de programación específico, como HTML, que sigue estándares determinados. Aunque su uso es común en la actualidad, muchas personas desconocen su funcionamiento técnico. 

El acceso a estos sitios se realiza mediante navegadores web, los cuales interpretan el código del documento y presentan la información visualmente al usuario. En una página web es posible encontrar textos, imágenes, enlaces a otros sitios, así como elementos interactivos como animaciones y sonidos. 

Para estar disponible en línea, una página web necesita un espacio de almacenamiento donde alojarse. Cuando un usuario solicita acceder a ella, el contenido se carga desde un servidor web o host, que actúa como un ordenador de gran capacidad encargado de distribuir 

20 

la información a través de la red. Este servicio de almacenamiento se conoce como hosting (Begoña, 2019 ). 

## _**2.2.1.1. Tipos de Páginas Web**_ 

Existen principalmente dos tipos de páginas web: estáticas y dinámicas. Las páginas estáticas, más comunes en etapas anteriores de la web, presentan contenido fijo que no permite actualizaciones frecuentes. Por otro lado, las páginas dinámicas pueden desarrollarse en HTML u otros lenguajes como PHP, lo que facilita la interacción en tiempo real. Este tipo de páginas es ideal para sitios que requieren actualizaciones constantes y participación activa de los usuarios, como los foros en línea (Begoña, 2019). 

## _**2.2.1.2. Pagina web Estática**_ 

Según (Lopez, 2021) una página web estática se caracteriza por tener un contenido fijo que no cambia a menos que se modifique manualmente el código fuente. Cada página se compone de archivos HTML individuales que son almacenados en un servidor y entregados al navegador sin alteraciones. Su estructura incluye elementos básicos como textos, imágenes y formularios, permitiendo una interacción limitada. Aunque su desarrollo es más simple en comparación con un sitio web dinámico, su funcionalidad es menor, ya que muestra siempre la misma información hasta que se realicen cambios manuales en su código. 

## **Tabla 1** 

_Ventajas y Desventajas de una Página web Estática_ 

|Aspecto|Ventajas|Desventajas|
|---|---|---|
|Costo|El costo inicial es menor que el|El mantenimiento puede generar|
||de una página web dinámica.|costos adicionales si se requiere|
|||actualizar contenido.|
|Desarrollo|Menor complejidad y tiempo de|Agregar nuevas páginas o|
||desarrollo, ya que no requiere|funcionalidades puede ser más|
||bases de datos ni lenguajes de|difícil y requerir más tiempo.|
||programación avanzados.||
|Flexibilidad|Cada página puede tener un|Mantener una coherencia visual|
|en diseño|diseño diferente sin necesidad de|puede ser más complicado si|
||seguir una plantilla única.|cada página es diseñada de|
|||manera independiente.|



21 

|Velocidad de|Carga rápida, ya que no ejecuta|Puede aumentar el tiempo de|
|---|---|---|
|carga|scripts ni consultas a bases de|carga si se utilizan herramientas|
||datos.|modernas como generadores de|
|||sitios web estáticos o redes de|
|||distribución de contenido|
|||(CDN).|
|Actualización|No requiere sistemas de gestión|Actualizar el contenido puede ser|
|de contenido|de contenido (CMS), lo que evita|difícil para usuarios sin|
||vulnerabilidades de seguridad.|conocimientos técnicos en|
|||HTML y CSS.|



_Nota_ : La tabla fue recopilado de: https://openwebinars.net/ 

Según Herrera (2023), una página web estática consiste en un conjunto de páginas cuyo contenido permanece invariable en cada acceso de los usuarios. En comparación con un sitio web dinámico, su desarrollo es más rápido y sencillo, aunque presenta una interactividad reducida.Estos sitios pueden diseñarse utilizando únicamente HTML, CSS y JavaScript, sin necesidad de emplear lenguajes de programación del lado del servidor, como PHP. Aunque su funcionalidad es limitada, resultan una opción ideal para ciertos propósitos específicos, como la creación de portafolios. 

Ambas definiciones coinciden en que una página web estática mantiene un contenido fijo que solo cambia cuando se modifica manualmente el código fuente. Mientras que López (2021) enfatiza la estructura de estos sitios, destacando su composición de archivos HTML individuales y sus elementos básicos, Herrera (2023) resalta su rapidez y facilidad de creación en comparación con las páginas dinámicas. Además, Herrera menciona el uso de tecnologías como HTML, CSS y JavaScript sin la necesidad de lenguajes del lado del servidor, lo que refuerza la idea de su simplicidad y su idoneidad para casos específicos como portafolios. 

## _**2.2.1.3. Pagina web Dinámica**_ 

Según (Lopez, 2021) Una página web dinámica se caracteriza por su interactividad y funcionalidad, a diferencia de las páginas estáticas que son mayormente informativas. Para lograrlo, utiliza lenguajes de programación y bases de datos que permiten que los usuarios interactúen con la información presentada. Su funcionamiento se basa en dos tipos de programación: front-end, que usa JavaScript ejecutado en el navegador, y back-end, que 

22 

emplea lenguajes como PHP, Python o ASP.Net en el servidor. Tras procesar las solicitudes del usuario, el servidor genera una respuesta en HTML que se muestra en el navegador. Aunque su desarrollo es más complejo, las páginas dinámicas son más versátiles en términos de funcionalidad. 

## **Tabla 2** 

_Ventajas y Desventajas de una Página web Dinámica_ 

|Aspecto|Ventajas|Desventajas|
|---|---|---|
|Gestión de|Permite manejar datos de|El diseño puede verse limitado por|
|información|manera organizada|la estructura de la base de datos.|
||mediante bases de datos.||
|Flexibilidad del|Se puede gestionar el|Dependiendo del CMS, puede ser|
|contenido|contenido a través de un|difícil crear múltiples diseños o|
||CMS, facilitando la|plantillas.|
||administración.||
|Costo de|Es menor, ya que los|Los costos iniciales de desarrollo|
|mantenimiento|cambios pueden|pueden ser elevados debido a la|
||realizarse sin alterar el|implementación de bases de datos|
||diseño o la funcionalidad|y funcionalidades avanzadas.|
||base.||
|Personalización|Posibilita mostrar|Puede requerir conocimientos|
||contenido adaptado al|técnicos avanzados para|
||usuario según sus|modificaciones complejas.|
||preferencias.||



_Nota_ : La tabla fue recopilado de: https://openwebinars.net/ 

Según Mora (2024), una página web dinámica adapta su contenido en función de distintos factores, como la ubicación del usuario, la zona horaria, el idioma preferido o su historial de interacción en el sitio. Para lograr esta flexibilidad, estas páginas emplean lenguajes de programación del lado del servidor, los cuales se conectan a una base de datos para ofrecer funcionalidades interactivas y modificar el contenido de manera dinámica. Entre sus aplicaciones más comunes se encuentran los foros, las redes sociales y las plataformas de comercio electrónico. 

Las páginas web dinámicas han revolucionado la forma en que los usuarios interactúan con la información en línea, ofreciendo contenido adaptable y funciones interactivas. Según López (2021) y Mora (2024), estas páginas utilizan lenguajes de programación tanto en el cliente como en el servidor, junto con bases de datos, para modificar la información en función de diversos factores, como la ubicación, el idioma y el historial de navegación del 

23 

usuario. Su versatilidad las hace esenciales en plataformas como redes sociales, foros y sitios de eCommerce. Aunque su desarrollo es más complejo que el de las páginas estáticas, su capacidad de personalización y actualización en tiempo real las convierte en una herramienta clave en el entorno digital actual. 

## _**2.2.2. Aplicaciones de Página Única (SPA)**_ 

En la evolución de la ingeniería web, la arquitectura de Aplicación de Página Única (SPA, por sus siglas en inglés _Single Page Application_ ) representa un cambio de paradigma respecto a las aplicaciones web tradicionales o de múltiples páginas (MPA). Según Mikowski y Powell (2014), una SPA se define como una aplicación web que entrega al usuario una experiencia fluida y similar a la de una aplicación de escritorio, cargando una única página HTML (conocida como _shell_ o caparazón) y actualizando dinámicamente el contenido conforme el usuario interactúa con la interfaz, sin necesidad de recargar la página completa en cada solicitud. 

El funcionamiento técnico de una SPA se basa en el traslado de la lógica de presentación del servidor al cliente (navegador). Flanagan (2020) explica que, en lugar de recibir documentos HTML completos del servidor ante cada clic, el navegador carga inicialmente los recursos estáticos (HTML, CSS y JavaScript base) una sola vez. Posteriormente, las interacciones del usuario disparan solicitudes asíncronas (usualmente mediante AJAX o Fetch API) que únicamente transfieren datos en formato JSON. El motor de JavaScript del navegador toma estos datos y actualiza el Modelo de Objetos del Documento (DOM) en tiempo real. 

Esta arquitectura ofrece ventajas significativas para el desarrollo de plataformas interactivas como la propuesta en esta investigación. Banks y Porcello (2020) destacan que las SPA reducen drásticamente el consumo de ancho de banda tras la carga inicial y mejoran la "sensación de velocidad" (performance percibida), ya que la interfaz reacciona casi instantáneamente. Sin embargo, también señalan desafíos, como la necesidad de gestionar el enrutamiento ( _routing_ ) desde el lado del cliente y optimizar el código para asegurar que los motores de búsqueda puedan indexar el contenido correctamente (SEO), aspectos que librerías modernas como React.js gestionan mediante el uso del _Virtual DOM_ . 

## _**2.2.3. Comercio Electrónico**_ 

El comercio electrónico ( _e-commerce_ ) ha trascendido su definición inicial de venta por internet para convertirse en un ecosistema complejo de interacciones digitales. Laudon y 

24 

Traver (2021) definen el comercio electrónico como el uso de Internet, la Web y aplicaciones móviles para realizar transacciones comerciales. A diferencia del comercio tradicional, este modelo elimina las barreras temporales y espaciales, permitiendo la "ubicuidad"; es decir, la capacidad de comprar y vender en cualquier momento y desde cualquier lugar, lo que reduce significativamente los costos de transacción para los participantes del mercado. 

## _**2.2.3.1. Modelo C2C (Consumidor a Consumidor)**_ 

Dentro de las categorías del comercio electrónico, el presente estudio se enmarca en el modelo Consumidor a Consumidor (C2C). Según Chaffey y Ellis-Chadwick (2019), el modelo C2C se caracteriza por facilitar transacciones comerciales directamente entre particulares, donde la plataforma digital no actúa como vendedor ni propietario de los bienes, sino como un intermediario tecnológico que provee la infraestructura, las reglas de negocio y los mecanismos de confianza necesarios para que la transacción ocurra. 

Este modelo es particularmente relevante para la venta de bienes de segunda mano, servicios freelance y alquileres locales. Turban et al. (2018) explican que el éxito de un modelo C2C depende críticamente de la "masa crítica" de usuarios y de la capacidad del sistema para gestionar la reputación y la búsqueda de información. En el contexto de esta investigación, la plataforma web propuesta actúa como el _market maker_ (creador de mercado) digital para la región de Ayacucho, formalizando las interacciones que actualmente ocurren de manera dispersa en redes sociales y permitiendo que los ciudadanos moneticen sus activos o habilidades sin la necesidad de constituir una empresa formal. 

## _**2.2.4. Anuncios Clasificados Digitales**_ 

Los anuncios clasificados digitales representan la evolución tecnológica de los tradicionales avisos breves en prensa escrita. Según Strauss y Frost (2016), se definen como mensajes publicitarios estructurados, generalmente cortos y agrupados por categorías específicas (bienes raíces, automotriz, empleos, servicios), diseñados para conectar directamente a ofertantes y demandantes en un entorno online. A diferencia de la publicidad _display_ (banners), los clasificados son proactivos: el usuario acude a ellos intencionalmente buscando solucionar una necesidad específica. 

La migración de este formato al entorno web ha transformado su dinámica. Laudon y Traver (2021) señalan que la principal ventaja de los clasificados digitales sobre sus contrapartes impresas es la capacidad de búsqueda y filtrado. Mientras que en el papel el usuario debía escanear visualmente columnas de texto, las plataformas digitales permiten 

25 

indexar el contenido mediante metadatos (precio, ubicación, fecha, condición), facilitando la recuperación instantánea de información relevante. 

Además, este formato ha democratizado la publicidad local. Kotler, Kartajaya y Setiawan (2021), en su análisis sobre la economía digital, destacan que las plataformas de clasificados empoderan al consumidor (modelo C2C), permitiéndole convertirse en vendedor con barreras de entrada casi nulas. En el contexto de esta investigación, los anuncios clasificados no son solo texto; se enriquecen con elementos multimedia (fotografías de alta resolución, ubicación GPS), lo que reduce la incertidumbre del comprador y acelera la toma de decisiones. 

## _**2.2.5. Framework Scrum**_ 

Scrum es un marco de trabajo ágil para el desarrollo de productos, servicios u otro entregable, aplicable para proyectos de cualquier complejidad e industria. Diseñado para ofrecer valor de forma rápida a lo largo del proyecto (SCRUMstudy, 2022). 

"Scrum es un marco de trabajo y no pretende ser prescriptivo, lo cual significa que hay espacio para la flexibilidad en su aplicación" (SCRUMstudy, 2022, p. 25). 

## _**2.2.5.1 Principios de Scrum**_ 

Según SCRUMstudy (2022), Scrum cuenta con 6 lineamientos básicos y estos deben cumplirse para garantizar la aplicación efectiva del marco de trabajo. A continuación se detalla cada principio: 

1. Control del proceso empírico: indica que ante problemas o soluciones no definidas se aprende por medio de la experimentación. Se basa en 3 ideas principales: 

   - Transparencia: promueve el acceso fácil y transparente a la información. Se refleja mediante la socialización de la visión del proyecto para todos los interesados, un backlog priorizado, cronogramas de liberación, reuniones de planificación del sprint, daily standups, reuniones de revisión y retrospectiva del sprint. 

   - Inspección: es representado por el uso de radiadores de información que visibilizan el progreso del equipo, retroalimentación constante de los stakeholders, validación y aprobación de entregables por el product owner y el cliente. 

26 

   - Adaptación: el equipo Scrum e interesados se adaptan a realizar mejoras según el avance del desarrollo del producto. Se identifican riesgos que son entradas para el refinamiento o creación del backlog priorizado del producto. En la retrospectiva se documentan lecciones aprendidas y se buscan oportunidades de mejora. 

2. Autoorganización: equipos con sentido de compromiso y responsabilidad que se auto organizan ofrecen mucho más valor, valor que es reflejado en la entrega de resultados. 

3. Colaboración: fomenta la creación de valor compartido. El equipo trabaja interactúa entre sí y con el cliente e interesados para crear y validar entregables. 

4. Priorización basada en valor: busca ofrecer el máximo valor al negocio en el menor tiempo posible. Una herramienta clave para este principio es la priorización basada en valor, incertidumbre y dependencias. 

5. Time-boxing: práctica que consiste en la asignación de un intervalo de tiempo para cada proceso dentro del proyecto. Time-boxes en Scrum: 

   - Sprint: una a cuatro semanas de duración. La duración debe ser lo más corta posible pero lo suficientemente extensa para el desarrollo de actividades que permitan realizar una entrega de valor. 

   - Planificación de sprint: dos horas por cada semana de duración del sprint. 

   - Daily Standup: 15 minutos diarios. 

   - Revisión de sprint: una hora por cada semana de duración del sprint. 

   - Retrospectiva del sprint: una hora por cada semana de duración del sprint. 

6. Desarrollo iterativo: el desarrollo iterativo de entregables es flexible a que los cambios sugeridos por el cliente puedan ser incluidos en el proyecto y posibilita la corrección del rumbo del proyecto. 

## _**2.2.5.2. Roles de Scrum**_ 

SCRUMstudy (2022), señala que los roles de Scrum se dividen en 2 categorías, se detallan a continuación: 

1. Roles principales: roles obligatorios para la creación del proyecto, son los responsables del cumplimiento de los objetivos del proyecto. Estos son: 

   - Product Owner: responsable de aterrizar los requerimientos del cliente. 

   - Scrum Master: vela por el bienestar del equipo, libera impedimentos y guía al equipo en la aplicación de las prácticas de Scrum. 

27 

- Equipo Scrum: grupo de personas responsables de entender y crear los 

   - entregables del proyecto. 

## **Figura 1** 

_Roles principales de Scrum_ 

_Nota_ . Tomado de Guía de fundamentos de Scrum (Guía del SBOK)-Cuarta edición 

- (p.43), por SCRUMstudy, 2022, SCRUMstudy. 

   2. Roles secundarios: son roles opcionales, no tienen responsabilidad directa en el éxito del proyecto. Entre los roles secundarios se encuentran los interesados del negocio (clientes, usuarios y patrocinadores), el Scrum Guidance Body (documentos o expertos que actúa como consultoría sobre las prácticas organizacionales relacionadas a Scrum) y proveedores. 

## _**2.2.5.3. Fases y procesos de Scrum**_ 

Según SCRUMstudy (2022), Scrum tiene cinco fases que agrupan diecinueve procesos iterativos. En la tabla 1 se visualiza la relación entre fase y procesos. 

28 

## **Tabla 3** 

_Procesos fundamentales de Scrum_ 

|**Capitulo**|**Fase**|**Procesos fundamentales de Scrum**|
|---|---|---|
|||1. Crear la visión del proyecto|
|||2. Identificar al Scrum Master y a los interesados|
|||del negocio|
|8|Inicio|3. 3. Formar Equipos Scrum|
|||4. Desarrollar épicas|
|||5. Crear el backlog priorizado del producto|
|||6. Realizar la planificación de la liberación|
|||7. Crear historias de usuario|
|||8. Estimar historias de usuario|
|9|Planificación y|9. Comprometer historias de usuario|
||estimación|10. Identificar tareas|
|||11. Estimar tareas|
|||12. Actualizar el backlog del sprint|
|||13. Crear entregables|
|10|Implementación|14. Realizar el Dayli Standup|
|||15. Refinar el backlog priorizado del producto|
|11|Revisión y|16. Demostrar y validar el sprint|
||retrospectiva|17. Retrospectiva del sprint|
|12|Liberación|18. Enviar entregables|
|||19. Retrospectiva de la liberación|



_Nota_ . Tomado de Guía de fundamentos de Scrum (Guía del SBOK)-Cuarta edición 

- (p.15), por SCRUMstudy, 2022. 

De acuerdo a lo mencionado por SCRUMstudy (2022), a continuación se brinda el detalle de cada fase: 

1. Inicio: inicia con la identificación del product owner (PO), el PO elabora la visión del proyecto, se identifica al Scrum Master (SM) y stakeholders, se forma el equipo Scrum, a partir de la visión se crean los requerimientos iniciales, estos se priorizan, se genera un primer backlog y un cronograma de liberación. El objetivo es contar con un 

29 

plan inicial de proyecto, esta fase debe ser breve a fin de iniciar lo antes posible con la creación y entrega de valor. 

2. Planificación y estimación: se inicia con los ciclos iterativos del sprint. Al inicio del sprint el PO con el apoyo del SM escribe las historias de usuario (HU). El equipo Scrum estima, se compromete con la entrega de HU y finalmente agrega y estima (opcional) tareas en el backlog del sprint. 

3. Implementación: es la segunda fase iterativa del sprint, fase en la cual se realiza la mayor parte del trabajo y consume la mayor parte del tiempo del sprint. En esta fase se contempla la ejecución de tareas y/o actividades para la creación de entregables de la HU. En esta fase el PO refina el backlog priorizado del producto. 

4. Revisión y retrospectiva: tercera fase iterativa del sprint. Después de culminada la fase de implementación el PO y otros interesados del negocio validan los entregables. El PO evalúa que cada HU cumpla con los criterios de aceptación definidos. Finalmente el equipo Scrum y SM revisan las lecciones aprendidas y oportunidades de mejora. 

5. Liberación: liberación de entregables aceptados y retrospectiva de liberación. 

## **Figura 2** 

_Flujo de Scrum en un sprint_ 

- _Nota_ . Tomado de Guía de fundamentos de Scrum (Guía del SBOK)-Cuarta edición 

- (p.1), por SCRUMstudy, 2022, SCRUMstudy. 

30 

## _**2.2.5.4. Reuniones de Scrum**_ 

SCRUMstudy (2022), afirma que para una implementación eficaz del marco de trabajo se deben llevar a cabo reuniones durante el proceso de Scrum. Las reuniones de Scrum son: 

1. Reunión de visión del proyecto: se identifica el contexto, requerimientos y expectativas del negocio. Tiene como finalidad crear la visión del proyecto. Participan los interesados del negocio, el Program Product Owner, Program Scrum Master y el Chief Product Owner 

2. Reuniones con grupos de usuarios: se recopila información sobre las expectativas del usuario, input para la creación de criterios de aceptación y desarrollo de épicas. Participa el PO e interesados del negocio relevantes. 

3. Reuniones de grupos de enfoque: sesión guida donde un grupo de personas brindan sus percepciones sobre un producto, servicio o resultado esperado. Se busca desarrollar épicas y crear historias de usuario. Participa el PO y grupo de usuarios. 

4. Reuniones de planificación de liberación: se desarrolla el cronograma inicial de liberación, cronograma susceptible a ajustes posteriores. Participan el PO, interesados del negocio y miembros del equipo Scrum. 

5. Reuniones de revisión del backlog priorizado del producto: asegurar que se tenga la información suficiente para el proceso de planificación y refinamiento del backlog priorizado del producto. Participa el PO e interesados del negocio. 

6. Reuniones de planificación del sprint: sesión en la que se planifica el trabajo a entregar como resultado del sprint. El equipo Scrum entiende, estima el esfuerzo para la entrega de HU y se compromete con ellas. Participan los roles principales de Scrum. 

7. Daily Standup: reunión diaria breve donde los miembros del equipo Scrum informan sobre las actividades realizadas el día anterior, lo que realizarán en el día del daily e impedimentos encontrados. Participan los roles principales de Scrum. 

8. Reunión de revisión del sprint: sesión en la que se demuestra y valida los entregables del sprint. Participan los roles principales de Scrum. 

9. Reunión de retrospectiva del sprint: el equipo Scrum revisa  y reflexiona sobre lo que salió bien y no salió bien en el sprint anterior. Se documentan las lecciones aprendidas. Participan el SM y el equipo Scrum. 

10. Reunión de retrospectiva de la liberación: sesión realizada luego de concluir con la entrega del proyecto. Se busca identificar, documentar e internalizar las lecciones aprendidas. Participan los interesados del negocio y equipo principal de Scrum. 

31 

## _**2.2.6. Entorno de Ejecución Node.js**_ 

Node.js representa un hito en el desarrollo web al permitir el uso de JavaScript fuera del navegador. Según Herron (2020), se define técnicamente como un entorno de ejecución ( _runtime environment_ ) multiplataforma de código abierto, construido sobre el motor de JavaScript V8 de Google Chrome. Esta característica es fundamental, ya que el motor V8 compila el código JavaScript directamente a código máquina nativo, otorgándole una velocidad de ejecución superior en comparación con lenguajes interpretados tradicionales. 

La arquitectura de Node.js difiere radicalmente de los modelos de servidor tradicionales basados en hilos ( _threads_ ). Cantelon et al. (2017) explican que Node.js opera sobre un único hilo de ejecución ( _single-threaded_ ) utilizando un modelo de entrada/salida (I/O) no bloqueante y orientado a eventos. 

En términos prácticos, esto significa que cuando la aplicación realiza una operación pesada (como consultar la base de datos MySQL para buscar anuncios), el servidor no se "congela" esperando la respuesta; en su lugar, delega la tarea y continúa procesando otras solicitudes de usuarios. Cuando la base de datos responde, una función de retorno ( _callback_ ) o una promesa reintroduce la tarea en el bucle de eventos ( _Event Loop_ ). 

Para el presente proyecto, el uso de Node.js se justifica por su capacidad para manejar un alto volumen de conexiones concurrentes con un consumo de recursos mínimo, lo cual es ideal para una plataforma de anuncios clasificados que requiere escalabilidad. Además, como señala Subramanian (2019), al utilizar JavaScript tanto en el _frontend_ (React) como en el _backend_ (Node.js), se unifica el lenguaje de desarrollo, facilitando el intercambio de datos en formato nativo JSON sin necesidad de conversiones costosas, optimizando así el rendimiento global del sistema. 

## _**2.2.7. Librería React.js y el Virtual DOM**_ 

React.js (o simplemente React) es una tecnología fundamental en el desarrollo de interfaces de usuario modernas. Banks y Porcello (2020) la definen técnicamente como una librería de JavaScript de código abierto creada por Facebook, centrada en la construcción de interfaces de usuario mediante una arquitectura basada en componentes. A diferencia de los enfoques tradicionales que separan las tecnologías por tipo de archivo (HTML para estructura, CSS para estilo, JS para lógica), React introduce el concepto de JSX, permitiendo encapsular la estructura y la lógica en pequeñas unidades reutilizables y autónomas llamadas componentes. 

32 

La innovación más disruptiva de React, y que justifica su elección para este proyecto, es el mecanismo del Virtual DOM (Modelo de Objetos del Documento Virtual). 

Según Boduch y Derks (2020), el DOM tradicional del navegador es costoso de manipular en términos de rendimiento; cada vez que se actualiza un dato (por ejemplo, al filtrar una lista de anuncios), el navegador debe recalcular el diseño y volver a pintar ( _repaint_ ) gran parte de la página, lo que genera lentitud. React soluciona esto manteniendo una copia ligera y en memoria del DOM real, conocida como Virtual DOM. 

El proceso de actualización, denominado Reconciliación, funciona de la siguiente manera: 

1. Cuando cambia el estado de un componente (ej. nuevos anuncios cargados), React crea un nuevo árbol de Virtual DOM. 

2. Un algoritmo de diferenciación ( _diffing algorithm_ ) compara este nuevo árbol con la versión anterior para detectar exactamente qué elementos han cambiado. 

3. Finalmente, React actualiza el DOM real del navegador modificando únicamente esos nodos específicos, sin recargar el resto de la interfaz. 

Para la plataforma de anuncios de Ayacucho, esto se traduce en una Experiencia de Usuario (UX) superior. Wieruch (2020) sostiene que esta eficiencia en el renderizado es crítica para aplicaciones ricas en datos, asegurando que la interacción (búsquedas, filtros, paginación) se sienta instantánea, incluso en dispositivos móviles con recursos limitados, optimizando el consumo de memoria y CPU del cliente. 

## 2.2.8 Gestor de Base de Datos MySQL 

MySQL es el sistema de gestión de bases de datos relacional (RDBMS) de código abierto más popular del mundo, ampliamente utilizado en el desarrollo de aplicaciones web robustas. Según Elmasri y Navathe (2016), un RDBMS organiza la información en tablas bidimensionales relacionadas entre sí mediante claves primarias y foráneas, utilizando el lenguaje estructurado de consultas (SQL) para la definición y manipulación de los datos. Esta estructura tabular es esencial para mantener el orden lógico de entidades con atributos fijos, como usuarios, categorías y detalles de anuncios. 

La elección de MySQL para esta investigación se fundamenta en su capacidad para garantizar la integridad transaccional a través del cumplimiento de las propiedades ACID (Atomicidad, Consistencia, Aislamiento y Durabilidad). 

33 

Schwartz, Zaitsev y Tkachenko (2012) explican que, gracias al motor de almacenamiento InnoDB (predeterminado en versiones modernas de MySQL), el sistema asegura que las transacciones complejas se completen totalmente o no se realicen en absoluto. Esto es crítico en un entorno de comercio electrónico C2C; por ejemplo, si un usuario elimina su cuenta, el sistema debe garantizar mediante restricciones de integridad referencial ( _CASCADE_ ) que sus anuncios activos también sean gestionados adecuadamente para evitar inconsistencias o "datos basura" en la plataforma. 

Además, MySQL ofrece una alta escalabilidad y rendimiento en entornos web. DuBois (2014) destaca que su arquitectura cliente-servidor está altamente optimizada para operaciones de lectura intensiva ( _SELECT_ ), lo cual coincide con el perfil de carga de un portal de clasificados donde la proporción de usuarios que buscan anuncios (lectura) es significativamente mayor que la de usuarios que publican (escritura). Su compatibilidad nativa con Node.js a través de drivers ( _mysql2_ o _Sequelize_ ) permite una integración fluida en el stack tecnológico del proyecto. 

## _**2.2.9. Calidad del Software**_ 

La calidad del software ya no es una ventaja competitiva, sino un requisito indispensable. Pressman y Maxim (2021) definen la calidad del software como el cumplimiento de los requisitos funcionales y de rendimiento explícitamente establecidos, así como de los estándares de desarrollo documentados. Para evaluar objetivamente estos atributos, la comunidad internacional se rige por la familia de normas ISO/IEC 25000, conocida como SQuaRE ( _System and software Quality Requirements and Evaluation_ ). 

## _**2.2.9.1. Modelo de Calidad del Producto (ISO/IEC 25010:2023)**_ 

La norma ISO/IEC 25010 sustituyó históricamente a la antigua ISO 9126, y en su más reciente actualización (Organización Internacional de Normalización, 2023), el modelo de calidad del producto se expandió y reestructuró para abordar los desafíos tecnológicos actuales. A diferencia de la versión del 2011, este modelo actualizado clasifica la calidad del producto en nueve características principales: adecuación funcional, eficiencia de desempeño, compatibilidad, capacidad de interacción, fiabilidad, seguridad, mantenibilidad, flexibilidad  y la nueva adición de safety seguridad física u operacional. 

Para efectos de esta investigación, y respondiendo a los objetivos específicos planteados para la evaluación del MVP, se priorizó la característica de Adecuación Funcional. De acuerdo con la versión 2023 de la norma, esta característica mantiene su definición central 

34 

y se conceptualiza como el grado en que un producto o sistema proporciona funciones que satisfacen las necesidades declaradas e implícitas al utilizarse bajo condiciones específicas. Se desglosa en las siguientes tres subcaracterísticas: 

**Completitud funcional** : ¿El sistema hace todo lo que prometió e implementa todas las funciones requeridas? 

**Corrección funcional:** ¿El sistema produce los resultados correctos con el nivel de precisión esperado? 

**Pertinencia funcional:** ¿Las funciones facilitan realmente el cumplimiento de las tareas y objetivos del usuario? 

## _**2.2.9.2. Usabilidad (ISO 9241-11)**_ 

A menudo confundida con la simple "facilidad de uso", la usabilidad es un concepto métrico riguroso. Enríquez y Casas (2013), basándose en la norma ISO 9241-11, definen la usabilidad como el grado en que un producto puede ser utilizado por usuarios específicos para conseguir objetivos específicos con efectividad, eficiencia y satisfacción en un contexto de uso determinado. 

Estos tres pilares son fundamentales para la plataforma de anuncios en Ayacucho: 

1. **Efectividad:** Que el usuario logre publicar o encontrar un anuncio (completar la tarea). 

2. **Eficiencia:** Que lo logre con el mínimo esfuerzo o tiempo posible (pocos clics). 

3. **Satisfacción:** Que la interacción genere una actitud positiva y ausencia de incomodidad. 

## _**2.2.9.3. Experiencia de Usuario (UX)**_ 

La Experiencia de Usuario (UX, por _User Experience_ ) va un paso más allá de la usabilidad instrumental. Según la norma ISO 9241-210 (2019), la UX se define como "las percepciones y respuestas de una persona resultantes del uso o del uso anticipado de un producto, sistema o servicio". 

Mientras que la usabilidad se enfoca en el desempeño durante la tarea, la UX abarca el aspecto emocional y subjetivo. Hassan Montero (2015) explica que la UX incluye las emociones, creencias, preferencias y respuestas físicas y psicológicas del usuario que ocurren 

35 

antes, durante y después del uso. En el contexto de una plataforma regional, una buena UX implica que el usuario sienta confianza, seguridad y familiaridad al navegar, lo cual es vital para fidelizar a la población ayacuchana frente a la competencia de redes sociales informales. 

## _**2.2.10. Arquitectura Mobile First**_ 

El enfoque _Mobile First_ , propuesto inicialmente por Wroblewski (2011), es una estrategia de diseño y desarrollo web que postula la creación de la interfaz gráfica comenzando por las pantallas de menor tamaño para luego escalar progresivamente hacia resoluciones mayores. A nivel de Ingeniería de Software y Experiencia de Usuario, este paradigma obliga a priorizar el contenido esencial y las interacciones críticas, eliminando elementos superfluos que generen carga cognitiva. En el contexto del desarrollo de plataformas de comercio electrónico locales, la adopción del _Mobile First_ asegura altos niveles de Usabilidad, garantizando una interacción humano-computadora fluida. 

## _**2.2.11. Extreme Programming (XP) en el Desarrollo Ágil**_ 

_Extreme Programming_ (XP) es una metodología ágil de desarrollo de software diseñada para mejorar la calidad del código y la capacidad de respuesta ante requerimientos cambiantes. Según Beck (1999), a diferencia de otros marcos ágiles centrados netamente en la gestión y planificación del proyecto como Scrum, XP provee un conjunto riguroso de prácticas de ingeniería de software a nivel técnico. Entre sus pilares fundamentales destacan la simplicidad del diseño, los estándares de codificación estrictos, la integración continua y la refactorización constante del código. En proyectos de desarrollo único, la hibridación de XP permite mitigar la deuda técnica y asegurar el correcto funcionamiento de los módulos críticos, proveyendo un artefacto de software robusto. 

## _**2.2.12. Frontend (Capa de Presentación)**_ 

El frontend constituye la capa visible, interactiva y del lado del cliente en la arquitectura de un sistema web. Es el entorno donde ocurre la Interacción Humano-Computadora. Según Freeman y Robson (2011), el desarrollo frontend moderno ha evolucionado desde la simple renderización de hipertexto hacia la construcción de aplicaciones complejas denominadas Single Page Applications (SPA). A través de librerías y frameworks de JavaScript, como React.js, esta capa se encarga de gestionar el estado de la interfaz de usuario en tiempo real, consumir servicios externos (APIs) de forma asíncrona y estructurar los flujos de navegación. Su correcta implementación técnica es el factor determinante para reducir la fricción comunicacional y elevar las métricas de usabilidad del sistema final. 

36 

## _**2.2.13. Backend (Capa de Lógica y Datos)**_ 

El backend representa la arquitectura subyacente que opera en el servidor, siendo invisible para el usuario final pero crítica para la viabilidad de la plataforma. De acuerdo con Casciaro (2016), esta capa es responsable de la lógica de negocio, la seguridad informática, el enrutamiento de peticiones y la persistencia de los datos. En entornos de ejecución asíncronos orientados a eventos como Node.js, el _backend_ provee servicios a través de APIs RESTful. Es en esta capa donde se centralizan las operaciones fundamentales del sistema, tales como la validación de identidad mediante tokens criptográficos (JWT) y la ejecución transaccional segura hacia los motores de bases de datos relacionales, como MySQL, garantizando así la trazabilidad y la integridad de la información comercial procesada. 

## _**2.2.14. Comparación y Justificación del Stack Tecnológico**_ 

La selección de las tecnologías subyacentes para el desarrollo de un Producto Mínimo Viable (MVP) determina no solo la velocidad de despliegue, sino la escalabilidad futura del sistema. Para la plataforma de anuncios publicitarios, se optó por una arquitectura desacoplada utilizando React.js, Node.js y MySQL, decisión que se justifica teóricamente frente a otras alternativas del mercado: 

**a. Capa de Presentación (Frontend): React.js vs. Angular o Vue** En el desarrollo de Aplicaciones de Página Única (SPA), los _frameworks_ tradicionales como Angular imponen una estructura monolítica y rígida, con una curva de aprendizaje pronunciada y un peso mayor en el cliente. Por el contrario, **Banks y Porcello (2020)** destacan que React.js, al ser estrictamente una librería enfocada en la interfaz, utiliza un _Virtual DOM_ que minimiza las manipulaciones directas en el navegador. Esta característica resultó decisiva para el proyecto, ya que la plataforma de anuncios clasificados requiere actualizar constantemente el _feed_ de productos en dispositivos móviles con recursos limitados, donde la eficiencia en la renderización que ofrece React supera a sus competidores. 

## **b. Capa de Negocio (Backend): Node.js vs. Arquitecturas Tradicionales (PHP / Java)** 

Históricamente, los sistemas web dependían de servidores bloqueantes (como PHP con Apache) que consumían un hilo de memoria por cada usuario conectado, limitando la concurrencia. Según **Tilkov y Vinoski (2010)** , Node.js revoluciona este paradigma al emplear un modelo de Entrada/Salida (I/O) asíncrono y no bloqueante, impulsado por eventos. Para el caso del comercio digital C2C, donde múltiples usuarios realizan búsquedas filtradas de manera simultánea, Node.js permite manejar una alta concurrencia de peticiones a la API 

37 

RESTful con un consumo de CPU significativamente menor que una arquitectura síncrona tradicional como Java Spring o PHP. 

**c. Capa de Datos: MySQL vs. Bases de Datos NoSQL (MongoDB)** El auge de los _stacks_ como MERN donde se usa MongoDB ha popularizado las bases de datos no relacionales basadas en documentos. Sin embargo, **Coronel y Morris (2019)** advierten que las bases de datos NoSQL sacrifican la consistencia inmediata a favor de la flexibilidad, lo cual es riesgoso en sistemas transaccionales o de comercio. Dado que la plataforma de clasificados posee una estructura de datos estrictamente relacional, se descartó el uso de NoSQL. La elección de **MySQL** garantizó el cumplimiento de las propiedades ACID (Atomicidad, Consistencia, Aislamiento, Durabilidad) y la integridad referencial de los datos, evitando anomalías como la existencia de anuncios huérfanos si un vendedor elimina su cuenta. 

38 

## **Capitulo III** 

## **Material y Métodos** 

## **3.1. Tipo de investigación** 

De acuerdo con la finalidad que persigue, la presente investigación es de tipo 

Aplicada. 

Según Hernández-Sampieri y Mendoza (2018), la investigación aplicada busca resolver problemas prácticos e inmediatos para mejorar la calidad de vida de un grupo social o sector específico, basándose en los hallazgos de la investigación básica. 

En este estudio, se utiliza el conocimiento teórico de la Ingeniería de Software y el desarrollo web para dar solución a una problemática concreta: la informalidad y desorganización en el comercio de bienes y servicios en la región de Ayacucho. No se busca generar nueva teoría pura, sino aplicar tecnologías existentes (React, Node.js, Scrum) para construir una herramienta funcional (la plataforma web) que transforme una realidad. 

## **3.2. Nivel de investigación** 

El nivel de investigación corresponde al Nivel Descriptivo. 

Según Carrasco (2019), el nivel descriptivo consiste en caracterizar un fenómeno o situación concreta, detallando sus rasgos peculiares o diferenciadores. 

La investigación se enmarca en este nivel porque tiene como propósito describir y evaluar las propiedades fundamentales del software desarrollado. Específicamente, se describieron cómo  es el correcto funcionamiento de los módulos principales y se evaluaron la usabilidad de los usuarios piloto de la plataforma web en el contexto de la región de Ayacucho. 

## **3.3. Diseño de investigación** 

El diseño de investigación adoptado es No experimental de alcance Transversal o transaccional. 

Según Hernández-Sampieri, Fernández y Baptista (2014), la investigación no experimental es aquella que se realiza sin manipular deliberadamente las variables; es decir, consiste en observar los fenómenos tal como se dan en su contexto natural para posteriormente analizarlos. Adicionalmente, los diseños transversales recolectan datos en un 

39 

solo momento y en un tiempo único, con el propósito de describir variables y analizar su incidencia e interrelación en un momento dado. 

La investigación se centró en el desarrollo de la plataforma web de anuncios clasificados para la región de Ayacucho y, una vez finalizada la fase de implementación, se procedió a recolectar los datos en una etapa única de post-desarrollo. En este momento se ejecutó la medición descriptiva en dos frentes metodológicos estrictamente separados: por un lado, el investigador validó el correcto Funcionamiento de los módulos principales (Variable X4) aplicando la Ficha de Análisis Documental sobre los artefactos del sistema; por otro lado, se midió la Usabilidad (Variable X5) aplicando el cuestionario a los 20 usuarios piloto. Esta delimitación garantiza que la operatividad técnica y la percepción subjetiva del usuario se evalúen con instrumentos independientes, reflejando la realidad del uso del software tal como se presentó durante las pruebas. 

## **3.4. Población y Muestra** 

## _**3.4.1. Población**_ 

Según Tamayo y Tamayo (2012), la población es la totalidad del fenómeno a estudiar donde las unidades de población poseen una característica común la cual se estudia y da origen a los datos de la investigación. 

Para la presente investigación, la población de estudio está conformada por la totalidad de ciudadanos residentes en la región de Ayacucho, provincia de Huamanga, que poseen acceso a internet y tienen interés en la comercialización (compra, venta o alquiler) de bienes y servicios. Dado que el número exacto de usuarios potenciales en la etapa inicial es indeterminado, se considera metodológicamente como una población infinita para efectos del estudio. 

## _**3.4.2. Muestra**_ 

La muestra es un subconjunto representativo de la población. Para este estudio, se ha optado por un Muestreo No Probabilístico de tipo Intencional (o por conveniencia). Según Hernández-Sampieri, Fernández y Baptista (2014), en este tipo de muestreo la elección de los elementos no depende de la probabilidad, sino de causas relacionadas con las características de la investigación y del criterio del investigador. 

La muestra seleccionada consta de 20 sujetos, divididos en dos grupos focales para evaluar la plataforma desde ambas perspectivas del mercado: 

40 

- 10 Anunciantes (Oferentes): Personas o pequeños negocios interesados en publicar productos o servicios. 

- 10 Usuarios (Demandantes): Personas interesadas en buscar y adquirir dichos bienes o servicios. 

Para garantizar la pertinencia de la muestra, se aplicaron los siguientes criterios de selección: 

Criterios de Inclusión: 

- Residir en la ciudad de Ayacucho. 

- Ser mayor de 18 años. 

- Contar con un dispositivo (móvil o computadora) con acceso a internet. 

- Tener conocimientos básicos de navegación web. 

Criterios de Exclusión: 

- Usuarios que no residan en el área de influencia del estudio. 

- Personas que rechacen participar voluntariamente en las pruebas de funcionamiento. 

## **3.5. Variables e indicadores** 

## _**3.5.1. Definición conceptual de las variables**_ 

## _**Variable de estudio**_ 

**Plataforma Web de Anuncios Clasificados:** Se define como un entorno digital centralizado que actúa como intermediario de mercado, permitiendo a los usuarios publicar y gestionar anuncios de productos o servicios para venta, compra, intercambio o promoción. Según Laudon y Laudon (2020), estas plataformas constituyen mercados digitales que reducen significativamente los costos de transacción y asimetría de información, facilitando la conexión dinámica entre ofertantes y demandantes (Modelo C2C) sin las barreras geográficas o temporales del comercio tradicional. 

## _**Variable descriptiva**_ 

**a) Análisis:** El análisis en el desarrollo de software implica la descomposición detallada de los requisitos del sistema para comprender plenamente las necesidades del usuario y las funcionalidades que el sistema debe proporcionar. Este proceso es fundamental para identificar y documentar las especificaciones (Historias de Usuario y _Backlog_ ) que guiarán las fases posteriores del proyecto (Pressman, 2014). 

41 

**b) Diseño:** El diseño en ingeniería de software se refiere al proceso de definir la arquitectura, los componentes, interfaces y otras características de un sistema. Según Sommerville (2011), este proceso establece una solución técnica (arquitectura de base de datos y diseño UI/UX) que cumple con los requisitos especificados, proporcionando una base sólida para la construcción y verificación del sistema. 

**c) Implementación:** La implementación es la fase de construcción donde el diseño se traduce en código ejecutable. Durante esta etapa, se utiliza el stack tecnológico seleccionado (React.js y Node.js) para escribir el código fuente, integrar los diferentes módulos y realizar pruebas unitarias iniciales para asegurar el correcto funcionamiento del sistema antes de su despliegue (Pressman, 2014). 

**d) Funcionamiento** Se define como la capacidad del software, en su versión de Producto Mínimo Viable (MVP), para ejecutar sus procesos principales (registro, publicación y búsqueda) sin fallos críticos. Según **Sommerville (2011)** , la validación del funcionamiento asegura que el sistema cumple con las expectativas del cliente y ejecuta correctamente las tareas para las cuales fue programado dentro de un entorno de pruebas. 

**e) Usabilidad:** De acuerdo con los lineamientos de la norma internacional ISO 924111, y en concordancia con lo establecido por Enríquez y Casas, la usabilidad se define como la medida en que un producto de software puede ser utilizado por usuarios específicos para lograr objetivos definidos con eficacia, eficiencia y satisfacción dentro de un contexto de uso determinado. Representa la capacidad inherente del sistema para ser comprendido, aprendido y operado, minimizando la carga cognitiva y la fricción durante la interacción humanocomputadora (HCI). Operacionalmente, esta variable es medida de forma empírica y cuantitativa a través de la Escala de Usabilidad del Sistema (SUS - _System Usability Scale_ ), desarrollada por Brooke (1996). Su evaluación se ejecuta mediante un instrumento estandarizado compuesto por 10 ítems de tipo Likert que, tras la aplicación de su algoritmo matemático de ponderación, consolida las percepciones del usuario en un _Score_ global que oscila entre 0 y 100 puntos. Este puntaje permite categorizar técnicamente el nivel de aceptabilidad y la viabilidad de adopción de la plataforma web en su entorno real. 

## _**3.5.2. Definición operacional de las variables**_ 

## _**Variable de estudio**_ 

**X:** Plataforma Web de Anuncios Clasificados 

42 

## _**Variables descriptivas**_ 

**X1:** Análisis 

**X2:** Diseño 

**X3:** Implementación 

**X4:** Funcionamiento 

## **X5:** Usabilidad 

## **3.6. Técnicas e instrumentos para el tratamiento de datos e información** 

Según Arias (2012), las técnicas de recolección de datos son las distintas formas o maneras de obtener la información, mientras que los instrumentos son los medios materiales que se emplean para recoger y almacenar dicha información. 

Dada la naturaleza de la investigación aplicada y tecnológica, el proceso de recolección de datos se estructuró en dos fases metodológicas distintas. La primera fase, de carácter diagnóstico, empleó la técnica de la entrevista para el levantamiento de requerimientos funcionales previos al desarrollo del software. La segunda fase, de carácter evaluativo, tuvo como objetivo medir directamente las variables de estudio una vez concluido el Producto Mínimo Viable (MVP). Para ello, se aplicó una Ficha de Análisis Documental orientada a la revisión técnica de los artefactos del sistema para evaluar la variable Funcionamiento (X4), y el instrumento estandarizado Escala de Usabilidad del Sistema (SUS) aplicado a la muestra piloto para evaluar la variable Usabilidad (X5). Esta estructuración garantiza que los datos recolectados respondan directamente, y con rigor científico, a los objetivos específicos de validación y evaluación de la plataforma. 

## _**3.6.1. Técnicas para recolectar información**_ 

Para este estudio de desarrollo tecnológico se utilizaron tres técnicas fundamentales para recopilar los requerimientos iniciales y validar empíricamente las variables de la investigación: la entrevista, el análisis documental y la encuesta. 

**3.6.1.1. Entrevista:** Para la fase de diagnóstico y recopilación de requerimientos, se llevaron a cabo entrevistas preliminares con ciudadanos locales activos en el comercio digital de la región de Ayacucho. Estas entrevistas permitieron obtener información detallada sobre las dinámicas actuales de compra y venta en redes sociales genéricas, identificar necesidades específicas como la mitigación de estafas por perfiles falsos y la desorganización de los 

43 

anuncios y estructurar el _Product Backlog_ . Esto aseguró que cada etapa del desarrollo del Producto Mínimo Viable (MVP) cumpliera con las expectativas reales y los requerimientos de los usuarios finales. 

**3.6.1.2. Análisis documental:** Para la validación de la variable de Funcionamiento (X4), se realizó una revisión técnica y exhaustiva de los artefactos del sistema. En el contexto de la ingeniería de _software_ , este análisis se enfocó en la revisión del código fuente (React.js y Node.js), los registros de la base de datos (MySQL) y los flujos de ejecución en el entorno de pruebas. Este análisis, guiado por la norma ISO/IEC 25010:2023, permitió auditar los procesos, garantizando la correcta operatividad técnica de la plataforma web y su alineación con la arquitectura propuesta. 

**3.6.1.3. Encuesta:** Finalmente, para la evaluación empírica de la variable Usabilidad (X5), se aplicó la técnica de la encuesta empleando como instrumento la Escala de Usabilidad del Sistema (SUS), dirigida a la muestra piloto de 20 usuarios. Esta técnica estandarizada a nivel internacional permitió recolectar datos cuantitativos precisos sobre la interacción humano-computadora (HCI), valorando aspectos estructurales críticos como la facilidad de aprendizaje, la coherencia de las funciones integradas, el nivel de complejidad del sistema y la autonomía del usuario para navegar sin soporte técnico. La aplicación de este instrumento garantiza la obtención de una métrica global de aceptabilidad ( _Score_ ), eliminando sesgos subjetivos en la evaluación del Producto Mínimo Viable. 

**NOTA.** Las entrevistas previas y las encuestas realizadas a los ciudadanos locales tuvieron como finalidad obtener información directa sobre las experiencias, frustraciones y niveles de aceptación frente al ecosistema de comercio digital C2C. A partir de la interacción con estas personas, se identificaron las tareas específicas del usuario, los puntos de fricción en la comunicación y los requerimientos de seguridad necesarios para la plataforma. 

Por su parte, el análisis documental permitió revisar el comportamiento interno del _software_ , auditando la correcta generación de _tokens_ de seguridad (JWT), el almacenamiento estructurado de imágenes y la ejecución del borrado lógico ( _soft delete_ ). De este modo, tanto la información proporcionada por los actores comerciales compradores y vendedores como la auditoría técnica de los componentes del sistema fueron las fuentes principales para validar las dimensiones de esta investigación. 

44 

En consecuencia, los instrumentos aplicados no se dirigieron a evaluar el comercio digital de forma abstracta, sino a las personas que interactúan con la interfaz y a los artefactos lógicos como el código y base de datos, que procesan la información, permitiendo construir una visión precisa, técnica y validada del funcionamiento y el impacto de la plataforma web en la región de Ayacucho. 

## _**3.6.2. Instrumentos para la recolectar información**_ 

Los instrumentos empleados para la recolección de datos se diseñaron en estricta concordancia con los objetivos de la investigación y las técnicas seleccionadas, permitiendo evaluar tanto las fases de desarrollo tecnológico como la validación final del software. 

_**3.6.2.1. Guía de entrevista:**_ Se elaboró una guía de entrevista semiestructurada con preguntas clave dirigidas a ciudadanos representativos de la región de Ayacucho que participan activamente en el comercio digital. Este instrumento diagnóstico permitió obtener información primaria sobre los problemas actuales en redes sociales (como estafas, anonimato y desorganización), identificar los requerimientos funcionales críticos y estructurar el _Product Backlog_ inicial del sistema. 

_**3.6.2.2. Ficha de análisis documental:**_ Se utilizó una ficha de evaluación técnica (tipo _checklist_ ) para auditar de manera estructurada los artefactos lógicos de la plataforma web (código fuente, consultas a la base de datos MySQL y flujos de ejecución). En ella se registraron los resultados binarios de cumple  y no cumple, permitiendo validar la variable de Funcionamiento (X4) de manera objetiva y bajo los criterios de Adecuación Funcional dictados por la norma internacional ISO/IEC 25010:2023. 

## **3.6.2.3. Escala de Usabilidad del Sistema (SUS):** Se aplicó el instrumento estandarizado 

_System Usability Scale_ , dirigido a la muestra piloto de 20 ciudadanos locales. Este instrumento, compuesto por 10 afirmaciones con opciones de respuesta de tipo Likert (escala de 1 a 5), fue seleccionado exclusivamente para cuantificar la variable de Usabilidad (X5). A diferencia de la Ficha de Análisis Documental (la cual audita el Funcionamiento técnico y la integridad del código), este instrumento posee un carácter psicométrico y perceptual. Su objetivo se centró en medir dimensiones críticas de la Interacción Humano-Computadora (HCI), tales como la facilidad de uso, la consistencia de las funciones del sistema, la curva de aprendizaje y la autonomía del usuario al interactuar con el Producto Mínimo Viable (MVP). El cuestionario original y su estructura de puntuación se detallan en el Anexo 2.4. 

45 

## _**3.6.3. Herramientas para el tratamiento de datos e información**_ 

Para el desarrollo, despliegue y validación del Producto Mínimo Viable (MVP) de la plataforma web de anuncios clasificados, se seleccionó un conjunto de herramientas tecnológicas, lenguajes y librerías de vanguardia. La siguiente tabla detalla el _stack_ tecnológico utilizado para el procesamiento de la información, tanto en el lado del cliente ( _Frontend_ ) como en el lado del servidor ( _Backend_ ): 

## **Tabla 4** 

_Herramientas tecnológicas para el procesamiento de datos y desarrollo del software._ 

|**Software /**|**Fabricante /**||
|---|---|---|
|**Tecnología**|**Creador**|**Servicio / Descripción**|
|HTML5|W3C (Tim<br>Berners-Lee)|Quinta revisión del lenguaje básico de la_World Wide Web_.<br>Define la semántica y estructura base para la plataforma de<br>clasificados.|
|CSS3|W3C (Håkon<br>Wium Lie)|Lenguaje de diseño de hojas de estilo empleado para la<br>maquetación visual de la plataforma bajo el enfoque_Mobile_<br>_First_.|
||Brendan Eich|Lenguaje de programación interpretado de alto nivel. Actúa|
|JavaScript|(Netscape/ECMA)|como el motor lógico principal tanto en el navegador del<br>usuario como en el servidor.|
|React.js|Meta (Facebook) /<br>Open Source|Librería de JavaScript para la construcción de interfaces de<br>usuario. Permitió crear la arquitectura_Single Page Application_<br>(SPA) y gestionar el_Virtual DOM_para un renderizado rápido.|
|Node.js|OpenJS Foundation<br>(Ryan Dahl)|Entorno de ejecución de JavaScript del lado del servidor.<br>Soporta la arquitectura de red asíncrona y no bloqueante para<br>gestionar múltiples usuarios concurrentes.|
|||Sistema de gestión de bases de datos relacional de código|
|MySQL|Oracle Corporation|abierto. Garantiza la integridad referencial y las propiedades<br>ACID para el almacenamiento del catálogo de anuncios y|
|||perfiles.|
|||Editor de código fuente altamente extensible. Utilizado como|
|Visual Studio|Microsoft|el entorno de desarrollo integrado (IDE) principal para la|
|Code||codificación del proyecto, ofreciendo depuración y|
|||refactorización.|



46 

|||Software de control de versiones distribuido. Fundamental para|
|---|---|---|
|Git|Linus Torvalds|implementar las prácticas de_Extreme Programming_(XP),|
|||permitiendo gestionar el historial del código de manera segura.|
||GitHub, Inc.|Plataforma de alojamiento en la nube para proyectos basados|
|GitHub|(Microsoft)|en Git. Permitió mantener el repositorio del código fuente<br>centralizado y seguro durante los_Sprints_.|
|||Plataforma para la construcción y uso de APIs. Se empleó para|
|Postman|Postman, Inc.|probar, documentar y validar las rutas (_endpoints_) del_backend_|
|||antes de integrarlas con la interfaz de usuario.|
|JWT (JSON<br>Web Token)|IETF (RFC 7519)|Estándar abierto basado en JSON para la creación de_tokens_de<br>acceso. Utilizado para asegurar la transmisión de información y<br>mantener las sesiones de los usuarios validadas y encriptadas.|
|||Función de_hashing_de contraseñas. Herramienta de seguridad|
|Bcrypt|Niels Provos /<br>David Mazières|fundamental utilizada en el servidor para encriptar las<br>credenciales de los ciudadanos antes de almacenarlas en la base|
|||de datos.|



## _**3.6.4. Diseño estadístico**_ 

Dado que la presente investigación es de tipo aplicada-tecnológica y de nivel descriptivo, no se contempla un diseño estadístico inferencial para la contrastación de hipótesis poblacionales. En su lugar, el tratamiento de los datos se fundamentó en la estadística descriptiva y en métricas estandarizadas de evaluación de software. Los resultados obtenidos de la validación del sistema en su entorno real (mediante el instrumento SUS aplicado a la muestra piloto de 20 usuarios) se procesaron a través del algoritmo matemático de tabulación del _System Usability Scale_ , lo que permitió consolidar las respuestas en un _Score_ global de 0 a 100. Toda esta información cuantitativa, junto con los resultados binarios de la implementación tecnológica del Producto Mínimo Viable (MVP), se presenta, resume y explica a través de tablas de evaluación y figuras arquitectónicas, permitiendo visualizar de manera clara y estructurada el impacto de la plataforma en la región de Ayacucho. 

## _**3.6.5. Análisis e interpretación de datos**_ 

El procesamiento de la información se ejecutó en tres frentes directamente alineados con las fases del proyecto. En primer lugar, los datos cualitativos recopilados a través de las entrevistas preliminares y el diagnóstico inicial fueron analizados para abstraer el problema central (informalidad y estafas). Esto permitió definir con precisión los requerimientos 

47 

funcionales y no funcionales, alimentando el _Product Backlog_ que guio las iteraciones del marco de trabajo ágil Scrum. 

En segundo lugar, los datos técnicos obtenidos mediante la Ficha de Análisis Documental fueron interpretados bajo un enfoque de validación binaria (Cumple / No Cumple). Esta información se contrastó sistemáticamente contra los estándares de Adecuación Funcional de la norma internacional ISO/IEC 25010:2023, lo que permitió certificar un 100% de éxito en las pruebas del código construido. 

Finalmente, los datos cuantitativos extraídos de la Escala de Usabilidad del Sistema (SUS) fueron tabulados y analizados de manera sistemática aplicando la fórmula estandarizada de Brooke (1996). La interpretación del _Score_ global obtenido (83.5 puntos sobre 100) permitió categorizar la usabilidad de la interfaz en un nivel "Excelente". Esto confirmó empíricamente que la plataforma web posee una curva de aprendizaje mínima y una arquitectura intuitiva ( _Mobile First_ ), superando las expectativas de los usuarios, mitigando la fricción comunicacional y validando la viabilidad del sistema en el ecosistema digital C2C local. 

## _**3.6.6. Técnicas para aplicar el marco de trabajo Scrum**_ 

El marco de trabajo Scrum se basa en tres pilares fundamentales: roles, eventos y artefactos, los cuales han sido adaptados metodológicamente a la naturaleza de una investigación tecnológica conducida por un único desarrollador. En cuanto a los roles, el investigador asumió una dualidad funcional para garantizar la viabilidad del proyecto: actuó como _Product Owner_ durante la fase de análisis recolectando los requerimientos de los usuarios de Ayacucho y como _Scrum Team/Scrum Master_ durante las fases de diseño e implementación codificando la plataforma e integrando prácticas de _Extreme Programming_ ) 

Respecto a los eventos, se aplicó el _Sprint Planning_ para organizar y planificar de manera estructurada las iteraciones de desarrollo del Producto Mínimo Viable, asegurando que los requerimientos de la arquitectura _Single Page Application_ estuvieran priorizados. Además, al finalizar cada ciclo, se ejecutó el _Sprint Review_ , donde se evaluó el funcionamiento del código en el entorno de pruebas y se validaron los módulos frente a los requerimientos iniciales. 

En cuanto a los artefactos, se gestionaron los tres componentes principales del marco Scrum: 

48 

- Product Backlog: Contiene la lista priorizada de los requerimientos y necesidades del ecosistema digital local  como por ejemplo, la validación de identidad y  buscador dinámico, proporcionando la ruta de valor para mitigar la desorganización del comercio informal. 

- Sprint Backlog: Selecciona y organiza las historias de usuario más críticas del _Product Backlog_ que el investigador se comprometió a desarrollar técnica y lógicamente en cada _Sprint_ . 

- Incremento: Representa los módulos plenamente funcionales de autenticación, catálogo y moderación todos ellos completados al final de cada iteración, asegurando que superen las pruebas  antes de ser integrados al sistema final. 

La aplicación de estas técnicas ha permitido una gestión iterativa, ágil y estructurada en la construcción de la plataforma web de anuncios clasificados, facilitando el despliegue exitoso de un ecosistema seguro para la región de Ayacucho. 

## **Tabla 5** 

_Entregables Scrum_ 

|**Tarea**|**Entregable**|**Técnica aplicada en el proyecto**|**Responsable**|
|---|---|---|---|
|Adaptación de<br>roles|Matriz de roles<br>Scrum adaptada|Asunción de responsabilidades<br>duales para optimizar el<br>desarrollo del MVP por un único<br>investigador.|Investigador<br>_(Scrum_<br>_Master)_|
|||Recopilación de las necesidades||
|Elaboración|Historias de|de los ciudadanos locales frente|Investigador|
|de historias de|Usuario|al comercio C2C, transformando|(_Product_|
|usuario|documentadas|las necesidades  en|_Owner_)|
|||requerimientos técnicos.||
|Elaboración|_Product_|Organización de las historias de|Investigador|
|del Product|_Backlog_|usuario enfocadas estrictamente|(_Product_|
|Backlog|priorizado|en la generación de valor.|_Owner_)|



49 

|||Distribución estratégica de la||
|---|---|---|---|
|Sprint<br>Planning<br>(Planificación)|_Sprint Backlog_|carga de trabajo, dividiendo la<br>codificación del_Frontend_(React)<br>y_Backend_(Node.js) en cuatro|Investigador<br>(_Scrum Team_)|
|||iteraciones ágiles.||
|||Implementación del código||
|Desarrollo de<br>las iteraciones<br>(Sprints)|Incremento de<br>software<br>funcional|fuente utilizando tecnologías web<br>y prácticas de_Extreme_<br>_Programming_(XP) para asegurar|Investigador<br>(_Scrum Team_)|
|||un código limpio y sin errores.||
|||Auditoría del incremento||
|Sprint Review<br>(Revisión<br>técnica)|Validación de<br>los módulos|mediante la Ficha de Análisis<br>Documental, asegurando el<br>cumplimiento técnico de las<br>funciones desarrolladas en el|Investigador<br>(_Scrum Team_)<br>y (_Product_<br>_Owner_)|
|||_Sprint_.||



50 

## **Capitulo IV** 

## **Resultados y Discusión** 

## **4.1. Resultados de la Investigación** 

Los resultados del presente estudio se exponen en alineación directa con las variables descriptivas (X1 a X5) definidas en la matriz de operacionalización, evidenciando los entregables metodológicos y técnicos obtenidos en cada fase del desarrollo del Producto Mínimo Viable (MVP). 

## _**4.1.1. Resultados de la Fase de Análisis**_ 

La recolección de datos inicial se llevó a cabo mediante entrevistas no estructuradas y el análisis del entorno digital de la región de Ayacucho (grupos de Facebook y redes sociales). Este proceso permitió identificar las deficiencias del comercio informal en línea y extraer las necesidades reales de los usuarios locales  tanto compradores y vendedores. 

A partir de este diagnóstico, la información recolectada se procesó y tradujo en una lista formal de requerimientos funcionales y no funcionales, los cuales constituyeron la base para la posterior formulación de las historias de usuario en el marco de trabajo Scrum. 

## **Tabla 6** 

_Detalle de los Requerimientos Funcionales de la Plataforma Web_ 

|**Nro**|**Requerimientos**<br>**funcionales**|**Descripción**|**Requerimiento**|
|---|---|---|---|
|||El sistema permitió que cualquier||
|||ciudadano se registrara creando una|Gestión de|
|RF-01|Registro de<br>nuevos usuarios|cuenta mediante un correo electrónico y<br>contraseña, garantizando la creación de<br>un perfil básico para operar en el mercado|Identidad y<br>Seguridad|
|||local.||
||Autenticación|La plataforma validó las credenciales de|Gestión de|
|RF-02|(Inicio de sesión)|acceso para permitir el ingreso seguro al<br>sistema, protegiendo las sesiones y|Identidad y<br>Seguridad|



51 

|||evitando el uso no autorizado de las||
|---|---|---|---|
|||cuentas.||
|||El usuario tuvo la capacidad de actualizar|Gestión de|
|RF-03|Edición y gestión<br>de perfil|su información personal y de contacto, lo<br>cual fomentó la transparencia y confianza<br>entre los actores del entorno C2C.|Identidad y<br>Seguridad|
|||Se habilitó un formulario estructurado||
||Creación de|para que los ofertantes publicaran sus|Gestión de|
|RF-04|nuevos anuncios|bienes o servicios, exigiendo campos|Anuncios|
|||clave como título, descripción, precio y||
|||categoría.||
|||El sistema integró la funcionalidad de||
|RF-05|Carga de<br>evidencia visual|subir fotografías de los productos desde el<br>dispositivo del usuario, optimizando las|Gestión de<br>Anuncios|
|||imágenes para una carga rápida en la||
|||interfaz.||
|||Los vendedores pudieron editar la||
||Modificación de|información, precio o estado de sus|Gestión de|
|RF-06|anuncios activos|publicaciones en cualquier momento para|Anuncios|
|||mantener la oferta actualizada frente a los||
|||compradores.||
|||Se otorgó la opción de dar de baja o||
||Desactivación de|eliminar un anuncio una vez que el|Gestión de|
|RF-07|clasificados|producto fue vendido o el servicio dejó de|Anuncios|
|||estar disponible, evitando la saturación de||
|||ofertas caducadas.||
|||Cada vendedor dispuso de un apartado||
||Panel de control|denominado "Mis Anuncios", donde|Gestión de|
|RF-08||||
||personal|visualizó y administró centralizadamente|Anuncios|
|||todo su inventario publicado.||



52 

|||La plataforma mostró en su pantalla de||
|---|---|---|---|
|||inicio los clasificados más recientes||
|RF-09|Visualización del<br>_Feed_principal|publicados en la región, ofreciendo un<br>escaparate dinámico y actualizado en|Exploración y<br>Búsqueda|
|||tiempo real.||
|||Al seleccionar un anuncio, el sistema||
|RF-10|Vista detallada|desplegó una vista específica con toda la|Exploración y|
||del producto|información extendida, galería de fotos y|Búsqueda|
|||los datos del vendedor.||
|||Se implementó una barra de búsqueda||
|RF-11|Motor de<br>búsqueda por<br>palabras|que permitió a los demandantes ingresar<br>términos específicos (ej. "laptop",<br>"alquiler") para encontrar coincidencias|Exploración y<br>Búsqueda|
|||exactas rápidamente.||
|||El sistema organizó la información||
|RF-12|Filtrado por<br>categorías|permitiendo a los usuarios filtrar los<br>resultados según el rubro de interés (ej.<br>Inmuebles, Vehículos, Empleos),|Exploración y<br>Búsqueda|
|||reduciendo el tiempo de exploración.||
|||Se integró un botón de acción rápida que||
||Redirección a|conectó directamente el anuncio con el|Comunicación|
|RF-13||||
||WhatsApp|WhatsApp del vendedor, facilitando la|Directa|
|||negociación inmediata sin intermediarios.||
|||El sistema permitió al administrador||
|RF-14|Administración<br>de rubros|crear, modificar o eliminar las categorías<br>principales del mercado, adaptándose a|Administración y<br>Moderación|
|||las dinámicas comerciales emergentes de||
|||Ayacucho.||



53 

|||Se habilitó una función de moderación||
|---|---|---|---|
|RF-15|Control de<br>calidad del|para que el administrador pudiera revisar,<br>aprobar o restringir anuncios que|Administración y<br>Moderación|
||contenido|incumplieran las normas de convivencia||
|||de la plataforma.||



_Nota._ La tabla describe las funcionalidades implementadas en el MVP de la plataforma web de anuncios clasificados para la región de Ayacucho, alineadas con las necesidades del comercio digital local. Elaboración propia. 

Estos requerimientos garantizaron que la solución tecnológica se mantuviera enfocada en resolver el problema central de desorganización y falta de confianza en el ecosistema C2C ayacuchano, sentando las bases para la arquitectura del sistema. 

## _**4.1.2. Resultados de la Fase de Diseño**_ 

Los resultados de la fase de diseño se materializaron en los artefactos visuales y arquitectónicos del sistema. A nivel de infraestructura, se documentó el Diagrama de Arquitectura definiendo un modelo Single Page Application (SPA) para garantizar fluidez, el cual se puede apreciar a detalle en el anexo 5.1. A nivel de base de datos, se elaboró el Diagrama Entidad-Relación (ER) en MySQL, asegurando la integridad referencial entre usuarios, categorías y anuncios, tal cual lo podemos observar en el anexo 5.2. Finalmente, a nivel de interfaz (UI/UX), el entregable consistió en el conjunto de prototipos y Wireframes diseñados bajo el enfoque Mobile First representado en el anexo 5.3 Esta decisión visual fue crucial para el contexto demográfico de Ayacucho, reduciendo la curva de aprendizaje al priorizar la usabilidad en dispositivos móviles sobre las vistas de escritorio. 

## _**4.1.3. Resultados de la Fase de Implementación (Variable X3)**_ 

## _**4.1.3.1. Prácticas de Programación Extrema (XP) aplicadas al desarrollo.**_ 

Para abordar la construcción técnica del código fuente de la plataforma de anuncios publicitarios, se integraron las prácticas de la metodología ágil de desarrollo _Extreme Programming_ (XP). Mientras que Scrum rigió la gestión del tiempo, la priorización del _Backlog_ y los roles del proyecto, XP proporcionó el marco de ingeniería estricto necesario para garantizar la calidad intrínseca del software. 

Dado que la codificación fue ejecutada íntegramente por un único investigador (autor de la tesis), las prácticas originales de XP fueron adaptadas estratégicamente para maximizar 

54 

la eficiencia y reducir la deuda técnica en el ecosistema React.js y Node.js. A continuación, se evidencian los artefactos técnicos que respaldan la aplicación de las cuatro prácticas fundamentales de XP en la construcción de la plataforma: 

**4.1.3.1.1. Estándares de Codificación** Para garantizar que la base de código mantuviera una consistencia estructural, se automatizaron las reglas de sintaxis y formateo utilizando herramientas de _linting_ . 

## **Figura 3:** 

_Diagrama estructural del stack tecnológico y estandarización arquitectónica de la plataforma._ 

Como se detalla en la Figura 3, el estándar de diseño del proyecto se fundamentó en una arquitectura cliente-servidor completamente desacoplada. Se estandarizó el uso de React, Vite y Tailwind CSS para una construcción ágil y optimizada del _Frontend_ (SPA), mientras que el _Backend_ se estructuró con Node.js, Express y Prisma ORM para interactuar de forma segura con la base de datos relacional MySQL. Esta definición arquitectónica estricta permitió que la integración de la API REST fluyera sin inconsistencias tecnológicas, cumpliendo con la premisa de "Diseño Simple" de la metodología XP. 

55 

## **Figura 4:** 

_Distribución de directorios y aplicación de estándares de validación en el entorno de desarrollo (Visual Studio Code)._ 

A nivel de código fuente, la disciplina técnica de la metodología XP se materializa en la estructura del entorno de desarrollo. La Figura 4 evidencia la separación modular e intuitiva de los directorios tanto para el cliente ( _components_ , _pages_ , _services_ ) como para el servidor ( _controllers_ , _middlewares_ , _routes_ , _prisma_ ). Asimismo, se aprecia la aplicación de estándares de codificación de seguridad y limpieza de datos mediante la implementación de middlewares de validación. Estas reglas estrictas garantizan que toda petición entrante cumpla con un formato predefinido antes de alcanzar la lógica de negocio. 

**4.1.3.1.2. Integración Continua** La construcción del MVP no se realizó de forma monolítica al final del proyecto, sino mediante la integración constante de módulos funcionales por cada _Sprint_ . 

56 

## **Figura 5:** 

_Bitácora de control de versiones, ramificación e integración continua en el repositorio del proyecto._ 

La Figura 5 evidencia la aplicación empírica de la integración continua a través del historial gráfico del sistema de control de versiones. Como se aprecia en la trazabilidad del repositorio, el desarrollo no operó de forma monolítica. En su lugar, se adoptó una estrategia de ramificación donde cada funcionalidad o corrección operaba de manera aislada para luego ser fusionada  hacia la rama principal, tal como se observa en la integración del módulo de rutas de autenticación. Este registro auditable demuestra que el código se integró, probó y versionó de forma constante, garantizando que el sistema mantuviera una versión estable, segura y desplegable a lo largo de todos los _Sprints_ de la investigación. 

**4.1.3.1.3. Diseño Simple** En concordancia con los principios de la metodología _Extreme Programming_ (XP), la arquitectura lógica de la plataforma web se rigió bajo la premisa de diseño simple. Esto implicó construir un sistema desacoplado, libre de código duplicado o capas de abstracción innecesarias, donde cada módulo expresa con claridad su intención y contiene el número mínimo de elementos requeridos para satisfacer los requerimientos del Producto Mínimo Viable. 

57 

Esta simplicidad de diseño se estructuró dividiendo el ecosistema tecnológico en dos proyectos independientes: una capa de cliente orientada a la experiencia de usuario y una capa de servidor orientada a la persistencia y lógica de negocio. 

- **A. Estructura y Modularidad en la Capa del Cliente (** _**Frontend**_ **)** 

El desarrollo del _Frontend_ se estructuró como una _Single Page Application_ (SPA) modular, escalable y optimizada mediante componentes reutilizables. 

## **Figura 6:** 

_Arquitectura de directorios del Frontend basada en componentes atómicos y servicios desacoplados._ 

Como se evidencia en la vista estructural de la Figura 6, la capa del cliente implementa un diseño simple que organiza los artefactos visuales y lógicos en directorios especializados. El directorio _components/_ agrupa los elementos de la interfaz gráfica reutilizables (botones, formularios, tarjetas de anuncios), optimizando la consistencia visual y evitando la duplicación de código. Las vistas principales de la aplicación se centralizan en la carpeta _pages/_ , mapeadas directamente mediante un sistema de enrutamiento dinámico. 

Asimismo, la lógica de comunicación con el servidor se aisló por completo en la carpeta _services/_ , encargada de gestionar las peticiones asíncronas hacia la API REST. 

## **B. Estructura y Flujo de Datos en la Capa del Servidor (** _**Backend**_ **)** 

58 

El desarrollo del _Backend_ se diseñó bajo un esquema arquitectónico de API REST asíncrona, estructurado de forma lineal para asegurar un procesamiento eficiente de las transacciones comerciales. 

## _**Figura 7:**_ 

_Arquitectura de directorios del Backend organizada por capas de enrutamiento, lógica de negocio y persistencia de datos._ 

La Figura 7 ilustra la materialización del principio de diseño simple en la capa del servidor. El flujo de control de las peticiones entrantes se organiza de manera secuencial y sin acoplamientos rígidos a través de carpetas dedicadas: 

1. _**routes/:**_ Centraliza los puntos de acceso ( _endpoints_ ) expuestos para el consumo del cliente. 

2. _**middlewares/:**_ Actúa como una capa interceptora encargada de la inyección de seguridad (validación de tokens JWT) y la limpieza de datos antes de permitir el procesamiento de la información. 

3. _**controllers/:**_ Aloja estrictamente la lógica de negocio del sistema, abstrayendo las acciones del usuario. 

59 

4. _**prisma/:**_ Implementa el mapeo objeto-relacional (ORM) para la base de datos MySQL, permitiendo gestionar el esquema transaccional mediante modelos declarativos puros. 

**4.1.3.1.4. Pruebas y Validación.** El pilar de pruebas  de la metodología XP fue adaptado estratégicamente a las necesidades de la investigación. En el ciclo de vida de un Producto Mínimo Viable (MVP), la automatización temprana de pruebas unitarias a nivel de código introduce rigidez ante los constantes  cambios de arquitectura derivados de la retroalimentación del usuario. Por consiguiente, para no comprometer la agilidad del proyecto, la estrategia de pruebas descartó los scripts de código automatizado y se enfocó estrictamente en la ejecución iterativa de pruebas funcionales y de integración de caja negra. 

## _**Figura 8:**_ 

_Ejecución de pruebas funcionales y de integración de API REST en la capa del servidor._ 

Como se evidencia en la Figura 8, la validación del intercambio de datos se realizó mediante herramientas de testeo de API. Se evaluó exhaustivamente la respuesta de los _endpoints_ , validando los códigos de estado HTTP, la correcta emisión de _Tokens_ de seguridad (JWT) y la prevención de inyecciones SQL en la base de datos. Esto garantizó que la integración entre el _Frontend_ y el _Backend_ operara sin excepciones. 

60 

A modo de síntesis, la aplicación de estas prácticas durante la codificación se detalla en la Tabla 4. 

## **Tabla 7** 

_Integración de prácticas XP en el ciclo de desarrollo técnico_ 

|**Práctica XP**|||
|---|---|---|
|**adaptada**|**Aplicación en el proyecto**|**Herramientas de soporte**|
||Creación de interfaces_Mobile First_y||
|Diseño Simple|arquitectura API REST sin código|Figma (UI/UX), Draw.io|
||excedente para el MVP.||
|Entregas Pequeñas|Compilación de módulos 100%<br>operativos al cierre de cada_Sprint_.|Node Package Manager<br>(NPM)|
||Optimización de componentes React||
|Refactorización|y normalización continua de|Visual Studio Code|
||consultas SQL.||
||Pruebas de_endpoints_y flujos de||
|Integración Continua|datos antes de fusionar el código a la|Postman, Chrome DevTools|
||rama principal.||
|Revisión Adaptada|Análisis estático de código para<br>prevención de errores tipográficos y<br>vulnerabilidades básicas.|ESLint, Git (Control de<br>versiones)|



_Nota._ Las prácticas de Extreme Programming fueron adaptadas para garantizar la 

calidad técnica del software bajo el desarrollo de un único programador. Elaboración propia. 

## _**4.1.3.2 Marco de Trabajo de la metodología Scrum.**_ 

La gestión del ciclo de vida del desarrollo de la plataforma de anuncios clasificados 

para la región de Ayacucho se rigió bajo el marco de trabajo Scrum. Esta elección 

metodológica permitió abordar la complejidad del proyecto de manera iterativa e incremental, garantizando la entrega continua de los módulos operativos y facilitando la adaptación a los requerimientos técnicos descubiertos durante la programación. 

61 

## _**4.2.2.1. Asignación de Roles.**_ 

Para la correcta aplicación del marco de trabajo dentro del contexto de la presente investigación, se definieron y adaptaron los roles oficiales de Scrum de la siguiente manera: 

- **Product Owner:** Este rol fue asumido bajo la perspectiva de la investigación, representando la voz y las necesidades de los usuarios de la región de Ayacucho como compradores y vendedores locales, priorizando los requerimientos en función del valor comercial y la viabilidad del Producto Mínimo Viable (MVP). 

- **Scrum Master:** El investigador principal ejerció este rol, encargándose de velar por el cumplimiento de las prácticas ágiles, organizar los Sprints, remover los impedimentos técnicos y mantener el enfoque del proyecto. 

- **Development Team:** Conformado íntegramente por el autor de la investigación, quien asumió la responsabilidad técnica de la arquitectura, el diseño UI/UX y la codificación _Full Stack_ , transformando los requerimientos en incrementos de software funcional. 

**4.2.2.2. Product Backlog Inicial** Con los roles definidos y los requerimientos funcionales claros, se procedió a construir el Product Backlog. Este artefacto se estructuró como una lista viva y priorizada de todo el trabajo necesario para la plataforma, expresado en formato de Historias de Usuario. 

Cada historia fue estimada utilizando la técnica de _Planning Poker,_ basada en la sucesión de Fibonacci, para asignar "Puntos de Historia", los cuales representaron el nivel de esfuerzo, complejidad técnica e incertidumbre de cada tarea. El _Product Backlog_ inicial que guio el proyecto se detalla en la Tabla 5. 

## **Tabla 8** 

_Product Backlog inicial_ 

|**Orden**|**ID**|**Nombre de la Historia**|**Prioridad**|**Puntos (Est.)**|
|---|---|---|---|---|
|1|HU-01|Registro de Usuario Nuevo|Alta|5|
|2|HU-02|Inicio de Sesión|Alta|3|
|3|HU-14|Gestión de Categorías|Alta|5|
|4|HU-09|Visualizar Anuncios Recientes|Alta|3|



62 

|5|HU-04|Publicar un Nuevo Anuncio|Alta|8|
|---|---|---|---|---|
|6|HU-05|Cargar Imágenes del Producto|Alta|5|
|7|HU-10|Ver Detalle de Anuncio|Alta|3|
|8|HU-13|Contactar vía WhatsApp|Alta|2|
|9|HU-11|Buscar Anuncios|Alta|5|
|10|HU-08|Ver "Mis Anuncios"|Media|3|
|11|HU-12|Filtrar por Categoría|Media|3|
|12|HU-06|Editar Información de un Anuncio|Media|5|
|13|HU-07|Eliminar/Desactivar Anuncio|Media|2|
|14|HU-03|Gestión de Perfil|Baja|3|
|15|HU-15|Moderación de Anuncios|Baja|3|



_Nota_ . Las historias de usuario fueron priorizadas en función de su criticidad para el funcionamiento del modelo C2C. Elaboración propia. 

## **Refinamiento del Product Backlog** 

Una vez establecido el listado inicial, se llevó a cabo el proceso de refinamiento. Durante esta actividad, se desglosaron las historias de mayor tamaño o complejidad como la HU-04: Publicar un Nuevo Anuncio, puntuada con 8, para asegurar que pudieran ser completadas dentro de un solo Sprint. 

Asimismo, se establecieron los criterios de aceptación para cada HU y se consolidó la estrategia de ejecución: las historias de prioridad "Alta", que sumaban un total de 39 puntos de historia y conformaban el núcleo duro del MVP  identificados como identidad, publicación y contacto, estos serían abordadas en las primeras iteraciones, dejando las de prioridad "Media" y "Baja" para los Sprints de consolidación y mejora continua. 

## _**4.2.2.3. Desarrollo del Sprint 1: Fundamentos, Seguridad y Base del Sistema.**_ 

**a) Planificación del Sprint** El objetivo principal de esta primera iteración fue establecer la arquitectura base del proyecto, configurar el entorno de desarrollo y programar el 

63 

control de acceso a la plataforma. Se determinó que, sin un sistema de seguridad robusto y una estructura de categorías definida en la base de datos MySQL, las demás funcionalidades de la plataforma no podrían operar. 

Durante la planificación, se acordó configurar el frontend utilizando React.js estructurado con el framework de estilos Tailwind CSS en su versión estable 3, garantizando interfaces consistentes y responsivas sin comprometer la estabilidad del sistema. En el backend trabajado en Node.js, se planificó la configuración de la zona horaria local (UTC-5) para el registro exacto de las operaciones en la base de datos, evitando desfases temporales en la creación de cuentas o auditorías de sesión. Se seleccionaron 3 Historias de Usuario con prioridad "Alta", sumando un esfuerzo total de 13 puntos de historia. 

**b)** _**Sprint Backlog**_ Las historias seleccionadas se desglosaron en tareas técnicas específicas para facilitar su codificación diaria. Se incluyeron parámetros de seguridad adicionales en la base de datos, como la captura de información del dispositivo ( _device_info_ ), para tener un control estricto de las sesiones activas. 

A continuación, se presenta el _Sprint Backlog_ correspondiente a esta iteración: 

## **Tabla 9** 

_Sprint Backlog - Iteración 1_ 

||**Historia de**||||||
|---|---|---|---|---|---|---|
|**ID**|**Usuario**|**Tareas Técnicas (Desglose)**|**Estado**||**Puntos**||
|||• Creación del modelo Usuarios|||||
|||en MySQL.|||||
|HU-01|Registro de<br>Usuario Nuevo|• Programación del formulario<br>de registro (React).||Completado||5|
|||• Encriptación de contraseñas|||||
|||(Bcrypt) y captura de zona|||||
|||horaria (UTC-5).|||||
|HU-02|Inicio de<br>Sesión|• Creación del_endpoint_de<br>autenticación (Node.js).||Completado||3|



64 

• Generación de tokens de seguridad (JWT). • Registro del campo device_info para auditoría de sesiones. • Creación del modelo Categorias y relaciones relacionales. Gestión de HU-14 • Desarrollo de la interfaz de Completado 5 Categorías administración de rubros. • Integración de la API para listar categorías habilitadas. 

_Nota_ . El Sprint 1 sentó las bases de seguridad e infraestructura de datos. Elaboración propia. 

**c) Ejecución y Gráfica** _**Burnup Chart:**_ El desarrollo del Sprint se ejecutó sin impedimentos críticos. La gráfica de trabajo Burnup Chart evidenció un progreso lineal constante. Los primeros días se invirtieron en la configuración de los repositorios y la base de datos, completando la HU-14 y la HU-01 hacia la mitad del ciclo. La historia HU-02  se integró exitosamente en los días finales tras asegurar la correcta emisión de los tokens de autenticación (JWT). 

## **Figura 9** 

_Gráfica de Burnup Chart para el primer sprint_ 

65 

**==> picture [377 x 227] intentionally omitted <==**

**----- Start of picture text -----**<br>
Progreso de iteración - Sprint 1<br>18<br>16<br>14<br>12<br>10<br>8<br>6<br>4<br>2<br>0<br> Día 0  Día 1  Día 2  Día 3  Día 4  Día 5  Día 6  Día 7  Día 8  Día 9  Día 10<br>Alcance Total (Puntos) Trabajo Completado (Puntos acumulados)<br>**----- End of picture text -----**<br>


_Nota._ La figura representa el progreso diario de las historias de usuario en 

comparación con el estimado, utilizando un Burnup Chart. 

A nivel de ingeniería, durante esta iteración se aplicó el principio XP de Diseño Simple (Simple Design), estructurando los modelos de la base de datos Usuarios y Categorías y las rutas de autenticación estrictamente con lo necesario, evitando sobrecargar el código con atributos no requeridos para esta primera versión del MVP. 

**d) Revisión del Sprint:** Al finalizar la iteración, se realizó la validación de los entregables contra sus respectivos criterios de aceptación. Se comprobó que el sistema permitía la creación exitosa de un usuario, encriptando su contraseña en la base de datos. Asimismo, el inicio de sesión bloqueaba correctamente los intentos con credenciales inválidas y redirigía al panel principal a los usuarios autenticados. Finalmente, el módulo de categorías permitió registrar rubros comerciales esenciales como por ejemplo Vehículos, Inmuebles, Servicios. Dado el cumplimiento de estos criterios, el Scrum Master marcó el 100% de las historias de 13 puntos como "Completadas". 

## **e) Resultados del Sprint (Evidencias Visuales)** Como resultado tangible de esta 

iteración, se obtuvieron las primeras interfaces funcionales de la plataforma de anuncios clasificados para la región de Ayacucho, las cuales demostraron la aplicación del diseño UI/UX planteado y la integración con el backend. 

## **Figura 10** 

_Formulario para registrar nuevo usuario en la plataforma_ 

66 

_Nota_ . La Figura muestra la implementación de la historia HU-01. 

## **Figura 11** 

_Formulario para iniciar sesión en la plataforma._ 

_Nota_ . La Figura muestra la implementación de la historia HU-02. 

## **Figura 12** 

Interfaz de configuración de categorías y atributos 

67 

_Nota_ . La Figura muestra la implementación de la historia HU-02. 

## _**4.2.2.4. Desarrollo del Sprint 2: Núcleo del Negocio.**_ 

**a) Planificación del Sprint:** El objetivo central de este segundo ciclo de iteración fue habilitar el motor principal de la plataforma: la publicación de clasificados. Habiendo asegurado la autenticación de usuarios en el Sprint 1, el sistema ya contaba con la capacidad de vincular cada nuevo anuncio a un usuario real, garantizando la trazabilidad y seguridad exigida. 

Durante la planificación, se identificó que el mayor desafío técnico residía en la carga y procesamiento de imágenes (HU-05), dado que los usuarios en Ayacucho accederían mayormente desde dispositivos móviles con conexiones inestables. Por ello, se planificó la implementación de middlewares en Node.js para la gestión de archivos y la optimización del peso de las fotografías antes de su almacenamiento. Para este ciclo, se seleccionaron 3 Historias de Usuario de prioridad "Alta", que representaron el mayor esfuerzo del proyecto con un total de 16 puntos de historia. 

**b)** _**Sprint Backlog**_ Las historias se desglosaron en tareas enfocadas en el manejo del estado del formulario en el frontend y la creación de la arquitectura relacional en la base de datos vinculando la tabla Anuncios con Usuarios y Categorías. 

A continuación, se presenta el _Sprint Backlog_ correspondiente a esta iteración: 

## **Tabla 10** 

_Sprint Backlog - Iteración 2_ 

68 

||**Historia de**||||
|---|---|---|---|---|
|**ID**|**Usuario**|**Tareas Técnicas (Desglose)**|**Estado**|**Puntos**|
|||• Creación de la tabla Anuncios con|||
|||llaves foráneas.|||
||Publicar un|• Diseño del formulario interactivo|||
|HU-04|Nuevo Anuncio|en React.|Completado|8|
|||• Programación del endpoint POST|||
|||para inserción de datos.|||
|||• Configuración del middleware de|||
|||recepción de archivos.|||
|HU-05|Cargar Imágenes<br>del Producto|• Desarrollo de vista previa de<br>imágenes en el frontend.|Completado|5|
|||• Almacenamiento de rutas de|||
|||imágenes en la base de datos.|||
|||• Creación de rutas dinámicas en|||
|||React.|||
|HU-10|Ver Detalle de<br>Anuncio|• Desarrollo de la consulta SQL con<br>JOIN para obtener detalles.|Completado|3|
|||• Maquetación de la vista de|||
|||producto.|||



_Nota_ . El Sprint 2 concentró el mayor esfuerzo técnico al integrar la carga de archivos multimedia. Elaboración propia. 

**c) Ejecución y Gráfica** _**Burnup Chart**_ La ejecución de este Sprint requirió un trabajo intensivo en las validaciones de datos. La historia HU-04 consumió la mayor parte de la primera semana debido a la complejidad de enlazar las categorías dinámicas con el formulario. Posteriormente, la HU-05 se integró permitiendo a los usuarios visualizar una miniatura de su foto antes de publicarla, mejorando sustancialmente la experiencia de usuario. Finalmente, la creación de la vista de detalle de la HU-10 cerró el ciclo. El _Burnup Chart_ reflejó un avance escalonado, superando la meta de los 16 puntos en el tiempo establecido. 

69 

## **Figura 13** 

_Gráfica de Burnup Chart para el segundo sprint_ 

**==> picture [383 x 226] intentionally omitted <==**

**----- Start of picture text -----**<br>
Progreso de iteración - Sprint 2<br>18<br>16<br>14<br>12<br>10<br>8<br>6<br>4<br>2<br>0<br> Día 0  Día 1  Día 2  Día 3  Día 4  Día 5  Día 6  Día 7  Día 8  Día 9  Día 10<br>Alcance Total (Puntos) Trabajo Completado (Puntos acumulados)<br>**----- End of picture text -----**<br>


_Nota_ . La figura representa el progreso diario de las historias de usuario en 

comparación con el estimado, utilizando un Burnup Chart. 

Durante la programación de estos módulos, se hizo uso intensivo de la práctica de Integración y Pruebas Continuas. Cada ajuste en el middleware de carga de imágenes fue validado localmente mediante peticiones controladas en Postman antes de acoplarlo con el estado del formulario en React, evitando que el manejo de archivos corrompiera la estabilidad del servidor. 

**d) Revisión del Sprint** La validación de este ciclo fue altamente satisfactoria. Se comprobó en el entorno de pruebas que un usuario autenticado podía llenar el formulario, adjuntar hasta tres fotografías, y que el sistema procesaba la solicitud guardando la información en MySQL de manera relacional. Al hacer clic en el anuncio recién creado, la ruta dinámica del frontend renderizaba correctamente el título, la descripción, el precio y la galería de imágenes. Con estos resultados empíricos, el Scrum Master dio por validadas las tres historias, alcanzando el 100% de cumplimiento. 

**e) Resultados del Sprint (Evidencias Visuales)** Los entregables de este Sprint representaron la materialización visual de la propuesta de valor de la plataforma. 

70 

## _**Figura 14**_ 

_Formulario par publicar anuncio en la plataforma_ 

_Nota_ . La Figura muestra la implementación de la historia HU-04. 

## **Figura 15** 

_Formulario donde se carga imágenes del producto._ 

_Nota_ . La Figura muestra la implementación de la historia HU-05. 

**Figura 16** 

71 

_Vista a detalle del anuncio_ 

_Nota_ . La Figura muestra la implementación de la historia HU-10. 

## _**4.2.2.5. Desarrollo del Sprint 3: Exploración, Búsqueda y Conexión C2C.**_ 

**a) Planificación del Sprint (** _**Sprint Planning**_ **)** El objetivo primordial de esta tercera iteración fue solucionar el problema de accesibilidad y desorganización de la información diagnosticado en la región. Para ello, se planificó la construcción de la interfaz principal  y los motores de filtrado, culminando con la integración de la herramienta de comunicación directa. 

A nivel técnico, se determinó que el motor de búsqueda en el backend  utilizaría consultas SQL parametrizadas con operadores LIKE para encontrar coincidencias en los títulos y descripciones de los anuncios, mientras que el frontend  manejaría los estados locales para renderizar dinámicamente los resultados sin necesidad de recargar la página. Asimismo, se planificó el uso de la API oficial de WhatsApp (wa.me) para generar enlaces dinámicos 

72 

basados en el número telefónico del vendedor registrado en la base de datos. Se seleccionaron 4 Historias de Usuario, sumando un esfuerzo de 13 puntos de historia. 

**b)** _**Sprint Backlog**_ Las tareas se enfocaron en la optimización de las consultas a la base de datos para no sobrecargar el servidor al mostrar múltiples anuncios y en la gestión de parámetros de búsqueda en las rutas de la API. 

A continuación, se presenta el _Sprint Backlog_ de esta iteración: 

## **Tabla 11** 

_Sprint Backlog - Iteración 3_ 

||**Historia de**||||
|---|---|---|---|---|
|**ID**|**Usuario**|**Tareas Técnicas (Desglose)**|**Estado**|**Puntos**|
|||• Creación del componente Feed en React.|||
||Visualizar||||
|HU-09|Anuncios<br>Recientes|• Consulta SQL con ORDER BY fecha<br>DESC y LIMIT.|Completado|3|
|||• Maquetación de tarjetas de anuncios.|||
|||• Desarrollo de la barra de búsqueda en la|||
|||cabecera.|||
|HU-11|Buscar<br>Anuncios|• Implementación del endpoint de búsqueda<br>con parámetros.|Completado|5|
|||• Actualización del estado en React al|||
|||recibir resultados.|||
|||• Integración de botones/menú de|||
|||categorías.|||
|HU-12|Filtrar por<br>Categoría|• Petición a la API filtrando por el ID de la<br>categoría.|Completado|3|
|||• Renderizado condicional de resultados o|||
|||mensajes de "No hay anuncios".|||



73 

|||• Inserción de botón CTA (Call to Action)||
|---|---|---|---|
|||en la vista de detalle.||
||Contactar|||
|||• Generación de URL dinámica con el||
|HU-13|vía|teléfono del ofertante.|Completado 2|
||WhatsApp|||
|||• Creación de mensaje predefinido||
|||mediante Template Literals.||



_Nota._ El Sprint 3 estructuró la visualización del catálogo y habilitó el contacto C2C. Elaboración propia. 

**c) Ejecución y Gráfica** _**Burnup Chart**_ La iteración fluyó de manera constante. Los primeros días se dedicaron a la HU-09, logrando que la pantalla de inicio mostrara exitosamente los últimos productos cargados en el Sprint anterior. Seguidamente, se abordaron la HU-11 y HU-12 en paralelo, ya que ambas compartían la lógica de manipulación del estado en React para refrescar el _Feed_ . La iteración cerró con la implementación de la HU-13, una tarea rápida de 2 puntos pero de altísimo impacto funcional, concatenando el número del vendedor con un mensaje de saludo automático. 

## **Figura 17** 

## _Gráfica de Burnup Chart para el tercer sprint_ 

**==> picture [389 x 234] intentionally omitted <==**

**----- Start of picture text -----**<br>
Progreso de iteración - Sprint 3<br>18<br>16<br>14<br>12<br>10<br>8<br>6<br>4<br>2<br>0<br> Día 0  Día 1  Día 2  Día 3  Día 4  Día 5  Día 6  Día 7  Día 8  Día 9  Día 10<br>Alcance Total (Puntos) Trabajo Completado (Puntos acumulados)<br>**----- End of picture text -----**<br>


74 

_Nota_ . La figura representa el progreso diario de las historias de usuario en comparación con el estimado, utilizando un Burnup Chart. 

Para garantizar la velocidad de respuesta del motor de búsqueda y los filtros, se aplicó la práctica de Refactorización Continua. El código de las consultas SQL fue reestructurado y optimizado en múltiples ocasiones para procesar eficientemente los parámetros enviados desde el frontend, manteniendo una arquitectura limpia a pesar de la creciente complejidad lógica. 

**d) Revisión del Sprint:** Durante la revisión, se ejecutaron pruebas de validación simulando el comportamiento de un comprador. Se comprobó que el Feed principal cargaba los anuncios de manera responsiva. Al utilizar la barra de búsqueda con términos específicos (ej. "celular") y aplicar filtros de categoría (ej. "Tecnología"), el sistema devolvió los resultados exactos en milisegundos, evidenciando el correcto funcionamiento de la API. Finalmente, al presionar el botón de contacto, el sistema redirigió exitosamente a la aplicación de WhatsApp con un mensaje pre-cargado. Las cuatro historias fueron aprobadas y marcadas como completadas. 

**e) Resultados del Sprint** Con este ciclo, la plataforma alcanzó su estado de Producto Mínimo Viable (MVP) cien por ciento interactivo entre oferta y demanda. 

## **Figura 18** 

Sección de anuncios recientes (Novedades) 

75 

_Nota_ . La Figura muestra la implementación de la historia HU-09. 

## **Figura 19** 

_Formulario de búsqueda de anuncios o productos_ 

76 

_Nota_ . La Figura muestra la implementación de la historia HU-11. 

## **Figura 20** 

_Filtro de búsqueda en el catálogo de anuncios_ 

_Nota_ . La Figura muestra la implementación de la historia HU-12. 

77 

## **Figura 21** 

_Botón de contacto directo via WhatsApp_ 

_Nota_ . La Figura muestra la implementación de la historia HU-13. 

## _**4.2.2.4. Desarrollo del Sprint 4: Gestión, Edición y Moderación Continua.**_ 

**a) Planificación del Sprint** El objetivo de esta última iteración fue otorgar autonomía a los usuarios sobre su inventario y dotar al administrador de herramientas de control de calidad. Habiendo resuelto la publicación y la búsqueda en iteraciones previas, el sistema requería cerrar el ciclo de vida de los datos. 

A nivel de arquitectura, el desafío técnico principal fue la autorización. Se planificó la validación estricta de los tokens JWT en el backend para garantizar que un usuario únicamente pudiera editar o eliminar los anuncios que le pertenecían, bloqueando cualquier petición no autorizada. Asimismo, para la funcionalidad de eliminación detallada en la HU07, se optó por implementar un "borrado lógico" cambiando el estado del anuncio en la base de datos MySQL  de 'activo' a 'inactivo', preservando la integridad referencial y el historial de 

78 

transacciones. Para este ciclo final, se seleccionaron 5 Historias de Usuario, sumando un esfuerzo total de 16 puntos de historia. 

**b) Sprint Backlog** Las tareas se centraron en la reutilización de componentes de React como el formulario de publicación, adaptado ahora para la edición y la creación de paneles de control privados. 

## **Tabla 12** 

_Sprint Backlog - Iteración 4_ 

|||**Tareas Técnicas**|||
|---|---|---|---|---|
|**ID**|**Historia de Usuario**||**Estado**|**Puntos**|
|||**(Desglose)**|||
|||• Desarrollo del panel de|||
|||usuario protegido|||
|||(React).|||
|HU-08|Ver "Mis Anuncios"|• Consulta SQL filtrando<br>anuncios por el ID del|Completado|3|
|||usuario en sesión.|||
|||• Renderizado de la lista|||
|||de productos propios.|||
|||• Reutilización del|||
|||formulario pre-llenando|||
|||los datos (_States_).|||
||Editar Información|• Creación del_endpoint_|||
|HU-06|de un Anuncio|PUT para actualización|Completado|5|
|||de campos.|||
|||• Validación de|||
|||propiedad del anuncio|||
|||(Middleware de Auth).|||
||Eliminar/Desactivar|• Integración de botón de|||
|HU-07|Anuncio|eliminación con modal|Completado|2|
|||de confirmación.|||



79 

|||• Actualización del|||
|---|---|---|---|---|
|||campo estado en la base|||
|||de datos (_Soft Delete_).|||
|||• Refresco automático de|||
|||la lista "Mis Anuncios".|||
|||• Formulario para|||
|||actualización de datos|||
|HU-03|Gestión de Perfil|personales y teléfono.|Completado|3|
|||•_Endpoint_PUT para la|||
|||tabla Usuarios.|||
|||• Desarrollo del panel de|||
|||Administrador (Vista|||
|||global).|||
||Moderación de|• Funcionalidad para|||
|HU-15|Anuncios|cambiar el estado a|Completado|3|
|||"Baneado/Oculto".|||
|||• Lógica condicional en|||
|||el_Feed_para no mostrar|||
|||anuncios baneados.|||



_Nota._ El Sprint 4 completó el ciclo CRUD y brindó herramientas de administración. Elaboración propia. 

**c) Ejecución y Gráfica** _**Burnup Chart**_ La iteración se caracterizó por la integración de múltiples vistas privadas. Los días iniciales se enfocaron en el panel del usuario contempladas en las HU-08 y HU-03, logrando que cada vendedor tuviera su propio espacio de trabajo. Posteriormente, se implementó la lógica de edición de la HU-06 y desactivación de la HU-07, lo cual fluyó rápidamente al reutilizar la estructura del Sprint 2. El ciclo culminó con la programación del rol de Administrador  detallada en la HU-15, asegurando que la plataforma tuviera un mecanismo contra publicaciones fraudulentas. El _Burnup Chart_ mostró un cierre perfecto, completando los 16 puntos en el tiempo estipulado. 

## **Figura 22** 

80 

_Gráfica de Burnup Chart para el cuarto sprint_ 

**==> picture [391 x 235] intentionally omitted <==**

**----- Start of picture text -----**<br>
Progreso de iteración - Sprint 4<br>18<br>16<br>14<br>12<br>10<br>8<br>6<br>4<br>2<br>0<br> Día 0  Día 1  Día 2  Día 3  Día 4  Día 5  Día 6  Día 7  Día 8  Día 9  Día 10<br>Alcance Total (Puntos) Trabajo Completado (Puntos acumulados)<br>**----- End of picture text -----**<br>


_Nota_ . La figura representa el progreso diario de las historias de usuario en 

comparación con el estimado, utilizando un Burnup Chart. 

Al tratarse del cierre de la fase de codificación, se consolidó la práctica de Entregas Pequeñas y la Revisión de Código Adaptada. Antes de dar por finalizado el ciclo, se ejecutaron herramientas de análisis estático sobre la totalidad del proyecto para asegurar que el incremento final fuera un producto robusto, libre de errores de sintaxis y listo para su validación con los usuarios piloto. 

**d) Revisión del Sprint** La revisión final del producto demostró el cumplimiento total del alcance del MVP. Se validó exhaustivamente la seguridad: se intentó modificar un anuncio desde una cuenta no propietaria, siendo la petición bloqueada correctamente por el servidor. Asimismo, el usuario pudo editar el precio de su producto y ocultarlo una vez vendido. Por parte de la administración, se verificó que al marcar un anuncio como indebido, este desaparecía instantáneamente del _Feed_ público. Las 5 historias fueron marcadas como "Completadas", cerrando formalmente la fase de codificación de la plataforma anuncios clasificados para la región de Ayacucho. 

**e) Resultados del Sprint** Las interfaces resultantes evidenciaron el control total sobre la información almacenada. 

**Figura 23** 

81 

Interfaz de visualización de los anuncios propio del titular de la cuenta 

_Nota_ . La Figura muestra la implementación de la historia HU-08. 

## **Figura 24** 

_Interfaz de la edición del anuncio_ 

82 

_Nota_ . La Figura muestra la implementación de la historia HU-06. 

## _**Figura 25**_ 

_Botón de activar o desactivar la visibilidad del anuncio_ 

83 

_Nota_ . La Figura muestra la implementación de la historia HU-07, referido a la activación y desactivación de la visibilidad del anuncio 

## **Figura 26** 

_Boton de eliminación de anuncio (Borrado lógico)_ 

84 

_Nota_ . La Figura muestra la implementación de la historia HU-07, referido a la 

eliminación del anuncio, para este caso un borrado lógico 

## **Figura 27** 

_Interfaz de la gestión de perfiles de usuarios desde el panel administrador_ 

85 

_Nota_ . La Figura muestra la implementación de la historia HU-03. 

## **Figura 28** 

_Panel de moderación de anuncios desde el administrador_ 

_Nota_ . La Figura muestra la implementación de la historia HU-15. 

86 

## _**4.1.4. Resultados de la Validación de Funcionamiento (Variable X4)**_ 

La evaluación de la dimensión de Funcionamiento tuvo como objetivo comprobar la calidad operativa del código implementado durante los _Sprints_ de desarrollo. Para ello, se aplicó la Ficha de Análisis Documental (ver Anexo 2.3), un instrumento técnico estructurado en cuatro dimensiones críticas (Gestión de Accesos, Publicación, Búsqueda y Moderación). Los resultados empíricos demostraron que el Producto Mínimo Viable (MVP) alcanzó un nivel de cumplimiento técnico del 100% en los ocho ítems de validación planificados, sin arrojar excepciones no controladas ni bloqueos del servicio ( _crashes_ ). 

Para garantizar el rigor metodológico, los resultados obtenidos en el Anexo 2.3 se categorizaron según las tres subcaracterísticas de la Adecuación Funcional dictadas por la norma ISO/IEC 25010:2023: 

**a). Completitud funcional:** La evaluación técnica verificó que el sistema implementó a cabalidad las funciones estructurales requeridas. Según los resultados de la Dimensión 1 (Gestión de Accesos) y la Dimensión 2 (Módulo de Publicación) del instrumento, se evidenció el registro exitoso de usuarios con encriptación de contraseñas (Bcrypt) en MySQL y el bloqueo efectivo ante credenciales incorrectas. Asimismo, se comprobó que el formulario de publicación y el middleware procesan y almacenan correctamente la carga de datos estructurados e imágenes adjuntas, vinculándolos al ID del usuario en sesión sin corromper la base de datos. 

**b). Corrección funcional:** Durante la ejecución en el entorno de pruebas, se validó la precisión absoluta de las operaciones lógicas y consultas. En la Dimensión 3 (Módulo de Búsqueda), se constató que la barra retorna coincidencias exactas o parciales (LIKE) en base a los títulos, y que los filtros actualizan el Feed dinámicamente utilizando los estados de la librería React. Adicionalmente, la Dimensión 4 (Módulo de Moderación) superó estrictas pruebas de seguridad arquitectónica: se validó correctamente la propiedad del anuncio para permitir ediciones exclusivas de su autor, y se confirmó que la acción de eliminar ejecuta un borrado lógico (soft delete), ocultando el registro del Feed público pero manteniendo intacta la evidencia en la base de datos. 

**c). Pertinencia funcional:** La ejecución exitosa de los ítems descritos en la ficha validó que las funciones desplegadas contribuyen directamente a la resolución de los problemas de seguridad y desorganización diagnosticados en la región. El uso de Tokens JWT para validar sesiones y la trazabilidad de los borrados lógicos demostraron ser mecanismos 

87 

sumamente pertinentes para garantizar un ecosistema comercial estructurado y auditable, superando las vulnerabilidades de los grupos informales de redes sociales. 

En la Tabla 13 se presenta la síntesis de la apreciación funcional de la plataforma web de anuncios clasificados, relacionando cada dimensión operativa con su aporte directo y su trazabilidad dentro de la fase de implementación de este documento. 

## **Tabla 13** 

_Apreciación general de las funcionalidades de la plataforma_ 

|**Dimensión**|**Aspecto**|**Descripción del aporte**|**Comentario**|
|---|---|---|---|
|**(Variable)**|**observado**|**funcional**||
|X4 –|Seguridad y<br>control de|El sistema valida credenciales y<br>protege rutas mediante_tokens_,|100% de los<br>registros en pruebas|
|Funcionamiento||asegurando el registro de usuarios|fueron exitosos y|
||acceso|||
|||reales.|seguros.|
|||Los usuarios cuentan con un|90% de usuarios|
||Publicación|formulario guiado para la carga|lograron publicar|
||estructurada|de datos y fotografías|sin requerir|
|||optimizadas.|asistencia.|
||||Reduce|
||Búsqueda y|Motor de búsqueda por texto y|drásticamente el|
||filtrado|categorización en tiempo real que|tiempo de|
||dinámico|organiza el catálogo comercial.|exploración frente a|
||||redes sociales.|
||||Mantiene el|
||Gestión y<br>control de|Paneles privados de<br>administración para editar/borrar|ecosistema C2C<br>libre de|
||inventario|anuncios propios y moderar<br>contenido global.|publicaciones<br>fraudulentas.|



88 

Los usuarios Interfaz gráfica intuitiva confirmaron alta Facilidad de desarrollada bajo el enfoque facilidad de uso y X5 – Usabilidad aprendizaje y _Mobile First_ para adaptarse a aprendizaje rápido uso dispositivos celulares. (Ítems 3 y 7 del SUS). Nula necesidad de Estructuración coherente de los soporte técnico Consistencia e módulos y flujos de navegación externo para operar integración (catálogo, detalle, publicación). el sistema (Ítem 4 del SUS). Score SUS global Nivel de percepción de seguridad Aceptación de 83.5/100, e interacción de la muestra piloto global del alcanzando la frente al Producto Mínimo ecosistema categoría de nivel Viable. "Excelente". 

_Nota._ La siguiente tabla se presenta como un elemento complementario que permite contextualizar los aportes de la plataforma de anuncios clasificados desde la percepción de los usuarios piloto y las evidencias de la interfaz gráfica. Elaboración propia. 

## _**4.1.5. Resultados de la Evaluación de Usabilidad (Variable X5)**_ 

La evaluación empírica de la variable Usabilidad tuvo como finalidad determinar la facilidad de uso, la curva de aprendizaje y la viabilidad de adopción de la plataforma de anuncios publicitarios. Para ello, se aplicó la Escala de Usabilidad del Sistema (SUS) a una muestra piloto de 20 ciudadanos de la región de Ayacucho que interactuaron con el Producto Mínimo Viable (MVP). 

Los datos recolectados de los 10 ítems del instrumento fueron procesados utilizando la fórmula de tabulación estándar del modelo SUS (Brooke, 1996), la cual estandariza las respuestas positivas y negativas para generar una métrica global en una escala de 0 a 100 puntos. 

Los resultados consolidados de la muestra piloto arrojaron un Score SUS promedio de 83.5 puntos. Según las escalas de aceptabilidad y los rangos de calificación en la industria del 

89 

software (Bangor, Kortum y Miller, 2008), un puntaje superior a 68 determina que un sistema es metodológicamente "Aceptable", mientras que un puntaje superior a 80 categoriza la usabilidad de la interfaz como "Excelente". 

El análisis detallado de los ítems evidenció que la plataforma posee una curva de aprendizaje mínima, destacando valoraciones sobresalientes en el ítem 3 ("Pensé que el sistema era fácil de usar") y en el ítem 7 ("Imagino que la mayoría aprendería a utilizar este sistema rápidamente"). Asimismo, los niveles de fricción cognitiva fueron nulos, como lo demuestra la baja puntuación en el ítem 4 (necesidad de soporte técnico). 

En conclusión, la plataforma web alcanzó una validación de usabilidad de nivel excelente, demostrando que su arquitectura, diseño y flujos de navegación son altamente intuitivos y aptos para ser adoptados de manera autónoma por los usuarios en el comercio digital local. 

## **4.2. Discusiones** 

La validación del Producto Mínimo Viable (MVP) de la plataforma web de anuncios clasificados permitió corroborar empíricamente la viabilidad técnica y la aceptación de una solución estructurada frente a las necesidades locales. En congruencia con el alcance descriptivo y tecnológico de la investigación, el análisis de los resultados no pretende medir el impacto macroeconómico del comercio digital en la región de Ayacucho, lo cual excede los límites metodológicos del proyecto, sino que se delimita estrictamente a evaluar cómo las capacidades de Funcionamiento (X4) y los niveles de Usabilidad (X5) obtenidos en la muestra piloto lograron resolver los requerimientos informáticos y de usabilidad diagnosticados en la fase inicial. 

En primer lugar, el diagnóstico inicial (mediante entrevistas preliminares) evidenció que el comercio _Consumer-to-Consumer_ (C2C) en la región se desarrollaba predominantemente a través de redes sociales genéricas, lo que generaba una percepción de desorganización y dificultad para ubicar los anuncios. Al respecto, Chaffey y Ellis-Chadwick (2019) sostienen que el éxito de cualquier modelo de negocio digital radica en la capacidad del sistema para reducir la fricción en la búsqueda de información, estructurando los datos de manera que el usuario encuentre valor con menor esfuerzo cognitivo. Los resultados de este proyecto resultaron plenamente congruentes con esta premisa teórica; al implementar una plataforma con categorías predefinidas y un motor de búsqueda parametrizado (Sprint 3), la aplicación de la Escala de Usabilidad del Sistema (SUS) arrojó un Score promedio de 83.5 

90 

puntos, lo cual califica la usabilidad de la interfaz en un nivel "Excelente". Esto permite inferir que, desde la perspectiva técnica y del usuario, la migración desde un _feed_ caótico hacia un entorno estructurado mejora significativamente la experiencia de interacción, validando la importancia de la arquitectura de la información en el ecosistema comercial de la región. 

Por otro lado, uno de los problemas más críticos abordados fue la falta de confianza y la proliferación de perfiles falsos. En el entorno de las redes sociales, el anonimato facilita prácticas fraudulentas que limitan el crecimiento del mercado. Laudon y Traver (2020) afirman que la confianza es el pilar fundamental para la adopción y supervivencia de los ecosistemas de comercio electrónico C2C, señalando que los usuarios necesitan garantías de identidad antes de efectuar una transacción. En consonancia con este postulado, la plataforma implementó un sistema de registro obligatorio y encriptación de credenciales (Sprint 1), junto con un módulo de gestión de contenido (Sprint 4). Para garantizar técnicamente la capacidad de moderación dentro del alcance del Producto Mínimo Viable (MVP), la arquitectura se fundamentó en la trazabilidad de los datos y el control de acceso basado en roles. Mediante la validación de _Tokens_ JWT, el sistema asegura que cada publicación esté estrictamente anclada al ID de un perfil identificable en la base de datos MySQL, permitiendo que un usuario con privilegios de administrador pueda auditar el _feed_ y ejecutar borrados lógicos sobre publicaciones indebidas. Este mecanismo oculta el anuncio infractor de la vista pública sin destruir la evidencia en el servidor. Esta estructuración técnica no solo aportó seguridad a nivel de código, sino que transformó la percepción de la muestra piloto. Al aplicar la Escala de Usabilidad del Sistema (SUS), los usuarios reportaron un alto grado de seguridad durante su interacción (reflejado de manera sobresaliente en el Ítem 9: "Me sentí muy confiado al utilizar el sistema"), lo que contribuyó a consolidar el _Score_ global de 83.5 puntos. Esto confirma empíricamente que operar en un ecosistema digital formal mitiga las barreras de desconfianza inherentes a las redes sociales genéricas. 

A nivel metodológico, la investigación demostró la efectividad de emplear un enfoque híbrido ágil frente a los modelos tradicionales en cascada, logrando un equilibrio entre la gestión del tiempo y la calidad técnica. Para la organización general del proyecto se empleó el marco de trabajo Scrum, el cual fue fundamental para priorizar los requerimientos del usuario y organizar las entregas del producto en ciclos cortos denominados Sprints (Schwaber y Sutherland, 2020). Sin embargo, aunque Scrum es altamente eficiente para la gestión administrativa del proyecto, carece de directivas específicas sobre cómo estructurar y escribir 

91 

el código fuente. Para cubrir este vacío, el desarrollo técnico de la plataforma web de anuncios clasificados adoptó las prácticas de ingeniería de la metodología Extreme Programming (XP). De esta manera, la sinergia entre ambos enfoques permitió que Scrum guiara la planificación del producto, mientras que XP garantizó la creación de un software limpio, seguro y escalable. 

De acuerdo con Beck (2004), Extreme Programming maximiza la calidad del software y la capacidad de respuesta ante cambios a través de prácticas de codificación disciplinadas. Al tratarse de un proyecto ejecutado por un único investigador, las prácticas de XP fueron adaptadas estratégicamente. El principio de entregas pequeñas  se materializó en la culminación de módulos funcionales al final de cada Sprint. Asimismo, el Diseño Simple guio la creación de una interfaz sin sobrecarga visual, priorizando el núcleo del negocio. Finalmente, la tradicional Programación en Pares  fue sustituida por un enfoque de revisión estática de código automatizada mediante linters y estándares estrictos en el editor y revisiones técnicas periódicas con la asesoría académica, garantizando un código limpio y la detección temprana de defectos. Esta sinergia entre Scrum  y XP  permitió que la evolución del código fuera sostenible y libre de deudas técnicas insalvables. 

Desde la perspectiva de la arquitectura de software, la decisión de implementar un modelo desacoplado mediante una Single Page Application con React.js en el frontend y una API REST con Node.js en el backend demostró ser fundamental para el éxito funcional. Sommerville (2011) argumenta que la separación de responsabilidade en sistemas distribuidos aumenta exponencialmente la mantenibilidad y la escalabilidad a largo plazo. En el caso de Ayacucho, donde la conectividad móvil predomina sobre los equipos de escritorio, esta arquitectura permitió que la plataforma funcionara con tiempos de carga mínimos y una fluidez similar a la de una aplicación nativa, lo cual no habría sido factible bajo arquitecturas monolíticas tradicionales (como las generadas por gestores de contenido genéricos). En consecuencia, la ingeniería de software aplicada respaldó directamente el cumplimiento de los requerimientos de usabilidad y rendimiento. 

Respecto a las variables descriptivas evaluadas, los resultados empíricos demostraron que la dimensión de Funcionamiento (X4) alcanzó los niveles de operatividad y fiabilidad funcional requeridos para un Producto Mínimo Viable. Esta afirmación se sustenta objetivamente en los resultados obtenidos a través de la Ficha de Análisis Documental, instrumento mediante el cual el sistema evidenció un cumplimiento del 100% en las pruebas 

92 

de caja negra y blanca de sus módulos críticos. Durante el entorno de evaluación, operaciones transaccionales complejas como la generación de tokens de seguridad (JWT) durante el registro, la carga asíncrona de imágenes hacia el servidor y el borrado lógico en la base de datos, se ejecutaron exitosamente sin generar excepciones no controladas ni bloqueos del sistema. Según Pressman y Maxim (2020), la calidad funcional de un software en sus fases iterativas iniciales no se cuantifica obligatoriamente mediante métricas de estrés o concurrencia masiva, sino por su capacidad demostrada para satisfacer los requisitos explícitos y casos de uso dentro de su entorno operativo. En este sentido, la ejecución sin errores del motor de búsqueda parametrizado y la precisión de los filtros por categoría validan técnicamente que la arquitectura propuesta soporta de manera robusta y coherente los flujos de información básicos para el comercio digital local. 

En cuanto a la dimensión de Usabilidad (X5), las percepciones de la muestra piloto de 20 usuarios confirmaron la premisa de que el diseño centrado en el usuario dicta la viabilidad de adopción tecnológica. Como señala Nielsen (2012), un sistema con un alto grado de usabilidad es aquel que minimiza la carga cognitiva del individuo, permitiéndole alcanzar sus objetivos con la menor fricción posible. Los resultados obtenidos mediante la escala SUS — con un Score global de 83.5 puntos— respaldaron contundentemente la decisión arquitectónica de priorizar el enfoque _Mobile First_ . Dado que la población de Ayacucho accede mayoritariamente a los servicios digitales a través de dispositivos móviles, el hecho de que el sistema fuera percibido como altamente intuitivo y fácil de aprender (ítems 3 y 7 del SUS) demuestra que la interfaz adaptativa no fue un atributo secundario, sino el núcleo de la experiencia de usuario (UX). 

Finalmente, el hallazgo más significativo en términos de usabilidad fue el impacto de la estrategia de comunicación integrada. El alto nivel de confianza reportado por los usuarios durante la interacción refleja la eficiencia de las herramientas desplegadas. En ecosistemas de comercio electrónico emergentes, la asimetría de información y la desconfianza son las barreras de entrada más severas (Laudon y Traver, 2020). Al integrar un canal de mensajería instantánea y familiar para el ciudadano ayacuchano como WhatsApp, el sistema no forzó al usuario a adoptar un nuevo chat interno complejo, lo cual se tradujo en una valoración de "Excelencia" en la escala de usabilidad. Esta integración potenció los hábitos de comunicación existentes, actuando como un puente estructurado entre el descubrimiento del producto y el cierre de la venta, validando la eficacia del Producto Mínimo Viable (MVP). 

93 

A pesar de los resultados favorables y la comprobación empírica del correcto funcionamiento de la plataforma web de anuncios clasificados, es fundamental realizar una reflexión crítica sobre las fronteras de la presente investigación. Como ocurre en todo proyecto de software desarrollado bajo metodologías ágiles, el estudio enfrentó ciertas limitaciones propias de su diseño ya fueran técnicas, metodológicas o contextuales las cuales se detallan en los siguientes párrafos. Sin embargo, lejos de restar valor a los resultados, estas restricciones ayudan a trazar con claridad el camino hacia futuras mejoras y nuevas líneas de desarrollo. 

En primer término, la validación del sistema se llevó a cabo con una muestra reducida y controlada de 20 usuarios piloto. Si bien este tamaño muestral resultó suficiente para medir la usabilidad (X5) y el funcionamiento de los módulos críticos (X4) en un entorno de laboratorio guiado, los resultados obtenidos no reflejan en su totalidad el comportamiento de uso espontáneo y masivo. En consecuencia, la ausencia de un despliegue público masivo durante el periodo de investigación impidió medir el rendimiento de la arquitectura (backend y base de datos) frente a tráfico real o picos de concurrencia en la región. 

En el aspecto arquitectónico, el alcance del proyecto se acotó estrictamente al desarrollo de un Producto Mínimo Viable (MVP). Esta decisión estratégica priorizó la entrega de valor temprano, pero dejó fuera del alcance actual características avanzadas que podrían escalar el modelo de negocio, tales como la integración de pasarelas de pago, un sistema de mensajería interna en tiempo real o el empaquetado del sistema en una aplicación móvil nativa. Asimismo, el stack tecnológico empleado (React.js, Node.js y MySQL) se encuentra en un ciclo de constante evolución. El software entregado representa el estado del arte de estas tecnologías al momento de su desarrollo, por lo que requerirá mantenibilidad y refactorización futura para conservar su compatibilidad y seguridad. 

Finalmente, desde el punto de vista del entorno en el que se aplica, el desempeño de la plataforma depende todavía de dos factores externos: la calidad de la conectividad que ofrecen los proveedores locales en Ayacucho y el avance gradual en la reducción de la brecha de alfabetización digital en las zonas periurbanas. Reconocer estas limitaciones es importante, porque deja claro que la plataforma de anuncios clasificados no fue pensada como un producto final e inmutable, sino como una primera versión estructurada, segura y escalable que busca dar forma y profesionalizar el comercio entre personas (C2C) en la región. 

94 

95 

## **Capitulo V** 

## **Conclusiones y Recomendaciones** 

## **5.1. Conclusiones** 

Se concluyó que el desarrollo y la implementación de la plataforma web de anuncios clasificados, en su versión de Producto Mínimo Viable (MVP), constituye una propuesta tecnológica viable frente a la desorganización y la falta de confianza diagnosticadas en el comercio digital de la región de Ayacucho. A través de la evaluación en un entorno controlado, se determinó que la centralización de los clasificados en una arquitectura estructurada genera una percepción altamente positiva en la muestra piloto evaluada. Los resultados demostraron que, a nivel técnico y de usabilidad, el sistema satisface los requerimientos locales, lo que evidencia una disposición favorable de los usuarios para eventualmente transitar desde las redes sociales informales hacia un ecosistema digital local más seguro, eficiente y centrado en sus necesidades, sentando así las bases operativas para una futura implementación a gran escala. 

En relación al objetivo específico "a)", orientado a determinar los resultados de la fase de análisis del desarrollo de la plataforma, se concluye que el levantamiento de información basado en la realidad tecnológica de Ayacucho dio como resultado la definición precisa de los requerimientos funcionales y la creación de un Product Backlog priorizado. La identificación de problemas clave, como la desconfianza por el anonimato y la pérdida de anuncios en feeds masivos, permitió definir un alcance realista centrado estrictamente en la generación de valor (registro seguro, motor de búsqueda y contacto directo), sentando las bases lógicas del Producto Mínimo Viable (MVP). 

En relación al objetivo específico "b)", enfocado en determinar los resultados de la fase de diseño de la plataforma, se concluye que esta etapa dio como resultado la estructuración técnica de una arquitectura Single Page Application (SPA) y la elaboración de prototipos bajo el enfoque Mobile First. Estas decisiones arquitectónicas y de interfaz demostraron ser las idóneas para el contexto demográfico objetivo, ya que priorizaron la usabilidad en dispositivos móviles y redujeron la curva de aprendizaje, garantizando un diseño escalable y centrado en el usuario local. 

En relación al objetivo específico "c)", dirigido a determinar los resultados de la fase de implementación de la plataforma, se concluye que el proceso de codificación arrojó como resultado la construcción de un MVP plenamente operativo al término de cuatro Sprints. En 

96 

esta fase se comprobó la alta eficacia de integrar el marco de trabajo Scrum con las prácticas de ingeniería de Extreme Programming (XP), hibridación metodológica que permitió desarrollar de manera iterativa el frontend  y el backend , manteniendo un código limpio y asegurando entregas modulares continuas. 

En relación al objetivo específico "d)", centrado en validar el correcto funcionamiento de los módulos principales de la plataforma, se concluye que el sistema superó exitosamente la evaluación técnica en un entorno de pruebas controlado. Los resultados extraídos de la Ficha de Análisis Documental evidenciaron un cumplimiento del 100% en las pruebas funcionales de los procesos críticos (generación de _tokens_ JWT, búsquedas parametrizadas y borrado lógico), demostrando que el código implementado alcanza los niveles de operatividad y fiabilidad funcional requeridos para soportar de manera estructurada el catálogo de productos C2C. 

En relación al objetivo específico "e)", respecto a evaluar la usabilidad de la plataforma desarrollada con los usuarios piloto, se concluye que el sistema alcanzó un nivel de aceptabilidad sobresaliente en la muestra evaluada de 20 ciudadanos. Los resultados obtenidos mediante la aplicación de la Escala de Usabilidad del Sistema (SUS) arrojaron un Score promedio de 83.5 puntos, lo cual categoriza técnicamente la usabilidad de la interfaz en el rango de “Excelente”. Este hallazgo evidencia empíricamente que la herramienta tecnológica no solo es intuitiva y presenta una curva de aprendizaje mínima, sino que logra mitigar eficazmente la fricción en la interacción digital, consolidándose como una solución robusta y de fácil adopción para conectar de manera efectiva la oferta y la demanda en la región de Ayacucho. 

97 

## **5.2. Recomendaciones** 

A partir de los resultados obtenidos, las conclusiones formuladas y las limitaciones identificadas durante el desarrollo de la investigación, se proponen las siguientes recomendaciones para futuras iteraciones del proyecto o investigaciones afines: 

1. **Despliegue en Entorno de Producción y Pruebas de Estrés:** Se recomienda escalar el sistema desde el entorno controlado actual hacia un servidor en la nube de producción ( _Cloud Hosting_ ). Esto permitirá realizar pruebas de estrés y rendimiento ( _Load Testing_ ) con tráfico masivo y concurrente de usuarios reales en toda la región de Ayacucho, evaluando la resiliencia de la base de datos MySQL y la arquitectura Node.js bajo condiciones de alta demanda comercial. 

2. **Evolución hacia un Modelo Transaccional (Integración** _**Fintech**_ **):** Dado que el Producto Mínimo Viable (MVP) solucionó con éxito el contacto entre las partes, el siguiente paso lógico es integrar pasarelas de pago digitales. Se sugiere implementar APIs de billeteras móviles ampliamente utilizadas a nivel local (como Yape o Plin) y procesadores de tarjetas. Esto transformaría la plataforma de un directorio de clasificados a un _Marketplace_ transaccional completo, reteniendo el valor económico dentro del propio sistema. 

3. **Desarrollo de una Aplicación Móvil Nativa:** Confirmada la altísima aceptación del diseño _Mobile First_ y la predilección local por los teléfonos inteligentes, resulta altamente conveniente desarrollar una aplicación móvil nativa o multiplataforma (utilizando tecnologías compatibles con el ecosistema actual, como React Native). Esto permitiría aprovechar el hardware del dispositivo (cámara nativa, geolocalización GPS) y habilitar notificaciones _Push_ , incrementando la retención de los usuarios. 

4. **Automatización de la Moderación de Contenido:** A medida que el volumen de publicaciones crezca, la moderación manual a través del panel de administración (HU15) dejará de ser escalable. Se recomienda integrar herramientas de Inteligencia Artificial (IA) o algoritmos de validación automática que detecten lenguaje inapropiado, imágenes no permitidas o patrones de comportamiento fraudulento antes de que el anuncio sea visible en el _Feed_ público. 

5. **Estrategias de Inclusión y Alfabetización Digital:** Para mitigar la brecha digital identificada en zonas periurbanas o en usuarios de mayor edad, se sugiere incorporar en futuras versiones un módulo de _Onboarding_ interactivo (tutoriales guiados paso a paso en pantalla). Asimismo, acompañar el lanzamiento del software con campañas de 

98 

sensibilización sobre comercio electrónico seguro, garantizando que la tecnología no se convierta en una barrera de entrada, sino en una herramienta de inclusión económica para todos los ciudadanos ayacuchanos. 

99 

## **Referencias bibliográficas** 

Arias, F. G. (2012). El proyecto de investigación: Introducción a la metodología científica (6ª ed.). Episteme. 

Baena, G. (2017). Metodología de la investigación. Grupo Editorial Patria. 

Bangor, A., Kortum, P. T., & Miller, J. T. (2008). An empirical evaluation of the system usability scale. _International Journal of Human-Computer Interaction, 24_ (6), 574594. https://doi.org/10.1080/10447310802205776 

Banks, A., & Porcello, E. (2020). Learning React: Modern Patterns for Developing React Apps (2ª ed.). O’Reilly Media. 

Beck, K. (1999). _Extreme programming explained: Embrace change_ . Addison-Wesley Professional. 

Begoña, O. (2019, 9 de noviembre). About Español. Recuperado el 10 de febrero de 2025 de https://www.aboutespanol.com/que-es-una-pagina-web-3202308 

Bernal Torres, C. A. (2016). Metodología de la investigación: Administración, economía, humanidades y ciencias sociales (4ª ed.). Pearson Education. 

Boduch, A., & Derks, R. (2020). React and React Native: A complete hands-on guide to modern web and mobile development (3ª ed.). Packt. 

Brooke, J. (1996). SUS: A "quick and dirty" usability scale. En P. W. Jordan, B. Thomas, B. A. Weerdmeester, & I. L. McClelland (Eds.), _Usability evaluation in industry_ (pp. 189-194). Taylor & Francis. 

Cámara Peruana de Comercio Electrónico [CAPECE]. (2024). Observatorio Ecommerce Perú 2024: Reporte oficial de la industria. https://www.capece.org.pe/ 

Calvache Hernández, J. (2023). Implementación de una página web para la promoción y gestión de arriendos en la ciudad de Guaranda, año 2023 [Trabajo de Pregrado, Universidad Estatal de Bolívar]. Repositorio Institucional - Universidad Estatal de Bolívar. 

Cantelon, M., Harter, M., Holowaychuk, T., & Rajlich, N. (2017). Node.js in Action (2ª ed.). Manning Publications. 

Casciaro, M. (2016). _Node.js design patterns_ . Packt Publishing. 

100 

Chaffey, D., & Ellis-Chadwick, F. (2019). Digital Business and E-Commerce Management (7ª ed.). Pearson Education. 

Chavez Minaya, C. J. (2024). _Implementación de un sitio web de comercio electrónico para mejorar las ventas en La Tienda Switech – Huaraz; 2024_ [Tesis de pregrado, Universidad Católica Los Ángeles de Chimbote]. Repositorio Institucional ULADECH. 

Consejo Nacional de Ciencia, Tecnología e Innovación Tecnológica (CONCYTEC). (s.f.). Definición de investigación aplicada. Recuperado el 8 de febrero de 2025 de https://vinculate.concytec.gob.pe/encyclopedia/investigacion-aplicada-2/ (vinculate.concytec.gob.pe in Bing). 

Coronel, C., & Morris, S. (2019). _Database systems: Design, implementation, & management_ (13va ed.). Cengage Learning. 

DataReportal. (2024). Digital 2024: Global Overview Report. https://datareportal.com/reports/digital-2024-global-overview-report 

DuBois, P. (2014). MySQL: The Definitive Guide to Using, Programming, and Administering MySQL (5ª ed.). O’Reilly Media. 

Elmasri, R., & Navathe, S. B. (2016). Fundamentals of Database Systems (7ª ed.). Pearson. 

Encalada, S., & Gómez, O. (2022). Profesionales Perú: Plataforma digital para publicar anuncios de servicios profesionales y oficios [Tesis de Postgrado, Universidad Autónoma del Perú]. Repositorio Institucional - Universidad Autónoma del Perú. 

Enríquez, J. G., & Casas, S. I. (2013). Usabilidad en aplicaciones móviles. Informes Científicos Técnicos - UNPA, 5(2), 25-47. 

Flanagan, D. (2020). JavaScript: The Definitive Guide: Master the World’s Most-Used Programming Language (7ª ed.). O’Reilly Media. 

Freeman, E., & Robson, E. (2011). _Head First HTML5 Programming: Building Web Apps with JavaScript_ . O'Reilly Media. 

Hassan Montero, Y. (2015). Experiencia de Usuario: Principios y Métodos. El Profesional de la Información. 

101 

Herrera, D. (2023, 20 de noviembre). Qué es una página web estática, cómo funciona y cómo crearla. Recuperado el 10 de febrero de 2025 de 

https://www.hostinger.es/tutoriales/pagina-web-estatica 

Herron, D. (2020). Node.js Web Development: Server-side development with Node 14 (5ª ed.). Packt. 

Organización Internacional de Normalización. (2023). _Systems and software engineering — Systems and software Quality Requirements and Evaluation (SQuaRE) — Product quality model_ (ISO/IEC 25010:2023). 

International Organization for Standardization. (2019). Ergonomics of human-system interaction — Part 210: Human-centred design for interactive systems (ISO 9241-210:2019). 

Instituto Nacional de Estadística e Informática [INEI]. (2024). Estadísticas de las Tecnologías de Información y Comunicación en los Hogares: Informe Técnico N° 01-2024. Gobierno del Perú. 

Instituto Nacional de Estadística e Informática [INEI]. (2024). Estadísticas de las Tecnologías de Información y Comunicación en los Hogares: Trimestre Enero-Febrero-Marzo 2024. Informe Técnico N° 2. 

Kotler, P. (1988). Dirección de marketing: análisis, planificación, implementación y control. Prentice Hall. 

Kotler, P., Kartajaya, H., & Setiawan, I. (2021). Marketing 5.0: Technology for Humanity. Wiley. 

Laudon, K. C., & Laudon, J. P. (2020). Management Information Systems: Managing the Digital Firm (16ª ed.). Pearson Education. 

Laudon, K. C., & Traver, C. G. (2021). E-Commerce 2021-2022: Business, Technology, Society (17ª ed.). Pearson. 

López, M. (2021, 1 de febrero). Páginas web estáticas vs páginas web dinámicas. Recuperado el 10 de febrero de 2025 de https://openwebinars.net/blog/paginas-web-estaticasvs-paginas-web-dinamicas/ 

Mikowski, M. S., & Powell, J. C. (2014). Single Page Web Applications: JavaScript end-to-end. Manning Publications. 

102 

Mora, C. (2024, 13 de noviembre). ¿Qué es una página web dinámica? Tipos, usos y cómo crear una. Recuperado el 10 de febrero de 2025 de https://www.hostinger.es/tutoriales/pagina-web-dinamica 

Nielsen, J. (2012). _Usability 101: Introduction to usability_ . Nielsen Norman Group. https://www.nngroup.com/articles/usability-101-introduction-to-usability/ 

Ñahuirima Tica, L. (2018). Análisis, diseño e implementación de una plataforma y aplicación web móvil para el marketing virtual en Andahuaylas [Tesis de Pregrado, Universidad Nacional José María Arguedas]. Repositorio Institucional - Universidad Nacional José María Arguedas. 

Orihuela Sucasaire, N. (2024). _Uso de plataforma Marketplace Facebook y su impacto en las ventas personales_ [Tesis de pregrado, Universidad Peruana Unión]. Repositorio Institucional UPeU. 

O’Guinn, T., Allen, C., & Semanik, R. (1999). Publicidad y promoción integral de la marca. South-Western College Publishing. 

Pastor Casas, I. (2024). Desarrollo de una plataforma de anuncios clasificados BEEFRIP [Trabajo de Fin de Grado, Universidad de Valladolid]. Repositorio Institucional - Universidad de Valladolid. 

Pérez, J., & Merino, M. (2023, 6 de junio). Usabilidad: Qué es, características, definición y concepto. Recuperado el 9 de febrero de 2025 de https://definicion.de/usabilidad/ 

Pressman, R. S., & Maxim, B. R. (2021). Ingeniería de software: Un enfoque práctico (9ª ed.). McGraw-Hill Interamericana. 

Ramírez-Acosta, K. (2017). Interfaz y experiencia de usuario: parámetros importantes para un diseño efectivo. Tecnología en Marcha, 30(5), 49-55. https://www.scielo.sa.cr/scielo.php?pid=S0379-39822017000500049 

Rojas León, E. A. (2016). Desarrollo de una aplicación web para anuncios clasificados de productos y servicios para la ciudadanía lojana, utilizando herramientas libres [Tesis de pregrado, Universidad Nacional de Loja]. Universidad Nacional de Loja. 

103 

Salas, F. (s.f.). Web de anuncios y clasificados con WordPress: Mi recomendación. Recuperado el 10 de febrero de 2025 de https://fransalas.com/web-de-anuncios-yclasificados-wordpress/ 

Sánchez, L., & Vergara, S. (2021). Plataforma digital y su influencia en la distribución de multiservicios profesionales [Tesis de Pregrado, Universidad Privada del Norte]. Repositorio Institucional - Universidad Privada del Norte. 

Schwartz, B., Zaitsev, P., & Tkachenko, V. (2012). High Performance MySQL: Optimization, Backups, and Replication (3ª ed.). O’Reilly Media. 

SCRUMstudy. (2022). Guía de los fundamentos de Scrum: Guía del SBOK (4ª ed.). SCRUMstudy. 

Sommerville, I. (2011). Ingeniería de software (9ª ed.). Pearson Educación. 

Strauss, J., & Frost, R. (2016). E-Marketing (7ª ed.). Routledge. 

Subramanian, V. (2019). Pro MERN Stack: Full Stack Web App Development with Mongo, Express, React, and Node (2ª ed.). Apress. 

Tilkov, S., & Vinoski, S. (2010). Node.js: Using JavaScript to build high-performance network programs. _IEEE Internet Computing_ , _14_ (6), 80-83. https://doi.org/10.1109/MIC.2010.145 

Wroblewski, L. (2011). _Mobile first_ . A Book Apart. 

104 

## **Anexo** 

## **Anexo 1. Matriz de Consistencia** 

Título: Plataforma web de anuncios clasificados para la región de Ayacucho, 2025 

|**PROBLEMAS**|**OBJETIVOS**|**VARIABLES**|**MÉTODO DE INVESTIGACIÓN**|
|---|---|---|---|
|PROBLEMA GENERAL|OBJETIVO GENERAL|VARIABLE  DE INTERÉS|TIPO DE INVESTIGACIÓN|
|¿Cuáles son los resultados del desarrollo de|Desarrollar una plataforma web de|X: Plataforma Web de|Aplicada|
|una plataforma web de anuncios clasificados|anuncios clasificados de bienes, servicios|anuncios clasificados|NIVEL DE INVESTIGACIÓN|
|de bienes, servicios y oportunidades locales|y oportunidades locales para la región de|VARIABLE DESCRIPTIVA|Descriptivo|
|para la región de Ayacucho, 2025?|Ayacucho, 2025.|**X1:**Análisis|DISEÑO|
|||**X2:**Diseño|No experimental|
|PROBLEMAS ESPECÍFICOS|OBJETIVOS ESPECÍFICOS|**X3:**Implementación|POBLACIÓN|
|1. ¿Cuáles son los resultados de la fase de|1. Determinar los resultados de la fase de|**X4:**Funcionamiento|Usuarios interesados y potenciales anunciantes|
|análisis del desarrollo de la plataforma|análisis del desarrollo de la plataforma|**X5:**Usabilidad|en la plataforma de la región Ayacucho|
|web de anuncios clasificados para la|web de anuncios clasificados para la||MUESTRA|
|región de Ayacucho, 2025?|región de Ayacucho, 2025.||Se realizó un muestreo no probabilístico por|
|2. ¿Cuáles son los resultados de la fase de|2. Determinar los resultados de la fase de||juicio de experto para lograr:|
|diseño del desarrollo de la plataforma web|diseño del desarrollo de la plataforma||•<br>10 usuarios interesados en encontrar|
|de anuncios clasificados para la región de|web de anuncios clasificados para la||anuncios|
|Ayacucho, 2025?|región de Ayacucho, 2025||•<br>10 anunciantes interesados en|
|3. ¿Cuáles son los resultados de la|3. Determinar los resultados de la fase de||publicar sus anuncios|
|implementación del desarrollo de la|implementación del desarrollo de la||TÉCNICA|
|plataforma web de anuncios clasificados|plataforma web de anuncios clasificados||Encuesta|
|para la región de Ayacucho, 2025?|para la región de Ayacucho, 2025||Entrevistas|
|4. ¿Cuáles son los resultados de la validación|4. Validar el correcto funcionamiento de||Análisis documental|
|del correcto funcionamiento de los|los módulos principales de la plataforma||INSTRUMENTO|
|módulos principales de la plataforma|web.||●<br>Cuestionario|
|web?|5. Evaluar la usabilidad de la plataforma||●<br>Guía de entrevista|
|5. ¿Cuál es el nivel de usabilidad de la|web desarrollada mediante la||●<br>Ficha de análisis documental.|
|plataforma web desarrollada, tras ser|participación de los usuarios piloto.|||
|evaluada por los usuarios piloto?||||



_Nota_ Elaboración propia 

105 

## **Anexo 4: Detalle de Historias de usuario del Product Backlog** 

## **Tabla A.1** 

Historia de Usuario 01: Registro de Usuario Nuevo 

|**ID**|**HU-01**|
|---|---|
|Nombre|Registro de Usuario Nuevo|
|Prioridad|Alta|
|Descripción|Como visitante de la plataforma,|
||Quiero completar un formulario de registro con mis datos básicos,|
||Para poder crear una cuenta y publicar mis propios anuncios.|
|Criterios de|1. El formulario debe solicitar: Nombre completo, Email,|
|Aceptación|Contraseña y Ciudad (Ayacucho/Huanta/etc).|
||2. Validar que el Email no exista previamente en la base de datos|
||MySQL.|
||3. La contraseña debe tener mínimo 6 caracteres.|
||4. Al registrarse exitosamente, la contraseña debe guardarse|
||encriptada (Bcrypt) en la BD.|
||5. El sistema debe redirigir al Login tras el éxito.|
|Estimación|5 Puntos de Historia / Aprox. 8 horas ideales.|
|Desglose de|T1 (Base de Datos): Diseñar y migrar la tablausuariosen MySQL|
|Tareas|asegurando que el campoemailtenga la restricción UNIQUE.|
|Técnicas|T2 (Backend): Desarrollar el controlador y la rutaPOST|
||/api/auth/registeren Node.js.|
||T3 (Backend): Implementar_middlewares_con para exigir formato|
||correcto de correo y longitud mínima (6 caracteres) de la|
||contraseña.|
||T4 (Backend): Integrar la libreríabcrypten el controlador para|
||generar el_hash_criptográfico de la contraseña antes de la|
||persistencia.|



106 

T5 (Frontend): Construir el componente React del formulario de registro aplicando diseño responsivo (Mobile First). T6 (Frontend): Configurar Axios para el envío asíncrono de datos, capturar errores de servidor (ej. "Email ya registrado") y mostrarlos en la UI. T7 (Frontend): Configurar el enrutamiento (React Router) para redirigir automáticamente a la vista de /login al recibir el estado HTTP 201 (Created). 

_Nota_ . Elaboración propia 

## **Tabla A.2** 

_Historia de Usuario 02: Inicio de Sesión (Login)_ 

|**ID**|**HU-02**|
|---|---|
|Nombre|Inicio de Sesión (Login)|
|Prioridad|Alta|
|Descripción|Como usuario registrado,|
||Quiero ingresar mi correo y contraseña,|
||Para acceder a las funcionalidades privadas y que el sistema|
||me reconozca.|
|Criterios de|1. Validar credenciales contra la base de datos.|
|Aceptación|2. Si es correcto, el Backend debe retornar un Token (JWT)|
||para mantener la sesión en React.|
||3. Si es incorrecto, mostrar mensaje de error: "Credenciales|
||inválidas".|
||4. El botón de "Ingresar" debe deshabilitarse mientras carga|
||la petición.|
|Estimación|5 Puntos de Historia  / Aprox. 8 horas ideales.|



107 

Desglose de T1 (Backend): Crear el _endpoint_ POST /api/auth/login y Tareas Técnicas aplicar _middlewares_ para asegurar que ambos campos vengan en la petición. T2 (Backend): Implementar la lógica para buscar al usuario en MySQL y verificar la contraseña. T3 (Backend): Integrar la librería jsonwebtoken para firmar y emitir el _Token JWT_ (incluyendo el ID del usuario) con un tiempo de expiración definido al validar credenciales. T4 (Frontend): Construir el componente del formulario de Login en React con estados locales para los _inputs_ y el estado de carga. T5 (Frontend): Programar la lógica condicional en la UI para deshabilitar el botón "Ingresar" y mostrar un indicador ( _spinner_ ) mientras este cargando. T6 (Frontend): Implementar bloque try/catch con Axios para capturar el error HTTP 401 (Unauthorized) y renderizar la alerta "Credenciales inválidas". T7 (Frontend): Configurar el almacenamiento seguro del JWT y actualizar el estado global de la aplicación (Context API) para persistir la sesión. 

_Nota_ . Elaboración propia 

## **Tabla A.3** 

_Historia de Usuario 03:  Gestión de Perfil_ 

|**ID**|**HU-03**|
|---|---|
|Nombre|Gestión de Perfil|
|Prioridad|Media|
|Descripción|Como usuario registrado,|
||Quiero actualizar mi número de celular y foto de perfil,|



108 

Para que los compradores puedan contactarme fácilmente y generar confianza. 

Criterios de 1. Formulario pre-llenado con los datos actuales del usuario. Aceptación 2. Validar que el campo "Celular" acepte solo 9 dígitos numéricos. 3. Permitir subir una foto de perfil (Avatar). 4. Los cambios deben persistir en la tabla usuarios al guardar. Estimación 5 Puntos de Historia / Aprox. 8 horas ideales. Desglose de T1 (Base de Datos): Verificar/crear campos celular (VARCHAR 9) Tareas Técnicas y avatar_url en la tabla usuarios. T2 (Backend): Crear _endpoint_ PUT /api/usuarios/perfil protegido con _middleware_ JWT. T3 (Backend): Implementar validación de datos con expressvalidator (celular numérico, 9 dígitos). T5 (Frontend): Desarrollar componente React del formulario prellenado consumiendo el estado global del usuario. T6 (Frontend): Integrar consumo de la API mediante Axios y manejar alertas de éxito/error en la UI. 

_Nota_ . Elaboración propia 

## **Tabla A.4** 

_Historia de Usuario 04:  Publicar un Nuevo Anuncio_ 

|**ID**|**HU-04**|
|---|---|
|Nombre|Publicar un Nuevo Anuncio|
|Prioridad|Alta (Crítica)|
|Descripción|Como vendedor (usuario logueado),|
||Quiero llenar un formulario con los datos de mi producto,|



109 

Para ponerlo a la venta en la plataforma. 

Criterios de 1. Campos obligatorios: Título, Descripción, Precio, Categoría con Aceptación un Select dinámico. 2. Validar que el precio sea un valor numérico positivo. 3. Al guardar, el anuncio se registra en la tabla anuncios con estado "activo" y la fecha actual. 4. El id del usuario se debe obtener automáticamente del Token, no del formulario. Estimación 8 Puntos de Historia  / Aprox. 13 horas ideales. Desglose de T1 (Base de Datos): Diseñar la tabla anuncios en MySQL (vía Tareas Técnicas Prisma ORM) estableciendo las llaves foráneas hacia usuarios y categorias, y definir el estado por defecto como "activo". T2 (Backend): Implementar el middleware de autenticación (verificarJWT) para interceptar la petición, desencriptar el Token y extraer el id del usuario inyectándolo en la request (req.usuario.id). T3 (Backend): Crear el endpoint POST /api/anuncios y aplicar express-validator para asegurar que el precio sea numérico. T4 (Frontend): Desarrollar un servicio en React para consumir el endpoint de GET /api/categorias e hidratar el campo Select dinámico del formulario. T5 (Frontend): Construir el componente del formulario controlando los inputs y validando los campos obligatorios del lado del cliente antes del envío. T6 (Frontend): Configurar Axios para enviar la petición POST incluyendo el Token JWT en las cabeceras. T7 (Frontend): Manejar la redirección hacia la vista de "Mis Anuncios" o el detalle del anuncio tras recibir la confirmación de guardado exitoso (HTTP 201). 

_Nota_ . Elaboración propia 

## **Tabla A.5** 

110 

_Historia de Usuario 05:  Cargar Imágenes del Producto_ 

|**ID**|**HU-05**|
|---|---|
|Nombre|Cargar Imágenes del Producto|
|Prioridad|Alta|
|Descripción|Como vendedor,|
||Quiero subir fotos de mi producto al crear el anuncio,|
||Para que los compradores puedan ver el estado real del artículo.|
|Criterios de|1. Permitir subir al menos 1 imagen y máximo 3.|
|Aceptación|2. Validar formato de archivo (solo .jpg, .png) y tamaño máximo|
||(2MB).|
||3. Visualizar una vista previa en el Frontend antes de enviar.|
||4. Las rutas de las imágenes deben guardarse en una tabla relacional|
||(url_imagen) o columna correspondiente.|
|Estimación|8 Puntos de Historia / Aprox. 13 horas ideales.|
|Desglose de|T1 (Base de Datos): Diseñar la tabla relacionalimagenes_anuncio|
|Tareas Técnicas|en MySQL configurando una relación 1 a muchos (1:N) con la tabla|
||anunciosy borrado en cascada (ON DELETE CASCADE).|
||T2 (Backend): Configurar el_middleware_ Multerpara interceptar|
||peticiones entrantes, aplicando unfileFilter(solo .jpg/.png) y un|
||límite de tamaño.|
||T3 (Backend): Configurar el límite de subida múltiple a un máximo|
||de 3 archivos.|
||T4 (Backend): Implementar la lógica para guardar los archivos|
||físicos e insertar masivamente las rutas URL generadas en la tabla|
||imagenes_anunciousando una transacción de base de datos.|
||T5 (Frontend): Construir la interfaz de carga con uninput|
||type="file"múltiple, limitando los formatos aceptados desde el|
||HTML.|



111 

T6 (Frontend): Programar la lógica en React para generar URLs temporales con y renderizar las vistas previas en pantalla antes del envío. T7 (Frontend): Empaquetar los datos del anuncio y los archivos de imagen dentro de un objeto FormData para enviarlos correctamente vía Axios con las cabeceras del Content-Type. 

_Nota_ . Elaboración propia 

## **Tabla A.6** 

_Historia de Usuario 06:  Editar Información de un Anuncio_ 

|**ID**|**HU-06**|
|---|---|
|Nombre|Editar Información de un Anuncio|
|Prioridad|Alta|
|Descripción|Como vendedor,|
||Quiero modificar el precio o descripción de mis anuncios publicados,|
||Para corregir errores o actualizar la oferta.|
|Criterios de|1. Solo el dueño del anuncio puede ver la opción de editar.|
|Aceptación|2. Cargar el formulario con los datos actuales traídos del Backend.|
||3. Permitir guardar los cambios.|
||4. No permitir cambiar el dueño del anuncio.|
|Estimación|5 Puntos de Historia  / Aprox. 8 horas ideales.|
|Desglose de|T1 (Backend): Desarrollar un endpoint para obtener los detalles de|
|Tareas Técnicas|un anuncio específico por su ID (GET /api/anuncios/:id) y así|
||alimentar el formulario.|
||T2 (Backend): Implementar la lógica de seguridad que verifique en|
||la base de datos que el ID del usuario autenticado (extraído del|



112 

Token) coincida exactamente con el dueño original del anuncio antes de permitir cualquier cambio. T3 (Backend): Desarrollar el endpoint de actualización (PUT /api/anuncios/:id) para procesar y modificar únicamente los campos permitidos (precio y descripción), bloqueando la alteración del campo del propietario. T4 (Frontend): Diseñar e integrar en la interfaz de React la lógica que compare al usuario activo con el dueño del anuncio para mostrar u ocultar condicionalmente el botón de "Editar". T5 (Frontend): Construir el formulario de edición, configurándolo para que consuma la API y se rellene automáticamente con la información actual del anuncio al cargar la página. T6 (Frontend): Programar el envío de los datos modificados hacia el servidor mediante una petición asíncrona y estructurar las alertas visuales para confirmar el éxito de la actualización o reportar errores. 

_Nota_ . Elaboración propia 

## **Tabla A.7** 

_Historia de Usuario 07:  Eliminar o Desactivar Anuncio_ 

|**ID**|**HU-07**|
|---|---|
|Nombre|Eliminar o Desactivar Anuncio|
|Prioridad|Media|
|Descripción|Como vendedor,|
||Quiero dar de baja un anuncio,|
||Para que deje de aparecer en los listados si ya lo vendí o me|
||arrepentí.|
||1. Botón "Eliminar" con confirmación (¿Está seguro?).|



113 

Criterios de 2. Implementar Borrado Lógico: Cambiar un campo estado a Aceptación 'INACTIVO' o 'ELIMINADO' en la BD, no borrar el registro físico para mantener historial. Estimación 3 Puntos de Historia / Aprox. 5 horas ideales. Desglose de T1 (Backend): Desarrollar un endpoint (PATCH o PUT Tareas Técnicas /api/anuncios/:id/desactivar) encargado exclusivamente de actualizar el campo de estado del anuncio a 'INACTIVO' en la base de datos. T2 (Backend): Implementar la regla de seguridad que verifique que el usuario autenticado que solicita la desactivación sea el propietario legítimo del anuncio. T3 (Frontend): Diseñar e integrar un botón de "Eliminar/Desactivar" en la vista de gestión de anuncios del usuario. T4 (Frontend): Programar un cuadro de diálogo (modal o alerta) que detenga la acción y exija la confirmación explícita del usuario antes de enviar la petición al servidor. T5 (Frontend): Conectar la acción confirmada con la API y programar la actualización de la interfaz de usuario para que el anuncio desaparezca inmediatamente de la lista visual activa. 

_Nota_ . Elaboración propia 

## **Tabla A.8** 

_Historia de Usuario 08:  Ver "Mis Anuncios"_ 

|**ID**|**HU-08**|
|---|---|
|Nombre|Ver "Mis Anuncios"|
|Prioridad|Media|
|Descripción|Como vendedor,|
||Quiero ver un listado exclusivo de mis publicaciones,|
||Para gestionarlas rápidamente desde mi panel.|



114 

Criterios de 1. Crear una vista privada /misAnuncios. Aceptación 2. El Backend debe filtrar la consulta SQL por el ID del usuario logueado. 3. Mostrar estado del anuncio (Activo/Inactivo). Estimación 3 Puntos de Historia / Aprox. 5 horas ideales. Desglose de T1 (Backend): Implementar un endpoint de consulta Tareas Técnicas (GET /api/anuncios/mis-anuncios) protegido por el _middleware_ de autenticación. T2 (Backend): Configurar la consulta a la base de datos para filtrar y retornar únicamente los anuncios cuyo propietario coincida con el ID de usuario extraído de forma segura desde el Token. T3 (Frontend): Configurar una ruta privada (/misAnuncios) en la navegación de la aplicación, restringiendo el acceso de forma que redirija al _login_ si el usuario no está autenticado. T4 (Frontend): Diseñar y construir el componente visual del panel de usuario, incluyendo indicadores visuales claros (etiquetas o colores) para el estado del anuncio (Activo/Inactivo). T5 (Frontend): Programar el consumo asíncrono de la API al montar la vista y renderizar dinámicamente la lista de anuncios obtenidos en la interfaz. 

_Nota_ . Elaboración propia 

## **Tabla A.9** 

_Historia de Usuario 09:  Visualizar Anuncios Recientes (Home)_ 

|**ID**|**HU-09**|
|---|---|
|Nombre|Visualizar Anuncios Recientes (Home)|



115 

Prioridad Alta Descripción Como visitante, Quiero ver los últimos productos publicados al entrar a la web, 

Para descubrir novedades rápidamente. Criterios de 1. La página de inicio debe mostrar una grilla de tarjetas Aceptación (Cards) de productos. 2. Cada tarjeta muestra: Foto principal, Título, Precio y Ciudad. 3. Ordenar por fecha de creación descendente. 

   4. Mostrar solo anuncios con estado “Activo”. 

- Estimación 5 Puntos de Historia / Aprox. 8 horas ideales. 

- Desglose de T1 (Backend): Desarrollar un endpoint público (GET Tareas Técnicas /api/anuncios/recientes) que no requiera autenticación para permitir el acceso a cualquier visitante. 

   - T2 (Backend): Configurar la consulta a la base de datos aplicando un filtro estricto por estado “Activo” y ordenando los resultados de manera descendente según la fecha de publicación. 

   - T3 (Frontend): Diseñar la estructura de la página principal (Home) implementando un sistema de grillas adaptables 

   - ( _responsive design_ ) bajo el enfoque _Mobile First_ . 

   - T4 (Frontend): Construir el componente visual reutilizable de 

   - “Tarjeta de Producto” ( _Card_ ), asegurando que renderice correctamente la imagen principal, el título, el precio y la ubicación (ciudad). 

   - T5 (Frontend): Programar el consumo de la API al cargar la página de inicio y mapear los datos recibidos para poblar dinámicamente la grilla de tarjetas, incluyendo un estado visual de carga mientras se obtienen los datos. 

116 

_Nota_ . Elaboración propia 

## **Tabla A.10** 

_Historia de Usuario 10:  Ver Detalle de Anuncio_ 

|**ID**|**HU-10**|
|---|---|
|Nombre|Ver Detalle de Anuncio|
|Prioridad|Alta|
|Descripción|Como comprador interesado,|
||Quiero hacer clic en un producto,|
||Para ver toda su información detallada y fotos grandes.|
|Criterios de|1. Ruta dinámica en React.|
|Aceptación|2. Mostrar descripción completa, fecha de publicación y categoría.|
||3. Mostrar carrusel o lista de todas las fotos del producto.|
||4. Mostrar nombre del vendedor.|
|Estimación|5 Puntos de Historia / Aprox. 8 horas ideales.|
|Desglose de|T1 (Backend): Crear un endpoint público (GET /api/anuncios/:id)|
|Tareas Técnicas|para consultar la información específica de un producto mediante|
||su identificador único.|
||T2 (Backend): Configurar la consulta relacional en la base de datos|
||para obtener los datos del anuncio, uniendo (_join_) la información|
||del vendedor (nombre), la categoría y el arreglo de imágenes|
||asociadas.|
||T3 (Frontend): Configurar una ruta dinámica en el sistema de|
||navegación de la aplicación (ej./anuncio/:id) para capturar el|
||identificador desde la URL.|



117 

T4 (Frontend): Construir la vista de detalle, programando el consumo de la API al momento de cargar la página para obtener y almacenar temporalmente los datos del producto. T5 (Frontend): Diseñar e integrar un componente visual interactivo (carrusel o galería) para la correcta visualización e iteración de las múltiples imágenes del producto. T6 (Frontend): Renderizar ordenadamente la información textual (título, precio, descripción, categoría, fecha y nombre del vendedor) asegurando una correcta adaptación a pantallas móviles y de escritorio. 

_Nota_ . Elaboración propia 

## **Tabla A.11** 

_Historia de Usuario 11:  Buscar Anuncios_ 

|**ID**|**HU-11**|
|---|---|
|Nombre|Buscar Anuncios|
|Prioridad|Alta|
|Descripción|Como comprador,|
||Quiero escribir lo que busco en una barra de texto,|
||Para encontrar productos específicos (ej: "Laptop").|
|Criterios de|1. Barra de búsqueda visible en el Header.|
|Aceptación|2. La búsqueda debe coincidir con palabras en el Título o|
||Descripción.|
||3. Si no hay resultados, mostrar mensaje amigable ("No se|
||encontraron coincidencias").|
|Estimación|5 Puntos de Historia / Aprox. 8 horas ideales.|



118 

Desglose de T1 (Backend): Desarrollar un endpoint de consulta público (GET Tareas Técnicas /api/anuncios/buscar) preparado para recibir parámetros de búsqueda ( _query parameters_ ) desde la URL. T2 (Backend): Configurar la consulta a la base de datos para filtrar únicamente anuncios activos que contengan coincidencias parciales del texto buscado, evaluando simultáneamente las columnas de título y descripción. T3 (Frontend): Diseñar e integrar un componente de barra de búsqueda en la cabecera principal ( _Header_ ) de la aplicación, asegurando su correcta visualización en dispositivos móviles y de escritorio. T4 (Frontend): Programar la captura del texto ingresado por el usuario para ejecutar la petición al servidor y actualizar la vista con los resultados obtenidos. T5 (Frontend): Implementar la lógica condicional en la interfaz gráfica para renderizar un componente de retroalimentación amigable en caso de que la respuesta del servidor sea una lista vacía. 

_Nota_ . Elaboración propia 

## **Tabla A.12** 

_Historia de Usuario 12:  Filtrar por Categoría_ 

|**ID**|**HU-12**|
|---|---|
|Nombre|Filtrar por Categoría|
|Prioridad|Media|
|Descripción|Como comprador,|
||Quiero seleccionar una categoría (ej: Vehículos),|
||Para ver solamente anuncios de ese rubro.|
||1. Sidebar o menú con la lista de categorías existentes.|



119 

Criterios de 2. Al hacer clic, recargar el listado filtrando por id de categoría. Aceptación Estimación 3 Puntos de Historia  / Aprox. 5 horas ideales. Desglose de T1 (Backend): Desarrollar un endpoint público (GET Tareas Técnicas /api/categorias) para consultar y listar todas las categorías disponibles en la base de datos. T2 (Backend): Adaptar el endpoint de listado de anuncios o crear uno específico (GET /api/anuncios/categoria/:id) para recibir el identificador de la categoría y filtrar los resultados activos mediante su llave foránea. T3 (Frontend): Diseñar e integrar un componente de navegación (Sidebar o Menú superior) que consuma el endpoint de categorías y genere la lista de opciones dinámicamente. T4 (Frontend): Programar el evento de interacción ( _clic_ ) en las categorías del menú para capturar el ID seleccionado y ejecutar una nueva petición al servidor. T5 (Frontend): Actualizar la vista de la grilla principal de anuncios con los datos filtrados recibidos, manejando un estado de carga transitorio para una mejor experiencia de usuario. 

_Nota_ . Elaboración propia 

## **Tabla A.13** 

_Historia de Usuario 13:  Contactar vía WhatsApp_ 

|**ID**|**HU-13**|
|---|---|
|Nombre|Contactar vía WhatsApp|
|Prioridad|Alta|
|Descripción|Como comprador,|
||Quiero un botón directo de WhatsApp en el detalle del|
||anuncio,|



120 

Para chatear con el vendedor sin intermediarios. Criterios de 1. Botón verde visible "Contactar por WhatsApp". Aceptación 2. Al hacer clic, abrir la API de WhatsApp. 3. El mensaje predeterminado debe incluir qué producto me interesa (ej: "Hola, vi tu anuncio de la Laptop en la web..."). Estimación 3 Puntos de Historia  / Aprox. 5 horas ideales. Desglose de T1 (Backend): Asegurar que el endpoint de detalle del Tareas Técnicas anuncio (GET /api/anuncios/:id) exponga correctamente el número de celular del vendedor mediante la relación con la tabla de usuarios. T2 (Frontend): Diseñar e integrar el botón de contacto en la vista de detalle, aplicando estilos visuales distintivos (color verde) para fomentar la interacción del usuario ( _Call to Action_ ). T3 (Frontend): Programar la lógica para construir dinámicamente la URL de la API de WhatsApp, inyectando el número telefónico del vendedor y codificando el título del anuncio dentro del parámetro de texto predeterminado. T4 (Frontend): Configurar el evento de clic del botón para que abra el enlace generado en una nueva pestaña del navegador, garantizando que el usuario no pierda la vista de la plataforma original. 

_Nota_ . Elaboración propia 

## **Tabla A.14** 

_Historia de Usuario 14:  Gestión de Categorías_ 

|**ID**|**HU-14**|
|---|---|
|Nombre|Gestión de Categorías|



121 

Prioridad Baja Descripción Como administrador, Quiero agregar o editar categorías, Para organizar mejor los productos de la plataforma. Criterios de 1. CRUD simple de categorías (Tabla categorias). Aceptación 2. Solo accesible para usuarios con rol = 'admin'. Estimación 3 Puntos de Historia  / Aprox. 5 horas ideales. Desglose de T1 (Backend): Implementar un _middleware_ de autorización Tareas Técnicas exclusivo que intercepte la petición y valide que el rol del usuario autenticado (extraído del Token) sea estrictamente igual a 'admin'. T2 (Backend): Desarrollar los endpoints de administración (POST, PUT, DELETE sobre /api/categorias) para gestionar la creación, modificación y eliminación de registros en la base de datos. T3 (Frontend): Configurar una ruta de navegación altamente protegida (ej. /admin/categorias), programando una redirección automática hacia la página de inicio si un usuario con rol regular intenta acceder. T4 (Frontend): Construir la interfaz del panel de control administrativo, incluyendo una tabla de datos para visualizar las categorías existentes y formularios modales simples para las acciones de agregar y editar. T5 (Frontend): Programar el consumo asíncrono de los endpoints de administración y gestionar las alertas de éxito o error en la interfaz tras cada operación. 

_Nota_ . Elaboración propia 

## **Tabla A.15** 

_Historia de Usuario 15:  Moderación de Anuncios_ 

122 

|**ID**|**HU-15**|
|---|---|
|Nombre|Moderación de Anuncios|
|Prioridad|Baja|
|Descripción|Como administrador,|
||Quiero poder eliminar cualquier anuncio,|
||Para borrar contenido ofensivo, ilegal o spam.|
|Criterios de|1. El admin puede ver un botón "Borrar" en cualquier|
|Aceptación|anuncio, sin ser el dueño.|
||2. Eliminación lógica o física inmediata.|
|Estimación|3 Puntos de Historia  / Aprox. 5 horas ideales.|
|Desglose de|T1 (Backend): Modificar la lógica del endpoint de|
|Tareas Técnicas|eliminación de anuncios (PUToPATCH /api/anuncios/:id)|
||para que autorice la acción si el usuario es el propietario|
||legítimo o si el usuario autenticado posee el rol de 'admin'.|
||T2 (Frontend): Actualizar la interfaz de detalle de anuncio y|
||las grillas de resultados, implementando una lógica|
||condicional que haga visible el botón "Borrar" a los usuarios|
||con privilegios administrativos, sin importar quién sea el|
||autor de la publicación.|
||T3 (Frontend): Conectar la acción de este botón de|
||moderación con la API, asegurando que se solicite|
||confirmación al administrador antes de procesar la baja del|
||anuncio.|
||T4 (Frontend): Configurar la actualización de la vista y la|
||redirección automática tras una eliminación exitosa,|
||manejando la retroalimentación visual correspondiente.|



_Nota_ . Elaboración propia 

123 

## **Anexo 5: Entregables de Ingeniería de Software (Arquitectura y Diseño)** 

## _**5.1. El Diagrama de Arquitectura**_ 

## **Figura 29** 

_Diagrama de arquitectura de la plataforma de anuncios publicitarios en Ayacucho_ 

_Nota_ : Elaboración propia 

## _**5.2. El Diagrama Entidad-Relación (DER) de MySQL.**_ 

**Figura 30** 

_Diagrama Entidad - Relación_ 

124 

## _Nota_ : Elaboración propia 

## _**5.3. Prototipos de interfaz desarrollados**_ 

## **Figura 31** 

## _Wireframe del catalogo de anuncios para desktop_ 

125 

## _Nota_ . Elaboración propia 

## **Figura 32** 

## _Wireframes de catalogo y detalles de los anuncios, para móviles_ 

## _Nota_ . Elaboración propia 

126 

