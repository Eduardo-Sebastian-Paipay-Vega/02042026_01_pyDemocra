# Arquitectura Documental Modular — Tesis Democra

Proyecto LaTeX modular. El archivo maestro es **`main.tex`**: no contiene texto
académico, solo ensambla módulos con `\input`. El monolito
`proyecto_final_corregido.tex` se conserva **intacto como respaldo** durante la migración.

## Estructura

```
main.tex                      # Maestro: solo \input (sin contenido académico)
config/
  preambulo.tex               # Paquetes, estilo, colores, hipervínculos (responsabilidad única)
frontmatter/
  portada.tex
  dedicatoria.tex
  agradecimiento.tex
  resumen.tex
  abstract.tex
  introduccion.tex
cap01/                        # Un capítulo = una carpeta
  cap01.tex                   # Índice del capítulo: SOLO \chapter + \input de secciones
  1.1_diagnostico.tex         # Una sección/tema = un archivo
  1.2_formulacion.tex
  1.3_hipotesis.tex
  1.4_objetivos.tex
  1.5_justificacion.tex
cap02/ ... cap07/             # (migración en curso — ver estado)
bibliografia/referencias.tex  # (pendiente de migrar)
anexos/anexos.tex             # (pendiente de migrar)
imagenes/                     # Recursos visuales (ver requerimientos_imagenes.md)
```

## Reglas (resumen operativo)

1. **Responsabilidad única:** cada archivo responde a un solo tema/pregunta.
2. **Índice-only:** `capXX.tex` solo tiene `\chapter{...}` + `\input{...}`; nada de prosa.
3. **Nombres:** `numero_tema.tex`, minúsculas, guiones bajos, sin espacios
   (ej. `2.2.3_llm.tex`).
4. **Crecimiento:** un tema nuevo NO se agrega a un archivo existente; se crea un
   `.tex` nuevo y se enlaza con `\input`. Si un archivo supera ~3–6 páginas, dividir.
5. **No destructivo:** no borrar ni fusionar archivos; reorganizar creando nuevos y
   actualizando los `\input`.
6. **Compilación estable:** `main.tex` solo debe hacer `\input` de archivos que existen.
   Los pendientes van comentados con `% TODO`.

## Cómo agregar un tema nuevo

1. Crear `capXX/X.Y_tema.tex` con `\section{...}` (o `\subsection`) y su contenido.
2. Añadir `\input{capXX/X.Y_tema}` en `capXX/capXX.tex`, respetando el orden.
3. Compilar.

## Compilar

```cmd
cd /d D:\espelo\Documento
pdflatex -interaction=nonstopmode main.tex
pdflatex -interaction=nonstopmode main.tex
pdflatex -interaction=nonstopmode main.tex
```

Salida: `main.pdf`.

## Estado de la migración

- [x] `config/preambulo.tex`, `main.tex`
- [x] `frontmatter/` (portada, dedicatoria, agradecimiento, resumen, abstract, introducción)
- [x] `cap01/` (Planteamiento del Problema) — 5 secciones
- [ ] `cap02/` Marco Teórico y Contextual (7 secciones)
- [ ] `cap03/` Material y Métodos (8 secciones)
- [ ] `cap04/` Arquitectura y Diseño (4 secciones)
- [ ] `cap05/` Resultados y Análisis Experimental (4 secciones)
- [ ] `cap06/` Discusión (5 secciones)
- [ ] `cap07/` Conclusiones y Recomendaciones (2 secciones)
- [ ] `bibliografia/referencias.tex`
- [ ] `anexos/anexos.tex`

Cada capítulo pendiente se migra con el mismo patrón de `cap01/` y se activa su
`\input` en `main.tex` al completarse.
