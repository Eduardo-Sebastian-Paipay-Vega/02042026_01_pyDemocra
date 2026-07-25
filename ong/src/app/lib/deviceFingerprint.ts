const STORAGE_KEY = "democra.device.fingerprint";

// Identificador estable por navegador, generado una sola vez y persistido en
// localStorage. No intenta huella de hardware/canvas — un UUID aleatorio
// reutilizado es suficiente para que el risk-engine distinga "dispositivo ya
// visto" de "dispositivo nuevo" (server/security/risk-engine.js).
export function getDeviceFingerprint(): string {
  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing) return existing;

    const generated = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, generated);
    return generated;
  } catch {
    return "unknown-device";
  }
}
