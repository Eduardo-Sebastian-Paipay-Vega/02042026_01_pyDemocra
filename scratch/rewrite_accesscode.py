import re

with open("ong/src/app/pages/landing/AccessCodeRedeemPage.tsx", "r", encoding="latin-1") as f:
    content = f.read()

# Fix encoding manually for this file (avoiding substrings that break code like "va")
content = content.replace("snete", "Únete")
content = content.replace("cdigo", "código")
content = content.replace("invǭlido", "inválido")
content = content.replace("expir", "expiró")
content = content.replace("lmite", "límite")
content = content.replace("vǭlido", "válido")
content = content.replace("contrasea", "contraseña")
content = content.replace("mnimo", "mínimo")
content = content.replace("Listo!", "¡Listo!")
content = content.replace("asign", "asignó")
content = content.replace("automǭticamente", "automáticamente")
content = content.replace("sesin", "sesión")
content = content.replace("pǭgina", "página")
content = content.replace("electrnico", "electrónico")
content = content.replace("pǧblico", "público")
content = content.replace("Verificando?", "Verificando...")
content = content.replace("Creando cuenta?", "Creando cuenta...")
content = content.replace("Redirigiendo a iniciar sesin?", "Redirigiendo a iniciar sesión...")

# Add Zod import
if 'import { z }' not in content:
    content = content.replace('import { useNavigate', 'import { z } from "zod";\nimport { useNavigate')

# Update inputClass
content = re.sub(
    r'const inputClass =[\s\S]*?;',
    'const inputClass =\n  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-[14px] text-white placeholder:text-gray-400 outline-none focus:border-white/20 transition-all";',
    content
)

# Replace form state
content = content.replace('fullName: ""', 'firstName: "", lastName: ""')
content = content.replace('form.fullName', '`${form.firstName} ${form.lastName}`.trim()')
content = content.replace('full_name: `${form.firstName} ${form.lastName}`.trim()', 'full_name: `${form.firstName} ${form.lastName}`.trim(), first_name: form.firstName, last_name: form.lastName')

# Update form validation and Zod schema
zod_schema = """
const formSchema = z.object({
  firstName: z.string().min(2, "El nombre debe tener al menos 2 caracteres."),
  lastName: z.string().min(2, "El apellido debe tener al menos 2 caracteres."),
  email: z.string().email("Correo electr\u00f3nico inv\u00e1lido."),
  password: z.string().min(8, "La contrase\u00f1a debe tener al menos 8 caracteres.")
});
"""
if 'const formSchema' not in content:
    content = content.replace('export function AccessCodeRedeemPage() {', zod_schema + '\nexport function AccessCodeRedeemPage() {')

content = re.sub(r'async function handleSubmit\(\) \{[\s\S]*?setStep\("submitting"\);', 'async function handleSubmit() {\n    const parsed = formSchema.safeParse(form);\n    if (!parsed.success) {\n      setErrorMessage(parsed.error.errors[0].message);\n      return;\n    }\n\n    setStep("submitting");', content)


# Update the form UI to have Grid layout for names
content = re.sub(r'<input[^>]*?placeholder="Nombre completo"[^>]*?/>', 
"""        <div className="grid grid-cols-2 gap-3">
          <input
            className={inputClass}
            placeholder="Nombres"
            value={form.firstName}
            onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
            disabled={step === "submitting"}
            autoComplete="given-name"
          />
          <input
            className={inputClass}
            placeholder="Apellidos"
            value={form.lastName}
            onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
            disabled={step === "submitting"}
            autoComplete="family-name"
          />
        </div>""", content)


# Add success banner above the form if the step is "form"
old_form_content = """    content = (
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">"""
        
new_form_content = """    content = (
      <div className="flex flex-col gap-3">
        <div className="mb-2 p-3 bg-[#08996A]/10 border border-[#08996A]/20 rounded-lg">
          <p className="text-xs text-[#08996A] flex items-center gap-1.5 font-medium">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            Código validado. Completa tus datos para unirte.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">"""
content = content.replace(old_form_content, new_form_content)


# Update error state for code
old_else = """  } else {
    content = (
      <div className="flex flex-col gap-3">
        <p className="text-[14px] text-[#E06A6A]">{errorMessage}</p>
        <PillButton variant="secondary" onClick={() => setStep("code")}>
          Intentar de nuevo
        </PillButton>
      </div>
    );
  }"""
  
new_else = """  } else {
    content = (
      <div className="flex flex-col gap-4">
        <div className="p-4 bg-[#E06A6A]/10 border border-[#E06A6A]/20 rounded-xl text-center">
          <div className="w-10 h-10 bg-[#E06A6A]/20 rounded-full flex items-center justify-center mx-auto mb-3">
             <svg className="w-5 h-5 text-[#E06A6A]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <h3 className="text-sm font-semibold text-[#F5F5F5] mb-1">Enlace inválido o caducado</h3>
          <p className="text-xs text-white/50">{errorMessage}</p>
        </div>
        <PillButton variant="secondary" onClick={() => {
            setCode("");
            setStep("code");
        }}>
          Ingresar otro código
        </PillButton>
      </div>
    );
  }"""
content = content.replace(old_else, new_else)


with open("ong/src/app/pages/landing/AccessCodeRedeemPage.tsx", "w", encoding="utf-8") as f:
    f.write(content)
