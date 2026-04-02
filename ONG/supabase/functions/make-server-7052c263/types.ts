// Tipos compartidos del sistema

export type Role = 'admin' | 'principal' | 'trabajador' | 'voluntario';

export interface User {
  id: string;
  email: string;
  name: string;
  username?: string;
  dni?: string;
  phone?: string;
  availability?: string[];
  id_rol: number;
  id_estado?: number;
  estado?: string;
  estadoDescripcion?: string | null;
  estadoColor?: string | null;
  roles?: {
    nombre: string;
  };
  role?: string;
  areaId?: string;
  organizationId?: string;
  organizationIds?: string[];
  organizationName?: string | null;
  organizations?: Array<{ id_organizacion: number; nombre: string }>;
  createdAt: string;
}

export interface Volunteer {
  id: string;
  dni: string;
  name: string;
  email: string;
  phone: string;
  areaId: string;
  availability: string[];
  status: 'active' | 'inactive';
  statusId?: number;
  statusName?: string;
  totalHours: number;
  totalActivities: number;
  createdAt: string;
}

export interface Activity {
  id: string;
  title: string;
  typeId: string;
  locationId: string;
  startDate: string;
  endDate: string;
  duration: number; // en horas
  responsibleId: string;
  responsibleName: string;
  description: string;
  attendees: string[]; // IDs de voluntarios
  status: 'pending' | 'validated' | 'rejected';
  estado?: string;
  id_estado?: number;
  estadoColor?: string | null;
  estadoDescripcion?: string | null;
  rejectionReason?: string;
  createdBy: string;
  createdAt: string;
  validatedBy?: string;
  validatedAt?: string;
}

export interface Area {
  id: string;
  name: string;
  color: string;
}

export interface ActivityType {
  id: string;
  name: string;
}

export interface Location {
  id: string;
  name: string;
  address: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entity: string;
  entityId: string;
  changes: any;
  timestamp: string;
}
