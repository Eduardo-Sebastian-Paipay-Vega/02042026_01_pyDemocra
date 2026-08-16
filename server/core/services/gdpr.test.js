import { generateGdprDataPackage } from "./gdpr-export.js";

describe("Modulo M16: Exportador de Portabilidad GDPR (server/services/gdpr-export.js)", () => {
  test("genera paquete de portabilidad GDPR estructurado correctamente", async () => {
    const res = await generateGdprDataPackage({
      userId: "user-uuid-12345",
      userData: {
        email: "voluntario@democra.org",
        fullName: "Carlos Perez",
      },
    });

    expect(res.success).toBe(true);
    expect(res.userId).toBe("user-uuid-12345");
    expect(res.fileName).toContain("gdpr_export_user-uuid-12345_");
    expect(res.payload.gdprMetadata.regulation).toContain("General Data Protection Regulation");
    expect(res.payload.personalInformation.fullName).toBe("Carlos Perez");
    expect(res.jsonString).toBeDefined();
  });

  test("lanza error si falta el ID de usuario", async () => {
    await expect(generateGdprDataPackage({ userId: "" })).rejects.toThrow(
      "El ID de usuario es obligatorio para generar el paquete GDPR."
    );
  });
});
