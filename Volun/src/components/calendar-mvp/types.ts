export type RoleCode = 1 | 2;

export interface User {
  id_usuario: number;
  nombre_completo: string;
  correo: string;
  id_rol: number;
  id_estado: number;
  id_area: number | null;
  id_organizacion: number | null;
}

export interface ActivityStatus {
  id_estado: number;
  nombre: string;
  ambito: string;
  color: string;
}

export interface ActivityType {
  id_tipo_actividad: number;
  nombre: string;
}

export interface Activity {
  id_actividad: number;
  codigo: string;
  titulo: string;
  descripcion: string;
  objetivo: string;
  fecha_inicio: string; // ISO string
  fecha_fin: string; // ISO string
  ubicacion_direccion: string | null;
  ubicacion_lat: number | null;
  ubicacion_lng: number | null;
  id_tipo_actividad: number;
  id_creador: number;
  id_responsable: number;
  id_estado: number;
  responsableName?: string | null;
  creadorName?: string | null;
}

export interface ActivityVolunteer {
  id_actividad: number;
  id_usuario: number;
  horas_total: number;
}

export interface Evidence {
  id_evidencia: number;
  id_actividad: number;
  url_archivo: string;
  tipo_archivo: string;
  nombre_original: string;
  fecha_subida: string; // ISO string
}

export interface ActivityDetailPayload {
  activity: Activity | null;
  evidencias: Evidence[];
}

export interface FormValues {
  codigo: string;
  titulo: string;
  descripcion: string;
  objetivo: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  ubicacion_direccion: string;
  ubicacion_lat: string;
  ubicacion_lng: string;
  id_tipo_actividad: number;
  id_responsable: number;
  id_estado: number;
}
