export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export class HttpError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

export function optionsResponse(): Response {
  return new Response("ok", {
    headers: corsHeaders,
  });
}

export async function parseJsonBody<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch (error) {
    throw new HttpError(400, "El cuerpo JSON es invalido.", error);
  }
}

export function errorResponse(error: unknown, fallbackMessage: string): Response {
  if (error instanceof HttpError) {
    return jsonResponse(
      {
        error: error.message,
        details: error.details ?? null,
      },
      error.status
    );
  }

  const message =
    error instanceof Error && error.message.trim()
      ? error.message
      : fallbackMessage;

  return jsonResponse({ error: message }, 500);
}
