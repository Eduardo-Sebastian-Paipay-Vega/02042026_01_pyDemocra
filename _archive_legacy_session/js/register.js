import { useAuthFlow } from "../hooks/useAuthFlow.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const setFeedback = (form, message = "", tone = "neutral") => {
  const target = form.querySelector("[data-register-feedback]");
  if (!target) return;

  target.textContent = message;
  target.dataset.tone = tone;
  target.classList.toggle("is-visible", Boolean(message));
};

const setLoading = (form, isLoading) => {
  const submit = form.querySelector('[type="submit"]');
  if (!submit) return;

  const label = submit.dataset.defaultLabel || submit.textContent;
  submit.dataset.defaultLabel = label;
  submit.disabled = isLoading;
  submit.setAttribute("aria-busy", isLoading ? "true" : "false");
  submit.textContent = isLoading ? "Creando cuenta..." : label;
};

const readField = (form, selector) => {
  const input = form.querySelector(selector);
  return String(input?.value || "").trim();
};

const initRegister = () => {
  const form = document.querySelector("[data-register-form]");
  if (!form) return;

  const auth = useAuthFlow();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = readField(form, '[name="email"]');
    const password = readField(form, '[name="password"]');

    if (!EMAIL_REGEX.test(email)) {
      setFeedback(form, "Ingresa un correo valido.", "error");
      return;
    }

    if (password.length < 8) {
      setFeedback(form, "La contrasena debe tener al menos 8 caracteres.", "error");
      return;
    }

    setLoading(form, true);
    setFeedback(form, "", "neutral");

    try {
      const result = await auth.signUp({
        email,
        password,
      });

      if (result?.session) {
        setFeedback(form, "Cuenta creada. Redirigiendo al onboarding...", "success");
        setTimeout(() => {
          window.location.href = "/onboarding.html";
        }, 450);
        return;
      }

      // En proyectos donde signUp no devuelve sesion inmediatamente, intentamos login directo.
      try {
        const signInResult = await auth.signIn({ email, password });
        if (signInResult?.session) {
          setFeedback(form, "Cuenta creada. Redirigiendo al onboarding...", "success");
          setTimeout(() => {
            window.location.href = "/onboarding.html";
          }, 450);
          return;
        }
      } catch {
        // Si no se puede iniciar sesion (ej: confirmacion de email activa), mostramos guia clara.
      }

      setFeedback(
        form,
        "Cuenta creada, pero no hay sesion activa aun. Inicia sesion y luego entra a Onboarding.",
        "success"
      );
    } catch (error) {
      const message = String(error?.message || "No se pudo crear la cuenta.");
      setFeedback(form, message, "error");
    } finally {
      setLoading(form, false);
    }
  });
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initRegister);
} else {
  initRegister();
}
