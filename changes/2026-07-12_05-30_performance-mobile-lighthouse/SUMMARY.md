# SUMMARY — Performance mobile: medición real + 1 fix

**Qué se hizo:** Se instaló Lighthouse y se midió performance real (mobile + Slow 4G) contra el build de producción de ambas apps (`/` y `/ong`). Se encontró la causa raíz de un Total Blocking Time anormalmente alto en el landing: dos componentes de fondo (`CursorSpotlight`, `GradientBackground`) corren animaciones infinitas sin parar nunca. Se corrigió `CursorSpotlight` (detiene el loop al converger, mismo efecto visual).

**Por qué se hizo:** El usuario preguntó por qué la app es lenta en mobile; en vez de optimizar a ciegas, se midió primero. Los datos mostraron que el problema no es de tamaño de bundle (454KB/367KB, ambos razonables) sino de trabajo continuo desperdiciado en el hilo principal.

**Qué beneficio aporta:** Elimina trabajo de CPU desperdiciado en el landing cuando el usuario no mueve el mouse (la mayor parte de una visita real), sin cambiar nada visualmente. Deja documentado con datos concretos qué más se puede optimizar (`GradientBackground`) y por qué no se tocó (cambia el diseño visual, requiere decisión del usuario).

**Qué funcionalidades quedaron afectadas:** Ninguna. La medición reveló mucha varianza por carga concurrente de la máquina de esta sesión — documentado explícitamente para no tomar los números como precisos, solo como dirección/orden de magnitud.
