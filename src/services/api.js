export const requestJson = async (endpoint, options = {}) => {
  const response = await fetch(endpoint, options);
  const raw = await response.text();

  let payload = null;
  try {
    payload = raw ? JSON.parse(raw) : null;
  } catch {
    payload = raw;
  }

  if (!response.ok) {
    const messageFromObject =
      payload && typeof payload === "object"
        ? String(payload.message || payload.error || payload.detail || "").trim()
        : "";
    const messageFromText =
      typeof payload === "string" ? String(payload || "").trim() : "";
    const message =
      messageFromObject ||
      messageFromText ||
      `Request failed: ${response.status} ${response.statusText}`;

    const error = new Error(message);
    error.payload = payload;
    error.status = response.status;
    error.endpoint = endpoint;
    throw error;
  }

  return payload;
};
