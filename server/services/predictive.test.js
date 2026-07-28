import {
  calculateVolunteerAttritionRisk,
  enqueueAsyncReportJob,
  processAsyncReportJob,
} from "./predictive-analytics.js";

describe("Modulo M11: BI Predictivo y Reportes Asincronos (server/services/predictive-analytics.js)", () => {
  test("clasifica riesgo CRITICO para voluntarios con alta inactividad y baja asistencia", () => {
    const risk = calculateVolunteerAttritionRisk({
      daysSinceLastActivity: 95,
      attendanceRate: 0.35,
      cancellationRate: 0.45,
      totalEventsAssigned: 12,
    });

    expect(risk.riskLevel).toBe("CRITICO");
    expect(risk.riskScore).toBeGreaterThanOrEqual(70);
    expect(risk.recommendedAction).toContain("Contacto telefónico prioritario");
  });

  test("clasifica riesgo BAJO para voluntarios activos con buena asistencia", () => {
    const risk = calculateVolunteerAttritionRisk({
      daysSinceLastActivity: 5,
      attendanceRate: 0.95,
      cancellationRate: 0.0,
      totalEventsAssigned: 20,
    });

    expect(risk.riskLevel).toBe("BAJO");
    expect(risk.riskScore).toBeLessThan(25);
  });

  test("encola y procesa en segundo plano una tarea de reporte asincrono", () => {
    const job = enqueueAsyncReportJob({
      reportType: "DESERCION_VOLUNTARIOS",
      filters: { minRisk: "ALTO" },
      requestedBy: "admin-bi-1",
    });

    expect(job.jobId).toBeDefined();
    expect(job.status).toBe("EN_COLA");

    const processed = processAsyncReportJob(job.jobId);

    expect(processed.status).toBe("COMPLETADO");
    expect(processed.progressPercentage).toBe(100);
    expect(processed.downloadUrl).toContain(job.jobId);
  });
});
