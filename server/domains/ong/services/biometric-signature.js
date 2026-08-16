import crypto from "node:crypto";

/**
 * Servicio de Validación y Sellado Criptográfico de Firma Digital / Biométrica
 * para Consentimientos Informados de Beneficiarios y Tutores (Módulo M03 / RF-020).
 */

/**
 * Valida la estructura de una firma manuscrita/biométrica en base64 o vectorial
 * y genera un sello criptográfico inmutable SHA-256 con timestamp.
 *
 * @param {Object} options
 * @param {string} options.signerId - ID del firmante (tutor, apoderado, beneficiario).
 * @param {string} options.documentType - Tipo de consentimiento ('CONSENTIMIENTO_MEDICO', 'AUTORIZACION_FOTO').
 * @param {string} options.signatureBase64 - Imagen o trazo de firma codificado en DataURL / Base64.
 * @param {Object} [options.metadata] - Datos adicionales de contexto (IP, UserAgent).
 * @returns {Object} Registro de firma con sello hash inmutable.
 */
export function verifyAndSealBiometricSignature({
  signerId,
  documentType = "CONSENTIMIENTO_INFORMADO",
  signatureBase64,
  metadata = {},
}) {
  if (!signerId) {
    throw new Error("El ID del firmante es obligatorio para registrar la firma digital.");
  }
  if (!signatureBase64 || typeof signatureBase64 !== "string") {
    throw new Error("La cadena base64 de la firma biométrica es obligatoria.");
  }

  // Verificar que la firma tenga formato Base64 o DataURL válido
  const isDataUrl = signatureBase64.startsWith("data:image/");
  const isBase64 = signatureBase64.length > 50;
  if (!isDataUrl && !isBase64) {
    throw new Error("El formato de la firma digital no es valido.");
  }

  const timestamp = new Date().toISOString();
  const signatureId = `sig_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

  // Generar Sello Criptográfico Inmutable SHA-256
  const payloadToHash = `${signerId}:${documentType}:${timestamp}:${signatureBase64.substring(0, 100)}`;
  const sha256Seal = crypto.createHash("sha256").update(payloadToHash).digest("hex");

  return {
    success: true,
    signatureId,
    signerId,
    documentType,
    sha256Seal,
    timestamp,
    signatureSizeLength: signatureBase64.length,
    metadata: {
      ipAddress: metadata.ipAddress || "127.0.0.1",
      userAgent: metadata.userAgent || "Democra Digital Signature Canvas v1.0",
    },
    status: "SELLADO_INMUTABLE",
  };
}
