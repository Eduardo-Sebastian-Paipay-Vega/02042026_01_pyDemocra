/**
 * KoBo -> Supabase Sync (relational model)
 *
 * Reglas (resumen):
 * - No duplicar: si submission ya esta en kobo_submission_procesada, saltar.
 * - Validar usuario por DNI (usuarios.dni). Si no existe: log error y continuar.
 * - Crear 1 actividad por submission.
 * - Upsert actividad_voluntarios (id_actividad,id_usuario) con horas_total + kobo_submission_id + fecha_ultima_actualizacion.
 * - Insert evidencias por attachments.
 * - Logging en kobo_sync_log + kobo_sync_error (sin abortar toda la sync).
 *
 * Nota: El token de KoBo se lee SOLO desde variables de entorno del backend.
 */

function getKoboApiBaseUrl(): string {
  const raw = (Deno.env.get('KOBO_BASE_URL') || 'https://kf.kobotoolbox.org').trim();
  if (!raw) return 'https://kf.kobotoolbox.org/api/v2';

  const normalized = raw.endsWith('/') ? raw.slice(0, -1) : raw;
  return normalized.endsWith('/api/v2') ? normalized : `${normalized}/api/v2`;
}

type SupabaseClientLike = {
  from: (table: string) => any;
};

type KoboAttachment = {
  download_url?: string;
  mimetype?: string;
  filename?: string;
  media_file_basename?: string;
};

export type KoboSubmission = Record<string, any> & {
  _id?: number;
  _uuid?: string;
  start?: string;
  end?: string;
  _submission_time?: string;
  _attachments?: KoboAttachment[];
};

export type KoboSyncParams = {
  assetUid: string;
  formularioCodigo: string;
  filtroDni?: string;
  limit?: number;
};

function getKoboToken(): string {
  // Compat: repo previo usa KOBO_API_KEY. Nueva regla usa KOBO_TOKEN.
  const token = Deno.env.get('KOBO_TOKEN') || Deno.env.get('KOBO_API_KEY');
  if (!token) {
    throw new Error('KOBO_TOKEN (o KOBO_API_KEY) no esta configurado en variables de entorno del backend');
  }
  return token;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeEstadoName(value: unknown): string {
  if (!value) return '';
  return String(value)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_');
}

function normalizeDni(value: unknown): string {
  if (!value) return '';
  return String(value).replace(/\D/g, '').trim();
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchKoboJson(url: string, token: string, opts?: { timeoutMs?: number; maxRetries?: number }): Promise<any> {
  const timeoutMs = opts?.timeoutMs ?? 20_000;
  const maxRetries = opts?.maxRetries ?? 5;

  let lastError: any = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetchWithTimeout(
        url,
        {
          method: 'GET',
          headers: {
            'Authorization': `Token ${token}`,
            'Accept': 'application/json',
          },
        },
        timeoutMs,
      );

      if (res.status === 401 || res.status === 403) {
        const text = await res.text();
        throw new Error(`KoBo auth error (${res.status}). ${text}`);
      }

      if (res.status === 429) {
        const retryAfter = res.headers.get('retry-after');
        const waitMs = retryAfter ? Number(retryAfter) * 1000 : Math.min(10_000, 500 * 2 ** attempt);
        await sleep(waitMs);
        continue;
      }

      if (!res.ok) {
        const text = await res.text();
        // Retry solo para 5xx
        if (res.status >= 500 && attempt < maxRetries) {
          const waitMs = Math.min(10_000, 500 * 2 ** attempt);
          await sleep(waitMs);
          continue;
        }
        throw new Error(`KoBo HTTP ${res.status}. ${text}`);
      }

      return await res.json();
    } catch (err: any) {
      lastError = err;
      const name = String(err?.name || '');
      const msg = String(err?.message || '');
      const retryable = name === 'AbortError' || msg.includes('timed out') || msg.includes('ECONNRESET') || msg.includes('fetch');

      if (attempt < maxRetries && retryable) {
        const waitMs = Math.min(10_000, 500 * 2 ** attempt);
        await sleep(waitMs);
        continue;
      }
      throw err;
    }
  }

  throw lastError || new Error('KoBo fetch failed');
}

function chunkArray<T>(items: T[], chunkSize: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    out.push(items.slice(i, i + chunkSize));
  }
  return out;
}

function parseDateToYmd(value: unknown): string | null {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;

  // YYYY-MM-DD
  const ymd = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (ymd) return `${ymd[1]}-${ymd[2]}-${ymd[3]}`;

  // DD/MM/YYYY
  const dmy = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;

  // Fallback: try Date parse and reformat
  const parsed = new Date(raw);
  if (!Number.isFinite(parsed.getTime())) return null;
  const yyyy = parsed.getFullYear();
  const mm = String(parsed.getMonth() + 1).padStart(2, '0');
  const dd = String(parsed.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function parseTimeToHms(value: unknown): string | null {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;

  // HH:mm or HH:mm:ss
  const m = raw.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) return null;

  const hh = String(Number(m[1])).padStart(2, '0');
  const mm = String(Number(m[2])).padStart(2, '0');
  const ss = String(Number(m[3] ?? '0')).padStart(2, '0');

  const hhN = Number(hh);
  const mmN = Number(mm);
  const ssN = Number(ss);
  if (hhN < 0 || hhN > 23 || mmN < 0 || mmN > 59 || ssN < 0 || ssN > 59) return null;
  return `${hh}:${mm}:${ss}`;
}

function addDaysToYmd(ymd: string, days: number): string {
  const m = ymd.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return ymd;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);

  // Usar UTC para evitar DST del runtime.
  const dt = new Date(Date.UTC(year, month - 1, day + days, 0, 0, 0));
  const yyyy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function buildTimestampLocal(ymd: string, hms: string): string {
  // Sin timezone intencionalmente para que Postgres (timestamp) no aplique conversiones.
  return `${ymd}T${hms}`;
}

function getKoboSubmissionId(submission: KoboSubmission): string | null {
  if (submission?._uuid) return String(submission._uuid);
  if (submission?._id !== undefined && submission?._id !== null) return String(submission._id);
  return null;
}

function deriveTipoArchivo(mimetype?: string): string | null {
  if (!mimetype) return null;
  const mt = String(mimetype).trim().toLowerCase();
  if (mt.startsWith('image/')) return 'foto';
  return mt;
}

function computeHorasFromSubmission(submission: KoboSubmission): { horas: number; error?: string } {
  const rawDirect = submission['Escribe_la_cantidad_hora_inicial_y_final'];
  if (rawDirect !== undefined && rawDirect !== null && String(rawDirect).trim() !== '') {
    const n = Number.parseFloat(String(rawDirect).replace(',', '.'));
    if (Number.isFinite(n)) {
      if (n > 0 && n <= 16) return { horas: n };
      return { horas: 0, error: `Horas directas fuera de rango (0<h<=16): ${n}` };
    }
  }

  const startHms = parseTimeToHms(submission['Coloca_la_hora_en_qu_aste_tus_actividades']);
  const endHms = parseTimeToHms(submission['Coloca_la_hora_en_qu_aste_tus_actividades_001']);
  if (!startHms || !endHms) {
    return { horas: 0, error: 'No se pudo calcular horas: faltan hora inicio/fin y horas directas no es numero' };
  }

  const [sh, sm] = startHms.split(':').map((v) => Number(v));
  const [eh, em] = endHms.split(':').map((v) => Number(v));
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;

  let diffMin = endMin - startMin;
  if (diffMin <= 0) diffMin += 24 * 60;
  const horas = diffMin / 60;

  if (horas > 0 && horas <= 16) return { horas };
  return { horas: 0, error: `Horas calculadas fuera de rango (0<h<=16): ${horas.toFixed(2)}` };
}

function buildFechasActividad(submission: KoboSubmission): { fecha_inicio: string; fecha_fin: string; error?: string } {
  const fechaBase = parseDateToYmd(submission['Selecciona_la_fecha_realiz_la_actividad']);
  const startHms = parseTimeToHms(submission['Coloca_la_hora_en_qu_aste_tus_actividades']);
  const endHms = parseTimeToHms(submission['Coloca_la_hora_en_qu_aste_tus_actividades_001']);

  if (fechaBase && startHms && endHms) {
    const [sh, sm] = startHms.split(':').map((v) => Number(v));
    const [eh, em] = endHms.split(':').map((v) => Number(v));
    const startMin = sh * 60 + sm;
    const endMin = eh * 60 + em;
    const endDate = endMin <= startMin ? addDaysToYmd(fechaBase, 1) : fechaBase;

    return {
      fecha_inicio: buildTimestampLocal(fechaBase, startHms),
      fecha_fin: buildTimestampLocal(endDate, endHms),
    };
  }

  // Fallback: usar start/end de KoBo si vienen como ISO
  const startIso = submission?.start || submission?._submission_time;
  const endIso = submission?.end || submission?.start || submission?._submission_time;
  if (startIso && endIso) {
    return {
      fecha_inicio: String(startIso),
      fecha_fin: String(endIso),
      error: (!fechaBase || !startHms || !endHms) ? 'Usando start/end de KoBo por falta de fecha/hora del formulario' : undefined,
    };
  }

  // Ultimo fallback: 09:00-10:00 del dia (si hay fechaBase)
  if (fechaBase) {
    return {
      fecha_inicio: buildTimestampLocal(fechaBase, '09:00:00'),
      fecha_fin: buildTimestampLocal(fechaBase, '10:00:00'),
      error: 'Usando horario por defecto 09:00-10:00 (faltan campos de hora y start/end de KoBo)',
    };
  }

  // No hay forma segura
  const now = new Date().toISOString();
  return {
    fecha_inicio: now,
    fecha_fin: now,
    error: 'No se encontro fecha/hora valida. Se uso now() como fallback',
  };
}

async function getEstadoIdByName(supabase: SupabaseClientLike, ambito: string, estadoName: string): Promise<number | null> {
  const wanted = normalizeEstadoName(estadoName);
  if (!wanted) return null;
  const { data, error } = await supabase
    .from('estados')
    .select('id_estado, nombre, ambito')
    .eq('ambito', ambito);
  if (error) {
    console.warn('No se pudo consultar estados:', error.message);
    return null;
  }
  const found = (data || []).find((row: any) => normalizeEstadoName(row?.nombre) === wanted);
  return found?.id_estado ? Number(found.id_estado) : null;
}

class KoboSyncConfigError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = 'KoboSyncConfigError';
    this.status = status;
  }
}

function normalizeTipoActividadName(value: unknown): string {
  return String(value || '').trim().toLowerCase();
}

function getTipoActividadNombreFromEnv(): string {
  const raw = String(Deno.env.get('KOBO_TIPO_ACTIVIDAD_NOMBRE') || 'Voluntariado').trim();
  return raw || 'Voluntariado';
}

async function getEstadoActivoId(supabase: SupabaseClientLike): Promise<number | null> {
  // Prefer el ambito "general" si existe (catalogo base).
  const general = await getEstadoIdByName(supabase, 'general', 'Activo');
  if (general) return general;

  // Fallback: buscar cualquier "activo" sin importar ambito.
  const { data, error } = await supabase
    .from('estados')
    .select('id_estado, nombre');

  if (error) {
    console.warn('No se pudo consultar estados (fallback):', error.message);
    return null;
  }

  const found = (data || []).find((row: any) => normalizeEstadoName(row?.nombre) === 'activo');
  return found?.id_estado ? Number(found.id_estado) : null;
}

async function findTipoActividadIdByNombre(supabase: SupabaseClientLike, nombre: string): Promise<number | null> {
  const wantedRaw = String(nombre || '').trim();
  if (!wantedRaw) return null;

  const wanted = normalizeTipoActividadName(wantedRaw);

  // 1) Exacto (case-insensitive). Evitar maybeSingle() porque puede fallar si hay duplicados.
  const { data: exactRows, error: exactError } = await supabase
    .from('tipos_actividad')
    .select('id_tipo_actividad, nombre')
    .ilike('nombre', wantedRaw)
    .order('id_tipo_actividad', { ascending: true })
    .limit(20);

  if (!exactError && Array.isArray(exactRows) && exactRows.length > 0) {
    const best = exactRows.find((row: any) => normalizeTipoActividadName(row?.nombre) === wanted) ?? exactRows[0];
    if (best?.id_tipo_actividad) return Number(best.id_tipo_actividad);
  }

  // 2) Contains (case-insensitive) como fallback.
  const { data: likeRows, error: likeError } = await supabase
    .from('tipos_actividad')
    .select('id_tipo_actividad, nombre')
    .ilike('nombre', `%${wantedRaw}%`)
    .order('id_tipo_actividad', { ascending: true })
    .limit(20);

  if (likeError || !Array.isArray(likeRows) || likeRows.length === 0) return null;

  const best = likeRows.find((row: any) => normalizeTipoActividadName(row?.nombre) === wanted) ?? likeRows[0];
  if (!best?.id_tipo_actividad) return null;
  return Number(best.id_tipo_actividad);
}

async function getOrCreateTipoActividadId(supabase: SupabaseClientLike, nombre: string): Promise<number> {
  const wanted = String(nombre || '').trim();
  if (!wanted) {
    throw new KoboSyncConfigError('KOBO_TIPO_ACTIVIDAD_NOMBRE es invalido (vacio).');
  }

  const existingId = await findTipoActividadIdByNombre(supabase, wanted);
  if (existingId) return existingId;

  const estadoActivoId = await getEstadoActivoId(supabase);
  if (!estadoActivoId) {
    throw new KoboSyncConfigError(
      'Falta catalogo de estados: no existe estado "Activo". Crea el estado antes de sincronizar KoBo.',
      400,
    );
  }

  // Intentar crear el tipo. Preferimos setear id_estado=Activo si la columna existe.
  const { data: insertedWithEstado, error: insertWithEstadoError } = await supabase
    .from('tipos_actividad')
    .insert({ nombre: wanted, id_estado: estadoActivoId })
    .select('id_tipo_actividad, nombre')
    .maybeSingle();

  if (!insertWithEstadoError && insertedWithEstado?.id_tipo_actividad) {
    return Number(insertedWithEstado.id_tipo_actividad);
  }

  // Si la columna id_estado no existe en el esquema, fallback sin id_estado.
  const insertMsg = String(insertWithEstadoError?.message || '').toLowerCase();
  const insertCode = String(insertWithEstadoError?.code || '');
  const unknownColumn =
    insertMsg.includes('id_estado') &&
    (insertMsg.includes('schema cache') || insertMsg.includes('column') || insertMsg.includes('does not exist'));

  if (unknownColumn) {
    const { data: inserted, error: insertError } = await supabase
      .from('tipos_actividad')
      .insert({ nombre: wanted })
      .select('id_tipo_actividad, nombre')
      .maybeSingle();

    if (insertError || !inserted?.id_tipo_actividad) {
      throw new Error(`Error creando tipos_actividad.nombre="${wanted}": ${insertError?.message || 'sin id_tipo_actividad'}`);
    }

    return Number(inserted.id_tipo_actividad);
  }

  // Si fue un race/duplicado, reintentar leyendo.
  if (insertCode === '23505') {
    const retryId = await findTipoActividadIdByNombre(supabase, wanted);
    if (retryId) return retryId;
  }

  throw new Error(`Error creando tipos_actividad.nombre="${wanted}": ${insertWithEstadoError?.message || 'desconocido'}`);
}

export async function fetchAllSubmissions(assetUid: string, filtroDni?: string, limit = 1000): Promise<{ count: number; results: KoboSubmission[] }> {
  const token = getKoboToken();

  const url = new URL(`${getKoboApiBaseUrl()}/assets/${assetUid}/data.json`);
  url.searchParams.set('limit', String(limit));

  const query: Record<string, any> = {};
  const dniNormalized = normalizeDni(filtroDni);
  if (dniNormalized) {
    query['N_mero_de_DNI'] = dniNormalized;
  }
  if (Object.keys(query).length > 0) {
    url.searchParams.set('query', JSON.stringify(query));
  }

  // Reducir payload solicitando campos relevantes
  const fields = [
    '_id',
    '_uuid',
    'start',
    'end',
    '_submission_time',
    '_attachments',
    'N_mero_de_DNI',
    'Escribe_la_cantidad_hora_inicial_y_final',
    'Coloca_la_hora_en_qu_aste_tus_actividades',
    'Coloca_la_hora_en_qu_aste_tus_actividades_001',
    'Escribe_de_forma_bre_mensajes_realizados',
    'Selecciona_la_fecha_realiz_la_actividad',
    'Nombre_del_Programa_yecto_complementario',
  ];
  url.searchParams.set('fields', JSON.stringify(fields));

  const results: KoboSubmission[] = [];
  let page = await fetchKoboJson(url.toString(), token);
  const count = Number(page?.count ?? 0);
  results.push(...((page?.results as KoboSubmission[]) || []));

  while (page?.next) {
    page = await fetchKoboJson(String(page.next), token);
    results.push(...((page?.results as KoboSubmission[]) || []));
  }

  return { count, results };
}

export async function getUserByDni(supabase: SupabaseClientLike, dni: string): Promise<{ id_usuario: number } | null> {
  const normalized = normalizeDni(dni);
  if (!normalized) return null;
  const { data, error } = await supabase
    .from('usuarios')
    .select('id_usuario, dni')
    .eq('dni', normalized)
    .maybeSingle();
  if (error) {
    throw new Error(`Error consultando usuario por dni: ${error.message}`);
  }
  if (!data?.id_usuario) return null;
  return { id_usuario: Number(data.id_usuario) };
}

export async function logError(
  supabase: SupabaseClientLike,
  params: { tipo_error: string; descripcion: string; payload?: any },
): Promise<void> {
  const payloadValue = params.payload === undefined ? null : params.payload;
  const rowBase = {
    tipo_error: params.tipo_error,
    descripcion: params.descripcion,
    fecha_creacion: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('kobo_sync_error')
    .insert({
      ...rowBase,
      payload: payloadValue,
    });

  if (!error) return;

  // Fallback: si payload no es compatible (ej: columna payload es text),
  // reintentar guardando JSON.stringify(payload).
  if (payloadValue && typeof payloadValue !== 'string') {
    const { error: retryError } = await supabase
      .from('kobo_sync_error')
      .insert({
        ...rowBase,
        payload: JSON.stringify(payloadValue),
      });

    if (!retryError) return;
    console.error('No se pudo registrar kobo_sync_error (retry):', retryError);
    return;
  }

  // Si el log falla, no abortar el flujo. Solo reportar.
  console.error('No se pudo registrar kobo_sync_error:', error);
}

export async function logSyncStart(supabase: SupabaseClientLike, formularioCodigo: string): Promise<number> {
  const parcialId = (await getEstadoIdByName(supabase, 'sync', 'Parcial')) ?? 8;
  const { data, error } = await supabase
    .from('kobo_sync_log')
    .insert({
      formulario_codigo: formularioCodigo,
      fecha_inicio: new Date().toISOString(),
      total_registros: 0,
      observaciones: null,
      id_estado: parcialId,
    })
    .select('id_sync')
    .single();

  if (error || !data?.id_sync) {
    throw new Error(`No se pudo crear kobo_sync_log: ${error?.message || 'sin id_sync'}`);
  }
  return Number(data.id_sync);
}

export async function logSyncEnd(
  supabase: SupabaseClientLike,
  params: {
    id_sync: number;
    total_registros: number;
    id_estado: number;
    observaciones?: string | null;
  },
): Promise<void> {
  const { error } = await supabase
    .from('kobo_sync_log')
    .update({
      fecha_fin: new Date().toISOString(),
      total_registros: params.total_registros,
      observaciones: params.observaciones ?? null,
      id_estado: params.id_estado,
    })
    .eq('id_sync', params.id_sync);

  if (error) {
    console.error('No se pudo actualizar kobo_sync_log:', error);
  }
}

export async function createActivityFromSubmission(
  supabase: SupabaseClientLike,
  params: {
    submission: KoboSubmission;
    formularioCodigo: string;
    idUsuario: number;
    idTipoActividad: number;
    idEstadoActividad: number;
  },
): Promise<{ id_actividad: number; codigo: string }> {
  const s = params.submission;
  const koboNumericId = s?._id !== undefined && s?._id !== null ? String(s._id) : (s._uuid ? String(s._uuid) : `noid-${Date.now()}`);
  const codigo = `KOBO-${params.formularioCodigo}-${koboNumericId}`;

  const { data: existing, error: existingError } = await supabase
    .from('actividades')
    .select('id_actividad')
    .eq('codigo', codigo)
    .maybeSingle();
  if (existingError) {
    throw new Error(`Error buscando actividad existente: ${existingError.message}`);
  }
  if (existing?.id_actividad) {
    return { id_actividad: Number(existing.id_actividad), codigo };
  }

  const programa = String(s['Nombre_del_Programa_yecto_complementario'] || '').trim();
  const titulo = programa ? `Voluntariado KoBo - ${programa}` : 'Voluntariado KoBo';
  const descripcion = String(s['Escribe_de_forma_bre_mensajes_realizados'] || '').trim() || null;

  const fechas = buildFechasActividad(s);

  const { data: inserted, error: insertError } = await supabase
    .from('actividades')
    .insert({
      codigo,
      titulo,
      descripcion,
      fecha_inicio: fechas.fecha_inicio,
      fecha_fin: fechas.fecha_fin,
      id_tipo_actividad: params.idTipoActividad,
      id_creador: params.idUsuario,
      id_responsable: params.idUsuario,
      id_estado: params.idEstadoActividad,
    })
    .select('id_actividad')
    .single();

  if (insertError || !inserted?.id_actividad) {
    throw new Error(`Error insertando actividad: ${insertError?.message || 'sin id_actividad'}`);
  }

  return { id_actividad: Number(inserted.id_actividad), codigo };
}

export async function upsertActividadVoluntarios(
  supabase: SupabaseClientLike,
  params: { id_actividad: number; id_usuario: number; horas_total: number; kobo_submission_id: string },
): Promise<void> {
  const { error } = await supabase
    .from('actividad_voluntarios')
    .upsert(
      {
        id_actividad: params.id_actividad,
        id_usuario: params.id_usuario,
        horas_total: params.horas_total,
        kobo_submission_id: params.kobo_submission_id,
        fecha_ultima_actualizacion: new Date().toISOString(),
      },
      { onConflict: 'id_actividad,id_usuario' },
    );

  if (error) {
    throw new Error(`Error upsert actividad_voluntarios: ${error.message}`);
  }
}

export async function insertEvidencias(
  supabase: SupabaseClientLike,
  params: { id_actividad: number; attachments: KoboAttachment[]; submittedAt?: string | null },
): Promise<{ inserted: number; errors: number }> {
  const nowIso = new Date().toISOString();
  const rows = (params.attachments || [])
    .map((a) => {
      const url = a?.download_url ? String(a.download_url) : '';
      if (!url) return null;
      const nombre = String(a.media_file_basename || a.filename || '').trim() || 'archivo';
      return {
        id_actividad: params.id_actividad,
        url_archivo: url,
        tipo_archivo: deriveTipoArchivo(a?.mimetype),
        nombre_original: nombre,
        fecha_subida: params.submittedAt ? String(params.submittedAt) : nowIso,
      };
    })
    .filter((row: any) => Boolean(row));

  if (rows.length === 0) return { inserted: 0, errors: 0 };

  const { error } = await supabase
    .from('evidencias')
    .insert(rows);

  if (!error) return { inserted: rows.length, errors: 0 };

  // Si falla bulk, intentar fila por fila para aislar problemas
  let inserted = 0;
  let errors = 0;
  for (const row of rows) {
    const { error: rowErr } = await supabase.from('evidencias').insert(row);
    if (rowErr) {
      errors++;
    } else {
      inserted++;
    }
  }
  return { inserted, errors };
}

export async function markSubmissionProcesada(
  supabase: SupabaseClientLike,
  params: { kobo_submission_id: string; formulario_codigo: string; id_actividad: number; id_usuario: number },
): Promise<void> {
  const { error } = await supabase
    .from('kobo_submission_procesada')
    .insert({
      kobo_submission_id: params.kobo_submission_id,
      formulario_codigo: params.formulario_codigo,
      id_actividad: params.id_actividad,
      id_usuario: params.id_usuario,
      fecha_procesamiento: new Date().toISOString(),
    });

  if (error) {
    // Dedupe: si ya existe (PK), no considerar error fatal
    if (String(error.code || '') === '23505') return;
    throw new Error(`Error insertando kobo_submission_procesada: ${error.message}`);
  }
}

async function getAlreadyProcessedIds(supabase: SupabaseClientLike, ids: string[]): Promise<Set<string>> {
  const set = new Set<string>();
  const uniq = Array.from(new Set(ids.filter(Boolean)));
  const chunks = chunkArray(uniq, 200);
  for (const chunk of chunks) {
    const { data, error } = await supabase
      .from('kobo_submission_procesada')
      .select('kobo_submission_id')
      .in('kobo_submission_id', chunk);
    if (error) {
      throw new Error(`Error consultando kobo_submission_procesada: ${error.message}`);
    }
    for (const row of data || []) {
      if (row?.kobo_submission_id) set.add(String(row.kobo_submission_id));
    }
  }
  return set;
}

export async function syncKoboToSupabase(supabase: SupabaseClientLike, params: KoboSyncParams) {
  const startedAt = new Date();
  const limit = params.limit ?? 1000;

  const syncId = await logSyncStart(supabase, params.formularioCodigo);

  let processed = 0;
  let skipped = 0;
  let errors = 0;
  let horas_nuevas = 0;
  let total_kobo = 0;

  try {
    const tipoActividadNombre = getTipoActividadNombreFromEnv();
    const idTipoActividad = await getOrCreateTipoActividadId(supabase, tipoActividadNombre);
    const idEstadoActividad = (await getEstadoIdByName(supabase, 'actividad', 'En Ejecucion')) ?? 4;

    const fetched = await fetchAllSubmissions(params.assetUid, params.filtroDni, limit);
    total_kobo = fetched.count;
    const results = fetched.results;
    const allIds = results.map(getKoboSubmissionId).filter((v): v is string => Boolean(v));
    const already = await getAlreadyProcessedIds(supabase, allIds);

    for (const submission of results) {
      const koboId = getKoboSubmissionId(submission);
      if (!koboId) {
        errors++;
        await logError(supabase, {
          tipo_error: 'KOBO_MISSING_ID',
          descripcion: 'Submission no tiene _uuid ni _id',
          payload: { assetUid: params.assetUid, formulario_codigo: params.formularioCodigo, submission },
        });
        continue;
      }

      if (already.has(koboId)) {
        skipped++;
        continue;
      }

      const dni = normalizeDni(submission['N_mero_de_DNI']);
      if (!dni) {
        errors++;
        await logError(supabase, {
          tipo_error: 'MISSING_DNI',
          descripcion: 'Submission sin DNI (campo N_mero_de_DNI)',
          payload: { kobo_submission_id: koboId, formulario_codigo: params.formularioCodigo, submission },
        });
        continue;
      }

      let user: { id_usuario: number } | null = null;
      try {
        user = await getUserByDni(supabase, dni);
      } catch (err: any) {
        errors++;
        await logError(supabase, {
          tipo_error: 'DB_USER_LOOKUP_FAILED',
          descripcion: err?.message || 'Error consultando usuario por DNI',
          payload: { kobo_submission_id: koboId, dni, formulario_codigo: params.formularioCodigo },
        });
        continue;
      }

      if (!user) {
        errors++;
        await logError(supabase, {
          tipo_error: 'USER_NOT_FOUND',
          descripcion: `No existe usuario con dni=${dni}`,
          payload: { kobo_submission_id: koboId, dni, formulario_codigo: params.formularioCodigo, submission },
        });
        continue;
      }

      let actividadId: number;
      let codigoActividad: string;
      try {
        const created = await createActivityFromSubmission(supabase, {
          submission,
          formularioCodigo: params.formularioCodigo,
          idUsuario: user.id_usuario,
          idTipoActividad,
          idEstadoActividad,
        });
        actividadId = created.id_actividad;
        codigoActividad = created.codigo;
      } catch (err: any) {
        errors++;
        await logError(supabase, {
          tipo_error: 'ACTIVITY_CREATE_FAILED',
          descripcion: err?.message || 'Error creando actividad desde submission',
          payload: { kobo_submission_id: koboId, dni, formulario_codigo: params.formularioCodigo, submission },
        });
        continue;
      }

      const horasCalc = computeHorasFromSubmission(submission);
      if (horasCalc.error) {
        await logError(supabase, {
          tipo_error: 'INVALID_HOURS',
          descripcion: horasCalc.error,
          payload: { kobo_submission_id: koboId, dni, codigoActividad, submission },
        });
      }

      try {
        await upsertActividadVoluntarios(supabase, {
          id_actividad: actividadId,
          id_usuario: user.id_usuario,
          horas_total: horasCalc.horas,
          kobo_submission_id: koboId,
        });
      } catch (err: any) {
        errors++;
        await logError(supabase, {
          tipo_error: 'RELATION_UPSERT_FAILED',
          descripcion: err?.message || 'Error upsert actividad_voluntarios',
          payload: { kobo_submission_id: koboId, dni, id_actividad: actividadId, id_usuario: user.id_usuario },
        });
        // No marcar procesada: reintento futuro debe corregir
        continue;
      }

      const attachments = Array.isArray(submission?._attachments) ? (submission._attachments as KoboAttachment[]) : [];
      if (attachments.length > 0) {
        const evid = await insertEvidencias(supabase, {
          id_actividad: actividadId,
          attachments,
          submittedAt: submission?._submission_time ? String(submission._submission_time) : null,
        });
        if (evid.errors > 0) {
          await logError(supabase, {
            tipo_error: 'EVIDENCE_INSERT_PARTIAL',
            descripcion: `Algunas evidencias fallaron. inserted=${evid.inserted} errors=${evid.errors}`,
            payload: { kobo_submission_id: koboId, id_actividad: actividadId, attachmentsCount: attachments.length },
          });
        }
      }

      try {
        await markSubmissionProcesada(supabase, {
          kobo_submission_id: koboId,
          formulario_codigo: params.formularioCodigo,
          id_actividad: actividadId,
          id_usuario: user.id_usuario,
        });
      } catch (err: any) {
        errors++;
        await logError(supabase, {
          tipo_error: 'MARK_PROCESSED_FAILED',
          descripcion: err?.message || 'Error marcando submission como procesada',
          payload: { kobo_submission_id: koboId, id_actividad: actividadId, id_usuario: user.id_usuario },
        });
        // Evitar contar como procesada si no se puede marcar, para permitir reintentos.
        continue;
      }

      horas_nuevas += horasCalc.horas;
      processed++;
      already.add(koboId);
    }

    const idEstadoSync =
      errors === 0
        ? ((await getEstadoIdByName(supabase, 'sync', 'Exitoso')) ?? 7)
        : (processed > 0 ? ((await getEstadoIdByName(supabase, 'sync', 'Parcial')) ?? 8) : ((await getEstadoIdByName(supabase, 'sync', 'Fallido')) ?? 9));

    const observaciones = JSON.stringify({
      assetUid: params.assetUid,
      formulario_codigo: params.formularioCodigo,
      processed,
      skipped,
      errors,
      startedAt: startedAt.toISOString(),
      finishedAt: new Date().toISOString(),
    });

    await logSyncEnd(supabase, {
      id_sync: syncId,
      total_registros: processed,
      id_estado: idEstadoSync,
      observaciones,
    });

    return {
      success: errors === 0,
      processed,
      skipped,
      errors,
      total_kobo,
      horas_nuevas,
      startedAt: startedAt.toISOString(),
      finishedAt: new Date().toISOString(),
    };
  } catch (err: any) {
    errors++;
    await logError(supabase, {
      tipo_error: 'SYNC_FATAL',
      descripcion: err?.message || 'Error fatal en sincronizacion KoBo',
      payload: { assetUid: params.assetUid, formulario_codigo: params.formularioCodigo },
    });

    const fallidoId = (await getEstadoIdByName(supabase, 'sync', 'Fallido')) ?? 9;
    await logSyncEnd(supabase, {
      id_sync: syncId,
      total_registros: processed,
      id_estado: fallidoId,
      observaciones: String(err?.message || err),
    });

    return {
      success: false,
      processed,
      skipped,
      errors,
      total_kobo,
      horas_nuevas,
      statusCode: Number(err?.status) || (err?.name === 'KoboSyncConfigError' ? 400 : 500),
      errorType: String(err?.name || 'Error'),
      errorMessage: err?.message || String(err),
      startedAt: startedAt.toISOString(),
      finishedAt: new Date().toISOString(),
    };
  }
}
