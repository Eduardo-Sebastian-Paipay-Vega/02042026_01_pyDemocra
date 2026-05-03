import { useAuthFlow } from "../hooks/useAuthFlow.js";
import { useRiskGate } from "../hooks/useRiskGate.js";
import { explainErrorCode } from "../shared/error-explainer.js";
import { redirectAfterPostLogin } from "../shared/post-login.js";

const setFeedback = (form, message = "", tone = "neutral") => {
  const target = form.querySelector("[data-auth-feedback]");
  if (!target) return;

  target.textContent = message;
  target.classList.toggle("is-visible", Boolean(message));
  target.dataset.tone = tone;
};

const setSubmitState = (form, isLoading) => {
  const submit = form.querySelector('[type="submit"]');
  if (!submit) return;
  submit.disabled = isLoading;
  submit.setAttribute("aria-busy", isLoading ? "true" : "false");
};

const readField = (form, selector) => {
  const input = form.querySelector(selector);
  return input ? input.value.trim() : "";
};

const toHumanError = (error) => {
  if (error?.payload?.message) {
    return String(error.payload.message);
  }

  if (error?.payload?.error_code) {
    return explainErrorCode(error.payload.error_code).message;
  }

  const message = String(error?.message || error || "");
  const codeMatch = message.match(/[A-Z]{3}-\d{3}/);
  if (codeMatch) {
    return explainErrorCode(codeMatch[0]).message;
  }

  return message || "No se pudo completar la operacion.";
};

const initLoginForm = (form) => {
  const auth = useAuthFlow();
  const risk = useRiskGate();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setSubmitState(form, true);
    setFeedback(form, "Validando acceso...", "neutral");

    try {
      const email = readField(form, '[name="email"]');
      const password = readField(form, '[name="password"]');

      if (!email || !password) {
        setFeedback(form, "Completa correo y contrasena.", "error");
        return;
      }

      const signInData = await auth.signIn({
        email,
        password,
      });

      const session = signInData?.session || (await auth.getSession());
      const user = signInData?.user || (await auth.getCurrentUser());

      if (!session || !user) {
        setFeedback(
          form,
          "No se pudo iniciar sesion. Intenta nuevamente.",
          "error"
        );
        return;
      }

      const profile = await auth.getProfile(user.id);
      if (!profile?.tenant_id) {
        window.location.href = "/onboarding.html";
        return;
      }

      const riskDecision = await risk.evaluateRisk({
        session,
        tenantId: profile.tenant_id,
        eventType: "LOGIN_WEB",
      });

      if (riskDecision.decision === "ALLOW") {
        await redirectAfterPostLogin({ auth, user, profile });
        return;
      }

      if (riskDecision.decision === "REQUIRE_OTP") {
        if (!riskDecision.challenge_id) {
          await auth.signOut();
          setFeedback(
            form,
            "No pudimos generar el desafio OTP. Revisa la configuracion de correo e intenta nuevamente.",
            "error"
          );
          return;
        }

        setFeedback(
          form,
          riskDecision.user_message ||
            "Se requiere OTP para completar el ingreso.",
          "warn"
        );
        window.location.href = "/otp-challenge.html";
        return;
      }

      if (riskDecision.decision === "TEMP_BLOCK") {
        await auth.signOut();

        const blockedUntil = riskDecision.blocked_until
          ? new Date(riskDecision.blocked_until).toLocaleString("es-PE")
          : "unos minutos";

        setFeedback(
          form,
          `${riskDecision.user_message} Bloqueado hasta: ${blockedUntil}. Si no reconoces el intento, notifica a tu admin.`,
          "error"
        );
        return;
      }

      setFeedback(
        form,
        "No se pudo completar la evaluacion de seguridad.",
        "error"
      );
    } catch (error) {
      setFeedback(form, toHumanError(error), "error");
    } finally {
      setSubmitState(form, false);
    }
  });
};

const initRegisterForm = (form) => {
  const auth = useAuthFlow();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setSubmitState(form, true);
    setFeedback(form, "Creando cuenta...", "neutral");

    try {
      const fullName = readField(form, '[name="full_name"]');
      const email = readField(form, '[name="email"]');
      const password = readField(form, '[name="password"]');
      const passwordConfirm = readField(form, '[name="password_confirm"]');

      if (!fullName || !email || !password) {
        setFeedback(form, "Completa todos los campos requeridos.", "error");
        return;
      }

      if (password !== passwordConfirm) {
        setFeedback(form, "Las contrasenas no coinciden.", "error");
        return;
      }

      const result = await auth.signUp({
        email,
        password,
        fullName,
      });

      if (result?.session) {
        window.location.href = "/onboarding.html";
        return;
      }

      setFeedback(
        form,
        "Cuenta creada. Revisa tu correo para confirmar y continuar con onboarding.",
        "success"
      );
    } catch (error) {
      setFeedback(form, toHumanError(error), "error");
    } finally {
      setSubmitState(form, false);
    }
  });
};

const initOnboardingForm = (form) => {
  const auth = useAuthFlow();
  const tenantNamePreview = form.querySelector("[data-tenant-name-preview]");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setSubmitState(form, true);
    setFeedback(form, "Validando RUC en SUNAT...", "neutral");

    try {
      const session = await auth.getSession();
      if (!session) {
        window.location.href = "/login.html";
        return;
      }

      const taxId = readField(form, '[name="tax_id"]');
      const industryTypeId = readField(form, '[name="industry_type_id"]');
      const planId = readField(form, '[name="plan_id"]');
      const billingDay = Number(readField(form, '[name="billing_day"]'));

      if (!taxId || !industryTypeId || !planId || !billingDay) {
        setFeedback(form, "Completa todos los campos del onboarding.", "error");
        return;
      }

      const validatedCompany = await auth.validateRuc(taxId);
      const tenantName = String(validatedCompany?.tenant_name || "").trim();
      const normalizedTaxId = String(validatedCompany?.tax_id || taxId).trim();

      if (!tenantName || !normalizedTaxId) {
        setFeedback(form, "No se pudo validar el RUC.", "error");
        return;
      }

      if (tenantNamePreview) {
        tenantNamePreview.value = tenantName;
      }

      setFeedback(
        form,
        `RUC validado para ${tenantName}. Creando tenant y permisos base...`,
        "neutral"
      );

      await auth.bootstrapTenant({
        tenantName,
        taxId: normalizedTaxId,
        industryTypeId,
        planId,
        billingDay,
      });

      setFeedback(form, "Onboarding completado. Redirigiendo...", "success");
      window.setTimeout(() => {
        void redirectAfterPostLogin({ auth });
      }, 900);
    } catch (error) {
      setFeedback(form, toHumanError(error), "error");
    } finally {
      setSubmitState(form, false);
    }
  });
};

const initOtpForm = (form) => {
  const auth = useAuthFlow();
  const risk = useRiskGate();
  let challenge = risk.readOtpChallenge();

  const hintElement = form.querySelector("[data-otp-hint]");
  const resendButton = form.querySelector("[data-otp-resend]");

  const renderOtpHint = () => {
    if (!hintElement) return;

    const parts = [];
    if (challenge?.user_message) {
      parts.push(challenge.user_message);
    } else {
      parts.push("Ingresa el codigo OTP enviado a tu canal seguro.");
    }

    if (challenge?.delivery_hint) {
      parts.push(`Canal: ${challenge.delivery_hint}.`);
    }

    if (challenge?.expires_at) {
      const expiresLabel = new Date(challenge.expires_at).toLocaleTimeString("es-PE", {
        hour: "2-digit",
        minute: "2-digit",
      });
      parts.push(`Vence a las ${expiresLabel}.`);
    }

    if (challenge?.debug_otp) {
      parts.push(`DEBUG OTP: ${challenge.debug_otp}`);
    }

    hintElement.textContent = parts.join(" ");
  };

  renderOtpHint();

  const setButtonLoading = (button, isLoading, loadingLabel = "Procesando...") => {
    if (!button) return;
    const defaultLabel = button.dataset.defaultLabel || button.textContent;
    button.dataset.defaultLabel = defaultLabel;
    button.disabled = isLoading;
    button.setAttribute("aria-busy", isLoading ? "true" : "false");
    button.textContent = isLoading ? loadingLabel : defaultLabel;
  };

  resendButton?.addEventListener("click", async () => {
    setButtonLoading(resendButton, true, "Reenviando...");
    setFeedback(form, "Enviando nuevo OTP...", "neutral");

    try {
      const session = await auth.getSession();
      if (!session) {
        window.location.href = "/login.html";
        return;
      }

      const challengeId = challenge?.challenge_id || readField(form, '[name="challenge_id"]');
      if (!challengeId) {
        setFeedback(form, "No hay desafio OTP activo. Vuelve al login.", "error");
        return;
      }

      const resent = await risk.resendStepUpOtp({
        session,
        challengeId,
        tenantId: challenge?.tenant_id || null,
      });

      challenge = risk.readOtpChallenge() || challenge;
      renderOtpHint();

      setFeedback(form, resent?.user_message || "Codigo OTP reenviado.", "success");
    } catch (error) {
      setFeedback(form, toHumanError(error), "error");
    } finally {
      setButtonLoading(resendButton, false, "Reenviar OTP");
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setSubmitState(form, true);
    setFeedback(form, "Verificando codigo OTP...", "neutral");

    try {
      const session = await auth.getSession();
      if (!session) {
        window.location.href = "/login.html";
        return;
      }

      const challengeId = challenge?.challenge_id || readField(form, '[name="challenge_id"]');
      const otpCode = readField(form, '[name="otp_code"]');

      if (!challengeId || !otpCode) {
        setFeedback(form, "Ingresa el codigo OTP de 6 digitos.", "error");
        return;
      }

      const verification = await risk.verifyStepUpOtp({
        session,
        challengeId,
        code: otpCode,
      });

      if (!verification?.verified) {
        setFeedback(form, "No se pudo verificar el codigo.", "error");
        return;
      }

      risk.clearOtpChallenge();
      await redirectAfterPostLogin({ auth });
    } catch (error) {
      setFeedback(form, toHumanError(error), "error");
    } finally {
      setSubmitState(form, false);
    }
  });
};

const initTerminalLoginForm = (form) => {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setSubmitState(form, true);
    setFeedback(form, "Validando PIN terminal...", "neutral");

    try {
      const payload = {
        tenant_id: readField(form, '[name="tenant_id"]'),
        user_id: readField(form, '[name="user_id"]'),
        terminal_id: readField(form, '[name="terminal_id"]'),
        pin: readField(form, '[name="pin"]'),
        device_fingerprint: readField(form, '[name="device_fingerprint"]'),
      };

      const response = await fetch("/api/auth/terminal-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const body = await response.json();
      if (!response.ok) {
        setFeedback(form, body?.message || "No se pudo validar PIN.", "error");
        return;
      }

      setFeedback(form, "Ingreso terminal autorizado.", "success");
    } catch (error) {
      setFeedback(form, toHumanError(error), "error");
    } finally {
      setSubmitState(form, false);
    }
  });
};

const initAuthForms = () => {
  const forms = document.querySelectorAll("[data-auth-form]");
  if (!forms.length) return;

  forms.forEach((form) => {
    const formType = form.getAttribute("data-auth-form");

    if (formType === "login") {
      initLoginForm(form);
      return;
    }

    if (formType === "register") {
      initRegisterForm(form);
      return;
    }

    if (formType === "onboarding") {
      initOnboardingForm(form);
      return;
    }

    if (formType === "otp") {
      initOtpForm(form);
      return;
    }

    if (formType === "terminal-login") {
      initTerminalLoginForm(form);
    }
  });
};

const initPasswordToggles = () => {
  const toggles = document.querySelectorAll("[data-toggle-password]");
  if (!toggles.length) return;

  toggles.forEach((toggle) => {
    const inputId = toggle.getAttribute("data-toggle-password");
    if (!inputId) return;

    const input = document.getElementById(inputId);
    if (!input) return;

    const iconShow = toggle.querySelector(".auth-password-icon--show");
    const iconHide = toggle.querySelector(".auth-password-icon--hide");

    toggle.addEventListener("click", () => {
      const reveal = input.type === "password";
      input.type = reveal ? "text" : "password";

      toggle.setAttribute("aria-pressed", reveal ? "true" : "false");
      toggle.setAttribute(
        "aria-label",
        reveal ? "Ocultar contrasena" : "Mostrar contrasena"
      );

      if (iconShow && iconHide) {
        iconShow.hidden = reveal;
        iconHide.hidden = !reveal;
      }
    });
  });
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    initAuthForms();
    initPasswordToggles();
  });
} else {
  initAuthForms();
  initPasswordToggles();
}
