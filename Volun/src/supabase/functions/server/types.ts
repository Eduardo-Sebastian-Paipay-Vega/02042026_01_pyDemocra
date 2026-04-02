// Tipos compartidos del sistema

export type Role = 'admin' | 'jefa' | 'trabajador' | 'voluntario';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  areaId?: string;
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
  status: 'active' | 'inactive' | 'banned';
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
