/**
 * EDUCACION OS — SHARED TYPES & API CONTRACTS (DDS SINGLE SOURCE OF TRUTH)
 * Trazabilidad 1:1: RF -> CU -> DDL -> DTO -> UI Component
 */

export * from './database.types';

export type UserRole =
  | 'SUPER_ADMIN'
  | 'TENANT_OWNER'
  | 'DIRECTOR_USER'
  | 'ACADEMIC_ADMIN'
  | 'COORDINATOR_USER'
  | 'TEACHER_USER'
  | 'STUDENT_USER'
  | 'PARENT_USER'
  | 'TUTOR_USER'
  | 'FINANCE_ADMIN';

export type EwsRiskLevel = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH_RISK_DROPOUT';

export interface UserProfileDto {
  id: string;
  tenantId: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: UserRole[];
  avatarUrl?: string;
  isActive: boolean;
  createdAt: string;
}

export interface CourseDto {
  id: string;
  tenantId: string;
  code: string;
  title: string;
  description: string;
  gradeLevel: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  modulesCount: number;
  assignedTeacherId?: string;
  createdAt: string;
}

export interface EwsRiskAlertDto {
  id: string;
  studentId: string;
  studentName: string;
  riskScore: number; // 0.00 to 1.00
  riskLevel: EwsRiskLevel;
  triggerFactors: string[];
  suggestedAction: string;
  isIntervened: boolean;
  createdAt: string;
}

export interface PaymentTransactionDto {
  id: string;
  tenantId: string;
  payerId: string;
  amount: number;
  currency: string;
  provider: 'STRIPE' | 'PAYPAL' | 'YAPE' | 'PLIN' | 'BANK_TRANSFER';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  invoiceUrl?: string;
  createdAt: string;
}

export interface StudentDigitalTwinDto {
  id: string;
  studentId: string;
  learningStyle: 'VISUAL' | 'AUDITORY' | 'KINESTHETIC';
  processingSpeedScore: number;
  postureHealthScore: number;
  burnoutFatigueIndex: number;
  simulationAccuracy: number;
  updatedAt: string;
}
