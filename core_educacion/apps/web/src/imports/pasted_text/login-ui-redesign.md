# UI DESIGN FIX — LOGIN SCREEN

Rediseña ÚNICAMENTE la interfaz visual de esta pantalla de inicio de sesión.

IMPORTANTE:
- NO cambies la lógica de autenticación.
- NO cambies las rutas.
- NO cambies los nombres de variables.
- NO cambies los roles disponibles.
- NO cambies validaciones.
- NO cambies la estructura funcional del formulario.
- NO agregues funcionalidades.
- NO elimines funcionalidades existentes.
- Este trabajo es EXCLUSIVAMENTE de UI/UX, layout, spacing, typography, visual hierarchy, responsiveness y estados visuales.

La pantalla pertenece a un SaaS educativo institucional de la familia visual de democra.pro. Debe sentirse como un producto SaaS profesional, moderno, sobrio y premium, no como un formulario genérico generado automáticamente.

## OBJETIVO PRINCIPAL

Convertir la pantalla actual en una pantalla de login visualmente equilibrada, elegante y profesional.

El diseño debe transmitir:

- SaaS institucional
- tecnología
- educación
- confianza
- profesionalismo
- simplicidad
- precisión

NO utilizar estética de landing page.
NO utilizar ilustraciones innecesarias.
NO utilizar gradientes exagerados.
NO utilizar glassmorphism excesivo.
NO utilizar sombras gigantes.
NO utilizar efectos llamativos.

La sofisticación debe venir de la composición, tipografía, espaciado, superficies y microinteracciones.

---

# 1. COMPOSICIÓN GENERAL

El problema principal de la pantalla actual es el exceso de espacio negro vacío.

Reestructura el viewport completo.

El formulario debe permanecer visualmente centrado tanto horizontal como verticalmente.

No coloques el formulario demasiado abajo.

En desktop:

- utilizar un contenedor central.
- mantener una anchura aproximada de 440–480px.
- asegurar que todo el formulario sea visible dentro del viewport estándar.
- evitar que el usuario tenga que hacer scroll para encontrar el botón principal.
- utilizar padding vertical equilibrado.
- aprovechar mejor el espacio disponible sin llenar innecesariamente la pantalla.

El fondo debe seguir siendo oscuro, pero no debe sentirse como un bloque negro infinito.

Crear una jerarquía de superficies muy sutil:

BODY
→ background oscuro

LOGIN CONTAINER
→ superficie ligeramente elevada

INPUTS
→ superficie ligeramente diferenciada

BORDERS
→ extremadamente sutiles pero visibles

No hacer que todos los elementos tengan exactamente el mismo color.

---

# 2. BACKGROUND

Mantener la identidad dark.

Evitar un negro absoluto plano en toda la pantalla.

Utilizar una escala de negros/grises muy cercana entre sí para crear profundidad.

Ejemplo conceptual:

background:
#090909 / #0B0B0B

card:
#111110 / #121211

inputs:
#171716 / #181817

border:
rgba(255,255,255,0.08)

El resultado debe seguir pareciendo prácticamente negro, pero tener profundidad visual.

Opcionalmente agregar una textura o iluminación ambiental MUY sutil detrás del contenido.

Debe ser casi imperceptible.

NO usar un gran radial-gradient evidente.

---

# 3. BRANDING

Mantener el logo y branding existente.

La estructura debe ser:

[LOGO]

democra.pro
EDUOS PLATFORM

Después:

Iniciar sesión
Semestre 2026-I · Democra School

La marca debe tener mayor presencia visual.

El texto "democra.pro" debe ser claramente reconocible.

"EDUOS PLATFORM" puede continuar siendo pequeño, pero debe tener mejor contraste y spacing.

No deformar el logo.

No cambiar el concepto de identidad visual.

---

# 4. TYPOGRAPHY

Mejorar la jerarquía tipográfica.

Orden visual:

1. Logo / brand
2. "Iniciar sesión"
3. contexto del semestre
4. labels
5. campos
6. acciones secundarias

"Iniciar sesión":

- tamaño aproximadamente 24–28px
- font-weight 600–700
- alto contraste

"Semestre 2026-I · Democra School":

- 13–14px
- contraste secundario

Labels:

- 13–14px
- font-weight 500–600
- claramente legibles

No utilizar tamaños diminutos para información funcional.

---

# 5. ROLE SELECTOR

Rediseñar visualmente la selección de roles.

Mantener EXACTAMENTE los roles existentes:

- PRIME — Acceso total
- Director / Rector
- Docente
- Coordinador de Matrícula
- Padre / Madre
- CFO / Tesorera

Convertir visualmente cada opción en una radio-card compacta.

Cada opción debe tener:

[radio] Nombre del rol

Características:

- altura cómoda
- padding horizontal consistente
- border sutil
- border-radius moderado
- separación pequeña pero visible entre opciones
- hover state
- selected state

El rol seleccionado debe ser inmediatamente identificable.

El estado seleccionado puede utilizar:

- borde ligeramente más brillante
- background ligeramente elevado
- radio interior claramente visible

NO utilizar colores chillones.

El azul institucional puede utilizarse de manera muy controlada para indicar selección/focus.

---

# 6. INPUTS

Mejorar todos los campos:

Correo institucional
Contraseña

Los inputs deben tener:

- altura consistente de aproximadamente 44–48px
- padding horizontal adecuado
- border visible pero discreto
- border-radius consistente
- background ligeramente diferente al card
- placeholder con contraste suficiente

Estados obligatorios:

NORMAL
HOVER
FOCUS
ERROR
DISABLED

En focus:

- utilizar el azul institucional de forma sutil
- no crear un glow gigante
- aumentar ligeramente la claridad del borde

---

# 7. PASSWORD ROW

La fila:

"Contraseña"                    "Olvidé mi contraseña"

debe estar perfectamente alineada.

El label debe permanecer a la izquierda.

El enlace debe permanecer a la derecha.

El enlace debe:

- tener contraste suficiente
- utilizar el azul institucional
- tener hover state
- no parecer un elemento accidental

Debe existir una separación visual correcta entre esta fila y el input.

---

# 8. PRIMARY ACTION

Asegurar que el botón principal de iniciar sesión sea completamente visible dentro del viewport.

Debe tener:

- altura aproximada de 46–50px
- ancho completo
- jerarquía visual claramente superior a las acciones secundarias
- border-radius coherente con los inputs
- estado hover
- estado active
- estado loading
- estado disabled

Utilizar el color de acción institucional.

El botón debe sentirse como el punto final natural del formulario.

---

# 9. SPACING SYSTEM

Eliminar spacing arbitrario.

Utilizar un sistema consistente basado aproximadamente en:

4 / 8 / 12 / 16 / 20 / 24 / 32px

Mantener consistencia entre:

- logo → título
- título → subtítulo
- subtítulo → role selector
- role selector → email
- email → password
- password → botón
- botón → elementos secundarios

No colocar elementos simplemente "porque caben".

Crear ritmo vertical.

---

# 10. CARD

La card del login debe sentirse como una superficie deliberada.

No hacerla excesivamente grande.

No hacerla excesivamente estrecha.

Aproximadamente:

max-width: 460–480px

padding:

32–40px

border:

1px solid rgba(255,255,255,0.07–0.10)

border-radius:

12–16px

shadow:

muy sutil.

La card debe separarse del fondo principalmente mediante contraste de superficie y borde, no mediante una sombra enorme.

---

# 11. RESPONSIVE DESIGN

El diseño debe funcionar correctamente en:

- 1440px+
- 1280px
- 1024px
- tablet
- mobile

En mobile:

- reducir padding lateral
- mantener el formulario prácticamente a ancho completo
- evitar que el contenido se corte
- mantener el botón visible
- reducir espacios verticales excesivos
- conservar la jerarquía visual

El login debe sentirse diseñado para mobile, no simplemente "encogido".

---

# 12. VISUAL QUALITY BAR

Antes de terminar, revisa la pantalla completa y corrige:

- espacios muertos excesivos
- elementos demasiado pequeños
- contrastes insuficientes
- alineaciones inconsistentes
- bordes inconsistentes
- radios inconsistentes
- jerarquía débil
- elementos cortados
- scroll innecesario
- exceso de negro plano
- estados visuales inexistentes

La pantalla final debe parecer diseñada por un equipo profesional de producto/UI y no por un generador automático de formularios.

---

# REGLA FUNDAMENTAL

NO rediseñes la identidad de Democra.

NO conviertas esto en otro producto.

NO agregues componentes decorativos innecesarios.

NO cambies funcionalidades.

NO cambies contenido funcional.

NO inventes nuevos campos.

NO elimines campos.

Solo corrige y eleva la calidad visual de la interfaz existente.

El resultado debe conservar la esencia actual de Democra.pro, pero con una ejecución mucho más madura, equilibrada y profesional.