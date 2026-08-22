import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../supabaseClient", () => ({
  supabase: {
    rpc: vi.fn().mockResolvedValue({ data: "tenant-123", error: null }),
    storage: {
      from: vi.fn().mockReturnThis(),
      upload: vi.fn().mockResolvedValue({ error: null }),
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: "https://cdn.example/avatars/x.png" } }),
    },
  },
}));

import { supabase } from "../../../supabaseClient";
import {
  uploadFileToStorage,
  getPeoplePhotoUploadBucket,
  getVolunteerDocumentsUploadBucket,
  getAdmissionOnboardingEvidenceBucket,
} from "./storage";

function makeFile(name: string, type: string, sizeBytes: number): File {
  const content = new Uint8Array(sizeBytes);
  return new File([content], name, { type });
}

describe("uploadFileToStorage â€” MIME/size validation (src/modules/ong copy)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (supabase.storage.from as ReturnType<typeof vi.fn>).mockReturnValue({
      upload: vi.fn().mockResolvedValue({ error: null }),
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: "https://cdn.example/avatars/x.png" } }),
    });
  });

  it("rechaza un tipo de archivo no permitido para fotos (avatars)", async () => {
    const file = makeFile("malware.exe", "application/x-msdownload", 1024);

    await expect(
      uploadFileToStorage({
        ...getPeoplePhotoUploadBucket(),
        file,
        pathSegments: ["fotos"],
      })
    ).rejects.toThrow(/tipo de archivo no permitido/i);

    expect(supabase.storage.from).not.toHaveBeenCalled();
  });

  it("rechaza un archivo que excede el tamaÃ±o mÃ¡ximo permitido", async () => {
    const oversized = makeFile("foto.png", "image/png", 6 * 1024 * 1024);

    await expect(
      uploadFileToStorage({
        ...getPeoplePhotoUploadBucket(),
        file: oversized,
        pathSegments: ["fotos"],
      })
    ).rejects.toThrow(/tamaÃ±o mÃ¡ximo permitido/i);

    expect(supabase.storage.from).not.toHaveBeenCalled();
  });

  it("acepta un PDF para documentos de admisiÃ³n pero lo rechazarÃ­a como foto de perfil", async () => {
    const pdf = makeFile("dni.pdf", "application/pdf", 2 * 1024 * 1024);

    await expect(
      uploadFileToStorage({
        ...getPeoplePhotoUploadBucket(),
        file: pdf,
        pathSegments: ["fotos"],
      })
    ).rejects.toThrow(/tipo de archivo no permitido/i);

    const result = await uploadFileToStorage({
      ...getVolunteerDocumentsUploadBucket(),
      file: pdf,
      pathSegments: ["documentos"],
    });

    expect(result.fileName).toBe("dni.pdf");
    expect(supabase.storage.from).toHaveBeenCalledWith(getVolunteerDocumentsUploadBucket().bucket);
  });

  it("permite un archivo vÃ¡lido y dentro del lÃ­mite sin cambiar el comportamiento existente", async () => {
    const file = makeFile("evidencia.jpg", "image/jpeg", 1024);

    const result = await uploadFileToStorage({
      ...getAdmissionOnboardingEvidenceBucket(),
      file,
      pathSegments: ["evidencia"],
    });

    expect(result.fileName).toBe("evidencia.jpg");
    expect(supabase.storage.from).toHaveBeenCalledWith(getAdmissionOnboardingEvidenceBucket().bucket);
  });

  it("no valida nada si el caller no pasa allowedMimeTypes/maxSizeBytes (compatibilidad hacia atrÃ¡s)", async () => {
    const file = makeFile("cualquier-cosa.bin", "application/octet-stream", 1024);

    const result = await uploadFileToStorage({
      bucket: "avatars",
      publicBucket: true,
      tenantScoped: true,
      file,
      pathSegments: ["sin-restriccion"],
    });

    expect(result.fileName).toBe("cualquier-cosa.bin");
  });
});

