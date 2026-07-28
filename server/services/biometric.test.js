import { verifyAndSealBiometricSignature } from "./biometric-signature.js";

describe("Modulo M03: Registro y Sellado de Firma Biometrica (server/services/biometric-signature.js)", () => {
  const dummySignatureBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

  test("valida y sella la firma digital generando un hash SHA-256 inmutable", () => {
    const res = verifyAndSealBiometricSignature({
      signerId: "tutor-uuid-456",
      documentType: "CONSENTIMIENTO_MEDICO",
      signatureBase64: dummySignatureBase64,
      metadata: { ipAddress: "192.168.1.50" },
    });

    expect(res.success).toBe(true);
    expect(res.signerId).toBe("tutor-uuid-456");
    expect(res.sha256Seal).toBeDefined();
    expect(res.sha256Seal.length).toBe(64);
    expect(res.status).toBe("SELLADO_INMUTABLE");
  });

  test("lanza error si la cadena de firma base64 esta vacia o es invalida", () => {
    expect(() =>
      verifyAndSealBiometricSignature({
        signerId: "tutor-1",
        signatureBase64: "",
      })
    ).toThrow("La cadena base64 de la firma biométrica es obligatoria.");
  });
});
