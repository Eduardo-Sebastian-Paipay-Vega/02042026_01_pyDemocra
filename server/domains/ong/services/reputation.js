/**
 * Motor de Reputación y Scoring Automático de Voluntarios (Módulo M01 / RF-006, RF-007).
 * Calcula el puntaje dinámico de reputación (0-100) y asigna medallas y rangos.
 */

/**
 * Calcula la puntuación de reputación de un voluntario según su historial operativo.
 *
 * @param {Object} metrics
 * @param {number} [metrics.attendancesCount=0] - Total de asistencias a eventos/actividades.
 * @param {number} [metrics.onTimeCount=0] - Cantidad de asistencias puntuales.
 * @param {number} [metrics.justifiedAbsences=0] - Faltas justificadas.
 * @param {number} [metrics.unjustifiedAbsences=0] - Faltas injustificadas.
 * @param {number} [metrics.totalHours=0] - Total de horas de voluntariado acumuladas.
 * @param {number} [metrics.averageRating=5.0] - Promedio de calificación por coordinadores (1.0 a 5.0).
 * @returns {Object} Resultado del cálculo de reputación, rango e insignias obtenidas.
 */
export function calculateVolunteerReputation({
  attendancesCount = 0,
  onTimeCount = 0,
  justifiedAbsences = 0,
  unjustifiedAbsences = 0,
  totalHours = 0,
  averageRating = 5.0,
}) {
  const totalEvents = attendancesCount + justifiedAbsences + unjustifiedAbsences;

  // 1. Puntuación de Puntualidad y Asistencia (Peso: 40 puntos)
  let attendanceScore = 40;
  if (totalEvents > 0) {
    const punctualityRatio = onTimeCount / totalEvents;
    const penaltyPerUnjustified = 10;
    const penaltyPerJustified = 2;

    const basePunctuality = punctualityRatio * 40;
    const penalties = (unjustifiedAbsences * penaltyPerUnjustified) + (justifiedAbsences * penaltyPerJustified);
    attendanceScore = Math.max(0, basePunctuality - penalties);
  }

  // 2. Puntuación por Horas Acumuladas (Peso: 30 puntos)
  // Cada 10 horas otorgan 3 puntos, máximo 30 puntos (100 horas)
  const hoursScore = Math.min(30, (totalHours / 100) * 30);

  // 3. Puntuación por Calificación de Coordinadores (Peso: 30 puntos)
  const clampedRating = Math.max(1.0, Math.min(5.0, averageRating));
  const ratingScore = (clampedRating / 5.0) * 30;

  // Sumatoria total (0 a 100)
  const rawScore = attendanceScore + hoursScore + ratingScore;
  const reputationScore = Math.min(100, Math.max(0, Math.round(rawScore * 100) / 100));

  // Determinar Rango e Insignias
  let rank = "Novato";
  let badgeCode = "BRONZE";
  let badgeName = "Insignia de Bronce";

  if (reputationScore >= 95) {
    rank = "Leyenda";
    badgeCode = "PLATINUM";
    badgeName = "Insignia de Platino / Leyenda";
  } else if (reputationScore >= 85) {
    rank = "Lider";
    badgeCode = "DIAMOND";
    badgeName = "Insignia de Diamante";
  } else if (reputationScore >= 70) {
    rank = "Destacado";
    badgeCode = "GOLD";
    badgeName = "Insignia de Oro";
  } else if (reputationScore >= 40) {
    rank = "Activo";
    badgeCode = "SILVER";
    badgeName = "Insignia de Plata";
  }

  return {
    reputationScore,
    rank,
    badgeCode,
    badgeName,
    breakdown: {
      attendanceScore: Math.round(attendanceScore * 100) / 100,
      hoursScore: Math.round(hoursScore * 100) / 100,
      ratingScore: Math.round(ratingScore * 100) / 100,
    },
    totalEvents,
    calculatedAt: new Date().toISOString(),
  };
}
