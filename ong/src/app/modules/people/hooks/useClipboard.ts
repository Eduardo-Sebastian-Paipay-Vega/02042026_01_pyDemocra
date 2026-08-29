import { useCallback } from "react";
import { toast } from "sonner";

export function useClipboard() {
  const copy = useCallback((text: string, successMessage = "Copiado al portapapeles") => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      toast.success(successMessage);
    }).catch(() => {
      toast.error("Error al copiar");
    });
  }, []);

  return { copy };
}
