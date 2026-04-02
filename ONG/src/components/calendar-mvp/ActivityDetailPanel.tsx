import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink, FileText, Loader2, MapPin } from 'lucide-react';
import type { ActivityDetailData, DbEvidencia } from '../../services/activities';
import { Button } from '../ui/button';
import { Dialog, DialogContent } from '../ui/dialog';
import { formatDuration } from './helpers/time';

interface ActivityDetailPanelProps {
  detail: ActivityDetailData | null;
  selectedActivityId: number | null;
  loading: boolean;
  error: string | null;
  updatingStatus: boolean;
  onRetry: () => void;
  onChangeStatus?: (estadoId: number) => void;
}

type EvidencePreviewState =
  | { kind: 'image'; index: number }
  | { kind: 'pdf'; evidencia: DbEvidencia }
  | { kind: 'other'; evidencia: DbEvidencia };

const normalize = (value: string) => value.trim().toLowerCase();
const isHexColor = (value: string) => /^#[0-9a-fA-F]{6}$/.test(value);

const extensionFromUrl = (url: string): string => {
  const raw = String(url || '').trim();
  if (!raw) return '';

  const pickExt = (pathname: string): string => {
    const last = pathname.split('/').pop() || '';
    const dot = last.lastIndexOf('.');
    if (dot < 0) return '';
    return normalize(last.slice(dot + 1));
  };

  try {
    return pickExt(new URL(raw).pathname || '');
  } catch {
    return pickExt((raw.split('?')[0] || '').trim());
  }
};

const isImageEvidence = (evidencia: DbEvidencia): boolean => {
  const tipo = normalize(evidencia.tipo_archivo || '');
  if (tipo.startsWith('image/') || tipo.includes('image')) return true;

  const name = normalize(evidencia.nombre_original || '');
  if (name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png') || name.endsWith('.webp')) return true;

  const ext = extensionFromUrl(evidencia.url_archivo || '');
  return ['jpg', 'jpeg', 'png', 'webp'].includes(ext);
};

const isPdfEvidence = (evidencia: DbEvidencia): boolean => {
  const tipo = normalize(evidencia.tipo_archivo || '');
  if (tipo.includes('pdf')) return true;

  const name = normalize(evidencia.nombre_original || '');
  if (name.endsWith('.pdf')) return true;

  return extensionFromUrl(evidencia.url_archivo || '') === 'pdf';
};

const formatDateTime = (value: string | null | undefined): string => {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';
  return date.toLocaleString('es-PE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const show = (value: string | null | undefined): string => {
  if (!value) return '--';
  const trimmed = value.trim();
  return trimmed ? trimmed : '--';
};

const looksLikePlaceholderText = (value: string | null | undefined): boolean => {
  const raw = String(value || '').trim();
  if (!raw) return true;
  if (/^\d+$/.test(raw)) return true;
  return raw.length <= 2;
};

const meaningfulText = (value: string | null | undefined): string => {
  const raw = String(value || '').trim();
  return looksLikePlaceholderText(raw) ? '' : raw;
};

function ExpandableText({
  text,
  emptyLabel,
  clampLines = 3,
}: {
  text: string;
  emptyLabel: string;
  clampLines?: 2 | 3;
}) {
  const [expanded, setExpanded] = useState(false);

  if (looksLikePlaceholderText(text)) {
    return <p className="mt-2 text-sm text-slate-500">{emptyLabel}</p>;
  }

  const clampClass = clampLines === 2 ? 'line-clamp-2' : 'line-clamp-3';
  const showToggle = text.length > 220 || text.split(/\r?\n/).length > clampLines;

  return (
    <div className="mt-2 space-y-2">
      <p className={`text-sm text-slate-700 whitespace-pre-wrap ${expanded ? '' : clampClass}`}>{text}</p>
      {showToggle && (
        <button
          type="button"
          className="text-xs font-semibold text-indigo-700 hover:underline"
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? 'Ver menos' : 'Ver mas'}
        </button>
      )}
    </div>
  );
}

function buildEstadoBadgeStyles(color: string) {
  const raw = String(color || '').trim();
  if (!raw) {
    return {
      borderColor: '#cbd5e1',
      backgroundColor: '#f8fafc',
      color: '#475569',
    };
  }
  if (isHexColor(raw)) {
    return {
      borderColor: raw,
      backgroundColor: `${raw}20`,
      color: raw,
    };
  }
  return {
    borderColor: raw,
    backgroundColor: 'transparent',
    color: raw,
  };
}

function buildEstadoCardStyles(color: string) {
  const raw = String(color || '').trim();
  if (!raw) return undefined;
  if (isHexColor(raw)) {
    return { borderColor: `${raw}55` };
  }
  return { borderColor: raw };
}

function EvidenceLightboxDialog({
  preview,
  images,
  onChangeImageIndex,
  onClose,
}: {
  preview: EvidencePreviewState | null;
  images: DbEvidencia[];
  onChangeImageIndex: (index: number) => void;
  onClose: () => void;
}) {
  const open = Boolean(preview);
  const mode = preview?.kind || 'other';
  const isImage = mode === 'image';
  const imageIndex = isImage ? (preview?.index || 0) : -1;
  const evidencia = isImage ? images[imageIndex] : preview && 'evidencia' in preview ? preview.evidencia : null;

  const [pdfLoadState, setPdfLoadState] = useState<'pending' | 'loaded' | 'fallback'>('pending');

  const canPrev = isImage && images.length > 1 && imageIndex > 0;
  const canNext = isImage && images.length > 1 && imageIndex < images.length - 1;

  useEffect(() => {
    if (!open || mode !== 'pdf' || !evidencia) return;
    setPdfLoadState('pending');
    const timer = window.setTimeout(() => {
      setPdfLoadState((current) => (current === 'loaded' ? 'loaded' : 'fallback'));
    }, 4000);
    return () => window.clearTimeout(timer);
  }, [evidencia?.id_evidencia, mode, open]);

  useEffect(() => {
    if (!open || !isImage || images.length <= 1) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft' && canPrev) {
        event.preventDefault();
        onChangeImageIndex(imageIndex - 1);
      }
      if (event.key === 'ArrowRight' && canNext) {
        event.preventDefault();
        onChangeImageIndex(imageIndex + 1);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [canNext, canPrev, imageIndex, images.length, isImage, onChangeImageIndex, open]);

  if (!preview || !evidencia) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden p-0">
        <div className="flex h-full flex-col">
          <header className="border-b border-slate-200 px-4 py-3 pr-14">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h4 className="truncate text-sm font-semibold text-slate-900">{show(evidencia.nombre_original)}</h4>
                <p className="mt-0.5 text-xs text-slate-600">{formatDateTime(evidencia.fecha_subida)}</p>
              </div>
              <div className="flex items-center gap-1">
                {isImage && images.length > 1 && (
                  <>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => onChangeImageIndex(Math.max(0, imageIndex - 1))}
                      disabled={!canPrev}
                      aria-label="Evidencia anterior"
                      title="Anterior"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => onChangeImageIndex(Math.min(images.length - 1, imageIndex + 1))}
                      disabled={!canNext}
                      aria-label="Evidencia siguiente"
                      title="Siguiente"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <span className="mx-1 text-xs font-medium text-slate-600">
                      {imageIndex + 1}/{images.length}
                    </span>
                  </>
                )}

                <Button asChild type="button" variant="outline" size="sm">
                  <a href={evidencia.url_archivo} target="_blank" rel="noreferrer" aria-label="Abrir evidencia en nueva pestaña">
                    <ExternalLink className="h-4 w-4" />
                    Abrir
                  </a>
                </Button>
              </div>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-auto p-4">
            {mode === 'image' && (
              <img
                src={evidencia.url_archivo}
                alt={evidencia.nombre_original}
                className="mx-auto max-h-[70vh] w-full rounded-lg bg-slate-100 object-contain"
                decoding="async"
              />
            )}

            {mode === 'pdf' && (
              <div className="space-y-3">
                <iframe
                  src={evidencia.url_archivo}
                  title={evidencia.nombre_original}
                  className="h-[62vh] w-full rounded-lg border border-slate-200"
                  onLoad={() => setPdfLoadState('loaded')}
                />
                {pdfLoadState === 'pending' && <p className="text-xs text-slate-500">Intentando cargar vista previa del PDF...</p>}
                {pdfLoadState === 'fallback' && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <p className="text-xs text-amber-800">No se pudo mostrar el PDF dentro del modal por restricciones del navegador/CORS.</p>
                    <Button asChild type="button" className="mt-2" size="sm" variant="secondary">
                      <a href={evidencia.url_archivo} target="_blank" rel="noreferrer">
                        Abrir
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            )}

            {mode === 'other' && (
              <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <p>No hay vista previa embebida para este tipo de archivo.</p>
                <Button asChild type="button" size="sm">
                  <a href={evidencia.url_archivo} target="_blank" rel="noreferrer">
                    Abrir
                  </a>
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ActivityDetailPanel({
  detail,
  selectedActivityId,
  loading,
  error,
  updatingStatus,
  onRetry,
  onChangeStatus,
}: ActivityDetailPanelProps) {
  const [preview, setPreview] = useState<EvidencePreviewState | null>(null);

  useEffect(() => {
    setPreview(null);
  }, [selectedActivityId]);

  const actividad = detail?.actividad || null;
  const estadoActual = detail?.estado || null;
  const estadoColor = String(estadoActual?.color || '').trim();
  const estadoBadgeStyles = useMemo(() => buildEstadoBadgeStyles(estadoColor), [estadoColor]);
  const estadoCardStyles = useMemo(() => buildEstadoCardStyles(estadoColor), [estadoColor]);

  const durationMinutes = useMemo(() => {
    if (!actividad?.fecha_inicio || !actividad?.fecha_fin) return 0;
    const start = new Date(actividad.fecha_inicio).getTime();
    const end = new Date(actividad.fecha_fin).getTime();
    if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return 0;
    return Math.round((end - start) / 60000);
  }, [actividad?.fecha_inicio, actividad?.fecha_fin]);

  const evidencias = detail?.evidencias || [];
  const { imageEvidence, fileEvidence } = useMemo(() => {
    const images: DbEvidencia[] = [];
    const files: DbEvidencia[] = [];
    for (const ev of evidencias) {
      if (isImageEvidence(ev)) images.push(ev);
      else files.push(ev);
    }
    return { imageEvidence: images, fileEvidence: files };
  }, [evidencias]);

  const openEvidencePreview = (evidencia: DbEvidencia) => {
    if (isImageEvidence(evidencia)) {
      const index = imageEvidence.findIndex((row) => row.id_evidencia === evidencia.id_evidencia);
      setPreview({ kind: 'image', index: Math.max(0, index) });
      return;
    }
    if (isPdfEvidence(evidencia)) {
      setPreview({ kind: 'pdf', evidencia });
      return;
    }
    setPreview({ kind: 'other', evidencia });
  };

  if (loading) {
    return (
      <div className="w-full space-y-4">
        <div className="inline-flex items-center gap-2 text-sm text-slate-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando detalle de actividad...
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <div className="h-28 animate-pulse rounded-xl border border-slate-200 bg-slate-50" />
            <div className="h-40 animate-pulse rounded-xl border border-slate-200 bg-slate-50" />
            <div className="h-56 animate-pulse rounded-xl border border-slate-200 bg-slate-50" />
          </div>
          <div className="space-y-4">
            <div className="h-28 animate-pulse rounded-xl border border-slate-200 bg-slate-50" />
            <div className="h-28 animate-pulse rounded-xl border border-slate-200 bg-slate-50" />
            <div className="h-28 animate-pulse rounded-xl border border-slate-200 bg-slate-50" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full space-y-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
        <p>{error}</p>
        <Button type="button" variant="destructive" size="sm" onClick={onRetry}>
          Reintentar
        </Button>
      </div>
    );
  }

  if (!actividad) {
    return (
      <div className="flex min-h-[220px] w-full items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
        {selectedActivityId ? `Actividad no encontrada (ID ${selectedActivityId})` : 'Selecciona una actividad'}
      </div>
    );
  }

  const tipoNombre = meaningfulText(detail?.tipo_actividad?.nombre) || '';
  const estadoNombre = meaningfulText(estadoActual?.nombre) || '';

  const codigo = meaningfulText(actividad.codigo) || show(actividad.codigo);
  const titulo = meaningfulText(actividad.titulo) || 'Sin titulo';
  const descripcion = meaningfulText(actividad.descripcion);
  const objetivo = meaningfulText(actividad.objetivo);

  const ubicacion = meaningfulText(actividad.ubicacion_direccion);
  const hasCoords = actividad.ubicacion_lat !== null && actividad.ubicacion_lng !== null;

  const voluntarios = detail?.voluntarios || [];
  const horasVol = Number(detail?.horas_voluntariado || 0);
  const showVolunteers = voluntarios.length > 0 || horasVol > 0;
  const durationLabel = durationMinutes > 0 ? formatDuration(durationMinutes) : '--';

  const cardClassName =
    'rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md lg:min-h-[110px]';
  const cardTitleClassName = 'text-[11px] font-semibold uppercase tracking-wide text-slate-500';
  const infoMetaLine = [codigo || '', tipoNombre ? `Tipo: ${tipoNombre}` : ''].filter(Boolean).join(' · ');

  return (
    <>
      <div className="w-full space-y-4">
        {(detail?.warnings || []).length > 0 && (
          <section className="rounded-xl border border-amber-200 bg-amber-50 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">Advertencias de carga</p>
            <ul className="mt-1 space-y-1">
              {(detail?.warnings || []).map((warning, idx) => (
                <li key={`${warning}-${idx}`} className="text-xs text-amber-800">
                  {warning}
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <section className={`${cardClassName} lg:col-span-2`}>
            <p className={cardTitleClassName}>Informacion general</p>
            <div className="mt-2 space-y-1">
              <h4 className="text-lg font-semibold text-slate-900">{titulo}</h4>
              <p className="text-sm text-muted-foreground">{infoMetaLine || '--'}</p>
            </div>
          </section>

          <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <section className={cardClassName} style={estadoCardStyles}>
              <div className="flex items-center justify-between gap-2">
                <p className={cardTitleClassName}>Estado</p>
                <span
                  className="inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors duration-200"
                  style={estadoBadgeStyles}
                >
                  <span
                    aria-hidden="true"
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: estadoColor || '#94a3b8' }}
                  />
                  {estadoNombre || 'Sin estado'}
                </span>
              </div>
              {onChangeStatus ? (
                <div className="mt-3">
                  <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">Cambiar</label>
                  <select
                    value={actividad.id_estado}
                    onChange={(event) => onChangeStatus(Number(event.target.value))}
                    disabled={updatingStatus}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 disabled:cursor-not-allowed disabled:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  >
                    {(detail?.estados_actividad || []).map((estado) => (
                      <option key={estado.id_estado} value={estado.id_estado}>
                        {estado.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
            </section>

            <section className={cardClassName}>
              <p className={cardTitleClassName}>Horario</p>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-xs text-muted-foreground">Inicio</span>
                  <span className="text-sm font-medium text-slate-900">{formatDateTime(actividad.fecha_inicio)}</span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-xs text-muted-foreground">Fin</span>
                  <span className="text-sm font-medium text-slate-900">{formatDateTime(actividad.fecha_fin)}</span>
                </div>
                <div className="flex items-center justify-between gap-3 pt-1">
                  <span className="text-xs text-muted-foreground">Duracion</span>
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                    {durationLabel}
                  </span>
                </div>
              </div>
            </section>

            <section className={cardClassName}>
              <p className={cardTitleClassName}>Personas</p>
              <div className="mt-3 space-y-2 text-sm text-slate-700">
                <p>
                  Responsable: <span className="font-medium text-slate-900">{detail?.responsable?.nombre_completo || '--'}</span>
                </p>
                <p>
                  Creador: <span className="font-medium text-slate-900">{detail?.creador?.nombre_completo || '--'}</span>
                </p>
              </div>
            </section>

            <section className={cardClassName}>
              <p className={cardTitleClassName}>Ubicacion</p>
              {ubicacion ? (
                <p className="mt-3 text-sm font-medium text-slate-900">{ubicacion}</p>
              ) : (
                <p className="mt-3 text-sm text-slate-500">Sin ubicacion registrada</p>
              )}
              {hasCoords && (
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                  <span className="rounded-full bg-slate-100 px-2 py-1 font-medium">
                    {actividad.ubicacion_lat}, {actividad.ubicacion_lng}
                  </span>
                  <a
                    href={`https://www.google.com/maps?q=${actividad.ubicacion_lat},${actividad.ubicacion_lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-indigo-700 hover:underline"
                  >
                    <MapPin className="h-3.5 w-3.5" />
                    Abrir mapa
                  </a>
                </div>
              )}
            </section>
          </aside>

          <div className="space-y-4 lg:col-span-2">
            <section className={cardClassName}>
              <p className={cardTitleClassName}>Detalle</p>
              <ExpandableText text={descripcion} emptyLabel="Sin detalle" clampLines={3} />
              <div className="mt-4">
                <p className={cardTitleClassName}>Objetivo</p>
                <ExpandableText text={objetivo} emptyLabel="Sin objetivo" clampLines={3} />
              </div>
            </section>

            <section className={cardClassName}>
              <div className="flex items-center justify-between gap-3">
                <p className={cardTitleClassName}>Evidencias ({evidencias.length})</p>
              </div>

              {evidencias.length === 0 ? (
                <div className="mt-3 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-500">
                  <p>Sin evidencias</p>
                  <Button type="button" variant="outline" size="sm" className="mt-3" disabled title="Proximamente">
                    Subir evidencia
                  </Button>
                </div>
              ) : (
                <div className="mt-3 space-y-4">
                  {imageEvidence.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-slate-700">Imagenes</p>
                      <div className="mt-2 grid grid-cols-2 gap-3 md:grid-cols-3">
                        {imageEvidence.map((evidencia) => (
                          <button
                            key={evidencia.id_evidencia}
                            type="button"
                            onClick={() => openEvidencePreview(evidencia)}
                            className="group relative overflow-hidden rounded-lg border border-slate-200 bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                            title={show(evidencia.nombre_original)}
                            aria-label={`Abrir evidencia ${show(evidencia.nombre_original)}`}
                          >
                            <img
                              src={evidencia.url_archivo}
                              alt={evidencia.nombre_original}
                              loading="lazy"
                              decoding="async"
                              className="aspect-square w-full rounded-lg object-cover transition-transform duration-200 group-hover:scale-105"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {fileEvidence.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-slate-700">Archivos</p>
                      <ul className="mt-2 space-y-2">
                        {fileEvidence.map((evidencia) => {
                          const isPdf = isPdfEvidence(evidencia);
                          return (
                            <li key={evidencia.id_evidencia} className="rounded-lg border border-slate-200">
                              <div className="flex items-center gap-3 p-3">
                                {isPdf ? (
                                  <FileText className="h-5 w-5 text-rose-500" />
                                ) : (
                                  <FileText className="h-5 w-5 text-slate-500" />
                                )}
                                <button
                                  type="button"
                                  onClick={() => openEvidencePreview(evidencia)}
                                  className="min-w-0 flex-1 text-left hover:underline"
                                  aria-label={`Vista previa ${show(evidencia.nombre_original)}`}
                                  title={isPdf ? 'Ver vista previa' : 'Ver informacion'}
                                >
                                  <p className="truncate text-sm font-medium text-slate-900">{show(evidencia.nombre_original)}</p>
                                  <p className="truncate text-xs text-slate-600">
                                    {show(evidencia.tipo_archivo)} - {formatDateTime(evidencia.fecha_subida)}
                                  </p>
                                </button>
                                <Button asChild type="button" variant="outline" size="sm">
                                  <a
                                    href={evidencia.url_archivo}
                                    target="_blank"
                                    rel="noreferrer"
                                    aria-label={`Abrir ${show(evidencia.nombre_original)}`}
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                    Abrir
                                  </a>
                                </Button>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </section>

            {showVolunteers && (
              <section className={cardClassName}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className={cardTitleClassName}>Voluntariado</p>
                  <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-700">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5">{horasVol} h</span>
                    {voluntarios.length > 0 && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5">{voluntarios.length} vol.</span>
                    )}
                  </div>
                </div>

                {voluntarios.length === 0 ? (
                  <p className="mt-2 text-sm text-slate-500">Sin voluntarios asignados</p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {voluntarios.map((voluntario) => (
                      <li
                        key={`${voluntario.id_usuario}-${voluntario.fecha_ultima_actualizacion || 'na'}`}
                        className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                      >
                        <p className="text-sm font-medium text-slate-900">{show(voluntario.nombre_completo)}</p>
                        <p className="text-xs text-slate-600">{show(voluntario.correo)}</p>
                        <p className="text-xs text-slate-700">Horas: {Number(voluntario.horas_total || 0)} h</p>
                        <p className="text-[11px] text-slate-500">
                          Ult. actualizacion: {formatDateTime(voluntario.fecha_ultima_actualizacion)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}
          </div>
        </div>
      </div>

      <EvidenceLightboxDialog
        preview={preview}
        images={imageEvidence}
        onChangeImageIndex={(index) => setPreview({ kind: 'image', index })}
        onClose={() => setPreview(null)}
      />
    </>
  );
}
