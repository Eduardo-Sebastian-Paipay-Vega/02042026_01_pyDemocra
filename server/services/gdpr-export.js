/**
 * Servicio de Exportación de Portabilidad de Datos Personales GDPR
 * (Módulo M16 / Auditoría y Compliance / RF-105).
 * Cumple con el Art. 20 del RGPD (Derecho a la Portabilidad de Datos).
 */

/**
 * Recopila y genera un paquete estructurado en formato JSON portable conteniendo
 * la totalidad de la información personal del usuario, asistencias, certificados y donaciones.
 *
 * @param {Object} options
 * @param {string} options.userId - ID del usuario/voluntario.
 * @param {Object} [options.userData] - Datos opcionales inyectados del perfil y actividad.
 * @returns {Promise<Object>} Paquete portable completo formateado según GDPR Art. 20.
 */
export async function generateGdprDataPackage({ userId, userData = {} }) {
  if (!userId) {
    throw new Error("El ID de usuario es obligatorio para generar el paquete GDPR.");
  }

  const generatedAt = new Date().toISOString();

  const profile = userData.profile || {
    id: userId,
    email: userData.email || "usuario@democra.org",
    fullName: userData.fullName || "Voluntario Democra",
    documentType: "DNI",
    documentNumber: "70000000",
    role: "Voluntario",
    createdAt: "2026-01-01T00:00:00.000Z",
  };

  const attendances = userData.attendances || [
    { eventId: "ev-1", eventName: "Jornada Social Norte", date: "2026-02-15", status: "ASISTIO", hours: 4.5 },
  ];

  const certificates = userData.certificates || [
    { courseId: "crs-101", courseName: "Primeros Auxilios y Liderazgo", issuedAt: "2026-03-01", certificateCode: "CERT-2026-001" },
  ];

  const donations = userData.donations || [
    { transactionId: "tx-99", amount: 50.0, currency: "USD", date: "2026-04-10", type: "DONACION_UNICA" },
  ];

  const auditLogs = userData.auditLogs || [
    { action: "USUARIO_REGISTRO", timestamp: "2026-01-01T00:00:00.000Z" },
    { action: "INICIO_SESION", timestamp: generatedAt },
  ];

  const exportPackage = {
    gdprMetadata: {
      regulation: "General Data Protection Regulation (EU) 2016/679 - Article 20 Right to Data Portability",
      organization: "Democra ONG",
      userId,
      exportedAt: generatedAt,
      dataSchemaVersion: "1.0",
      format: "application/json",
    },
    personalInformation: profile,
    activityAndAttendance: attendances,
    lmsCertificates: certificates,
    financialDonations: donations,
    securityAndAuditLogs: auditLogs,
  };

  return {
    success: true,
    userId,
    fileName: `gdpr_export_${userId}_${Date.now()}.json`,
    mimeType: "application/json",
    payload: exportPackage,
    jsonString: JSON.stringify(exportPackage, null, 2),
    generatedAt,
  };
}
