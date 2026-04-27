import { comunicacionesSchema } from "./shared";

export interface InAppNotificationInput {
  tenantId: string;
  recipientId: string;
  titulo: string;
  mensaje: string;
  actorId?: string | null;
}

export async function createInAppNotification(
  input: InAppNotificationInput
): Promise<void> {
  const { error } = await comunicacionesSchema()
    .from("historial_notificaciones")
    .insert({
      tenant_id: input.tenantId,
      id_usuario: input.recipientId,
      titulo: input.titulo,
      mensaje: input.mensaje,
      leida: false,
      codigo_canal: "in_app",
      estado_entrega: "pendiente",
      created_by: input.actorId ?? null,
      updated_by: input.actorId ?? null,
    });

  if (error) {
    throw new Error(error.message);
  }
}
