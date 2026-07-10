import { useEffect, useState } from "react";
import { PageHeader } from "../components/shared/PageHeader";
import { useTenantBootstrap } from "../tenant/TenantBootstrapProvider";
import { getMyProfile, type MyProfileRow } from "../services/account/myAccount.service";

// REQ-005 (dds/MEJORAS/09072026/REQ005.md): "Perfil" es la vista de solo
// consulta de la cuenta; la edición vive en MyAccountSettings.tsx.
function InfoRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3" style={{ borderBottom: "1px solid var(--t-border)" }}>
      <span className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>{label}</span>
      <span className="text-[13px]" style={{ color: "var(--t-text)" }}>{value ?? "—"}</span>
    </div>
  );
}

export function MyProfile() {
  const tenantBootstrap = useTenantBootstrap();
  const [profile, setProfile] = useState<MyProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getMyProfile()
      .then((row) => { if (!cancelled) setProfile(row); })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : String(err)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const email = tenantBootstrap.context?.user.email ?? null;
  const tenantNameLabel = tenantBootstrap.context?.tenant.name ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Perfil"
        description="Información de tu cuenta. Para editar tus datos, usa Configuración."
      />

      <div
        className="max-w-xl rounded-2xl p-6"
        style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
      >
        {loading && (
          <p className="text-[13px]" style={{ color: "var(--t-text-dim)" }}>Cargando…</p>
        )}

        {!loading && error && (
          <p className="text-[13px]" style={{ color: "var(--t-danger, #ef4444)" }}>{error}</p>
        )}

        {!loading && !error && profile && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt=""
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[var(--t-primary)]/60 to-[var(--t-secondary)]/60 text-[18px] font-semibold text-white"
                >
                  {(profile.full_name ?? email ?? "?").trim().slice(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-[16px] font-medium" style={{ color: "var(--t-text)" }}>
                  {profile.full_name ?? "Sin nombre registrado"}
                </p>
                <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>{email ?? "—"}</p>
              </div>
            </div>

            <div className="mt-2">
              <InfoRow label="Organización" value={tenantNameLabel} />
              <InfoRow label="Tipo de documento" value={profile.tipo_documento} />
              <InfoRow label="Número de documento" value={profile.numero_documento} />
              <InfoRow label="Género" value={profile.genero} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
