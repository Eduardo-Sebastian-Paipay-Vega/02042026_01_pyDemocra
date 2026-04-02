/**
 * INTEGRACIÓN CON KOBOTOOLBOX API
 * 
 * Este módulo maneja todas las operaciones con KoboToolbox:
 * - GET: Obtener submissions de formularios
 * - POST: Enviar nuevos datos a formularios
 * - PATCH: Editar submissions existentes
 * - DELETE: Eliminar submissions
 */

function getKoboApiBaseUrl(): string {
  const raw = (Deno.env.get('KOBO_BASE_URL') || 'https://kf.kobotoolbox.org').trim();
  if (!raw) return 'https://kf.kobotoolbox.org/api/v2';

  const normalized = raw.endsWith('/') ? raw.slice(0, -1) : raw;
  return normalized.endsWith('/api/v2') ? normalized : `${normalized}/api/v2`;
}

// IDs de los formularios
export const KOBO_FORMS = {
  ASISTENCIA_HORAS: 'a7fxQuzKfBijBYKHvgKT5c',
  EJECUCION_EVIDENCIAS: 'aKD5dYnp8VkRpoJ5DJoSi7'
};

/**
 * Cliente HTTP para KoboToolbox
 */
class KoboClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Headers comunes para todas las peticiones
   */
  private getHeaders(): HeadersInit {
    return {
      'Authorization': `Token ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Listar todos los formularios (assets)
   */
  async listAssets() {
    const response = await fetch(`${getKoboApiBaseUrl()}/assets/`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error al listar formularios: ${response.status} - ${errorText}`);
    }

    return await response.json();
  }

  /**
   * Obtener información de un formulario específico
   */
  async getAsset(assetUid: string) {
    const response = await fetch(`${getKoboApiBaseUrl()}/assets/${assetUid}/`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error al obtener formulario ${assetUid}: ${response.status} - ${errorText}`);
    }

    return await response.json();
  }

  /**
   * Obtener submissions (datos enviados) de un formulario
   * @param assetUid - ID del formulario
   * @param params - Parámetros de filtrado (opcional)
   */
  async getSubmissions(assetUid: string, params?: {
    limit?: number;
    start?: number;
    query?: string;
    fields?: string[];
    sort?: string;
  }) {
    const queryParams = new URLSearchParams();
    
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.start) queryParams.append('start', params.start.toString());
    if (params?.query) queryParams.append('query', params.query);
    if (params?.fields) queryParams.append('fields', JSON.stringify(params.fields));
    if (params?.sort) queryParams.append('sort', params.sort);

    const url = `${getKoboApiBaseUrl()}/assets/${assetUid}/data/?${queryParams.toString()}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error al obtener submissions: ${response.status} - ${errorText}`);
    }

    return await response.json();
  }

  /**
   * Enviar un nuevo submission a un formulario
   * @param assetUid - ID del formulario
   * @param data - Datos a enviar (objeto con los campos del formulario)
   */
  async createSubmission(assetUid: string, data: Record<string, any>) {
    const response = await fetch(`${getKoboApiBaseUrl()}/assets/${assetUid}/data/`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error al crear submission: ${response.status} - ${errorText}`);
    }

    return await response.json();
  }

  /**
   * Editar un submission existente
   * @param assetUid - ID del formulario
   * @param submissionId - ID del submission a editar
   * @param data - Datos actualizados
   */
  async updateSubmission(assetUid: string, submissionId: string, data: Record<string, any>) {
    const response = await fetch(`${getKoboApiBaseUrl()}/assets/${assetUid}/data/${submissionId}/`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error al actualizar submission: ${response.status} - ${errorText}`);
    }

    return await response.json();
  }

  /**
   * Eliminar un submission
   * @param assetUid - ID del formulario
   * @param submissionId - ID del submission a eliminar
   */
  async deleteSubmission(assetUid: string, submissionId: string) {
    const response = await fetch(`${getKoboApiBaseUrl()}/assets/${assetUid}/data/${submissionId}/`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error al eliminar submission: ${response.status} - ${errorText}`);
    }

    // DELETE no devuelve contenido
    return { success: true };
  }

  /**
   * Obtener el esquema (estructura) de un formulario
   * Útil para saber qué campos tiene cada formulario
   */
  async getFormSchema(assetUid: string) {
    const asset = await this.getAsset(assetUid);
    return {
      name: asset.name,
      uid: asset.uid,
      deployment_status: asset.deployment__active,
      submission_count: asset.deployment__submission_count,
      fields: asset.content?.survey || [],
      choices: asset.content?.choices || []
    };
  }
}

/**
 * Obtener instancia del cliente Kobo
 */
export function getKoboClient(): KoboClient {
  // Compat: algunos entornos usan KOBO_API_KEY, nueva convencion usa KOBO_TOKEN
  const apiKey = Deno.env.get('KOBO_TOKEN') || Deno.env.get('KOBO_API_KEY');
  
  if (!apiKey) {
    throw new Error('KOBO_TOKEN (o KOBO_API_KEY) no está configurado en las variables de entorno');
  }
  
  return new KoboClient(apiKey);
}


