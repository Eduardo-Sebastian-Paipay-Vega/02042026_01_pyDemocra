export const ERROR_CATALOG = {
  "IAM-001": {
    message: "No pudimos validar el codigo de seguridad.",
    suggestion: "Verifica el codigo e intentalo nuevamente.",
    retry_allowed: true,
    severity: "medium",
  },
  "IAM-002": {
    message: "Tu acceso esta bloqueado temporalmente por seguridad.",
    suggestion: "Espera el tiempo indicado o solicita soporte al administrador.",
    retry_allowed: true,
    severity: "high",
  },
  "IAM-003": {
    message: "No tienes permisos suficientes para esta accion.",
    suggestion: "Solicita autorizacion a un administrador del tenant.",
    retry_allowed: false,
    severity: "high",
  },
  "IAM-004": {
    message: "La sesion o desafio de seguridad expiro.",
    suggestion: "Inicia sesion nuevamente y vuelve a intentarlo.",
    retry_allowed: true,
    severity: "medium",
  },
  "IAM-005": {
    message: "No se pudo verificar este dispositivo.",
    suggestion: "Confirma tu acceso con OTP o usa un dispositivo confiable.",
    retry_allowed: true,
    severity: "high",
  },
  "SUB-001": {
    message: "Se alcanzo el limite de sesiones concurrentes del plan.",
    suggestion: "Cierra otra sesion o solicita override autorizado.",
    retry_allowed: true,
    severity: "high",
  },
  "SUB-002": {
    message: "No se pudo confirmar el pago.",
    suggestion: "Revisa tu metodo de pago o intenta nuevamente mas tarde.",
    retry_allowed: true,
    severity: "high",
  },
  "SUB-003": {
    message: "Tu tenant esta en modo solo lectura.",
    suggestion: "Regulariza la cuenta para restaurar operaciones de escritura.",
    retry_allowed: false,
    severity: "high",
  },
  "SUB-004": {
    message: "El plan solicitado no es valido para esta operacion.",
    suggestion: "Selecciona un plan permitido o consulta soporte.",
    retry_allowed: false,
    severity: "medium",
  },
  "TEN-001": {
    message: "El identificador fiscal ingresado no es valido.",
    suggestion: "Revisa el RUC e intentalo nuevamente.",
    retry_allowed: true,
    severity: "medium",
  },
  "TEN-002": {
    message: "El estado fiscal de la empresa no permite continuar.",
    suggestion: "Actualiza la condicion fiscal y reintenta.",
    retry_allowed: false,
    severity: "high",
  },
  "TEN-003": {
    message: "No se encontro contexto de tenant autorizado.",
    suggestion: "Completa el onboarding o inicia sesion con una cuenta habilitada.",
    retry_allowed: true,
    severity: "high",
  },
  "PAY-001": {
    message: "El proveedor de pagos no esta disponible en este momento.",
    suggestion: "No se realizo ningun cobro. Intenta nuevamente mas tarde.",
    retry_allowed: true,
    severity: "high",
  },
  "PAY-002": {
    message: "El pago fue rechazado por la entidad financiera.",
    suggestion: "Usa otro metodo de pago o vuelve a intentarlo.",
    retry_allowed: true,
    severity: "high",
  },
  "PAY-003": {
    message: "Se detecto una inconsistencia en el monto de la transaccion.",
    suggestion: "Nuestro equipo ya esta verificando el caso.",
    retry_allowed: false,
    severity: "critical",
  },
  "PAY-004": {
    message: "Se detecto una inconsistencia en la moneda de la transaccion.",
    suggestion: "Nuestro equipo ya esta verificando el caso.",
    retry_allowed: false,
    severity: "critical",
  },
  "PAY-005": {
    message: "La transaccion no coincide con la cuenta esperada.",
    suggestion: "Nuestro equipo ya esta verificando el caso.",
    retry_allowed: false,
    severity: "critical",
  },
  "PAY-006": {
    message: "No se pudo validar la firma del evento de pago.",
    suggestion: "La operacion fue protegida automaticamente.",
    retry_allowed: false,
    severity: "critical",
  },
  "PAY-007": {
    message: "Tu pago esta siendo verificado por timeout de confirmacion.",
    suggestion: "Si ya fue debitado, se aplicara automaticamente en breve.",
    retry_allowed: true,
    severity: "high",
  },
  "PAY-008": {
    message: "Se recibio un evento de pago duplicado y fue ignorado.",
    suggestion: "No se aplicaron cambios adicionales.",
    retry_allowed: false,
    severity: "medium",
  },
  "PAY-009": {
    message: "Se recibio un contracargo confirmado asociado a la cuenta.",
    suggestion: "Contacta soporte para regularizar el estado.",
    retry_allowed: false,
    severity: "critical",
  },
  "FIN-001": {
    message: "La cuenta esta en modo solo lectura.",
    suggestion: "Regulariza el pago para restaurar operaciones completas.",
    retry_allowed: false,
    severity: "high",
  },
  "FIN-002": {
    message: "La cuenta esta suspendida temporalmente.",
    suggestion: "Contacta soporte para revisar el estado.",
    retry_allowed: false,
    severity: "critical",
  },
  "FIN-003": {
    message: "Se detecto una inconsistencia financiera en revision.",
    suggestion: "Tus operaciones siguen con el ultimo estado confirmado.",
    retry_allowed: false,
    severity: "critical",
  },
  "FIN-004": {
    message: "La cuenta se encuentra en periodo de gracia.",
    suggestion: "Regulariza tu pago antes de la fecha limite.",
    retry_allowed: true,
    severity: "high",
  },
  "FIN-005": {
    message: "El cambio financiero esta bloqueado temporalmente.",
    suggestion: "Espera la reconciliacion o contacta soporte.",
    retry_allowed: false,
    severity: "high",
  },
};

const DEFAULT_ERROR = {
  message: "No pudimos completar la operacion por seguridad.",
  suggestion: "Intenta nuevamente o contacta al administrador.",
  retry_allowed: true,
  severity: "medium",
};

export const explainErrorCode = (errorCode) => {
  const normalized = (errorCode || "").toUpperCase();
  return {
    error_code: normalized || "GEN-000",
    ...(ERROR_CATALOG[normalized] || DEFAULT_ERROR),
  };
};

export const toErrorResponse = (errorCode, overrides = {}) => ({
  ...explainErrorCode(errorCode),
  ...overrides,
});