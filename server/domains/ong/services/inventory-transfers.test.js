import {
  requestStockTransfer,
  approveAndDispatchTransfer,
  evaluateStockAndAutoPurchaseOrder,
} from "./inventory-transfers.js";

describe("Modulo M06: Transferencias Inter-Sedes y Ordenes de Compra (server/services/inventory-transfers.js)", () => {
  test("crea una solicitud de transferencia de stock inter-sedes exitosamente", () => {
    const trf = requestStockTransfer({
      sourceSedeId: "sede-central",
      targetSedeId: "sede-norte",
      itemId: "item-botiquin",
      quantity: 10,
      requestedBy: "coord-norte",
    });

    expect(trf.transferId).toBeDefined();
    expect(trf.status).toBe("SOLICITADO");
    expect(trf.quantity).toBe(10);
  });

  test("lanza error si la sede de origen y destino son la misma", () => {
    expect(() =>
      requestStockTransfer({
        sourceSedeId: "sede-norte",
        targetSedeId: "sede-norte",
        itemId: "item-1",
        quantity: 5,
        requestedBy: "coord",
      })
    ).toThrow("La sede de origen y destino no pueden ser iguales.");
  });

  test("aprueba y descuenta stock cuando hay disponibilidad suficiente", () => {
    const trf = requestStockTransfer({
      sourceSedeId: "sede-central",
      targetSedeId: "sede-norte",
      itemId: "item-botiquin",
      quantity: 10,
      requestedBy: "coord-norte",
    });

    const approved = approveAndDispatchTransfer({
      transfer: trf,
      approvedBy: "admin-central",
      availableStockAtSource: 25,
    });

    expect(approved.status).toBe("APROBADO_Y_DESPACHADO");
    expect(approved.remainingStockAtSource).toBe(15);
  });

  test("genera orden de compra automatica si el stock cae debajo del umbral minimo", () => {
    const item = { id: "item-kits", name: "Kit Escolar", minStockThreshold: 15 };

    // Evaluacion con stock suficiente
    const resOK = evaluateStockAndAutoPurchaseOrder({ item, currentGlobalStock: 30 });
    expect(resOK.autoPurchaseOrderGenerated).toBe(false);

    // Evaluacion con stock critico (10 <= 15)
    const resAutoPO = evaluateStockAndAutoPurchaseOrder({ item, currentGlobalStock: 10 });
    expect(resAutoPO.autoPurchaseOrderGenerated).toBe(true);
    expect(resAutoPO.purchaseOrderId).toBeDefined();
    expect(resAutoPO.status).toBe("ORDEN_DE_COMPRA_GENERADA");
  });
});
