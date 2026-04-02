import { explainErrorCode, toErrorResponse } from "../../src/shared/error-explainer.js";

export const getBearerToken = (req) => {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) return null;
  return authHeader.slice("Bearer ".length).trim();
};

export const sendError = (res, statusCode, errorCode, overrides = {}) => {
  const payload = toErrorResponse(errorCode, {
    error_type: overrides.error_type || "security",
    ...overrides,
  });
  res.status(statusCode).json(payload);
};

export const sendUnexpectedError = (res, error, fallbackCode = "IAM-004") => {
  const explained = explainErrorCode(fallbackCode);
  res.status(500).json({
    ...explained,
    error_type: "unexpected",
    message: explained.message,
    debug:
      process.env.NODE_ENV === "production"
        ? undefined
        : String(error?.message || error || "unknown"),
  });
};

export const parseBoolean = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    return ["1", "true", "yes", "y"].includes(value.toLowerCase());
  }

  return false;
};

export const clamp = (value, min, max) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.min(max, Math.max(min, number));
};