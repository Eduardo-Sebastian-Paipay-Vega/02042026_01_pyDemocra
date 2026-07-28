import crypto from "node:crypto";

/**
 * Adaptador para la Pasarela de Pagos Culqi / Yape / Plin (Módulo M14 / Perú).
 */

export async function createCulqiCharge({
  amount,
  currency = "PEN",
  email,
  token,
  configOverride = {},
}) {
  if (!amount || amount <= 0) {
    throw new Error("El monto de Culqi debe ser mayor a cero.");
  }
  if (!email) {
    throw new Error("El correo del pagador es obligatorio.");
  }

  const secretKey = configOverride.secretKey || process.env.CULQI_SECRET_KEY;

  if (!secretKey) {
    return {
      success: true,
      provider: "culqi-mock",
      chargeId: `chr_mock_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
      amount,
      currency: currency.toUpperCase(),
      email,
      status: "captured",
      simulated: true,
      note: "Cargo Culqi simulado por falta de CULQI_SECRET_KEY.",
    };
  }

  try {
    const amountInCents = Math.round(amount * 100);
    const url = "https://api.culqi.com/v2/charges";

    const payload = {
      amount: amountInCents,
      currency_code: currency.toUpperCase(),
      email,
      source_id: token || "tkn_live_mock",
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.user_message || `Error Culqi ${response.status}`);
    }

    return {
      success: true,
      provider: "culqi",
      chargeId: data.id,
      amount,
      currency: currency.toUpperCase(),
      email,
      status: "captured",
      simulated: false,
    };
  } catch (error) {
    return {
      success: false,
      provider: "culqi",
      amount,
      email,
      error: error.message,
    };
  }
}
