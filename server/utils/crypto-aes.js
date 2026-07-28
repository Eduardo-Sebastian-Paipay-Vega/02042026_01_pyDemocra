import crypto from "node:crypto";
import { config } from "../config.js";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH_BYTES = 12; // 96 bits recomendado para GCM
const AUTH_TAG_LENGTH_BYTES = 16; // 128 bits

/**
 * Deriva una clave simétrica de 256 bits (32 bytes) a partir de una clave dada
 * o utilizando la pimienta configurada en el servidor por defecto.
 */
function derive32ByteKey(secretKey) {
  const sourceKey = secretKey || config.otpPepper || "democra-default-aes-secret-key-32b";
  return crypto.createHash("sha256").update(String(sourceKey)).digest();
}

/**
 * Cifra una cadena de texto claro utilizando AES-256-GCM con autenticación de datos.
 * Retorna un payload codificado en formato `ivHex:authTagHex:ciphertextHex`.
 *
 * @param {string} plainText - Texto en claro a cifrar.
 * @param {string} [customSecretKey] - Clave opcional personalizada.
 * @returns {string} Payload cifrado en formato ivHex:authTagHex:ciphertextHex.
 */
export function encryptAes256(plainText, customSecretKey) {
  if (plainText === null || plainText === undefined) {
    return null;
  }
  const text = String(plainText);
  if (!text) return "";

  const key = derive32ByteKey(customSecretKey);
  const iv = crypto.randomBytes(IV_LENGTH_BYTES);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH_BYTES,
  });

  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

/**
 * Descifra un payload cifrado previamente con `encryptAes256`.
 *
 * @param {string} encryptedPayload - Cadena en formato ivHex:authTagHex:ciphertextHex.
 * @param {string} [customSecretKey] - Clave opcional personalizada usada para cifrar.
 * @returns {string} Texto en claro descifrado.
 */
export function decryptAes256(encryptedPayload, customSecretKey) {
  if (!encryptedPayload || typeof encryptedPayload !== "string") {
    return null;
  }

  const parts = encryptedPayload.split(":");
  if (parts.length !== 3) {
    throw new Error("Formato de payload cifrado invalido. Se esperaba ivHex:authTagHex:ciphertextHex.");
  }

  const [ivHex, authTagHex, ciphertextHex] = parts;
  const key = derive32ByteKey(customSecretKey);
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const ciphertext = Buffer.from(ciphertextHex, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH_BYTES,
  });
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString("utf8");
}
