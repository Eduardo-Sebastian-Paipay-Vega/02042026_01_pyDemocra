import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "../components/shared/PageHeader";
import { GradientButton } from "../components/ui/gradient-button";
import { ImageUploadField } from "../components/ui/image-upload-field";
import {
  getMyProfile,
  updateMyAvatar,
  updateMyFullName,
  type MyProfileRow,
} from "../services/account/myAccount.service";

const INPUT_STYLE = {
  border: "1px solid var(--t-border)",
  background: "var(--t-input-bg)",
  color: "var(--t-text-secondary)",
} as const;

// REQ-005 (dds/MEJORAS/09072026/REQ005.md): "Configuración" es la vista de
// edición de la cuenta (nombre y foto, como mínimo). El nombre se guarda con
// un UPDATE directo a public.profiles (permitido por la policy RLS
// "profiles_self_update" / "p_profiles_update": auth.uid() = id) y la foto
// vía fn_update_my_avatar, que es la función que expone para esto el propio
// esquema de producción.
export function MyAccountSettings() {
  const [profile, setProfile] = useState<MyProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getMyProfile()
      .then((row) => {
        if (cancelled) return;
        setProfile(row);
        setFullName(row.full_name ?? "");
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : String(err)))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      if (fullName.trim() && fullName.trim() !== (profile?.full_name ?? "")) {
        await updateMyFullName(fullName);
      }
      let nextAvatarUrl = profile?.avatar_url ?? null;
      if (avatarFile) {
        nextAvatarUrl = await updateMyAvatar(avatarFile);
      }
      setProfile((prev) => (prev ? { ...prev, full_name: fullName.trim(), avatar_url: nextAvatarUrl } : prev));
      setAvatarFile(null);
      toast.success("Cuenta actualizada.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  const hasChanges = avatarFile !== null || fullName.trim() !== (profile?.full_name ?? "");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuración"
        description="Actualiza el nombre y la foto de tu cuenta."
      />

      <div
        className="max-w-xl rounded-2xl p-6"
        style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
      >
        {loading ? (
          <p className="text-[13px]" style={{ color: "var(--t-text-dim)" }}>Cargando…</p>
        ) : (
          <div className="flex flex-col gap-5">
            <label className="block space-y-1.5">
              <span className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>Nombre completo</span>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={saving}
                className="h-10 w-full rounded-xl px-3 text-[13px] outline-none"
                style={INPUT_STYLE}
              />
            </label>

            <ImageUploadField
              label="Foto de perfil"
              existingUrl={profile?.avatar_url}
              previewFile={avatarFile}
              onFileSelect={setAvatarFile}
              onClear={() => setAvatarFile(null)}
              disabled={saving}
            />

            <div className="flex justify-end">
              <GradientButton onClick={handleSave} disabled={saving || !hasChanges}>
                {saving ? "Guardando…" : "Guardar cambios"}
              </GradientButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
