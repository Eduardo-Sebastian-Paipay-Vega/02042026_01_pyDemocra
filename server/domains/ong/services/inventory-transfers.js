import crypto from "node:crypto";

/**
 * Gestor de Transferencias de Inventario Inter-Sedes y Generación de Órdenes de Compra
 * (Módulo M06 / RF-038, RF-040).
 */

/**
 * Registra una solicitud de transferencia de materiales entre dos sedes.
 *
 * @param {Object} options
 * @param {string} options.sourceSedeId - ID de la sede de origen.
 * @param {string} options.targetSedeId - ID de la sede de destino.
 * @param {string} options.itemId - ID del artículo/material a transferir.
 * @param {number} options.quantity - Cantidad de unidades a transferir.
 * @param {string} options.requestedBy - Usuario solicitante.
 * @returns {Object} Registro de la solicitud de transferencia creada.
 */
export function requestStockTransfer({
  sourceSedeId,
  targetSedeId,
  itemId,
  quantity,
  requestedBy,
}) {
  if (!sourceSedeId || !targetSedeId || !itemId) {
    throw new Error("La sede de origen, sede de destino y el item son obligatorios.");
  }
  if (sourceSedeId === targetSedeId) {
    throw new Error("La sede de origen y destino no pueden ser iguales.");
  }
  if (!quantity || quantity <= 0) {
    throw new Error("La cantidad a transferir debe ser mayor a cero.");
  }

  const transferId = `trf_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
  const requestedAt = new Date().toISOString();

  return {
    transferId,
    sourceSedeId,
    targetSedeId,
    itemId,
    quantity,
    requestedBy,
    status: "SOLICITADO",
    requestedAt,
  };
}

/**
 * Aprueba y despacha una transferencia de inventario pendiente.
 *
 * @param {Object} options
 * @param {Object} options.transfer - Objeto de transferencia creado por `requestStockTransfer`.
 * @param {string} options.approvedBy - ID del usuario/coordinador que aprueba.
 * @param {number} options.availableStockAtSource - Stock disponible actual en la sede de origen.
 * @returns {Object} Transferencia actualizada y descontada.
 */
export function approveAndDispatchTransfer({ transfer, approvedBy, availableStockAtSource }) {
  if (!transfer) {
    throw new Error("La solicitud de transferencia es obligatoria.");
  }
  if (availableStockAtSource < transfer.quantity) {
    throw new Error(`Stock insuficiente en sede origen. Disponible: ${availableStockAtSource}, Requerido: ${transfer.quantity}.`);
  }

  return {
    ...transfer,
    status: "APROBADO_Y_DESPACHADO",
    approvedBy,
    dispatchedAt: new Date().toISOString(),
    remainingStockAtSource: availableStockAtSource - transfer.quantity,
  };
}

/**
 * Evalúa el nivel de stock global de un artículo e inicia automáticamente
 * una Orden de Compra si desciende del umbral mínimo configurado.
 *
 * @param {Object} options
 * @param {Object} options.item - Datos del artículo (id, name, minStockThreshold, targetPurchaseQuantity).
 * @param {number} options.currentGlobalStock - Stock actual sumado entre todas las sedes.
 * @returns {Object} Resultado de la evaluación y Orden de Compra si aplica.
 */
export function evaluateStockAndAutoPurchaseOrder({ item, currentGlobalStock }) {
  if (!item || !item.id) {
    throw new Error("Los datos del item son obligatorios para evaluar la orden de compra.");
  }

  const minStockThreshold = item.minStockThreshold || 10;
  const isCriticalStock = currentGlobalStock <= minStockThreshold;

  if (!isCriticalStock) {
    return {
      autoPurchaseOrderGenerated: false,
      itemId: item.id,
      currentGlobalStock,
      minStockThreshold,
      status: "STOCK_SUFICIENTE",
    };
  }

  const orderQuantity = item.targetPurchaseQuantity || (minStockThreshold * 3);
  const purchaseOrderId = `po_auto_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

  return {
    autoPurchaseOrderGenerated: true,
    purchaseOrderId,
    itemId: item.id,
    itemName: item.name || item.id,
    currentGlobalStock,
    minStockThreshold,
    suggestedOrderQuantity: orderQuantity,
    status: "ORDEN_DE_COMPRA_GENERADA",
    generatedAt: new Date().toISOString(),
  };
}
