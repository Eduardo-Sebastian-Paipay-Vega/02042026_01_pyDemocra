import { describe, it, expect } from "vitest";
import * as asignacionesActividadService from "./asignacionesActividad.service";

// Barrel de re-exports hacia actividades.service. Smoke test para asegurar
// que el barrel sigue re-exportando cada simbolo esperado.
describe("asignacionesActividad.service barrel", () => {
  it("re-exporta las funciones de asignaciones de actividades", () => {
    expect(typeof asignacionesActividadService.addAsignacionActividad).toBe("function");
    expect(typeof asignacionesActividadService.assignVoluntarioActividad).toBe("function");
    expect(typeof asignacionesActividadService.listAsignacionesByActividad).toBe("function");
    expect(typeof asignacionesActividadService.removeAsignacionActividad).toBe("function");
    expect(typeof asignacionesActividadService.updateAsignacionActividad).toBe("function");
  });
});
