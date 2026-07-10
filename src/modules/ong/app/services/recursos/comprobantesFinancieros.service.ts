import { supabase } from "../../../supabaseClient";
import type { FinancialMutationFeedback, FinancialReceiptCreateInput, FinancialReceiptRow, FinancialReceiptUpdateInput } from "../../modules/resources/types";
import { finanzasSchema, isRouteValueValid, sanitizeFileName, sanitizeOptionalId, sanitizePath, sanitizeText, toDateTimeLabel, toOperationError } from "./shared";

const FINANCE_RECEIPTS_BUCKET = (import.meta.env.VITE_ONG_FINANCE_RECEIPTS_BUCKET ?? import.meta.env.VITE_ONG_EVIDENCE_BUCKET ?? "").trim();

interface ReceiptRow {
  id: string;
  id_transaccion: string;
  tipo_comprobante: string;
  numero_comprobante: string;
  emisor_ruc_dni: string | null;
  emisor_nombre: string | null;
  url_archivo: string | null;
  created_at: string | null;
}

function mapRow(row: ReceiptRow): FinancialReceiptRow {
  return {
    id: row.id,
    transactionId: row.id_transaccion,
    route: row.url_archivo ?? "",
    fileType: row.tipo_comprobante,
    receiptNumber: row.numero_comprobante,
    issuerDocument: row.emisor_ruc_dni ?? "",
    issuerName: row.emisor_nombre ?? "",
    uploadedAt: toDateTimeLabel(row.created_at),
    rawUploadedAt: row.created_at ?? new Date().toISOString(),
  };
}

async function ensureTransactionIsValid(transactionId: string): Promise<void> {
  const { data, error } = await finanzasSchema().from("transacciones").select("id").eq("id", transactionId).limit(1);
  if (error) throw new Error(error.message);
  if (!data?.[0]) throw new Error("La transaccion no existe.");
}

export async function listComprobantesByTransaccion(transactionId: string): Promise<FinancialReceiptRow[]> {
  try {
    const id = sanitizeOptionalId(transactionId);
    if (!id) throw new Error("No se encontro la transaccion.");
    const { data, error } = await finanzasSchema()
      .from("comprobantes_financieros")
      .select("id, id_transaccion, tipo_comprobante, numero_comprobante, emisor_ruc_dni, emisor_nombre, url_archivo, created_at")
      .eq("id_transaccion", id)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return ((data ?? []) as ReceiptRow[]).map(mapRow);
  } catch (error) {
    throw toOperationError(error, "No se pudieron cargar los comprobantes.");
  }
}

export async function createComprobanteFinanciero(input: FinancialReceiptCreateInput): Promise<FinancialReceiptRow> {
  try {
    const transactionId = sanitizeOptionalId(input.transactionId);
    const routeInput = sanitizePath(input.routeInput);
    const fileType = sanitizeText(input.fileType, 50);
    const receiptNumber = sanitizeText(input.receiptNumber, 100);
    const issuerDocument = sanitizeText(input.issuerDocument, 50);
    const issuerName = sanitizeText(input.issuerName, 200);
    const file = input.file ?? null;

    if (!transactionId) throw new Error("La transaccion es obligatoria para adjuntar comprobante.");
    if (!routeInput && !file) throw new Error("Debes adjuntar archivo o indicar ruta del comprobante.");

    await ensureTransactionIsValid(transactionId);

    let resolvedRoute = routeInput;
    if (file) {
      if (FINANCE_RECEIPTS_BUCKET) {
        const fileName = sanitizeFileName(file.name);
        const storagePath = `finanzas/comprobantes/${transactionId}/${Date.now()}-${fileName}`;
        const { error: uploadError } = await supabase.storage.from(FINANCE_RECEIPTS_BUCKET).upload(storagePath, file, { upsert: false });
        if (uploadError) throw new Error(uploadError.message);
        resolvedRoute = `${FINANCE_RECEIPTS_BUCKET}/${storagePath}`;
      } else if (!resolvedRoute) {
        throw new Error("No hay bucket configurado para comprobantes. Debes registrar una ruta manual.");
      }
    }

    if (!resolvedRoute || !isRouteValueValid(resolvedRoute)) throw new Error("La ruta del comprobante no es valida.");

    const payload = {
      id_transaccion: transactionId,
      tipo_comprobante: fileType || "Comprobante",
      numero_comprobante: receiptNumber || `REC-${Date.now()}`,
      emisor_ruc_dni: issuerDocument || null,
      emisor_nombre: issuerName || null,
      url_archivo: resolvedRoute,
    };

    const { data, error } = await finanzasSchema()
      .from("comprobantes_financieros")
      .insert(payload as any)
      .select("id, id_transaccion, tipo_comprobante, numero_comprobante, emisor_ruc_dni, emisor_nombre, url_archivo, created_at")
      .single();
    if (error) throw new Error(error.message);
    return mapRow(data as ReceiptRow);
  } catch (error) {
    throw toOperationError(error, "No se pudo registrar el comprobante.");
  }
}

export async function updateComprobanteFinanciero(input: FinancialReceiptUpdateInput): Promise<FinancialReceiptRow> {
  try {
    const receiptId = sanitizeOptionalId(input.receiptId);
    if (!receiptId) throw new Error("No se encontro el comprobante a editar.");

    const payload: Record<string, string | null> = {};
    if (input.routeInput !== undefined) {
      const route = sanitizePath(input.routeInput);
      if (!route || !isRouteValueValid(route)) throw new Error("La ruta del comprobante no es valida.");
      payload.url_archivo = route;
    }
    if (input.fileType !== undefined) payload.tipo_comprobante = sanitizeText(input.fileType, 50) || "Comprobante";
    if (input.receiptNumber !== undefined) payload.numero_comprobante = sanitizeText(input.receiptNumber, 100) || `REC-${Date.now()}`;
    if (input.issuerDocument !== undefined) payload.emisor_ruc_dni = sanitizeText(input.issuerDocument, 50) || null;
    if (input.issuerName !== undefined) payload.emisor_nombre = sanitizeText(input.issuerName, 200) || null;
    if (Object.keys(payload).length === 0) throw new Error("No hay cambios para actualizar.");

    const { data, error } = await finanzasSchema()
      .from("comprobantes_financieros")
      .update(payload as any)
      .eq("id", receiptId)
      .select("id, id_transaccion, tipo_comprobante, numero_comprobante, emisor_ruc_dni, emisor_nombre, url_archivo, created_at")
      .single();
    if (error) throw new Error(error.message);
    return mapRow(data as ReceiptRow);
  } catch (error) {
    throw toOperationError(error, "No se pudo actualizar el comprobante.");
  }
}

export async function removeOrVoidComprobanteFinanciero(receiptId: string): Promise<FinancialMutationFeedback> {
  try {
    const id = sanitizeOptionalId(receiptId);
    if (!id) throw new Error("No se encontro el comprobante a eliminar.");
    const { error } = await finanzasSchema().from("comprobantes_financieros").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return { id, message: "Comprobante eliminado correctamente." };
  } catch (error) {
    throw toOperationError(error, "No se pudo eliminar el comprobante.");
  }
}

export async function listComprobantesFinancierosByTransaccion(transactionId: string) {
  return listComprobantesByTransaccion(transactionId);
}
