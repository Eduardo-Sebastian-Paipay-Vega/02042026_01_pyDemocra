import crypto from "node:crypto";

/**
 * Adaptador para la Pasarela de Pagos MercadoPago (Módulo M14 / Latinoamérica).
 */

export async function createMercadoPagoPreference({
  title = "Donacion Democra ONG",
  amount,
  payerEmail,
  configOverride = {},
}) {
  if (!amount || amount <= 0) {
    throw new Error("El monto de MercadoPago debe ser mayor a cero.");
  }
  if (!payerEmail) {
    throw new Error("El correo del pagador es obligatorio.");
  }

  const accessToken = configOverride.accessToken || process.env.MERCADOPAGO_ACCESS_TOKEN;

  if (!accessToken) {
    return {
      success: true,
      provider: "mercadopago-mock",
      preferenceId: `mp_pref_mock_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
      initPoint: "https://www.mercadopago.com/checkout/mock-init-point",
      amount,
      payerEmail,
      simulated: true,
      note: "Preferencia MercadoPago simulada por falta de MERCADOPAGO_ACCESS_TOKEN.",
    };
  }

  try {
    const url = "https://api.mercadopago.com/checkout/preferences";
    const payload = {
      items: [
        {
          title,
          unit_price: Number(amount),
          quantity: 1,
          currency_id: "USD",
        },
      ],
      payer: { email: payerEmail },
      back_urls: {
        success: "https://democra.org/donaciones/exito",
        failure: "https://democra.org/donaciones/error",
        pending: "https://democra.org/donaciones/pendiente",
      },
      auto_return: "approved",
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.message || `Error HTTP ${response.status} de MercadoPago`);
    }

    return {
      success: true,
      provider: "mercadopago",
      preferenceId: data.id,
      initPoint: data.init_point,
      amount,
      payerEmail,
      simulated: false,
    };
  } catch (error) {
    return {
      success: false,
      provider: "mercadopago",
      amount,
      payerEmail,
      error: error.message,
    };
  }
}
