import { describe, it, expect } from "vitest";
import * as operationService from "./operationService";

// operationService.ts es un barrel de re-exports hacia services/operacion/*.
// Este smoke test solo verifica que el barrel re-exporta correctamente cada
// simbolo (para que nadie borre una re-exportacion sin darse cuenta), ya que
// el resto de los tests importan directamente desde los servicios reales.
describe("operationService barrel", () => {
  it("re-exporta todas las funciones de actividades.service", () => {
    expect(typeof operationService.addAsignacionActividad).toBe("function");
    expect(typeof operationService.assignVoluntarioActividad).toBe("function");
    expect(typeof operationService.changeEstadoActividad).toBe("function");
    expect(typeof operationService.createActividad).toBe("function");
    expect(typeof operationService.getActividadById).toBe("function");
    expect(typeof operationService.getResumenRelacionActividad).toBe("function");
    expect(typeof operationService.listActividades).toBe("function");
    expect(typeof operationService.listAsignacionesByActividad).toBe("function");
    expect(typeof operationService.removeAsignacionActividad).toBe("function");
    expect(typeof operationService.softDeleteActividad).toBe("function");
    expect(typeof operationService.updateActividad).toBe("function");
    expect(typeof operationService.updateAsignacionActividad).toBe("function");
  });

  it("re-exporta todas las funciones de asistencias.service", () => {
    expect(typeof operationService.createAsistencia).toBe("function");
    expect(typeof operationService.closeAsistencia).toBe("function");
    expect(typeof operationService.getAsistenciaById).toBe("function");
    expect(typeof operationService.listAsistencias).toBe("function");
    expect(typeof operationService.markAsistenciaIncidencia).toBe("function");
    expect(typeof operationService.removeAsistencia).toBe("function");
    expect(typeof operationService.updateAsistencia).toBe("function");
  });

  it("re-exporta todas las funciones y constantes de aprobaciones.service", () => {
    expect(typeof operationService.createAprobacion).toBe("function");
    expect(typeof operationService.getAprobacionDetail).toBe("function");
    expect(typeof operationService.listAprobaciones).toBe("function");
    expect(typeof operationService.resolveAprobacion).toBe("function");
    expect(typeof operationService.trySyncApprovalForEntity).toBe("function");
    expect(operationService.HOURS_APPROVAL_ENTITY).toBeDefined();
    expect(operationService.EVIDENCE_APPROVAL_ENTITY).toBeDefined();
  });

  it("re-exporta todas las funciones de evidencias.service", () => {
    expect(typeof operationService.createEvidencia).toBe("function");
    expect(typeof operationService.getEvidenciaById).toBe("function");
    expect(typeof operationService.listEvidencias).toBe("function");
    expect(typeof operationService.removeEvidencia).toBe("function");
    expect(typeof operationService.updateEvidencia).toBe("function");
    expect(typeof operationService.validateEvidencia).toBe("function");
  });

  it("re-exporta todas las funciones de horas.service", () => {
    expect(typeof operationService.createHoras).toBe("function");
    expect(typeof operationService.getHorasById).toBe("function");
    expect(typeof operationService.listHoras).toBe("function");
    expect(typeof operationService.removeHoras).toBe("function");
    expect(typeof operationService.requestHoursApproval).toBe("function");
    expect(typeof operationService.resolveHoras).toBe("function");
    expect(typeof operationService.updateHoras).toBe("function");
  });
});
