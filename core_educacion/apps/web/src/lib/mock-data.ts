export const ROLES = [
  { id: 'prime',       label: 'PRIME — Acceso total',       color: 'var(--blue)' },
  { id: 'director',    label: 'Director / Rector',          color: 'var(--blue)' },
  { id: 'docente',     label: 'Docente',                    color: 'var(--blue)' },
  { id: 'coordinador', label: 'Coordinador de Matrícula',   color: 'var(--blue)' },
  { id: 'padres',      label: 'Padre / Madre',              color: 'var(--blue)' },
  { id: 'cfo',         label: 'CFO / Tesorera',             color: 'var(--blue)' },
]

export const kpisDirector = {
  inscritos:        300,
  tasaRetencion:    94,
  promedioGeneral:  7.8,
  estudiantesRiesgo: 12,
  ingresoProyectado: 180000,
  recaudado:        156300,
  pctRecaudacion:   86.8,
  deudaPendiente:   38900,
}

export const retencionData = [
  { mes: 'Feb', tasa: 91 },
  { mes: 'Mar', tasa: 92.5 },
  { mes: 'Abr', tasa: 93 },
  { mes: 'May', tasa: 94 },
  { mes: 'Jun', tasa: 94.2 },
]

export const financieroYTD = [
  { mes: 'Ene', ingresos: 28000, egresos: 18000 },
  { mes: 'Feb', ingresos: 31000, egresos: 19500 },
  { mes: 'Mar', ingresos: 29500, egresos: 20000 },
  { mes: 'Abr', ingresos: 33000, egresos: 21000 },
  { mes: 'May', ingresos: 34800, egresos: 22000 },
]

export const riesgoDistribucion = [
  { name: 'Sin riesgo', value: 240, color: '#22C55E' },
  { name: 'Riesgo leve', value: 48,  color: '#F59E0B' },
  { name: 'Riesgo alto', value: 12,  color: '#EF4444' },
]

export const docentes = [
  { id: 1, nombre: 'Prof. García',    materia: 'Matemática', cursos: ['10-A', '10-B', '11-C'], carga: 8,  evaluacion: null, estado: 'activo' },
  { id: 2, nombre: 'Prof. López',     materia: 'Inglés',     cursos: ['9-A', '10-A', '10-B'],  carga: 10, evaluacion: 8.5,  estado: 'activo' },
  { id: 3, nombre: 'Prof. Martínez',  materia: 'Física',     cursos: ['11-A', '11-B'],         carga: 6,  evaluacion: 9.1,  estado: 'activo' },
  { id: 4, nombre: 'Prof. Rodríguez', materia: 'Química',    cursos: ['10-C', '11-A'],         carga: 7,  evaluacion: 7.8,  estado: 'activo' },
]

export const misClasesDocente = [
  { id: 1, nombre: '10-A Matemática', estudiantes: 32, horario: 'L-M-J 08:00–09:30', salon: 'Salón 4', evalPendientes: 3, promedio: 7.9 },
  { id: 2, nombre: '11-B Cálculo',    estudiantes: 28, horario: 'M-J 10:00–11:30',   salon: 'Salón 5', evalPendientes: 5, promedio: 7.2 },
  { id: 3, nombre: '10-B Matemática', estudiantes: 30, horario: 'L-V 07:00–08:30',   salon: 'Salón 3', evalPendientes: 2, promedio: 8.1 },
]

export const estudiantesRiesgo = [
  { nombre: 'Carlos López',   curso: '10-A', promedio: 5.2, asistencia: 72 },
  { nombre: 'Ana Martínez',   curso: '11-B', promedio: 5.8, asistencia: 80 },
  { nombre: 'Pedro Sánchez',  curso: '10-B', promedio: 6.0, asistencia: 75 },
]

export const calificaciones10A = [
  { nombre: 'Juan Pérez',    quiz1: 8.5, examen: 9.0, promedio: 8.7, estado: 'ok' },
  { nombre: 'María García',  quiz1: 9.2, examen: 8.8, promedio: 9.0, estado: 'ok' },
  { nombre: 'Carlos López',  quiz1: 5.3, examen: 5.0, promedio: 5.2, estado: 'riesgo' },
  { nombre: 'Ana Martínez',  quiz1: 7.8, examen: 6.5, promedio: 7.1, estado: 'ok' },
  { nombre: 'Luis Herrera',  quiz1: 8.0, examen: 8.2, promedio: 8.1, estado: 'ok' },
  { nombre: 'Sofia Reyes',   quiz1: 9.5, examen: 9.8, promedio: 9.7, estado: 'ok' },
]

export const asistencia10A = [
  { nombre: 'Juan Pérez',    estado: 'presente' },
  { nombre: 'María García',  estado: 'presente' },
  { nombre: 'Carlos López',  estado: 'ausente' },
  { nombre: 'Ana Martínez',  estado: 'tarde' },
  { nombre: 'Luis Herrera',  estado: 'presente' },
  { nombre: 'Sofia Reyes',   estado: 'presente' },
  { nombre: 'Pedro Sánchez', estado: 'ausente' },
]

export const inscripciones = [
  { id: 1, nombre: 'Juan Pérez',    curso: '10-A', monto: 1200, estado: 'pagado',   fecha: '15 May' },
  { id: 2, nombre: 'María García',  curso: '9-B',  monto: 900,  estado: 'pendiente', fecha: '14 May' },
  { id: 3, nombre: 'Carlos López',  curso: '11-C', monto: 1500, estado: 'deuda',    fecha: '13 May' },
  { id: 4, nombre: 'Ana Martínez',  curso: '10-C', monto: 1200, estado: 'pagado',   fecha: '12 May' },
  { id: 5, nombre: 'Luis Herrera',  curso: '9-A',  monto: 900,  estado: 'pendiente', fecha: '11 May' },
  { id: 6, nombre: 'Sofia Reyes',   curso: '11-A', monto: 1500, estado: 'pagado',   fecha: '10 May' },
]

export const evolucionMatricula = [
  { semana: 'S1', inscritos: 45 },
  { semana: 'S2', inscritos: 102 },
  { semana: 'S3', inscritos: 178 },
  { semana: 'S4', inscritos: 220 },
  { semana: 'S5', inscritos: 245 },
]

export const secciones10 = [
  { id: '10-A', cupos: 32, max: 35, profesor: 'García',   disponible: true  },
  { id: '10-B', cupos: 30, max: 35, profesor: null,       disponible: false, alerta: 'Sin profesor asignado' },
  { id: '10-C', cupos: 20, max: 35, profesor: 'Martínez', disponible: true,  recomendado: true },
]

export const deudores = [
  { familia: 'Familia García',    monto: 3200, dias: '90+', score: 'alto' },
  { familia: 'Familia López',     monto: 2800, dias: '75+', score: 'alto' },
  { familia: 'Familia Rodríguez', monto: 2100, dias: '60',  score: 'medio' },
  { familia: 'Familia Martínez',  monto: 1800, dias: '45',  score: 'medio' },
  { familia: 'Familia Herrera',   monto: 950,  dias: '30',  score: 'bajo' },
]

export const perfilHijo = {
  nombre: 'Juan García',
  curso: '10-A',
  promedio: 8.3,
  asistencia: 96,
  ausenciasInjustificadas: 0,
  retrasos: 2,
  materias: [
    { nombre: 'Inglés',      nota: 9.5, tendencia: 'up' },
    { nombre: 'Matemática',  nota: 8.7, tendencia: 'stable' },
    { nombre: 'Física',      nota: 8.1, tendencia: 'up' },
    { nombre: 'Historia',    nota: 7.8, tendencia: 'stable' },
    { nombre: 'Ed. Física',  nota: 7.2, tendencia: 'down' },
  ],
  planPago: 'Mensual',
  montoPago: 450,
  proximoPago: '30 de mayo',
  estadoPago: 'pagado',
  deuda: 0,
}

export const radarData = [
  { subject: 'Matemática', A: 87 },
  { subject: 'Inglés',     A: 95 },
  { subject: 'Física',     A: 81 },
  { subject: 'Historia',   A: 78 },
  { subject: 'Ed. Física', A: 72 },
  { subject: 'Química',    A: 84 },
]

export const comunicaciones = [
  { id: 1, de: 'Prof. García',  tipo: 'email', hora: '15 May 10:30', asunto: 'Evaluación de Matemática',  preview: 'Juan obtuvo 9.0 en la prueba del 14 de mayo...', leido: false },
  { id: 2, de: 'Coordinadora',  tipo: 'email', hora: '14 May 16:45', asunto: 'Confirmación de Pago',      preview: 'Pago recibido por $450 correspondiente a mayo...', leido: true },
  { id: 3, de: 'Prof. García',  tipo: 'chat',  hora: '14 May 15:20', asunto: 'Consulta de Tarea',         preview: '¿Tienes dudas sobre la tarea asignada?',           leido: true },
]

export const kpisCFO = {
  ingresosHoy:       45200,
  flujoNeto:         12800,
  deudaTotal:        38500,
  totalTransacciones: 234,
}

export const canalesPago = [
  { canal: 'Pasarela Propia', monto: 180000, comision: '1%',      color: '#3B82F6' },
  { canal: 'Stripe',          monto: 45000,  comision: '2.9%',    color: '#22C55E' },
  { canal: 'Mercado Pago',    monto: 12000,  comision: 'Variable', color: '#F59E0B' },
  { canal: 'BNPL Fintech',    monto: 28000,  comision: '3%',      color: '#8B5CF6' },
]

export const flujoCaja = [
  { mes: 'Ene', ingresos: 45000, egresos: 28000 },
  { mes: 'Feb', ingresos: 52000, egresos: 31000 },
  { mes: 'Mar', ingresos: 48000, egresos: 30000 },
  { mes: 'Abr', ingresos: 61000, egresos: 33000 },
  { mes: 'May', ingresos: 58000, egresos: 35000 },
]

export const deudorScore = [
  { score: 'Bajo',  familias: 5,  deuda: 5000,  color: '#22C55E' },
  { score: 'Medio', familias: 12, deuda: 18000, color: '#F59E0B' },
  { score: 'Alto',  familias: 3,  deuda: 8000,  color: '#EF4444' },
]

export const agentesIA = [
  {
    id: 1,
    nombre: 'Coordinador Académico',
    estado: 'ejecutando',
    accionesHoy: 3,
    logs: [
      { hora: '08:30', tipo: 'alerta',      mensaje: 'Detectó 8 alumnos en riesgo (Matemática, promedio <5.5)', propuesta: 'Plan de regularización 3 semanas',     estadoAccion: 'pendiente'  },
      { hora: '10:15', tipo: 'resuelto',    mensaje: 'Conflicto de horarios — Prof. García asignado en dos aulas simultáneas',           propuesta: 'Cambiar 10-B a Sala 4',              estadoAccion: 'aprobada'   },
      { hora: '14:20', tipo: 'analizando',  mensaje: 'Analizando riesgos académicos para la próxima semana...',                         propuesta: null,                                 estadoAccion: 'en_progreso' },
    ],
  },
  {
    id: 2,
    nombre: 'Gestor de Deuda IA',
    estado: 'ejecutando',
    accionesHoy: 2,
    logs: [
      { hora: '09:00', tipo: 'propuesta',  mensaje: 'Familia García: Score 75/100 — Deuda $1,200 (2 cuotas atrasadas)', propuesta: 'BNPL 6 cuotas a 8% anual',      estadoAccion: 'enviada'   },
      { hora: '11:30', tipo: 'ejecutada',  mensaje: 'Familia López: Score 32/100 — Deuda $800 (mora 45 días)',           propuesta: 'Cobranza automática + llamada', estadoAccion: 'ejecutada' },
    ],
  },
]

// ── Marketplace ────────────────────────────────────────────────
export const marketplaceProducts = [
  { id: 1, titulo: 'Álgebra Interactiva',  autor: 'McGraw-Hill Educativa', precio: 50,  rating: 4.9, reviews: 85,  colegios: 200, tipo: 'Curso',    tags: ['Grado 10', 'Matemática'] },
  { id: 2, titulo: 'Álgebra Game',          autor: 'EduStart',              precio: 25,  rating: 4.3, reviews: 32,  colegios: 45,  tipo: 'Juego',    tags: ['Grado 10', 'Gamificación'] },
  { id: 3, titulo: 'Álgebra Clásica',       autor: 'Prof. Juan López',      precio: 10,  rating: 3.2, reviews: 8,   colegios: 8,   tipo: 'Material', tags: ['Grado 10'] },
  { id: 4, titulo: 'Cálculo Diferencial',   autor: 'UniPress Editorial',     precio: 75,  rating: 4.7, reviews: 54,  colegios: 130, tipo: 'Curso',    tags: ['Grado 11', 'Matemática'] },
  { id: 5, titulo: 'Inglés Avanzado B2',    autor: 'Cambridge EduPack',     precio: 60,  rating: 4.8, reviews: 120, colegios: 310, tipo: 'Curso',    tags: ['Grado 10–11', 'Idiomas'] },
]

// ── Pasaporte Digital ──────────────────────────────────────────
export const pasaporteData = {
  nombre: 'Juan García',
  id: 'EL-JG-2015-001',
  dni: '12345678-9',
  creado: '15 Ago 2020',
  colegioActual: 'Colegio ABC (2024–)',
  colegiosAnteriores: 3,
  historial: [
    { grado: 5, año: 2018, promedio: 8.3 },
    { grado: 6, año: 2019, promedio: 8.1 },
    { grado: 7, año: 2020, promedio: 7.9 },
    { grado: 8, año: 2021, promedio: 8.0 },
    { grado: 9, año: 2023, promedio: 8.7 },
    { grado: 10, año: 2024, promedio: 8.9 },
  ],
  competencias: [
    { area: 'Matemáticas',  pct: 89, nivel: 'Avanzado' },
    { area: 'Lectura',      pct: 92, nivel: 'Experto' },
    { area: 'Escritura',    pct: 76, nivel: 'Competente' },
    { area: 'Ciencias',     pct: 85, nivel: 'Avanzado' },
  ],
}

// ── Analytics B2B ──────────────────────────────────────────────
export const analyticsCanales = [
  { canal: 'Sales Directo',        instituciones: 15, cac: 8000,  color: '#3B82F6' },
  { canal: 'Logros Compartidos',   instituciones: 8,  cac: 1200,  color: '#22C55E' },
  { canal: 'Word-of-Mouth',        instituciones: 5,  cac: 600,   color: '#F59E0B' },
  { canal: 'Conferencias',         instituciones: 2,  cac: 3000,  color: '#8B5CF6' },
]

export const logrosCompartidos = [
  { logro: 'Dominé Trigonometría',          shares: 320 },
  { logro: 'Badge Matemático Desbloqueado', shares: 210 },
  { logro: 'Promedio subió a 8.5',          shares: 180 },
  { logro: 'Completé Módulo de Lectura',    shares: 95  },
]

// ── Transacciones CFO ─────────────────────────────────────────
export const transacciones = [
  { id: 'TXN-001', familia: 'Familia Pérez',     concepto: 'Cuota Mayo',         fecha: '15 May 2026', monto: 450,  metodo: 'Stripe',    estado: 'completado' },
  { id: 'TXN-002', familia: 'Familia García',     concepto: 'Cuota Mayo',         fecha: '15 May 2026', monto: 450,  metodo: 'Yape',      estado: 'completado' },
  { id: 'TXN-003', familia: 'Familia Martínez',   concepto: 'Matrícula 2026-I',   fecha: '14 May 2026', monto: 300,  metodo: 'MercadoPago', estado: 'completado' },
  { id: 'TXN-004', familia: 'Familia López',      concepto: 'Cuota Abril + mora', fecha: '14 May 2026', monto: 459,  metodo: 'BNPL',      estado: 'completado' },
  { id: 'TXN-005', familia: 'Familia Herrera',    concepto: 'Cuota Mayo',         fecha: '13 May 2026', monto: 450,  metodo: 'Stripe',    estado: 'completado' },
  { id: 'TXN-006', familia: 'Familia Rodríguez',  concepto: 'Cuota Mayo',         fecha: '13 May 2026', monto: 450,  metodo: 'Yape',      estado: 'pendiente'  },
  { id: 'TXN-007', familia: 'Familia Sánchez',    concepto: 'Matrícula 2026-I',   fecha: '12 May 2026', monto: 300,  metodo: 'Stripe',    estado: 'completado' },
  { id: 'TXN-008', familia: 'Familia Torres',     concepto: 'Cuota Abril',        fecha: '12 May 2026', monto: 450,  metodo: 'MercadoPago', estado: 'fallido'  },
  { id: 'TXN-009', familia: 'Familia Vargas',     concepto: 'Cuota Mayo',         fecha: '11 May 2026', monto: 450,  metodo: 'Stripe',    estado: 'completado' },
  { id: 'TXN-010', familia: 'Familia Flores',     concepto: 'Cuota Marzo + Abril',fecha: '10 May 2026', monto: 900,  metodo: 'BNPL',      estado: 'completado' },
]

// ── EWS Students ───────────────────────────────────────────────
export const ewsStudents = [
  { nombre: 'Carlos López',   curso: '10-A', riesgo: 88, promedio: 5.2, asistencia: 72, diasSinLogin: 5,  motivos: ['Bajo rendimiento', 'Alta inasistencia'], plan: 'Sesión de tutoría + refinanciar cuota', estado: 'critico'  },
  { nombre: 'Ana Martínez',   curso: '11-B', riesgo: 74, promedio: 5.8, asistencia: 80, diasSinLogin: 3,  motivos: ['Bajo rendimiento', 'Deuda pendiente'],   plan: 'Reunión con apoderado + refuerzo académico', estado: 'alto'  },
  { nombre: 'Pedro Sánchez',  curso: '10-B', riesgo: 67, promedio: 6.0, asistencia: 75, diasSinLogin: 4,  motivos: ['Inasistencia recurrente'],               plan: 'Contactar apoderado + justificar ausencias', estado: 'alto'  },
  { nombre: 'Luis Herrera',   curso: '9-A',  riesgo: 45, promedio: 6.8, asistencia: 85, diasSinLogin: 2,  motivos: ['Tendencia a la baja'],                   plan: 'Monitoreo semanal de desempeño',             estado: 'medio' },
  { nombre: 'Sofia Torres',   curso: '11-A', riesgo: 32, promedio: 7.1, asistencia: 88, diasSinLogin: 1,  motivos: ['Leve descenso en Matemática'],           plan: 'Refuerzo de matemáticas',                   estado: 'leve'  },
]

// ── Cursos Docente ─────────────────────────────────────────────
export const cursosDocente = [
  {
    id: 1, titulo: 'Matemática 10-A', codigo: 'MAT-10A', grado: '10°', estado: 'publicado',
    modulos: [
      { id: 1, titulo: 'Álgebra Lineal', temas: [
        { id: 1, titulo: 'Sistemas de ecuaciones', lecciones: ['Métodos de eliminación', 'Método de sustitución', 'Quiz'] },
        { id: 2, titulo: 'Matrices y determinantes', lecciones: ['Operaciones con matrices', 'Determinante 2x2', 'Taller práctico'] },
      ]},
      { id: 2, titulo: 'Trigonometría', temas: [
        { id: 3, titulo: 'Funciones trigonométricas', lecciones: ['Seno, coseno, tangente', 'Identidades', 'Evaluación'] },
      ]},
    ],
  },
  {
    id: 2, titulo: 'Cálculo 11-B', codigo: 'CAL-11B', grado: '11°', estado: 'borrador',
    modulos: [
      { id: 3, titulo: 'Límites y Continuidad', temas: [
        { id: 4, titulo: 'Límites', lecciones: ['Definición de límite', 'Teoremas de límites', 'Práctica guiada'] },
      ]},
    ],
  },
]

// ── Badges ─────────────────────────────────────────────────────
export const badges = [
  { id: 1, nombre: 'Matemático Estrella',     icono: '⭐', xp: 500,  desbloqueado: true,  descripcion: 'Promedio ≥ 9.0 en Matemática',        fecha: 'May 2026' },
  { id: 2, nombre: 'Asistencia Perfecta',     icono: '📅', xp: 300,  desbloqueado: true,  descripcion: '100% asistencia en el mes',            fecha: 'Abr 2026' },
  { id: 3, nombre: 'Participación Activa',    icono: '🙋', xp: 200,  desbloqueado: true,  descripcion: '10+ respuestas en clase',              fecha: 'Mar 2026' },
  { id: 4, nombre: 'Lector Experto',          icono: '📚', xp: 400,  desbloqueado: false, descripcion: 'Completar 5 módulos de lectura',       fecha: null },
  { id: 5, nombre: 'Dominé Trigonometría',    icono: '📐', xp: 600,  desbloqueado: false, descripcion: 'Obtener ≥ 9.0 en examen de trigonometría', fecha: null },
  { id: 6, nombre: 'Colaborador del Año',     icono: '🤝', xp: 250,  desbloqueado: false, descripcion: 'Ayudar a 3+ compañeros en proyectos',  fecha: null },
]

// ── Leaderboard ────────────────────────────────────────────────
export const leaderboard = [
  { pos: 1, nombre: 'Sofia Reyes',   curso: '10-A', xp: 2840, badges: 8,  promedio: 9.7 },
  { pos: 2, nombre: 'María García',  curso: '10-A', xp: 2650, badges: 7,  promedio: 9.0 },
  { pos: 3, nombre: 'Juan Pérez',    curso: '10-A', xp: 2100, badges: 5,  promedio: 8.7 },
  { pos: 4, nombre: 'Ana Martínez',  curso: '11-B', xp: 1890, badges: 4,  promedio: 7.1 },
  { pos: 5, nombre: 'Luis Herrera',  curso: '9-A',  xp: 1750, badges: 4,  promedio: 6.8 },
  { pos: 6, nombre: 'Pedro Sánchez', curso: '10-B', xp: 1500, badges: 3,  promedio: 6.0 },
  { pos: 7, nombre: 'Carlos López',  curso: '10-A', xp: 1100, badges: 2,  promedio: 5.2 },
]

// ── Misiones semanales ─────────────────────────────────────────
export const misiones = [
  { id: 1, titulo: 'Resolver 5 ejercicios de álgebra',    xp: 150, progreso: 3, total: 5, tipo: 'academico', expira: '18 May' },
  { id: 2, titulo: 'Asistir 5 días consecutivos',         xp: 100, progreso: 4, total: 5, tipo: 'asistencia', expira: '18 May' },
  { id: 3, titulo: 'Obtener ≥ 8.0 en próximo quiz',       xp: 200, progreso: 0, total: 1, tipo: 'evaluacion', expira: '20 May' },
  { id: 4, titulo: 'Participar en 3 debates de clase',    xp: 120, progreso: 1, total: 3, tipo: 'participacion', expira: '22 May' },
]

// ── Usuarios ───────────────────────────────────────────────────
export const usuarios = [
  { id: 1, nombre: 'Carlos Mendoza',  rol: 'Director',     email: 'c.mendoza@colegio.edu',  estado: 'activo',    ultimo: 'Hoy, 08:34' },
  { id: 2, nombre: 'Ana Torres',      rol: 'Coordinadora', email: 'a.torres@colegio.edu',   estado: 'activo',    ultimo: 'Hoy, 07:55' },
  { id: 3, nombre: 'Prof. García',    rol: 'Docente',      email: 'garcia@colegio.edu',     estado: 'activo',    ultimo: 'Hoy, 08:10' },
  { id: 4, nombre: 'Laura Silva',     rol: 'CFO',          email: 'l.silva@colegio.edu',    estado: 'activo',    ultimo: 'Ayer, 18:20' },
  { id: 5, nombre: 'Familia García',  rol: 'Padre/Madre',  email: 'garcia@gmail.com',       estado: 'activo',    ultimo: 'Ayer, 15:40' },
  { id: 6, nombre: 'Prof. López',     rol: 'Docente',      email: 'lopez@colegio.edu',      estado: 'inactivo',  ultimo: 'Hace 3 días' },
]
