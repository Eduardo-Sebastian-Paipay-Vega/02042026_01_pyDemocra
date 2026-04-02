import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner@2.0.3';
import { generateActivityCode } from '../../services/activities';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { checkOverlap } from './date-utils';
import { getAllowedEstadoIdsForRole } from './state';
import type { Activity, ActivityStatus, ActivityType, FormValues, User } from './types';

interface ActivityFormModalProps {
  open: boolean;
  mode: 'create' | 'edit';
  date: string;
  initialActivity: Activity | null;
  accessToken: string;
  currentUser: User | null;
  users: User[];
  estadosActividad: ActivityStatus[];
  tiposActividad: ActivityType[];
  existingActivities: Activity[];
  onClose: () => void;
  onSave: (activity: Activity) => void | Promise<void>;
}

const DEFAULT_FORM: FormValues = {
  codigo: '',
  titulo: '',
  descripcion: '',
  objetivo: '',
  fecha: '',
  hora_inicio: '09:00',
  hora_fin: '10:00',
  ubicacion_direccion: '',
  ubicacion_lat: '',
  ubicacion_lng: '',
  id_tipo_actividad: 1,
  id_responsable: 0,
  id_estado: 1,
};

type FormErrors = Partial<Record<'codigo' | 'titulo' | 'id_tipo_actividad' | 'timeRange', string>>;

const toIsoDateTime = (date: string, time: string) => `${date}T${time}:00`;
const timeToMinutes = (time: string) => {
  const [hour, minute] = time.split(':').map(Number);
  return hour * 60 + minute;
};

const normalize = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const buildDefaultActivityCode = () => {
  const year = new Date().getFullYear();
  const suffix = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
  return `ACT-${year}-${suffix}`;
};

const normalizeSnapshot = (form: FormValues) =>
  JSON.stringify({
    codigo: form.codigo.trim(),
    titulo: form.titulo.trim(),
    descripcion: form.descripcion.trim(),
    objetivo: form.objetivo.trim(),
    fecha: form.fecha,
    hora_inicio: form.hora_inicio,
    hora_fin: form.hora_fin,
    ubicacion_direccion: form.ubicacion_direccion.trim(),
    ubicacion_lat: form.ubicacion_lat.trim(),
    ubicacion_lng: form.ubicacion_lng.trim(),
    id_tipo_actividad: form.id_tipo_actividad,
    id_responsable: form.id_responsable,
    id_estado: form.id_estado,
  });

const validateForm = (form: FormValues): FormErrors => {
  const errors: FormErrors = {};
  if (!form.codigo.trim()) errors.codigo = 'El codigo es obligatorio.';
  if (!form.titulo.trim()) errors.titulo = 'El titulo es obligatorio.';
  if (!form.id_tipo_actividad) errors.id_tipo_actividad = 'Debes seleccionar un tipo.';
  if (timeToMinutes(form.hora_fin) <= timeToMinutes(form.hora_inicio)) {
    errors.timeRange = 'La hora de fin debe ser mayor a la hora de inicio.';
  }
  return errors;
};

export function ActivityFormModal({
  open,
  mode,
  date,
  initialActivity,
  accessToken,
  currentUser,
  users,
  estadosActividad,
  tiposActividad,
  existingActivities,
  onClose,
  onSave,
}: ActivityFormModalProps) {
  const [form, setForm] = useState<FormValues>(DEFAULT_FORM);
  const [baselineForm, setBaselineForm] = useState<FormValues>(DEFAULT_FORM);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const codigoSeedRef = useRef<string>('');

  // ROLE_IDS in the backend: admin=1, principal=2, trabajador=3, voluntario=4
  const isWorker = currentUser?.id_rol === 3;
  const allowedEstadoIds = useMemo(
    () => getAllowedEstadoIdsForRole(currentUser, estadosActividad),
    [currentUser, estadosActividad],
  );

  const validationErrors = useMemo(() => validateForm(form), [form]);
  const isValid = Object.keys(validationErrors).length === 0;
  const hasChanges = useMemo(
    () => normalizeSnapshot(form) !== normalizeSnapshot(baselineForm),
    [form, baselineForm],
  );

  const requestClose = useCallback(() => {
    if (isSaving) return;
    if (hasChanges && !window.confirm('Descartar cambios?')) return;
    setSubmitError(null);
    onClose();
  }, [hasChanges, isSaving, onClose]);

  useEffect(() => {
    if (!open || !currentUser) return;

    let nextForm: FormValues;
    if (mode === 'edit' && initialActivity) {
      const fecha = initialActivity.fecha_inicio.slice(0, 10);
      nextForm = {
        codigo: initialActivity.codigo,
        titulo: initialActivity.titulo,
        descripcion: initialActivity.descripcion || '',
        objetivo: initialActivity.objetivo || '',
        fecha,
        hora_inicio: initialActivity.fecha_inicio.slice(11, 16),
        hora_fin: initialActivity.fecha_fin.slice(11, 16),
        ubicacion_direccion: initialActivity.ubicacion_direccion || '',
        ubicacion_lat: initialActivity.ubicacion_lat !== null ? String(initialActivity.ubicacion_lat) : '',
        ubicacion_lng: initialActivity.ubicacion_lng !== null ? String(initialActivity.ubicacion_lng) : '',
        id_tipo_actividad: initialActivity.id_tipo_actividad,
        id_responsable: initialActivity.id_responsable,
        id_estado: initialActivity.id_estado,
      };
    } else {
      const planificadaId = estadosActividad.find((estado) => normalize(estado.nombre) === 'planificada')?.id_estado;
      const preferredEstadoId = planificadaId || allowedEstadoIds[0] || estadosActividad[0]?.id_estado || 1;
      const defaultEstadoId = allowedEstadoIds.includes(preferredEstadoId) ? preferredEstadoId : allowedEstadoIds[0] || preferredEstadoId;

      const defaultTipo = tiposActividad[0]?.id_tipo_actividad || 1;
      const defaultResponsable = currentUser.id_rol === 3
        ? currentUser.id_usuario
        : users.find((user) => user.id_rol !== 1)?.id_usuario || currentUser.id_usuario;

      nextForm = {
        ...DEFAULT_FORM,
        fecha: date || DEFAULT_FORM.fecha,
        id_tipo_actividad: defaultTipo,
        id_responsable: defaultResponsable,
        id_estado: defaultEstadoId,
        codigo: buildDefaultActivityCode(),
      };

      codigoSeedRef.current = nextForm.codigo;
    }

    setForm(nextForm);
    setBaselineForm(nextForm);
    setSubmitError(null);
    setIsSaving(false);
  }, [allowedEstadoIds, currentUser, date, estadosActividad, initialActivity, mode, open, tiposActividad, users]);

  useEffect(() => {
    if (!open || mode !== 'create') return;
    if (!accessToken) return;

    let cancelled = false;
    const seed = codigoSeedRef.current;

    (async () => {
      try {
        const codigo = await generateActivityCode(accessToken);
        if (cancelled) return;

        setForm((prev) => (prev.codigo === seed ? { ...prev, codigo } : prev));
        setBaselineForm((prev) => (prev.codigo === seed ? { ...prev, codigo } : prev));
        codigoSeedRef.current = codigo;
      } catch (err) {
        console.warn('No se pudo generar codigo de actividad, usando fallback local', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [accessToken, mode, open]);

  const onChange = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError(null);

    const hasInvalidLat = form.ubicacion_lat.trim() && Number.isNaN(Number(form.ubicacion_lat));
    const hasInvalidLng = form.ubicacion_lng.trim() && Number.isNaN(Number(form.ubicacion_lng));

    if (!isValid) {
      setSubmitError('Revisa los campos obligatorios antes de guardar.');
      return;
    }
    if (!form.fecha.trim()) {
      setSubmitError('La fecha es obligatoria.');
      return;
    }
    if (!allowedEstadoIds.includes(form.id_estado)) {
      setSubmitError('No tienes permisos para seleccionar ese estado.');
      return;
    }
    if (hasInvalidLat || hasInvalidLng) {
      setSubmitError('Latitud y longitud deben ser numeros validos.');
      return;
    }

    const creatorId = mode === 'edit' && initialActivity ? initialActivity.id_creador : (currentUser?.id_usuario || 0);

    const nextActivity: Activity = {
      id_actividad: mode === 'edit' && initialActivity ? initialActivity.id_actividad : 0,
      codigo: form.codigo.trim(),
      titulo: form.titulo.trim(),
      descripcion: form.descripcion.trim(),
      objetivo: form.objetivo.trim(),
      fecha_inicio: toIsoDateTime(form.fecha, form.hora_inicio),
      fecha_fin: toIsoDateTime(form.fecha, form.hora_fin),
      ubicacion_direccion: form.ubicacion_direccion.trim() || null,
      ubicacion_lat: form.ubicacion_lat.trim() ? Number(form.ubicacion_lat) : null,
      ubicacion_lng: form.ubicacion_lng.trim() ? Number(form.ubicacion_lng) : null,
      id_tipo_actividad: form.id_tipo_actividad,
      id_creador: creatorId,
      id_responsable: isWorker ? (currentUser?.id_usuario || 0) : form.id_responsable,
      id_estado: form.id_estado,
    };

    if (checkOverlap(nextActivity, existingActivities)) {
      const proceed = window.confirm('Hay actividades en el mismo horario. Deseas continuar igual?');
      if (!proceed) return;
    }

    try {
      setIsSaving(true);
      await Promise.resolve(onSave(nextActivity));
      toast.success(mode === 'edit' ? 'Actividad actualizada' : 'Actividad creada');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo guardar la actividad';
      console.error('Error guardando actividad', { mode, nextActivity, err });
      setSubmitError(message);
      toast.error(`No se pudo guardar (${message})`);
    } finally {
      setIsSaving(false);
    }
  };

  const assignableUsers = users.filter((user) => user.id_rol !== 1);
  const modeTitle = mode === 'edit' ? 'Editar actividad' : 'Nueva actividad';

  if (!currentUser) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) requestClose();
      }}
    >
      {/* DialogContent is the scroll container (simpler + avoids layout collapsing). */}
      <DialogContent className="w-full max-w-5xl max-h-[85vh] overflow-y-auto rounded-2xl p-0 gap-0 shadow-2xl">
        <div className="sticky top-0 z-10 border-b border-slate-200 bg-background px-6 py-4 pr-14">
          <DialogHeader className="text-left">
            <DialogTitle>{modeTitle}</DialogTitle>
            <DialogDescription className="text-xs">
              Completa los datos y guarda para ver la actividad en el calendario.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 py-5">
          <form id="activity-form" onSubmit={onSubmit} className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-2">
                <section className="space-y-3 rounded-xl border border-slate-200 p-3 transition-all hover:-translate-y-[1px] hover:shadow-md">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Datos base</p>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">Codigo</label>
                    <input
                      value={form.codigo}
                      onChange={(event) => onChange('codigo', event.target.value)}
                      disabled={isSaving}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-50"
                    />
                    {validationErrors.codigo && <p className="text-xs font-medium text-rose-600">{validationErrors.codigo}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">Tipo actividad</label>
                    <select
                      value={form.id_tipo_actividad}
                      onChange={(event) => onChange('id_tipo_actividad', Number(event.target.value))}
                      disabled={isSaving}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-50"
                    >
                      {tiposActividad.map((tipo) => (
                        <option key={tipo.id_tipo_actividad} value={tipo.id_tipo_actividad}>
                          {tipo.nombre}
                        </option>
                      ))}
                    </select>
                    {validationErrors.id_tipo_actividad && (
                      <p className="text-xs font-medium text-rose-600">{validationErrors.id_tipo_actividad}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">Titulo</label>
                    <input
                      value={form.titulo}
                      onChange={(event) => onChange('titulo', event.target.value)}
                      disabled={isSaving}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-50"
                      placeholder="Nombre de la actividad"
                    />
                    {validationErrors.titulo && <p className="text-xs font-medium text-rose-600">{validationErrors.titulo}</p>}
                  </div>
                </section>

                <section className="space-y-3 rounded-xl border border-slate-200 p-3 transition-all hover:-translate-y-[1px] hover:shadow-md">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Horario</p>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">Fecha</label>
                    <input
                      type="date"
                      value={form.fecha}
                      onChange={(event) => onChange('fecha', event.target.value)}
                      disabled={isSaving}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-50"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">Inicio</label>
                      <input
                        type="time"
                        value={form.hora_inicio}
                        onChange={(event) => onChange('hora_inicio', event.target.value)}
                        disabled={isSaving}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">Fin</label>
                      <input
                        type="time"
                        value={form.hora_fin}
                        onChange={(event) => onChange('hora_fin', event.target.value)}
                        disabled={isSaving}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-50"
                      />
                    </div>
                  </div>
                  {validationErrors.timeRange && <p className="text-xs font-medium text-rose-600">{validationErrors.timeRange}</p>}
                </section>
              </div>

              <section className="space-y-3 rounded-xl border border-slate-200 p-3 transition-all hover:-translate-y-[1px] hover:shadow-md">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Asignaciones</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">Responsable</label>
                    <select
                      value={isWorker ? currentUser.id_usuario : form.id_responsable}
                      onChange={(event) => onChange('id_responsable', Number(event.target.value))}
                      disabled={isSaving || isWorker}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    >
                      {assignableUsers.map((user) => (
                        <option key={user.id_usuario} value={user.id_usuario}>
                          {user.nombre_completo}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">Estado</label>
                    <select
                      value={form.id_estado}
                      onChange={(event) => onChange('id_estado', Number(event.target.value))}
                      disabled={isSaving}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-50"
                    >
                      {estadosActividad
                        .filter((estado) => allowedEstadoIds.includes(estado.id_estado))
                        .map((estado) => (
                          <option key={estado.id_estado} value={estado.id_estado}>
                            {estado.nombre}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              </section>

              <section className="space-y-3 rounded-xl border border-slate-200 p-3 transition-all hover:-translate-y-[1px] hover:shadow-md">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ubicacion</p>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">Direccion</label>
                  <input
                    value={form.ubicacion_direccion}
                    onChange={(event) => onChange('ubicacion_direccion', event.target.value)}
                    disabled={isSaving}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-50"
                    placeholder="Ej. Colegio San Juan - Aula 2"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">Latitud (opcional)</label>
                    <input
                      value={form.ubicacion_lat}
                      onChange={(event) => onChange('ubicacion_lat', event.target.value)}
                      disabled={isSaving}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-50"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">Longitud (opcional)</label>
                    <input
                      value={form.ubicacion_lng}
                      onChange={(event) => onChange('ubicacion_lng', event.target.value)}
                      disabled={isSaving}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-50"
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-3 rounded-xl border border-slate-200 p-3 transition-all hover:-translate-y-[1px] hover:shadow-md">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Detalle</p>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">Descripcion</label>
                  <textarea
                    value={form.descripcion}
                    onChange={(event) => onChange('descripcion', event.target.value)}
                    disabled={isSaving}
                    rows={3}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">Objetivo</label>
                  <textarea
                    value={form.objetivo}
                    onChange={(event) => onChange('objetivo', event.target.value)}
                    disabled={isSaving}
                    rows={3}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-50"
                  />
                </div>
              </section>

              {submitError && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
                  {submitError}
                </div>
              )}
            </form>
        </div>

        <div className="sticky bottom-0 z-10 border-t border-slate-200 bg-background px-6 py-4">
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={requestClose} disabled={isSaving}>
              Cancelar
            </Button>
            <Button type="submit" form="activity-form" disabled={!isValid || !hasChanges || isSaving}>
              {isSaving ? 'Guardando...' : mode === 'edit' ? 'Guardar cambios' : 'Guardar actividad'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
