import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router";
import { GradientText } from "./components/GradientText";
import { GlassCard } from "./components/GlassCard";
import { PillButton } from "./components/PillButton";
import { useVolunteerRegistrationByCode } from "../../modules/admission/hooks/useVolunteerRegistrationByCode";
import {
  getVolunteerRegistrationDocumentsBucket,
} from "../../services/admision/volunteerRegistration.service";
import type {
  AdmissionPublicRegistrationCodePreview,
  AdmissionPublicVolunteerRegistrationResult,
} from "../../modules/admission/types";

type RegistrationDocumentForm = {
  type: string;
  manualUrl: string;
  file: File | null;
};

type RegistrationForm = {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  documentNumber: string;
  documentType: string;
  genderCode: string;
  countryCode: string;
  birthDate: string;
  phone: string;
  notes: string;
  documents: RegistrationDocumentForm[];
};

const DEFAULT_DOCUMENT: RegistrationDocumentForm = {
  type: "",
  manualUrl: "",
  file: null,
};

function buildInitialForm(
  preview: AdmissionPublicRegistrationCodePreview | null
): RegistrationForm {
  return {
    email: preview?.email ?? preview?.targetEmail ?? "",
    password: "",
    confirmPassword: "",
    firstName: preview?.firstName ?? "",
    lastName: preview?.lastName ?? "",
    documentNumber: preview?.documentNumber ?? preview?.targetDocumentNumber ?? "",
    documentType: preview?.documentType ?? "",
    genderCode: preview?.genderCode ?? "",
    countryCode: preview?.countryCode ?? "PE",
    birthDate: preview?.birthDate ?? "",
    phone: preview?.phone ?? "",
    notes: preview?.notes ?? "",
    documents: [DEFAULT_DOCUMENT],
  };
}

function InlineAlert({
  title,
  message,
  tone = "neutral",
}: {
  title: string;
  message: string;
  tone?: "neutral" | "error" | "success" | "warning";
}) {
  const borderColor =
    tone === "error"
      ? "border-[#ef4444]/40"
      : tone === "success"
        ? "border-[#22c55e]/30"
        : tone === "warning"
          ? "border-[#f59e0b]/30"
          : "border-white/[0.08]";
  const titleColor =
    tone === "error"
      ? "text-[#fca5a5]"
      : tone === "success"
        ? "text-[#86efac]"
        : tone === "warning"
          ? "text-[#fcd34d]"
          : "text-[#F5F5F5]";

  return (
    <div className={`rounded-3xl border ${borderColor} bg-[#121212]/85 px-4 py-3`}>
      <p className={`text-[13px] font-semibold ${titleColor}`}>{title}</p>
      <p className="mt-1 text-[12px] leading-[1.6] text-[#A7A7A7]">{message}</p>
    </div>
  );
}

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[12px] font-medium text-[#A7A7A7]">{label}</span>
      {children}
      {hint ? <span className="text-[11px] text-[#707070]">{hint}</span> : null}
    </label>
  );
}

function textInputClass(disabled = false) {
  return [
    "h-11 w-full rounded-2xl border border-white/[0.08] bg-white/[0.03] px-3 text-[13px] text-[#F5F5F5] outline-none transition-colors",
    "placeholder:text-[#5F5F5F] focus:border-white/[0.2]",
    disabled ? "cursor-not-allowed opacity-70" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function selectInputClass(disabled = false) {
  return [
    "h-11 w-full rounded-2xl border border-white/[0.08] bg-white/[0.03] px-3 text-[13px] text-[#F5F5F5] outline-none transition-colors",
    "focus:border-white/[0.2]",
    disabled ? "cursor-not-allowed opacity-70" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function sanitizeCodeInput(value: string): string {
  return value.replace(/\s+/g, "").trim();
}

function buildShareableHint(preview: AdmissionPublicRegistrationCodePreview | null): string {
  if (!preview) {
    return "";
  }

  return preview.targetFullName || preview.linkedVolunteerName || preview.email || preview.code;
}

export function VolunteerRegistrationPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [codeInput, setCodeInput] = useState(searchParams.get("code") ?? "");
  const [tenantInput, setTenantInput] = useState(searchParams.get("tenant") ?? "");
  const [form, setForm] = useState<RegistrationForm>(buildInitialForm(null));
  const [formError, setFormError] = useState<string | null>(null);
  const [result, setResult] =
    useState<AdmissionPublicVolunteerRegistrationResult | null>(null);

  const {
    catalogs,
    catalogsLoading,
    catalogsError,
    preview,
    previewLoading,
    previewError,
    isSubmitting,
    submitError,
    loadPreview,
    submit,
    refreshCatalogs,
    clearPreviewError,
    clearSubmitError,
  } = useVolunteerRegistrationByCode();

  const documentsBucket = getVolunteerRegistrationDocumentsBucket();

  useEffect(() => {
    if (!searchParams.get("code")) {
      return;
    }

    void loadPreview({
      code: searchParams.get("code") ?? "",
      tenantId: searchParams.get("tenant"),
    });
  }, [loadPreview, searchParams]);

  useEffect(() => {
    setForm(buildInitialForm(preview));
    setResult(null);
    setFormError(null);
  }, [preview]);

  const countryOptions = useMemo(
    () =>
      catalogs.countries.length
        ? catalogs.countries
        : [{ value: "PE", label: "Peru" }],
    [catalogs.countries]
  );

  const previewHint = buildShareableHint(preview);

  function updateForm<TKey extends keyof RegistrationForm>(
    key: TKey,
    value: RegistrationForm[TKey]
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function updateDocument(
    index: number,
    patch: Partial<RegistrationDocumentForm>
  ) {
    setForm((current) => ({
      ...current,
      documents: current.documents.map((document, currentIndex) =>
        currentIndex === index ? { ...document, ...patch } : document
      ),
    }));
  }

  function addDocumentRow() {
    setForm((current) => ({
      ...current,
      documents: [...current.documents, { ...DEFAULT_DOCUMENT }],
    }));
  }

  function removeDocumentRow(index: number) {
    setForm((current) => ({
      ...current,
      documents:
        current.documents.length === 1
          ? [{ ...DEFAULT_DOCUMENT }]
          : current.documents.filter((_, currentIndex) => currentIndex !== index),
    }));
  }

  async function handleLookupCode() {
    const code = sanitizeCodeInput(codeInput);
    const tenantId = tenantInput.trim() || null;

    setResult(null);
    setFormError(null);
    clearPreviewError();

    const response = await loadPreview({
      code,
      tenantId,
    });

    if (!response) {
      return;
    }

    const next = new URLSearchParams(searchParams);
    next.set("code", code);
    next.set("tenant", response.tenantId);
    setSearchParams(next, { replace: true });
    setTenantInput(response.tenantId);
  }

  async function handleSubmit() {
    if (!preview) {
      setFormError("Primero debes validar el codigo de registro.");
      return;
    }
    if (!preview.canConsume) {
      setFormError(preview.warning || "El codigo ya no se encuentra habilitado.");
      return;
    }
    if (!form.email.trim()) {
      setFormError("El correo es obligatorio.");
      return;
    }
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setFormError("Nombres y apellidos son obligatorios.");
      return;
    }
    if (!form.documentNumber.trim()) {
      setFormError("El numero de documento es obligatorio.");
      return;
    }
    if (!form.password.trim() || form.password.trim().length < 8) {
      setFormError("La contrasena debe tener al menos 8 caracteres.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setFormError("La confirmacion de contrasena no coincide.");
      return;
    }

    const documents = form.documents.filter(
      (document) => document.type.trim() || document.manualUrl.trim() || document.file
    );

    for (const document of documents) {
      if (!document.type.trim()) {
        setFormError("Cada documento debe indicar un tipo.");
        return;
      }
      if (!document.file && !document.manualUrl.trim()) {
        setFormError("Cada documento debe adjuntar un archivo o indicar una URL manual.");
        return;
      }
    }

    setFormError(null);
    clearSubmitError();

    const response = await submit({
      tenantId: preview.tenantId,
      code: preview.code,
      email: form.email,
      password: form.password,
      firstName: form.firstName,
      lastName: form.lastName,
      documentNumber: form.documentNumber,
      documentType: form.documentType || null,
      genderCode: form.genderCode || null,
      countryCode: form.countryCode || null,
      birthDate: form.birthDate || null,
      phone: form.phone || null,
      notes: form.notes || null,
      documents: documents.map((document) => ({
        type: document.type,
        manualUrl: document.manualUrl || null,
        file: document.file,
      })),
    });

    if (!response) {
      return;
    }

    setResult(response);
    void loadPreview({
      code: preview.code,
      tenantId: preview.tenantId,
    });
  }

  return (
    <div
      className="w-full flex-grow px-4 text-[#F5F5F5] sm:px-6 lg:px-8 relative z-10"
      style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}
    >
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link
              to="/landing"
              className="text-[12px] uppercase tracking-[0.2em] text-[#4A7BA7]"
            >
              Volver al landing
            </Link>
            <h1
              className="mt-3 text-[32px] tracking-[-0.02em] sm:text-[40px]"
              style={{ fontFamily: "'Sora', 'Inter', sans-serif", fontWeight: 700 }}
            >
              Registro de <GradientText>voluntariado por codigo</GradientText>
            </h1>
            <p className="mt-3 max-w-2xl text-[14px] leading-[1.7] text-[#A7A7A7]">
              Valida tu código único de registro, carga tus documentos y completa tu incorporación como voluntario.
            </p>
          </div>
          <GlassCard className="px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#707070]">Estado</p>
            <p className="mt-1 text-[13px] text-[#F5F5F5]">
              {preview ? `${preview.status} · ${preview.usesLabel}` : "Pendiente de validacion"}
            </p>
          </GlassCard>
        </div>

        <GlassCard className="p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[1.4fr_1fr_auto]">
            <Field label="Codigo de registro">
              <input
                value={codeInput}
                onChange={(event) => setCodeInput(sanitizeCodeInput(event.target.value))}
                placeholder="Ingresa el codigo recibido"
                className={textInputClass(previewLoading)}
                disabled={previewLoading}
              />
            </Field>
            <Field
              label="Tenant (opcional)"
              hint="Si llegaste desde el enlace compartido, este valor se completa solo."
            >
              <input
                value={tenantInput}
                onChange={(event) => setTenantInput(event.target.value)}
                placeholder="UUID del tenant"
                className={textInputClass(previewLoading)}
                disabled={previewLoading}
              />
            </Field>
            <div className="flex items-end">
              <PillButton
                variant="primary"
                size="md"
                onClick={() => void handleLookupCode()}
                className="w-full"
              >
                {previewLoading ? "Validando..." : "Validar codigo"}
              </PillButton>
            </div>
          </div>

          {previewError ? (
            <div className="mt-4">
              <InlineAlert title="Codigo invalido" message={previewError} tone="error" />
            </div>
          ) : null}

          {preview ? (
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              <InlineAlert
                title="Expiracion"
                message={`El codigo vence el ${preview.expiresAtLabel}.`}
                tone="neutral"
              />
              <InlineAlert
                title="Titular"
                message={previewHint || "Sin nombre objetivo en el codigo."}
                tone="neutral"
              />
              <InlineAlert
                title="Uso"
                message={
                  preview.warning ||
                  `Uso actual ${preview.usesLabel}. ${preview.canConsume ? "El codigo sigue habilitado." : "El codigo ya no acepta mas consumos."}`
                }
                tone={preview.canConsume ? "success" : "warning"}
              />
            </div>
          ) : null}
        </GlassCard>

        {(catalogsError || preview?.warning) && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {catalogsError ? (
              <InlineAlert
                title="Catalogos publicos"
                message={catalogsError}
                tone="warning"
              />
            ) : null}
            {preview?.warning ? (
              <InlineAlert
                title="Validacion del codigo"
                message={preview.warning}
                tone={preview.canConsume ? "warning" : "error"}
              />
            ) : null}
          </div>
        )}

        <GlassCard className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2
                className="text-[22px] tracking-[-0.01em]"
                style={{ fontFamily: "'Sora', 'Inter', sans-serif", fontWeight: 700 }}
              >
                Completa tu perfil
              </h2>
              <p className="mt-2 text-[13px] leading-[1.7] text-[#A7A7A7]">
                El formulario queda habilitado cuando el backend confirma que el codigo sigue
                vigente, no fue revocado y no supero su limite de uso.
              </p>
            </div>
            <button
              type="button"
              onClick={refreshCatalogs}
              className="rounded-full border border-white/[0.08] px-4 py-2 text-[12px] text-[#A7A7A7]"
            >
              {catalogsLoading ? "Actualizando catalogos..." : "Actualizar catalogos"}
            </button>
          </div>

          {(formError || submitError) && (
            <div className="mt-4">
              <InlineAlert
                title="No se pudo completar el registro"
                message={formError ?? submitError ?? "Error inesperado."}
                tone="error"
              />
            </div>
          )}

          {result ? (
            <div className="mt-4 space-y-3">
              <InlineAlert
                title="Registro completado"
                message={`Se enlazo ${result.email} con el usuario ${result.userId} y el voluntario ${result.volunteerId}. El codigo quedo en estado ${result.codeStatus} (${result.usesLabel}).`}
                tone="success"
              />
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <InlineAlert
                  title="Perfil IAM"
                  message={result.existingUser ? "Se reutilizo un auth.user existente." : "Se creo un auth.user nuevo y se sincronizo public.profiles."}
                  tone="neutral"
                />
                <InlineAlert
                  title="Voluntario"
                  message={result.volunteerLinked ? "El voluntario quedo vinculado al usuario." : "No se detecto voluntario para vincular."}
                  tone="neutral"
                />
                <InlineAlert
                  title="Documentos"
                  message={`Se registraron ${result.documentsRegistered} documento(s) del postulante.`}
                  tone="neutral"
                />
              </div>
            </div>
          ) : null}

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Correo" hint={preview?.emailLocked ? "Bloqueado por el codigo emitido." : undefined}>
              <input
                value={form.email}
                onChange={(event) => updateForm("email", event.target.value)}
                className={textInputClass(preview?.emailLocked || !preview?.canConsume)}
                disabled={Boolean(preview?.emailLocked) || !preview?.canConsume}
                type="email"
                placeholder="correo@dominio.com"
              />
            </Field>
            <Field label="Numero de documento" hint={preview?.documentLocked ? "Bloqueado por el codigo emitido." : undefined}>
              <input
                value={form.documentNumber}
                onChange={(event) => updateForm("documentNumber", event.target.value)}
                className={textInputClass(preview?.documentLocked || !preview?.canConsume)}
                disabled={Boolean(preview?.documentLocked) || !preview?.canConsume}
                placeholder="Documento"
              />
            </Field>
            <Field label="Nombres">
              <input
                value={form.firstName}
                onChange={(event) => updateForm("firstName", event.target.value)}
                className={textInputClass(!preview?.canConsume)}
                disabled={!preview?.canConsume}
                placeholder="Nombres"
              />
            </Field>
            <Field label="Apellidos">
              <input
                value={form.lastName}
                onChange={(event) => updateForm("lastName", event.target.value)}
                className={textInputClass(!preview?.canConsume)}
                disabled={!preview?.canConsume}
                placeholder="Apellidos"
              />
            </Field>
            <Field label="Tipo de documento">
              <select
                value={form.documentType}
                onChange={(event) => updateForm("documentType", event.target.value)}
                className={selectInputClass(!preview?.canConsume)}
                disabled={!preview?.canConsume}
              >
                <option value="">Selecciona</option>
                {catalogs.documentTypes.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Genero">
              <select
                value={form.genderCode}
                onChange={(event) => updateForm("genderCode", event.target.value)}
                className={selectInputClass(!preview?.canConsume)}
                disabled={!preview?.canConsume}
              >
                <option value="">Selecciona</option>
                {catalogs.genders.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Pais">
              <select
                value={form.countryCode}
                onChange={(event) => updateForm("countryCode", event.target.value)}
                className={selectInputClass(!preview?.canConsume)}
                disabled={!preview?.canConsume}
              >
                {countryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Fecha de nacimiento">
              <input
                value={form.birthDate}
                onChange={(event) => updateForm("birthDate", event.target.value)}
                className={textInputClass(!preview?.canConsume)}
                disabled={!preview?.canConsume}
                type="date"
              />
            </Field>
            <Field label="Telefono">
              <input
                value={form.phone}
                onChange={(event) => updateForm("phone", event.target.value)}
                className={textInputClass(!preview?.canConsume)}
                disabled={!preview?.canConsume}
                placeholder="Telefono"
              />
            </Field>
            <Field label="Contrasena" hint="Minimo 8 caracteres.">
              <input
                value={form.password}
                onChange={(event) => updateForm("password", event.target.value)}
                className={textInputClass(!preview?.canConsume)}
                disabled={!preview?.canConsume}
                type="password"
                placeholder="Crea una contrasena"
              />
            </Field>
            <Field label="Confirmar contrasena">
              <input
                value={form.confirmPassword}
                onChange={(event) => updateForm("confirmPassword", event.target.value)}
                className={textInputClass(!preview?.canConsume)}
                disabled={!preview?.canConsume}
                type="password"
                placeholder="Repite la contrasena"
              />
            </Field>
          </div>

          <div className="mt-4">
            <Field label="Observaciones">
              <textarea
                value={form.notes}
                onChange={(event) => updateForm("notes", event.target.value)}
                className="min-h-[110px] w-full rounded-2xl border border-white/[0.08] bg-white/[0.03] px-3 py-3 text-[13px] text-[#F5F5F5] outline-none placeholder:text-[#5F5F5F] focus:border-white/[0.2] transition-colors"
                disabled={!preview?.canConsume}
                placeholder="Observaciones adicionales para el alta del voluntariado"
              />
            </Field>
          </div>

          <div className="mt-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-[16px] font-semibold text-[#F5F5F5]">
                  Documentos del postulante
                </h3>
                <p className="mt-1 text-[12px] leading-[1.6] text-[#A7A7A7]">
                  Cada documento se registra en <code>rrhh.registro_documentos_postulante</code>.
                  {documentsBucket
                    ? ` Los archivos se cargan al bucket ${documentsBucket}.`
                    : " Si no hay bucket configurado, debes indicar una URL manual por documento."}
                </p>
              </div>
              <PillButton
                variant="secondary"
                size="sm"
                onClick={addDocumentRow}
                className="min-w-[150px]"
              >
                Agregar documento
              </PillButton>
            </div>

            <div className="mt-4 space-y-4">
              {form.documents.map((document, index) => (
                <GlassCard key={`document-${index}`} className="p-4">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_auto]">
                    <Field label="Tipo de documento">
                      <input
                        value={document.type}
                        onChange={(event) =>
                          updateDocument(index, { type: event.target.value })
                        }
                        className={textInputClass(!preview?.canConsume)}
                        disabled={!preview?.canConsume}
                        placeholder="DNI, CV, constancia..."
                      />
                    </Field>
                    <Field
                      label="URL manual"
                      hint="Usala si el bucket no esta configurado o prefieres registrar una ruta existente."
                    >
                      <input
                        value={document.manualUrl}
                        onChange={(event) =>
                          updateDocument(index, { manualUrl: event.target.value })
                        }
                        className={textInputClass(!preview?.canConsume)}
                        disabled={!preview?.canConsume}
                        placeholder="https://..."
                      />
                    </Field>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => removeDocumentRow(index)}
                        className="h-11 w-full rounded-2xl border border-white/[0.08] bg-transparent px-3 text-[12px] text-[#A7A7A7]"
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                  <div className="mt-3">
                    <Field
                      label="Archivo"
                      hint={
                        documentsBucket
                          ? "El archivo se subira con backend seguro durante el consumo del codigo."
                          : "Sin bucket configurado, este campo es opcional y la URL manual pasa a ser obligatoria."
                      }
                    >
                      <input
                        type="file"
                        disabled={!preview?.canConsume}
                        className={textInputClass(!preview?.canConsume)}
                        onChange={(event) =>
                          updateDocument(index, {
                            file: event.target.files?.[0] ?? null,
                          })
                        }
                      />
                    </Field>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <PillButton
              variant="primary"
              size="lg"
              onClick={() => void handleSubmit()}
              className="min-w-[220px]"
            >
              {isSubmitting ? "Registrando..." : "Completar registro"}
            </PillButton>
            <PillButton
              variant="secondary"
              size="lg"
              onClick={() => {
                setResult(null);
                setForm(buildInitialForm(preview));
                setFormError(null);
                clearSubmitError();
              }}
            >
              Reiniciar formulario
            </PillButton>
          </div>

          {!preview && (
            <div className="mt-6">
              <InlineAlert
                title="Pendiente de validacion"
                message="Valida primero el codigo para habilitar el formulario y bloquear los campos objetivo que vengan definidos desde la emision."
                tone="neutral"
              />
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
