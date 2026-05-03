import { useOnboardingFlow } from "./useOnboardingFlow.js";

const bootstrapOnboarding = async () => {
  const root = document.querySelector("[data-onboarding-root]");
  if (!root) return;

  try {
    const flow = useOnboardingFlow({ root });
    await flow.init();
  } catch (error) {
    const notice = root.querySelector("[data-onboarding-notice]");
    if (notice) {
      const message =
        String(error?.message || "").trim() ||
        "No se pudo iniciar el onboarding. Revisa tu configuracion de entorno.";
      notice.textContent = message;
      notice.dataset.tone = "error";
      notice.classList.add("is-visible");
    }
  }
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    void bootstrapOnboarding();
  });
} else {
  void bootstrapOnboarding();
}
