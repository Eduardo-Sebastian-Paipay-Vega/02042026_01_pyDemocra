import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../App';
import { API_BASE_URL } from '../utils/api';
import { publicAnonKey } from '../utils/supabase/info';
import { Dialog, DialogContent } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { RefreshCw, LogOut, Download } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import logoUrl from '../assets/voluntariado-logo.svg';
import { downloadCertificatePdf } from '../utils/certificatePdf';

interface OrgOption {
  id: string;
  name: string;
}

interface VolunteerInfo {
  id: string;
  name: string;
  dni: string;
  email?: string;
  phone?: string;
  organizacion?: string | null;
  id_organizacion?: number | null;
  totalHours: number;
  totalActivities: number;
}

interface SystemActivityItem {
  id: string;
  title: string;
  startDate: string;
  duration: number;
  responsibleName: string;
  id_organizacion?: number | null;
  organizacion?: string | null;
}

interface EvidenceItem {
  id_evidencia: number;
  url_archivo: string | null;
  download_url?: string | null;
  download_large_url?: string | null;
  tipo_archivo: string | null;
  nombre_original: string | null;
  fecha_subida: string | null;
}

interface HoursHistoryItem {
  id_actividad: number;
  id_usuario: number;
  horas_total: number;
  kobo_submission_id: string | null;
  fecha_ultima_actualizacion: string | null;
  descripcion?: string | null;
  id_organizacion?: number | null;
  organizacion?: string | null;
  actividad: {
    id_actividad: number | null;
    codigo: string | null;
    titulo: string | null;
    descripcion?: string | null;
    id_responsable?: number | null;
    id_creador?: number | null;
    fecha_inicio: string | null;
    fecha_fin: string | null;
    evidencias?: EvidenceItem[];
  } | null;
}

function AuthorizedImage({
  url,
  alt,
  accessToken,
  className,
  loadingClassName,
  errorClassName,
  spinnerClassName,
  errorTextClassName,
  errorMessage,
}: {
  url: string;
  alt: string;
  accessToken?: string | null;
  className?: string;
  loadingClassName?: string;
  errorClassName?: string;
  spinnerClassName?: string;
  errorTextClassName?: string;
  errorMessage?: string;
}) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url || !accessToken) {
      setLoading(false);
      setError(null);
      setObjectUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      return;
    }

    const controller = new AbortController();
    let localObjectUrl: string | null = null;

    setLoading(true);
    setError(null);
    setObjectUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });

    (async () => {
      try {
        const res = await fetch(url, {
          headers: {
            Authorization: 'Bearer ' + publicAnonKey,
            'X-Access-Token': accessToken,
          },
          signal: controller.signal,
        });

        if (!res.ok) {
          const body = await res.text().catch(() => '');
          throw new Error(body ? `${res.status} ${res.statusText}: ${body}` : `${res.status} ${res.statusText}`);
        }

        const blob = await res.blob();
        localObjectUrl = URL.createObjectURL(blob);
        if (controller.signal.aborted) return;
        setObjectUrl(localObjectUrl);
      } catch (err: any) {
        if (controller.signal.aborted) return;
        setError(err?.message || 'No se pudo cargar la imagen');
      } finally {
        if (controller.signal.aborted) return;
        setLoading(false);
      }
    })();

    return () => {
      controller.abort();
      if (localObjectUrl) URL.revokeObjectURL(localObjectUrl);
    };
  }, [url, accessToken]);

  if (loading) {
    return (
      <div className={loadingClassName || ''} aria-label="Cargando evidencia">
        <div className={spinnerClassName || 'h-5 w-5 border-2 border-gray-300 border-t-gray-700 animate-spin rounded-full'} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={errorClassName || ''} title={error}>
        <span className={errorTextClassName || 'text-xs text-gray-400'}>
          {errorMessage || 'No se pudo cargar la evidencia'}
        </span>
      </div>
    );
  }

  if (!objectUrl) {
    return <div className={loadingClassName || ''} />;
  }

  return <img src={objectUrl} alt={alt} className={className} />;
}

export default function PortalVoluntario() {
  const { user, accessToken, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [volunteer, setVolunteer] = useState<VolunteerInfo | null>(null);
  const [systemActivities, setSystemActivities] = useState<SystemActivityItem[]>([]);
  const [hoursHistory, setHoursHistory] = useState<HoursHistoryItem[]>([]);
  const [loadingKoboHistory, setLoadingKoboHistory] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const [selectedOrgId, setSelectedOrgId] = useState<string>('');

  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [evidence, setEvidence] = useState<{ url: string; name?: string | null } | null>(null);

  const closeEvidence = () => {
    setEvidenceOpen(false);
    setEvidence(null);
  };

  const orgOptions: OrgOption[] = useMemo(() => {
    const fromSession = Array.isArray(user?.organizations)
      ? user!.organizations!.map((org) => ({
          id: String(org.id_organizacion),
          name: String(org.nombre || '').trim() || `Org ${org.id_organizacion}`,
        }))
      : [];

    if (fromSession.length > 0) return fromSession;

    const primaryId = user?.organizationId ? String(user.organizationId).trim() : '';
    if (!primaryId) return [];
    return [{ id: primaryId, name: user?.organizationName || `Org ${primaryId}` }];
  }, [user?.organizations, user?.organizationId, user?.organizationName]);

  useEffect(() => {
    if (selectedOrgId) return;
    if (orgOptions.length === 1) setSelectedOrgId(orgOptions[0].id);
    if (orgOptions.length > 1) setSelectedOrgId(orgOptions[0].id);
  }, [orgOptions, selectedOrgId]);

  const fetchVolunteerDetails = async (volunteerId: string) => {
    if (!accessToken) return;

    const res = await fetch(`${API_BASE_URL}/volunteers/${volunteerId}`, {
      headers: {
        Authorization: 'Bearer ' + publicAnonKey,
        'X-Access-Token': accessToken,
      },
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const message = data?.error || `Error ${res.status}`;
      throw new Error(message);
    }

    const volunteerData = data?.volunteer as any;
    const activitiesData = (data?.activities || []) as any[];

    setVolunteer({
      id: String(volunteerData?.id || volunteerId),
      name: String(volunteerData?.name || ''),
      dni: String(volunteerData?.dni || ''),
      email: volunteerData?.email ? String(volunteerData.email) : undefined,
      phone: volunteerData?.phone ? String(volunteerData.phone) : undefined,
      organizacion: volunteerData?.organizacion ?? null,
      id_organizacion: volunteerData?.id_organizacion !== undefined ? Number(volunteerData.id_organizacion) : null,
      totalHours: Number(volunteerData?.totalHours || 0),
      totalActivities: Number(volunteerData?.totalActivities || 0),
    });

    setSystemActivities(
      activitiesData.map((act: any) => ({
        id: String(act?.id || ''),
        title: String(act?.title || ''),
        startDate: String(act?.startDate || ''),
        duration: Number(act?.duration || 0),
        responsibleName: String(act?.responsibleName || ''),
        id_organizacion: act?.id_organizacion !== undefined ? Number(act.id_organizacion) : null,
        organizacion: act?.organizacion ?? null,
      })),
    );
  };

  const fetchKoboHistory = async (volunteerId: string) => {
    if (!accessToken) return;
    setLoadingKoboHistory(true);
    try {
      const res = await fetch(`${API_BASE_URL}/voluntarios/${volunteerId}/historial-horas`, {
        headers: {
          Authorization: 'Bearer ' + publicAnonKey,
          'X-Access-Token': accessToken,
        },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || `Error ${res.status}`);
      }

      setHoursHistory((data.items || []) as HoursHistoryItem[]);
    } finally {
      setLoadingKoboHistory(false);
    }
  };

  const loadData = async () => {
    if (!user?.id || !accessToken) return;
    setLoading(true);
    try {
      await Promise.all([fetchVolunteerDetails(user.id), fetchKoboHistory(user.id)]);
    } catch (err: any) {
      const message = err?.message || 'No se pudo cargar tu historial';
      console.error('[portal-voluntario] load error', err);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!accessToken || !user?.id) return;
    void loadData();
  }, [accessToken, user?.id]);

  const handleSyncKobo = async () => {
    if (!user?.id) return;
    if (!accessToken) {
      toast.error('No hay sesion activa');
      return;
    }

    const idUsuario = Number(user.id);
    if (!Number.isFinite(idUsuario) || idUsuario <= 0) {
      toast.error('ID de voluntario invalido');
      return;
    }

    setSyncing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/kobo/sync/voluntario`, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + publicAnonKey,
          'X-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id_usuario: idUsuario }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || data?.result?.errorMessage || `Error ${res.status}`);
      }

      const result = data?.result || {};
      toast.success(
        `KoBo: ${result.nuevos ?? 0} nuevos / ${result.total_kobo ?? 0} en KoBo, +${result.horas_nuevas ?? 0}h. Total BD: ${result.horas_total_bd ?? '-'}h`,
      );

      await loadData();
    } catch (err: any) {
      console.error('[portal-voluntario] sync error', err);
      toast.error(err?.message || 'Error en sincronizacion KoBo');
    } finally {
      setSyncing(false);
    }
  };

  const filteredSystemActivities = useMemo(() => {
    if (!selectedOrgId) return systemActivities;
    return systemActivities.filter((act) => String(act.id_organizacion || '') === String(selectedOrgId));
  }, [systemActivities, selectedOrgId]);

  const filteredHoursHistory = useMemo(() => {
    if (!selectedOrgId) return hoursHistory;
    return hoursHistory.filter((item) => String(item.id_organizacion || '') === String(selectedOrgId));
  }, [hoursHistory, selectedOrgId]);

  const downloadCertificate = async () => {
    if (!user?.id) return;
    if (!accessToken) {
      toast.error('No hay sesion activa');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/reports/certificate/${user.id}`, {
        headers: {
          Authorization: 'Bearer ' + publicAnonKey,
          'X-Access-Token': accessToken,
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Error ${res.status}`);
      }

      const data = await res.json();
      await downloadCertificatePdf(data, {
        logoSvgUrl: logoUrl,
        filename: `certificado_${String(data?.volunteer?.name || 'voluntario').replace(/\\s+/g, '_')}.pdf`,
        activitiesLimit: 12,
      });
    } catch (err: any) {
      toast.error(err?.message || 'Error al generar certificado');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-gray-700 mx-auto" />
          <p className="mt-3 text-gray-600">Cargando historial...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={logoUrl}
              alt="Logo"
              className="h-10 w-auto shrink-0"
              loading="eager"
            />
            <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">Mi Historial</h1>
            <p className="text-sm text-gray-600 truncate">
              {volunteer?.name || user?.name}
              {volunteer?.dni ? ` | DNI: ${volunteer.dni}` : ''}
            </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={downloadCertificate}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium"
              title="Descargar certificado"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Certificado</span>
            </button>
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium"
              title="Salir"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <section className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-white border border-gray-200 p-4">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total horas</div>
            <div className="mt-1 text-2xl font-bold text-blue-700">{Number(volunteer?.totalHours || 0)}h</div>
          </div>
          <div className="rounded-xl bg-white border border-gray-200 p-4">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total actividades</div>
            <div className="mt-1 text-2xl font-bold text-purple-700">{Number(volunteer?.totalActivities || 0)}</div>
          </div>
        </section>

        {orgOptions.length > 1 ? (
          <section className="rounded-xl bg-white border border-gray-200 p-4">
            <Tabs value={selectedOrgId || orgOptions[0].id} onValueChange={(value) => setSelectedOrgId(value)}>
              <TabsList className="grid w-full grid-cols-2">
                {orgOptions.slice(0, 2).map((org) => (
                  <TabsTrigger key={org.id} value={org.id}>
                    {org.name}
                  </TabsTrigger>
                ))}
              </TabsList>
              {orgOptions.slice(0, 2).map((org) => (
                <TabsContent key={org.id} value={org.id} className="mt-0" />
              ))}
            </Tabs>
          </section>
        ) : null}

        <section className="rounded-xl bg-white border border-gray-200 p-4">
          <h2 className="text-lg font-bold text-gray-900">Historial de Actividades Validadas</h2>
          <div className="mt-3 space-y-3">
            {filteredSystemActivities.length === 0 ? (
              <p className="text-sm text-gray-500">Sin actividades validadas aun.</p>
            ) : (
              filteredSystemActivities.map((activity) => (
                <div key={activity.id} className="rounded-xl border border-gray-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-900 truncate" title={activity.title}>
                        {activity.title}
                      </div>
                      <div className="mt-1 text-sm text-gray-600">
                        {activity.startDate ? new Date(activity.startDate).toLocaleDateString('es') : '-'} | {activity.duration}h
                      </div>
                      <div className="text-sm text-gray-500">Responsable: {activity.responsibleName}</div>
                      {activity.organizacion ? (
                        <div className="mt-1 text-xs text-gray-400">Organizacion: {activity.organizacion}</div>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-xl bg-white border border-gray-200 p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-gray-900">Historial de horas (KoBo)</h2>
            <button
              type="button"
              onClick={handleSyncKobo}
              disabled={syncing}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              title="Calcular horas (KoBo Sync)"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Calcular horas</span>
            </button>
          </div>

          <div className="mt-3">
            {loadingKoboHistory ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div key={idx} className="border rounded-lg p-3">
                    <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse" />
                    <div className="mt-2 h-3 w-1/2 bg-gray-200 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : filteredHoursHistory.length === 0 ? (
              <div className="border rounded-lg p-4 text-center text-sm text-gray-500">
                Sin registros KoBo para este voluntario.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredHoursHistory.map((item) => {
                  const codigo = item.actividad?.codigo || `Actividad #${item.id_actividad}`;
                  const titulo = item.actividad?.titulo || 'Sin titulo';
                  const descripcionRaw = item.actividad?.descripcion ?? item.descripcion ?? null;
                  const descripcion = descripcionRaw ? String(descripcionRaw).trim() : '';
                  const inicio = item.actividad?.fecha_inicio ? new Date(item.actividad.fecha_inicio) : null;
                  const fin = item.actividad?.fecha_fin ? new Date(item.actividad.fecha_fin) : null;
                  const evidencias = Array.isArray(item.actividad?.evidencias) ? item.actividad!.evidencias! : [];

                  const fechaText = inicio
                    ? inicio.toLocaleDateString('es')
                    : item.fecha_ultima_actualizacion
                      ? new Date(item.fecha_ultima_actualizacion).toLocaleDateString('es')
                      : '-';

                  return (
                    <div key={`${item.id_actividad}-${item.kobo_submission_id || ''}`} className="rounded-xl border border-gray-200 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-semibold text-gray-900 truncate" title={titulo}>
                            {codigo} - {titulo}
                          </div>
                          <div className="mt-1 text-sm text-gray-700 whitespace-pre-wrap break-words">
                            <span className="font-medium text-gray-700">Actividad realizada:</span>{' '}
                            {descripcion ? descripcion : <span className="text-gray-400">Sin mensaje</span>}
                          </div>
                          <div className="mt-1 text-sm text-gray-600">
                            {fechaText}
                            {inicio && fin ? (
                              <>
                                {' '}
                                | {inicio.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })} -{' '}
                                {fin.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                              </>
                            ) : null}
                          </div>
                          {item.organizacion ? (
                            <div className="mt-1 text-xs text-gray-400">Organizacion: {item.organizacion}</div>
                          ) : null}

                          {item.kobo_submission_id ? (
                            <div className="mt-1 text-xs text-gray-500 truncate" title={item.kobo_submission_id}>
                              KoBo submission: {item.kobo_submission_id}
                            </div>
                          ) : null}

                          {evidencias.length > 0 ? (
                            <div className="mt-3">
                              <div className="text-xs font-medium text-gray-600 mb-2">Evidencias ({evidencias.length})</div>
                              <div className="flex flex-wrap gap-2">
                                {evidencias.slice(0, 6).map((ev) => {
                                  const url = ev?.url_archivo ? String(ev.url_archivo) : '';
                                  if (!url) return null;

                                  const proxyUrl = `${API_BASE_URL}/kobo/attachments/proxy?url=${encodeURIComponent(url)}`;
                                  const tipo = String(ev?.tipo_archivo || '').toLowerCase();
                                  const isImage =
                                    tipo === 'foto' ||
                                    tipo.startsWith('image/') ||
                                    /\\.(png|jpe?g|gif|webp|bmp)$/i.test(url);

                                  if (isImage) {
                                    const rawLargeUrl = String(ev.download_large_url || ev.download_url || ev.url_archivo || '');
                                    if (!rawLargeUrl) return null;
                                    const proxyLargeUrl = `${API_BASE_URL}/kobo/attachments/proxy?url=${encodeURIComponent(rawLargeUrl)}`;

                                    return (
                                      <button
                                        key={String(ev.id_evidencia)}
                                        type="button"
                                        onClick={() => {
                                          setEvidence({ url: proxyLargeUrl, name: ev.nombre_original });
                                          setEvidenceOpen(true);
                                        }}
                                        className="block"
                                        title={ev.nombre_original || undefined}
                                      >
                                        <AuthorizedImage
                                          url={proxyUrl}
                                          alt={ev.nombre_original || 'Evidencia'}
                                          accessToken={accessToken}
                                          className="h-16 w-16 rounded-md object-cover border border-gray-200 hover:opacity-90 transition cursor-zoom-in"
                                          loadingClassName="h-16 w-16 rounded-md border border-gray-200 bg-gray-100 flex items-center justify-center"
                                          errorClassName="h-16 w-16 rounded-md border border-gray-200 bg-gray-100 flex items-center justify-center"
                                          errorMessage="Sin imagen"
                                          spinnerClassName="h-4 w-4 border-2 border-gray-300 border-t-gray-700 animate-spin rounded-full"
                                        />
                                      </button>
                                    );
                                  }

                                  return (
                                    <a
                                      key={String(ev.id_evidencia)}
                                      href={proxyUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center px-2 py-1 rounded-md border border-gray-200 text-xs text-gray-700 hover:bg-gray-50 transition"
                                      title={ev.nombre_original || undefined}
                                    >
                                      {ev.nombre_original || 'Archivo'}
                                    </a>
                                  );
                                })}
                              </div>
                            </div>
                          ) : null}
                        </div>

                        <div className="shrink-0 text-right">
                          <div className="text-sm font-semibold text-gray-900">{Number(item.horas_total || 0)}h</div>
                          {item.fecha_ultima_actualizacion ? (
                            <div className="text-xs text-gray-500">
                              {new Date(item.fecha_ultima_actualizacion).toLocaleString('es')}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      <Dialog
        open={evidenceOpen}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) closeEvidence();
        }}
      >
        <DialogContent
          showClose={false}
          className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl overflow-hidden p-0 gap-0 border-0"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div className="text-sm font-medium">Evidencia</div>
            <button
              type="button"
              onClick={closeEvidence}
              className="rounded-md p-2 hover:bg-gray-100"
              aria-label="Cerrar evidencia"
              title="Cerrar"
            >
              ✕
            </button>
          </div>

          <div className="bg-black flex items-center justify-center p-2">
            <AuthorizedImage
              url={evidence?.url || ''}
              alt={evidence?.name ?? 'Evidencia'}
              accessToken={accessToken}
              className="w-full max-h-[80vh] object-contain"
              loadingClassName="w-full max-h-[80vh] flex items-center justify-center"
              errorClassName="w-full max-h-[80vh] flex items-center justify-center"
              errorTextClassName="text-sm text-white/80"
              spinnerClassName="h-7 w-7 border-2 border-white/30 border-t-white animate-spin rounded-full"
              errorMessage="No se pudo cargar la evidencia"
            />
          </div>

          {evidence?.name ? (
            <div className="px-4 py-2 text-xs text-gray-600 border-t">{evidence.name}</div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
