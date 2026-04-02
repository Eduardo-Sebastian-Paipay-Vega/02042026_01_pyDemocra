import { requestJson } from "../services/api.js";

export const validateRucTaxId = async (ruc) => {
  const cleanRuc = String(ruc || "").replace(/\D/g, "");
  return requestJson(`/api/onboarding/validate-ruc/${encodeURIComponent(cleanRuc)}`);
};