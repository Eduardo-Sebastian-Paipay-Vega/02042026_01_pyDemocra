export type UserRoleName = 'admin' | 'principal' | 'trabajador' | 'voluntario';

export interface UserRoleRelation {
  id_rol?: number;
  nombre: string;
}

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
  estadoColor?: string | null;
  estadoDescripcion?: string | null;
  roles?: UserRoleRelation;
  role?: string;
  areaId?: string;
  organizationId?: string;
  organizationIds?: string[];
  organizationName?: string | null;
  organizations?: Array<{ id_organizacion: number; nombre: string }>;
  createdAt?: string;
}

const ROLE_ID_TO_NAME: Record<number, UserRoleName> = {
  1: 'admin',
  2: 'principal',
  3: 'trabajador',
  4: 'voluntario',
};

const normalizeRoleName = (value?: string | null): UserRoleName | '' => {
  if (!value) return '';

  const normalized = value.trim().toLowerCase();
  if (normalized === 'jefa') return 'principal';
  if (normalized === 'responsable') return 'trabajador';
  if (normalized === 'admin' || normalized === 'principal' || normalized === 'trabajador' || normalized === 'voluntario') {
    return normalized;
  }

  return '';
};

export const getUserRoleName = (user?: Pick<User, 'id_rol' | 'roles' | 'role'> | null): UserRoleName | '' => {
  const fromRelation = normalizeRoleName(user?.roles?.nombre);
  if (fromRelation) return fromRelation;

  const fromLegacy = normalizeRoleName(user?.role);
  if (fromLegacy) return fromLegacy;

  return ROLE_ID_TO_NAME[Number(user?.id_rol)] || '';
};

export const getUserRoleLabel = (user?: Pick<User, 'id_rol' | 'roles' | 'role'> | null): string => {
  const role = getUserRoleName(user);
  if (!role) return 'Sin rol';
  return role.charAt(0).toUpperCase() + role.slice(1);
};
