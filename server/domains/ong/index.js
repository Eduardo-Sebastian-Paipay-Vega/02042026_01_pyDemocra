import { registerTenantWriteGuard } from "../../security/tenant-guards.js";
import { financialWriteGuard } from "./middleware/financial-state.js";

// Registra la regla de negocio de la ONG/GYM en el core de forma desacoplada
export function initOngDomain() {
  registerTenantWriteGuard(financialWriteGuard);
}
