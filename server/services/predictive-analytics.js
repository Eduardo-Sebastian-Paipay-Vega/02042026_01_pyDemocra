import crypto from "node:crypto";

/**
 * Motor de BI Predictivo y Generación Asíncrona de Reportes (Módulo M11 / RF-071, RF-073).
 */

/**
 * Clasifica el riesgo de deserción de un voluntario mediante lógica predictiva.
 *
 * @param {Object} metrics
 * @param {number} metrics.daysSinceLastActivity - Días transcurridos desde su última asistencia.
 * @param {number} metrics.attendanceRate - Tasa de asistencia histórica (0.0 a 1.0).
 * @param {number} metrics.cancellationRate - Tasa de cancelación a eventos sobre la hora (0.0 a 1.0).
 * @param {number} [metrics.totalEventsAssigned=0] - Total de eventos a los que se le ha convocado.
 * @returns {Object} Clasificación del nivel de riesgo e indicadores recomendados.
 */
export function calculateVolunteerAttritionRisk({
  daysSinceLastActivity = 0,
  attendanceRate = 1.0,
  cancellationRate = 0.0,
  totalEventsAssigned = 0,
}) {
  let riskScore = 0;

  // 1. Días de Inactividad (Hasta 40 puntos)
  if (daysSinceLastActivity > 90) {
    riskScore += 40;
  } else if (daysSinceLastActivity > 45) {
    riskScore += 30;
  } else if (daysSinceLastActivity > 30) {
    riskScore += 20;
  } else if (daysSinceLastActivity > 15) {
    riskScore += 10;
  }

  // 2. Tasa de Asistencia Histórica (Hasta 35 puntos)
  if (attendanceRate < 0.4) {
    riskScore += 35;
  } else if (attendanceRate < 0.6) {
    riskScore += 25;
  } else if (attendanceRate < 0.8) {
    riskScore += 15;
  }

  // 3. Tasa de Cancelación / Faltas sobre la hora (Hasta 25 puntos)
  if (cancellationRate > 0.4) {
    riskScore += 25;
  } else if (cancellationRate > 0.2) {
    riskScore += 15;
  } else if (cancellationRate > 0.1) {
    riskScore += 5;
  }

  let riskLevel = "BAJO";
  let recommendedAction = "Mantener comunicación estándar y reconocimientos.";

  if (riskScore >= 70) {
    riskLevel = "CRITICO";
    recommendedAction = "Contacto telefónico prioritario y entrevista de retención.";
  } else if (riskScore >= 50) {
    riskLevel = "ALTO";
    recommendedAction = "Enviar encuesta de satisfacción y reasignación de rol o sede.";
  } else if (riskScore >= 25) {
    riskLevel = "MEDIO";
    recommendedAction = "Enviar recordatorio amigable por WhatsApp o correo.";
  }

  return {
    riskScore: Math.min(100, riskScore),
    riskLevel,
    recommendedAction,
    metricsEvaluated: {
      daysSinceLastActivity,
      attendanceRatePercentage: Math.round(attendanceRate * 100),
      cancellationRatePercentage: Math.round(cancellationRate * 100),
      totalEventsAssigned,
    },
    evaluatedAt: new Date().toISOString(),
  };
}

// Almacenamiento en memoria para cola de reportes asíncronos
const asyncReportJobsQueue = new Map();

/**
 * Encola una tarea asíncrona de generación masiva de reportes.
 *
 * @param {Object} options
 * @param {string} options.reportType - Tipo de reporte ('DESERCION_VOLUNTARIOS', 'FINANCIERO_DONACIONES').
 * @param {Object} [options.filters] - Filtros aplicados al reporte.
 * @param {string} options.requestedBy - ID del usuario solicitante.
 * @returns {Object} Trabajo encolado con ID único.
 */
export function enqueueAsyncReportJob({ reportType, filters = {}, requestedBy }) {
  if (!reportType || !requestedBy) {
    throw new Error("El tipo de reporte y el usuario solicitante son obligatorios.");
  }

  const jobId = `job_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
  const job = {
    jobId,
    reportType,
    filters,
    requestedBy,
    status: "EN_COLA",
    progressPercentage: 0,
    downloadUrl: null,
    enqueuedAt: new Date().toISOString(),
  };

  asyncReportJobsQueue.set(jobId, job);
  return job;
}

/**
 * Procesa en segundo plano una tarea de reporte asíncrono.
 *
 * @param {string} jobId - ID de la tarea a procesar.
 * @returns {Object} Tarea de reporte completada con URL simulada de descarga.
 */
export function processAsyncReportJob(jobId) {
  const job = asyncReportJobsQueue.get(jobId);
  if (!job) {
    throw new Error(`Tarea de reporte con ID ${jobId} no encontrada.`);
  }

  job.status = "PROCESANDO";
  job.progressPercentage = 50;

  // Simulación de renderizado y exportación PDF/Excel
  job.status = "COMPLETADO";
  job.progressPercentage = 100;
  job.completedAt = new Date().toISOString();
  job.downloadUrl = `/api/reports/download/${jobId}.pdf`;

  asyncReportJobsQueue.set(jobId, job);
  return job;
}
