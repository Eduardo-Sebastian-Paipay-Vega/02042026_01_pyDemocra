type Uuid = string;
type IsoDate = string;
type IsoDateTime = string;
type JsonObject = Record<string, unknown>;
type JsonValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JsonValue }
  | JsonValue[];

type GenericTable<TRow> = {
  Row: TRow;
  Insert: Partial<TRow>;
  Update: Partial<TRow>;
  Relationships: [];
};

type EmptySchema = {
  Views: Record<string, never>;
  Functions: Record<string, never>;
};

interface PublicCatGeneroRow {
  codigo: string;
  nombre: string;
}

interface PublicCatPaisRow {
  codigo: string;
  nombre: string;
}

interface PublicCatMonedaRow {
  codigo: string;
  nombre: string;
  simbolo: string | null;
}

interface PublicCatTipoDocumentoRow {
  codigo: string;
  nombre: string;
}

interface PublicCatPermissionRow {
  id: string;
  description: string;
  module: string;
  created_at: IsoDateTime;
}

interface PublicCatModuleStatusRow {
  codigo: string;
  nombre: string;
}

interface PublicTenantRow {
  id: Uuid;
  name: string;
  tax_id: string;
  industry_type_id: string;
  plan_id: string;
  status_financial_id: string;
  billing_day: number;
  max_licenses: number;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}

interface PublicPlanPolicyRow {
  plan_id: string;
  retention_days: number;
  max_sedes: number;
  max_licenses: number;
  can_use_terminals: boolean;
  created_at: IsoDateTime;
}

interface PublicProfileRow {
  id: Uuid;
  tenant_id: Uuid | null;
  full_name: string | null;
  pin_hash: string | null;
  is_blocked: boolean;
  blocked_reason: string | null;
  pin_failed_attempts: number;
  pin_last_failed_at: IsoDateTime | null;
  pin_blocked_until: IsoDateTime | null;
  risk_blocked_until: IsoDateTime | null;
  tipo_documento: string | null;
  numero_documento: string | null;
  genero: string | null;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}

interface PublicRoleRow {
  id: Uuid;
  tenant_id: Uuid;
  name: string;
  hierarchy_level: number;
  is_system_role: boolean;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}

interface PublicRolePermissionRow {
  role_id: Uuid;
  permission: string;
  created_at: IsoDateTime;
}

interface PublicUserRoleSedeRow {
  tenant_id: Uuid;
  user_id: Uuid;
  role_id: Uuid;
  sede_id: Uuid;
  created_at: IsoDateTime;
}

interface PublicSedeRow {
  id: Uuid;
  tenant_id: Uuid;
  name: string;
  is_active: boolean;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}

interface PublicRoleAccessConstraintRow {
  id: Uuid;
  tenant_id: Uuid;
  role_id: Uuid;
  sede_id: Uuid | null;
  ip_cidr: string | null;
  time_start: string | null;
  time_end: string | null;
  require_trusted_device: boolean;
  created_at: IsoDateTime;
}

interface PublicDeviceRow {
  id: Uuid;
  tenant_id: Uuid;
  user_id: Uuid;
  device_fingerprint: string;
  is_trusted: boolean;
  last_ip: string | null;
  last_user_agent: string | null;
  last_seen_at: IsoDateTime | null;
  created_at: IsoDateTime;
}

interface PublicTerminalRow {
  id: Uuid;
  tenant_id: Uuid;
  name: string;
  created_at: IsoDateTime;
}

interface PublicSessionRow {
  id: Uuid;
  tenant_id: Uuid;
  user_id: Uuid | null;
  terminal_id: Uuid | null;
  device_id: Uuid | null;
  session_type: "web" | "terminal" | "api";
  ip: string | null;
  user_agent: string | null;
  created_at: IsoDateTime;
  expires_at: IsoDateTime;
  revoked_at: IsoDateTime | null;
  revoke_reason: string | null;
}

interface PublicAuthEventRow {
  id: Uuid;
  tenant_id: Uuid;
  user_id: Uuid | null;
  session_id: Uuid | null;
  terminal_id: Uuid | null;
  device_id: Uuid | null;
  event_type: string;
  result: "success" | "error";
  ip: string | null;
  user_agent: string | null;
  error_code: string | null;
  created_at: IsoDateTime;
}

interface PublicAuditLogRow {
  id: Uuid;
  tenant_id: Uuid | null;
  schema_name: string;
  table_name: string;
  operation: string;
  record_pk: string | null;
  old_data: JsonObject | null;
  new_data: JsonObject | null;
  changed_by: Uuid | null;
  created_at: IsoDateTime;
}

interface PublicSystemModuleRow {
  codigo: string;
  nombre: string;
  schema_name: string;
  current_version: string;
  is_core: boolean;
  is_transversal: boolean;
  created_at: IsoDateTime;
}

interface PublicTenantModuleRow {
  tenant_id: Uuid;
  module_code: string;
  status_code: string;
  activated_at: IsoDateTime;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
  created_by: Uuid | null;
  updated_by: Uuid | null;
}

interface OngEstadoVoluntarioRow {
  codigo: string;
  nombre_estado: string;
  descripcion: string | null;
  orden_visual: number;
}

interface OngUnidadMedidaRow {
  codigo: string;
  nombre: string;
  abreviatura: string;
}

interface OngEstadoObjetoRow {
  codigo: string;
  nombre: string;
  descripcion: string | null;
}

interface OngEstadoProyectoRow {
  codigo: string;
  nombre_estado: string;
  orden_visual: number;
}

interface OngAreaRow {
  id: Uuid;
  tenant_id: Uuid;
  codigo: string;
  nombre_area: string;
  descripcion: string | null;
  activo: boolean;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
  created_by: Uuid | null;
  updated_by: Uuid | null;
}

interface OngUbicacionRow {
  id: Uuid;
  tenant_id: Uuid;
  codigo: string;
  nombre_ubicacion: string;
  direccion: string;
  latitud: number | null;
  longitud: number | null;
  activa: boolean;
  imagen_url: string | null;
  codigo_pais: string | null;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
  created_by: Uuid | null;
  updated_by: Uuid | null;
}

interface OngItemRow {
  id: Uuid;
  tenant_id: Uuid;
  codigo: string;
  nombre_item: string;
  descripcion: string;
  codigo_unidad_medida: string;
  codigo_estado_objeto: string;
  sku: string | null;
  imagen_url: string | null;
  activo: boolean;
  created_at: IsoDateTime;
  created_by: Uuid | null;
  updated_at: IsoDateTime;
  updated_by: Uuid | null;
}

interface OngVoluntarioRow {
  id: Uuid;
  tenant_id: Uuid;
  iam_user_id: Uuid | null;
  numero_documento: string;
  tipo_documento: string | null;
  genero: string | null;
  codigo_pais: string | null;
  nombre: string;
  apellido: string;
  fecha_nacimiento: IsoDate | null;
  email: string | null;
  telefono: string | null;
  ruta_foto: string | null;
  codigo_estado: string;
  observaciones: string | null;
  created_at: IsoDateTime;
  created_by: Uuid | null;
  updated_at: IsoDateTime;
  updated_by: Uuid | null;
}

interface OngBeneficiarioRow {
  id: Uuid;
  tenant_id: Uuid;
  numero_documento: string | null;
  tipo_documento: string | null;
  codigo_pais: string | null;
  nombre: string;
  apellido: string;
  fecha_nacimiento: IsoDate | null;
  genero: string | null;
  telefono: string | null;
  direccion: string | null;
  foto_url: string | null;
  observaciones: string | null;
  created_at: IsoDateTime;
  created_by: Uuid | null;
  updated_at: IsoDateTime;
  updated_by: Uuid | null;
}

interface OngProyectoRow {
  id: Uuid;
  tenant_id: Uuid;
  codigo: string;
  nombre_proyecto: string;
  descripcion: string;
  fecha_inicio: IsoDate | null;
  fecha_fin: IsoDate | null;
  id_area: Uuid;
  codigo_estado: string;
  presupuesto: number;
  imagen_url: string | null;
  created_at: IsoDateTime;
  created_by: Uuid | null;
  updated_at: IsoDateTime;
  updated_by: Uuid | null;
}

interface OngTareaRow {
  id: Uuid;
  tenant_id: Uuid;
  id_actividad: Uuid | null;
  titulo: string;
  descripcion: string | null;
  estado: "pendiente" | "en_progreso" | "completada" | "cancelada" | null;
  fecha_limite: IsoDate | null;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
  created_by: Uuid | null;
  updated_by: Uuid | null;
}

interface OngActividadRow {
  id: Uuid;
  tenant_id: Uuid;
  id_proyecto: Uuid | null;
  titulo: string;
  descripcion: string | null;
  codigo_estado:
    | "pendiente"
    | "planificada"
    | "en_progreso"
    | "completada"
    | "cancelada";
  fecha_inicio: IsoDateTime | null;
  fecha_fin: IsoDateTime | null;
  id_ubicacion: Uuid | null;
  horas_estimadas: number | null;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
  created_by: Uuid | null;
  updated_by: Uuid | null;
}

interface OngHorasActividadRow {
  id: Uuid;
  tenant_id: Uuid;
  id_actividad: Uuid;
  id_voluntario: Uuid;
  horas_registradas: number;
  fecha: IsoDate;
  estado_aprobacion: "pendiente" | "aprobada" | "rechazada" | null;
  aprobado_por: Uuid | null;
  id_aprobacion: Uuid | null;
  comentario_resolucion: string | null;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
  created_by: Uuid | null;
  updated_by: Uuid | null;
}

interface OngAsignacionActividadRow {
  id: Uuid;
  tenant_id: Uuid;
  id_actividad: Uuid;
  id_voluntario: Uuid;
  rol_en_actividad: string | null;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
  created_by: Uuid | null;
  updated_by: Uuid | null;
  is_deleted: boolean;
  deleted_at: IsoDateTime | null;
  deleted_by: Uuid | null;
}

interface OngEvidenciaActividadRow {
  id: Uuid;
  tenant_id: Uuid;
  id_actividad: Uuid;
  id_voluntario: Uuid;
  url_archivo: string;
  tipo_evidencia: string | null;
  comentario: string | null;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
  created_by: Uuid | null;
  updated_by: Uuid | null;
}

interface OngRecursoProyectoRow {
  id: Uuid;
  tenant_id: Uuid;
  id_proyecto: Uuid;
  id_item: Uuid;
  cantidad_requerida: number;
  cantidad_asignada: number | null;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
  created_by: Uuid | null;
  updated_by: Uuid | null;
  is_deleted: boolean;
  deleted_at: IsoDateTime | null;
  deleted_by: Uuid | null;
}

interface OngAsistenciaRow {
  id: Uuid;
  tenant_id: Uuid;
  id_actividad: Uuid;
  id_voluntario: Uuid;
  fecha_operacion: IsoDate;
  check_in_at: IsoDateTime | null;
  check_out_at: IsoDateTime | null;
  origen_registro: "scan" | "manual" | "import";
  estado: "presente" | "tardanza" | "ausente" | "justificado" | "pendiente";
  observacion: string | null;
  qr_payload: string | null;
  id_card_id: Uuid | null;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
  created_by: Uuid | null;
  updated_by: Uuid | null;
  deleted_at: IsoDateTime | null;
  deleted_by: Uuid | null;
  is_deleted: boolean;
}

interface OngAprobacionRow {
  id: Uuid;
  tenant_id: Uuid;
  modulo: string;
  entidad_schema: string;
  entidad_tabla: string;
  entidad_id: Uuid;
  tipo_aprobacion: "hora" | "evidencia" | "admision" | "finanza" | "otro";
  estado: "pendiente" | "aprobada" | "rechazada" | "devuelta";
  comentario: string | null;
  solicitado_por: Uuid | null;
  resuelto_por: Uuid | null;
  requested_at: IsoDateTime;
  resolved_at: IsoDateTime | null;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
  created_by: Uuid | null;
  updated_by: Uuid | null;
}

interface OngIdCardTemplateRow {
  id: Uuid;
  tenant_id: Uuid;
  nombre: string;
  base_image_url: string;
  template_width: number;
  template_height: number;
  /** JSON schema template config (layers, metadata, positions in mm). Null for legacy templates. */
  template_config: JsonValue | null;
  activa: boolean;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
  created_by: Uuid | null;
  updated_by: Uuid | null;
}

interface OngIdCardTemplateFieldRow {
  id: Uuid;
  tenant_id: Uuid;
  id_template: Uuid;
  field_key: "foto" | "nombre" | "dni" | "codigo" | "qr";
  pos_x: number;
  pos_y: number;
  width: number | null;
  height: number | null;
  font_size: number | null;
  font_family: string | null;
  font_weight: string | null;
  color_hex: string | null;
  z_index: number;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}

interface OngIdCardRow {
  id: Uuid;
  tenant_id: Uuid;
  id_voluntario: Uuid;
  id_template: Uuid;
  card_code: string;
  qr_payload: string;
  issued_at: IsoDateTime;
  expires_at: IsoDateTime | null;
  estado: "activa" | "revocada" | "expirada";
  image_render_url: string | null;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
  created_by: Uuid | null;
  updated_by: Uuid | null;
}

interface OngAsignacionProyectoRow {
  id: Uuid;
  tenant_id: Uuid;
  id_proyecto: Uuid;
  id_voluntario: Uuid;
  rol_en_proyecto: string | null;
  fecha_ingreso: IsoDate | null;
  activo: boolean | null;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
  created_by: Uuid | null;
  updated_by: Uuid | null;
}

interface OngParticipacionProyectoRow {
  id: Uuid;
  tenant_id: Uuid;
  id_proyecto: Uuid;
  id_beneficiario: Uuid;
  observaciones: string | null;
  fecha_vinculacion: IsoDate | null;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
  created_by: Uuid | null;
  updated_by: Uuid | null;
}

interface OngTipoTransaccionInventarioRow {
  codigo: string;
  nombre: string;
  signo: -1 | 0 | 1;
}

interface OngTransaccionInventarioRow {
  id: Uuid;
  tenant_id: Uuid;
  id_item: Uuid;
  codigo_tipo_transaccion: string;
  cantidad: number;
  id_ubicacion_origen: Uuid | null;
  id_ubicacion_destino: Uuid | null;
  fecha_transaccion: IsoDateTime | null;
  registrado_por: Uuid;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
  created_by: Uuid | null;
  updated_by: Uuid | null;
}

interface RrhhSolicitudAdmisionRow {
  id: Uuid;
  tenant_id: Uuid;
  nombres: string;
  apellidos: string;
  email: string;
  estado: "nueva" | "en_entrevista" | "aprobada" | "rechazada" | null;
  fecha_solicitud: IsoDateTime | null;
  notas: string | null;
  id_voluntario_vinculado: Uuid | null;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
  created_by: Uuid | null;
  updated_by: Uuid | null;
}

interface RrhhDocumentoAdmisionRow {
  id: Uuid;
  tenant_id: Uuid;
  id_solicitud: Uuid;
  tipo_documento: string;
  archivo_url: string;
  verificado: boolean | null;
  verified_by: Uuid | null;
  verified_at: IsoDateTime | null;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
  created_by: Uuid | null;
  updated_by: Uuid | null;
}

interface RrhhHabilidadRow {
  codigo: string;
  nombre: string;
}

interface RrhhVoluntarioHabilidadRow {
  id: Uuid;
  tenant_id: Uuid;
  id_voluntario: Uuid;
  codigo_habilidad: string;
  nivel: "basico" | "intermedio" | "avanzado" | "experto" | null;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
  created_by: Uuid | null;
  updated_by: Uuid | null;
}

interface RrhhVolunteerPreferenceRow {
  id: Uuid;
  tenant_id: Uuid;
  id_voluntario: Uuid;
  disponibilidad_json: JsonObject | null;
  distancia_max_km: number | null;
  quiere_viajar: boolean | null;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
  created_by: Uuid | null;
  updated_by: Uuid | null;
}

interface RrhhDocumentoVoluntarioRow {
  id: Uuid;
  tenant_id: Uuid;
  id_voluntario: Uuid;
  tipo_documento: string;
  url_archivo: string;
  fecha_vencimiento: IsoDate | null;
  vigente: boolean | null;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
  created_by: Uuid | null;
  updated_by: Uuid | null;
}

interface RrhhEntrevistaAdmisionRow {
  id: Uuid;
  tenant_id: Uuid;
  id_solicitud: Uuid;
  entrevistador_id: Uuid;
  fecha_entrevista: IsoDateTime;
  comentarios: string | null;
  resultado: "apto" | "no_apto" | "pendiente" | null;
  puntaje: number | null;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
  created_by: Uuid | null;
  updated_by: Uuid | null;
}

interface RrhhOnboardingPasoRow {
  id: Uuid;
  tenant_id: Uuid;
  nombre_paso: string;
  orden: number;
  obligatorio: boolean | null;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
  created_by: Uuid | null;
  updated_by: Uuid | null;
}

interface RrhhOnboardingVoluntarioRow {
  id: Uuid;
  tenant_id: Uuid;
  id_voluntario: Uuid;
  id_paso: Uuid;
  completado: boolean | null;
  fecha_completado: IsoDateTime | null;
  evidencia_url: string | null;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
  created_by: Uuid | null;
  updated_by: Uuid | null;
  is_deleted: boolean;
  deleted_at: IsoDateTime | null;
  deleted_by: Uuid | null;
}

interface RrhhCodigoRegistroVoluntarioRow {
  id: Uuid;
  tenant_id: Uuid;
  codigo: string;
  email_objetivo: string | null;
  numero_documento_objetivo: string | null;
  nombres_objetivo: string | null;
  apellidos_objetivo: string | null;
  id_solicitud: Uuid | null;
  id_voluntario: Uuid | null;
  expires_at: IsoDateTime;
  max_uses: number;
  use_count: number;
  estado: "activo" | "consumido" | "expirado" | "revocado";
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
  created_by: Uuid | null;
  updated_by: Uuid | null;
}

interface RrhhRegistroDocumentoPostulanteRow {
  id: Uuid;
  tenant_id: Uuid;
  id_codigo_registro: Uuid;
  tipo_documento: string;
  archivo_url: string;
  verificado: boolean;
  verified_by: Uuid | null;
  verified_at: IsoDateTime | null;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
  created_by: Uuid | null;
  updated_by: Uuid | null;
}

interface RrhhAdmissionRequirementRow {
  id: Uuid;
  tenant_id: Uuid;
  nombre_requisito: string;
  descripcion: string | null;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
  created_by: Uuid | null;
  updated_by: Uuid | null;
}

interface RrhhAdmissionRequirementReviewRow {
  id: Uuid;
  tenant_id: Uuid;
  id_solicitud: Uuid;
  id_requisito: Uuid;
  estado: string | null;
  revisado_por: Uuid | null;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
  created_by: Uuid | null;
  updated_by: Uuid | null;
}

interface RrhhAdmisionEstadoHistorialRow {
  id: Uuid;
  tenant_id: Uuid;
  id_solicitud: Uuid;
  estado_anterior: string | null;
  estado_nuevo: string;
  comentario: string | null;
  cambiado_por: Uuid;
  fecha_cambio: IsoDateTime | null;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}

interface RrhhRolOperativoRow {
  id: Uuid;
  tenant_id: Uuid;
  nombre_rol: string;
  descripcion: string | null;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
  created_by: Uuid | null;
  updated_by: Uuid | null;
}

interface RrhhAsignacionRolRow {
  id: Uuid;
  tenant_id: Uuid;
  id_voluntario: Uuid;
  id_rol_operativo: Uuid;
  fecha_asignacion: IsoDate | null;
  activo: boolean | null;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
  created_by: Uuid | null;
  updated_by: Uuid | null;
}

interface RrhhPerfilCoordinadorRow {
  id: Uuid;
  tenant_id: Uuid;
  id_voluntario: Uuid;
  anios_experiencia: number | null;
  departamento_asignado: string | null;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
  created_by: Uuid | null;
  updated_by: Uuid | null;
}

interface FinanzasCuentaRow {
  id: Uuid;
  tenant_id: Uuid;
  nombre_cuenta: string;
  tipo_cuenta: "banco" | "caja_chica" | "pasarela";
  moneda: string;
  saldo_actual: number;
  activa: boolean | null;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
  created_by: Uuid | null;
  updated_by: Uuid | null;
}

interface FinanzasCatTipoCuentaRow {
  codigo: "banco" | "caja_chica" | "pasarela";
  nombre: string;
}

interface FinanzasCategoriaRow {
  id: Uuid;
  tenant_id: Uuid;
  nombre: string;
  tipo: "ingreso" | "egreso";
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
  created_by: Uuid | null;
  updated_by: Uuid | null;
}

interface FinanzasTransaccionRow {
  id: Uuid;
  tenant_id: Uuid;
  id_cuenta: Uuid;
  id_categoria: Uuid;
  tipo: "ingreso" | "egreso";
  monto: number;
  fecha_transaccion: IsoDate;
  descripcion: string | null;
  comprobante_url: string | null;
  id_proyecto: Uuid | null;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
  created_by: Uuid | null;
  updated_by: Uuid | null;
}

interface FinanzasComprobanteFinancieroRow {
  id: Uuid;
  tenant_id: Uuid;
  id_transaccion: Uuid;
  tipo_comprobante: string;
  numero_comprobante: string;
  emisor_ruc_dni: string | null;
  emisor_nombre: string | null;
  url_archivo: string | null;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
  created_by: Uuid | null;
  updated_by: Uuid | null;
}

interface FinanzasAprobacionTransaccionRow {
  id: Uuid;
  tenant_id: Uuid;
  id_transaccion: Uuid;
  estado: "pendiente" | "aprobada" | "rechazada";
  comentario: string | null;
  solicitado_por: Uuid | null;
  resuelto_por: Uuid | null;
  requested_at: IsoDateTime;
  resolved_at: IsoDateTime | null;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}

interface ClinicoFichaMedicaRow {
  id: Uuid;
  tenant_id: Uuid;
  id_beneficiario: Uuid;
  tipos_sangre: string | null;
  alergias: string | null;
  condiciones_preexistentes: string | null;
  medicacion_actual: string | null;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
  created_by: Uuid | null;
  updated_by: Uuid | null;
}

interface ClinicoAccesoSensibleLogRow {
  id: Uuid;
  tenant_id: Uuid;
  id_ficha: Uuid;
  usuario_id: Uuid;
  motivo: string | null;
  fecha_acceso: IsoDateTime | null;
  created_at: IsoDateTime;
}

interface ClinicoAccesoSensibleVoluntarioLogRow {
  id: Uuid;
  tenant_id: Uuid;
  id_ficha_voluntario: Uuid;
  usuario_id: Uuid;
  motivo: string;
  ip: string | null;
  user_agent: string | null;
  fecha_acceso: IsoDateTime;
  created_at: IsoDateTime;
}

interface ClinicoPerfilNinoRow {
  id: Uuid;
  tenant_id: Uuid;
  id_beneficiario: Uuid;
  nombre_tutor: string;
  telefono_tutor: string | null;
  colegio: string | null;
  grado_escolar: string | null;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
  created_by: Uuid | null;
  updated_by: Uuid | null;
}

interface ClinicoPerfilAdultoMayorRow {
  id: Uuid;
  tenant_id: Uuid;
  id_beneficiario: Uuid;
  movilidad_reducida: boolean | null;
  vive_solo: boolean | null;
  contacto_emergencia: string | null;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
  created_by: Uuid | null;
  updated_by: Uuid | null;
}

interface ClinicoFichaSensibleVoluntarioRow {
  id: Uuid;
  tenant_id: Uuid;
  id_voluntario: Uuid;
  condiciones_medicas: string | null;
  contacto_emergencia: string | null;
  telefono_emergencia: string | null;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
  created_by: Uuid | null;
  updated_by: Uuid | null;
}

interface AcademicoCursoRow {
  id: Uuid;
  tenant_id: Uuid;
  nombre_curso: string;
  descripcion: string | null;
  horas_certificacion: number | null;
  activo: boolean | null;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
  created_by: Uuid | null;
  updated_by: Uuid | null;
}

interface AcademicoInscripcionRow {
  id: Uuid;
  tenant_id: Uuid;
  id_curso: Uuid;
  id_voluntario: Uuid;
  estado: "inscrito" | "aprobado" | "reprobado" | null;
  nota: number | null;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
  created_by: Uuid | null;
  updated_by: Uuid | null;
}

interface AcademicoCertificadoRow {
  id: Uuid;
  tenant_id: Uuid;
  id_inscripcion: Uuid;
  url_certificado: string;
  fecha_emision: IsoDate;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
  created_by: Uuid | null;
  updated_by: Uuid | null;
}

interface AcademicoAsistenciaRow {
  id: Uuid;
  tenant_id: Uuid;
  id_inscripcion: Uuid;
  fecha_clase: IsoDate;
  asistio: boolean | null;
  minutos_asistidos: number | null;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
  created_by: Uuid | null;
  updated_by: Uuid | null;
}

interface ComunicacionCanalNotificacionRow {
  codigo: string;
  nombre: string;
}

interface ComunicacionHistorialNotificacionRow {
  id: Uuid;
  tenant_id: Uuid;
  id_usuario: Uuid;
  titulo: string;
  mensaje: string;
  leida: boolean | null;
  codigo_canal: string | null;
  estado_entrega: string;
  error_mensaje: string | null;
  id_plantilla: Uuid | null;
  payload: JsonValue;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
  created_by: Uuid | null;
  updated_by: Uuid | null;
}

interface ComunicacionPlantillaNotificacionRow {
  id: Uuid;
  tenant_id: Uuid;
  codigo_canal: string;
  nombre_plantilla: string;
  asunto: string | null;
  cuerpo_html: string | null;
  cuerpo_texto: string | null;
  activa: boolean | null;
  variables: JsonValue;
  codigo_evento: string | null;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
  created_by: Uuid | null;
  updated_by: Uuid | null;
}

interface AuditoriaAuditLogRow {
  id_audit: Uuid;
  tenant_id: Uuid;
  table_name: string;
  record_pk: string | null;
  action: "INSERT" | "UPDATE" | "DELETE";
  before_json: JsonObject | null;
  after_json: JsonObject | null;
  auth_user_id: Uuid | null;
  event_at: IsoDateTime;
  ip: string | null;
  user_agent: string | null;
  correlation_id: Uuid | null;
  source: string;
}

/**
 * Dedicated view/projection for medical audit entries surfaced to the
 * medical_audit_viewer RBAC role.  Read-only; populated by the service layer
 * by merging clinico access logs + auditoria.audit_log rows tagged with
 * "medical_audit:" source prefix.
 */
interface AuditoriaMedicalAccessRow {
  id: Uuid;
  tenant_id: Uuid;
  /** UUID of the medical record that was accessed. */
  record_id: Uuid;
  /** "ficha_medica" | "ficha_sensible_voluntario" */
  record_kind: string;
  /** "VIEW" | "EDIT" | "DELETE" */
  action: string;
  actor_id: Uuid | null;
  reason: string | null;
  /** Comma-separated field names (no values) for EDIT events. */
  changed_fields: string | null;
  ip_address: string | null;
  user_agent: string | null;
  event_at: IsoDateTime;
}

type PublicFunctions = {
  fn_current_tenant_id: {
    Args: Record<string, never>;
    Returns: Uuid;
  };
  fn_has_permission: {
    Args: {
      p_permission: string;
    };
    Returns: boolean;
  };
  fn_is_tenant_admin: {
    Args: Record<string, never>;
    Returns: boolean;
  };
  fn_remote_revoke_app_session: {
    Args: {
      p_session_id: Uuid;
      p_reason: string;
    };
    Returns: PublicSessionRow;
  };
};

type OngFunctions = {
  fn_register_attendance_scan: {
    Args: {
      p_qr_payload: string;
      p_id_actividad: Uuid;
      p_scan_time?: IsoDateTime | null;
    };
    Returns: OngAsistenciaRow;
  };
};

type RrhhFunctions = {
  fn_generate_registration_code: {
    Args: {
      p_email: string | null;
      p_numero_documento: string | null;
      p_nombres: string | null;
      p_apellidos: string | null;
      p_id_solicitud: Uuid | null;
      p_expires_in_minutes?: number | null;
    };
    Returns: RrhhCodigoRegistroVoluntarioRow;
  };
};

type PublicTables = {
  cat_permissions: GenericTable<PublicCatPermissionRow>;
  cat_generos: GenericTable<PublicCatGeneroRow>;
  cat_paises: GenericTable<PublicCatPaisRow>;
  cat_monedas: GenericTable<PublicCatMonedaRow>;
  cat_tipos_documento: GenericTable<PublicCatTipoDocumentoRow>;
  cat_module_statuses: GenericTable<PublicCatModuleStatusRow>;
  tenants: GenericTable<PublicTenantRow>;
  plan_policies: GenericTable<PublicPlanPolicyRow>;
  profiles: GenericTable<PublicProfileRow>;
  roles: GenericTable<PublicRoleRow>;
  role_permissions: GenericTable<PublicRolePermissionRow>;
  user_roles_sedes: GenericTable<PublicUserRoleSedeRow>;
  sedes: GenericTable<PublicSedeRow>;
  role_access_constraints: GenericTable<PublicRoleAccessConstraintRow>;
  devices: GenericTable<PublicDeviceRow>;
  terminals: GenericTable<PublicTerminalRow>;
  sessions: GenericTable<PublicSessionRow>;
  auth_events: GenericTable<PublicAuthEventRow>;
  audit_logs: GenericTable<PublicAuditLogRow>;
  system_modules: GenericTable<PublicSystemModuleRow>;
  tenant_modules: GenericTable<PublicTenantModuleRow>;
};

export interface AppDatabase {
  public: {
    Tables: PublicTables;
    Views: Record<string, never>;
    Functions: PublicFunctions;
  };
  ong: {
    Tables: {
      estados_voluntario: GenericTable<OngEstadoVoluntarioRow>;
      unidades_medida: GenericTable<OngUnidadMedidaRow>;
      estados_objeto: GenericTable<OngEstadoObjetoRow>;
      estados_proyecto: GenericTable<OngEstadoProyectoRow>;
      areas: GenericTable<OngAreaRow>;
      ubicaciones: GenericTable<OngUbicacionRow>;
      items: GenericTable<OngItemRow>;
      voluntarios: GenericTable<OngVoluntarioRow>;
      beneficiarios: GenericTable<OngBeneficiarioRow>;
      proyectos: GenericTable<OngProyectoRow>;
      tareas: GenericTable<OngTareaRow>;
      actividades: GenericTable<OngActividadRow>;
      horas_actividad: GenericTable<OngHorasActividadRow>;
      asignaciones_actividad: GenericTable<OngAsignacionActividadRow>;
      evidencias_actividad: GenericTable<OngEvidenciaActividadRow>;
      recursos_proyecto: GenericTable<OngRecursoProyectoRow>;
      asignaciones_proyecto: GenericTable<OngAsignacionProyectoRow>;
      participaciones_proyecto: GenericTable<OngParticipacionProyectoRow>;
      asistencias: GenericTable<OngAsistenciaRow>;
      aprobaciones: GenericTable<OngAprobacionRow>;
      id_card_templates: GenericTable<OngIdCardTemplateRow>;
      id_card_template_fields: GenericTable<OngIdCardTemplateFieldRow>;
      id_cards: GenericTable<OngIdCardRow>;
      tipo_transaccion_inventario: GenericTable<OngTipoTransaccionInventarioRow>;
      transacciones_inventario: GenericTable<OngTransaccionInventarioRow>;
    };
    Views: Record<string, never>;
    Functions: OngFunctions;
  };
  rrhh: {
    Tables: {
      solicitudes_admision: GenericTable<RrhhSolicitudAdmisionRow>;
      documentos_admision: GenericTable<RrhhDocumentoAdmisionRow>;
      habilidades: GenericTable<RrhhHabilidadRow>;
      voluntario_habilidades: GenericTable<RrhhVoluntarioHabilidadRow>;
      volunteer_preferences: GenericTable<RrhhVolunteerPreferenceRow>;
      documentos_voluntario: GenericTable<RrhhDocumentoVoluntarioRow>;
      entrevistas_admision: GenericTable<RrhhEntrevistaAdmisionRow>;
      onboarding_pasos: GenericTable<RrhhOnboardingPasoRow>;
      onboarding_voluntario: GenericTable<RrhhOnboardingVoluntarioRow>;
      admission_requirements: GenericTable<RrhhAdmissionRequirementRow>;
      admission_requirement_reviews: GenericTable<RrhhAdmissionRequirementReviewRow>;
      admision_estado_historial: GenericTable<RrhhAdmisionEstadoHistorialRow>;
      roles_operativos: GenericTable<RrhhRolOperativoRow>;
      asignaciones_rol: GenericTable<RrhhAsignacionRolRow>;
      perfil_coordinador: GenericTable<RrhhPerfilCoordinadorRow>;
      codigos_registro_voluntario: GenericTable<RrhhCodigoRegistroVoluntarioRow>;
      registro_documentos_postulante: GenericTable<RrhhRegistroDocumentoPostulanteRow>;
    };
    Views: Record<string, never>;
    Functions: RrhhFunctions;
  };
  finanzas: EmptySchema & {
    Tables: {
      cat_tipos_cuenta: GenericTable<FinanzasCatTipoCuentaRow>;
      cuentas: GenericTable<FinanzasCuentaRow>;
      categorias: GenericTable<FinanzasCategoriaRow>;
      transacciones: GenericTable<FinanzasTransaccionRow>;
      comprobantes_financieros: GenericTable<FinanzasComprobanteFinancieroRow>;
      aprobaciones_transaccion: GenericTable<FinanzasAprobacionTransaccionRow>;
    };
  };
  clinico: EmptySchema & {
    Tables: {
      fichas_medicas: GenericTable<ClinicoFichaMedicaRow>;
      accesos_sensibles_log: GenericTable<ClinicoAccesoSensibleLogRow>;
      accesos_sensibles_voluntario_log: GenericTable<ClinicoAccesoSensibleVoluntarioLogRow>;
      perfil_nino: GenericTable<ClinicoPerfilNinoRow>;
      perfil_adulto_mayor: GenericTable<ClinicoPerfilAdultoMayorRow>;
      ficha_sensible_voluntario: GenericTable<ClinicoFichaSensibleVoluntarioRow>;
    };
  };
  academico: EmptySchema & {
    Tables: {
      cursos: GenericTable<AcademicoCursoRow>;
      inscripciones: GenericTable<AcademicoInscripcionRow>;
      certificados: GenericTable<AcademicoCertificadoRow>;
      asistencias: GenericTable<AcademicoAsistenciaRow>;
    };
  };
  comunicaciones: EmptySchema & {
    Tables: {
      canales_notificacion: GenericTable<ComunicacionCanalNotificacionRow>;
      historial_notificaciones: GenericTable<ComunicacionHistorialNotificacionRow>;
      plantillas_notificacion: GenericTable<ComunicacionPlantillaNotificacionRow>;
    };
  };
  auditoria: EmptySchema & {
    Tables: {
      audit_log: GenericTable<AuditoriaAuditLogRow>;
      medical_access: GenericTable<AuditoriaMedicalAccessRow>;
    };
  };
}

export type OngDatabase = AppDatabase;
