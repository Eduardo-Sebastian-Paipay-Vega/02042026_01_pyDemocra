import { useAuthFlow } from "../hooks/useAuthFlow.js";
import { validateRucTaxId } from "./api.js";

const STORAGE_KEY = "solaris.onboarding.wizard.v2";
const TOTAL_STEPS = 4;

const DEFAULT_STATE = {
  step: 1,
  company: {
    ruc: "",
    phone: "",
    tenantName: "",
    rucValidated: false,
  },
  industryTypeId: "",
  planTypeId: "",
  billingDay: null,
};

const INDUSTRY_CARD_DEFINITIONS = [
  {
    key: "retail",
    fallbackIds: ["retail"],
    title: "RETAIL",
    description: "Tiendas y comercios presenciales",
    icon: "RI",
  },
  {
    key: "gym",
    fallbackIds: ["gym", "fitness"],
    title: "GIMNASIO",
    description: "Control de acceso y membresias",
    icon: "GY",
  },
  {
    key: "health",
    fallbackIds: ["health", "salud"],
    title: "SALUD",
    description: "Operacion clinica y servicios",
    icon: "SA",
  },
  {
    key: "academy",
    fallbackIds: ["academy", "education", "educacion", "academias"],
    title: "ACADEMIAS",
    description: "Centros educativos y capacitacion",
    icon: "ED",
  },
];

const PLAN_CARD_DEFINITIONS = [
  {
    key: "basic",
    fallbackIds: ["basic", "basico"],
    title: "BASICO",
    price: "S/ 99",
    caption: "Ideal para iniciar",
    highlights: ["1 sede", "3 licencias", "Auditoria base"],
  },
  {
    key: "pro",
    fallbackIds: ["pro"],
    title: "PRO",
    price: "S/ 249",
    caption: "Escala multi-sede",
    highlights: ["Hasta 5 sedes", "30 licencias", "Controles avanzados"],
  },
  {
    key: "enterprise",
    fallbackIds: ["enterprise"],
    title: "ENTERPRISE",
    price: "A medida",
    caption: "Gobernanza extendida",
    highlights: ["Sedes ilimitadas", "Politicas personalizadas", "Soporte prioritario"],
    optional: true,
  },
];

const BILLING_OPTIONS = [1, 15, 28];

const deepClone = (value) => JSON.parse(JSON.stringify(value));

const loadPersistedState = () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return deepClone(DEFAULT_STATE);

  try {
    const parsed = JSON.parse(raw);
    return {
      ...deepClone(DEFAULT_STATE),
      ...parsed,
      company: {
        ...deepClone(DEFAULT_STATE).company,
        ...(parsed?.company || {}),
      },
    };
  } catch {
    return deepClone(DEFAULT_STATE);
  }
};

const persistState = (state) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

const clearPersistedState = () => {
  localStorage.removeItem(STORAGE_KEY);
};

const normalizeId = (value) => String(value || "").toLowerCase().trim();

const resolveCatalogId = (list, fallbackIds = []) => {
  if (!Array.isArray(list) || !list.length) return "";

  const normalizedFallbacks = fallbackIds.map(normalizeId);
  const match = list.find((item) => normalizedFallbacks.includes(normalizeId(item.id)));
  return match?.id || "";
};

const isEmailLike = (value) => /.+@.+\..+/.test(String(value || "").trim());

const formatCatalogLabel = (id) => String(id || "").replace(/[-_]/g, " ").toUpperCase();

export const useOnboardingFlow = ({ root }) => {
  const auth = useAuthFlow();
  const state = loadPersistedState();

  let catalogs = {
    industries: [],
    plans: [],
  };

  let validateTimer = null;
  let rucRequestNonce = 0;

  const refs = {
    stepLabel: root.querySelector("[data-step-label]"),
    stepTitle: root.querySelector("[data-step-title]"),
    progressFill: root.querySelector("[data-progress-fill]"),
    notice: root.querySelector("[data-onboarding-notice]"),

    stepPanels: Array.from(root.querySelectorAll("[data-step-panel]")),

    rucInput: root.querySelector('[name="tax_id"]'),
    phoneInput: root.querySelector('[name="phone"]'),
    tenantNameInput: root.querySelector('[name="tenant_name_preview"]'),
    validateRucButton: root.querySelector("[data-validate-ruc]"),
    step1NextButton: root.querySelector("[data-step1-next]"),

    industryGrid: root.querySelector("[data-industry-grid]"),
    industryHint: root.querySelector("[data-industry-hint]"),

    planGrid: root.querySelector("[data-plan-grid]"),
    planHint: root.querySelector("[data-plan-hint]"),

    billingGrid: root.querySelector("[data-billing-grid]"),
    finishButton: root.querySelector("[data-finish-onboarding]"),
  };

  const setNotice = (message, tone = "neutral") => {
    if (!refs.notice) return;
    refs.notice.textContent = message || "";
    refs.notice.dataset.tone = tone;
    refs.notice.classList.toggle("is-visible", Boolean(message));
  };

  const setLoading = (button, isLoading, loadingLabel) => {
    if (!button) return;

    const defaultLabel = button.dataset.defaultLabel || button.textContent;
    button.dataset.defaultLabel = defaultLabel;

    button.disabled = isLoading;
    button.setAttribute("aria-busy", isLoading ? "true" : "false");
    button.textContent = isLoading ? loadingLabel : defaultLabel;
  };

  const getStepTitle = (step) => {
    if (step === 1) return "Datos de la empresa";
    if (step === 2) return "Seleccion de sector";
    if (step === 3) return "Plan de suscripcion";
    return "Dia de facturacion";
  };

  const isPhoneValid = () => {
    const digits = String(state.company.phone || "").replace(/\D/g, "");
    return digits.length >= 7;
  };

  const canAdvanceFromStep1 = () => {
    return Boolean(state.company.rucValidated && state.company.tenantName && isPhoneValid());
  };

  const canFinalize = () => {
    return (
      state.company.rucValidated &&
      Boolean(state.company.ruc) &&
      Boolean(state.company.tenantName) &&
      Boolean(state.industryTypeId) &&
      Boolean(state.planTypeId) &&
      Boolean(state.billingDay)
    );
  };

  const ensureStepBounds = () => {
    state.step = Math.min(TOTAL_STEPS, Math.max(1, Number(state.step) || 1));
  };

  const gotoStep = (nextStep) => {
    state.step = nextStep;
    ensureStepBounds();
    persistState(state);
    render();
  };

  const hydrateStepOneFields = () => {
    if (refs.rucInput) refs.rucInput.value = state.company.ruc || "";
    if (refs.phoneInput) refs.phoneInput.value = state.company.phone || "";
    if (refs.tenantNameInput) refs.tenantNameInput.value = state.company.tenantName || "";
  };

  const renderIndustryCards = () => {
    if (!refs.industryGrid) return;

    refs.industryGrid.innerHTML = "";

    const options = INDUSTRY_CARD_DEFINITIONS.map((definition) => {
      const resolvedId = resolveCatalogId(catalogs.industries, definition.fallbackIds);
      return {
        ...definition,
        id: resolvedId,
        available: Boolean(resolvedId),
      };
    });

    options.forEach((option) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "wiz-choice";
      button.dataset.choiceId = option.id || option.key;

      if (option.available && state.industryTypeId === option.id) {
        button.classList.add("is-selected");
      }

      if (!option.available) {
        button.classList.add("is-disabled");
        button.disabled = true;
      }

      button.innerHTML = `
        <span class="wiz-choice__icon" aria-hidden="true">${option.icon}</span>
        <span class="wiz-choice__title">${option.title}</span>
        <span class="wiz-choice__text">${option.description}</span>
      `;

      button.addEventListener("click", () => {
        if (!option.available) return;
        state.industryTypeId = option.id;
        persistState(state);
        renderIndustryCards();
        setNotice(`Sector seleccionado: ${option.title}.`, "success");
        setTimeout(() => gotoStep(3), 180);
      });

      refs.industryGrid.appendChild(button);
    });

    if (refs.industryHint) {
      const missing = options.filter((option) => !option.available).map((option) => option.title);
      refs.industryHint.textContent = missing.length
        ? `TODO catalogo: falta registrar en cat_industry_types -> ${missing.join(", ")}.`
        : "";
    }
  };

  const renderPlanCards = () => {
    if (!refs.planGrid) return;

    refs.planGrid.innerHTML = "";

    const options = PLAN_CARD_DEFINITIONS.map((definition) => {
      const resolvedId = resolveCatalogId(catalogs.plans, definition.fallbackIds);
      return {
        ...definition,
        id: resolvedId,
        available: Boolean(resolvedId),
      };
    }).filter((option) => !option.optional || option.available);

    options.forEach((option) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "wiz-plan";
      button.dataset.planId = option.id || option.key;

      if (option.available && state.planTypeId === option.id) {
        button.classList.add("is-selected");
      }

      if (!option.available) {
        button.classList.add("is-disabled");
        button.disabled = true;
      }

      const featureLines = option.highlights
        .map((highlight) => `<li class="wiz-plan__item">${highlight}</li>`)
        .join("");

      button.innerHTML = `
        <span class="wiz-plan__title">${option.title}</span>
        <span class="wiz-plan__price">${option.price}</span>
        <span class="wiz-plan__caption">${option.caption}</span>
        <ul class="wiz-plan__list">${featureLines}</ul>
      `;

      button.addEventListener("click", () => {
        if (!option.available) return;
        state.planTypeId = option.id;
        persistState(state);
        renderPlanCards();
        setNotice(`Plan seleccionado: ${option.title}.`, "success");
        setTimeout(() => gotoStep(4), 180);
      });

      refs.planGrid.appendChild(button);
    });

    if (refs.planHint) {
      const requiredPlans = ["basic", "pro"];
      const missingRequired = requiredPlans.filter(
        (planKey) => !options.some((option) => normalizeId(option.key) === planKey && option.available)
      );

      refs.planHint.textContent = missingRequired.length
        ? `TODO catalogo: faltan planes requeridos en cat_plan_types -> ${missingRequired.join(", ")}.`
        : "";
    }
  };

  const renderBillingTiles = () => {
    if (!refs.billingGrid) return;

    refs.billingGrid.innerHTML = "";

    BILLING_OPTIONS.forEach((day) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "wiz-billing";
      button.textContent = `Dia ${day}`;
      button.dataset.billingDay = String(day);

      if (state.billingDay === day) {
        button.classList.add("is-selected");
      }

      button.addEventListener("click", () => {
        state.billingDay = day;
        persistState(state);
        renderBillingTiles();
        renderFinishButtonState();
        setNotice(`Dia de facturacion seleccionado: ${day}.`, "success");
      });

      refs.billingGrid.appendChild(button);
    });
  };

  const renderFinishButtonState = () => {
    if (!refs.finishButton) return;
    refs.finishButton.disabled = !canFinalize();
  };

  const renderStepOneControls = () => {
    if (refs.step1NextButton) {
      refs.step1NextButton.disabled = !canAdvanceFromStep1();
    }

    if (refs.tenantNameInput) {
      refs.tenantNameInput.readOnly = true;
    }
  };

  const renderStepShell = () => {
    ensureStepBounds();
    if (refs.stepLabel) refs.stepLabel.textContent = `Paso ${state.step}/${TOTAL_STEPS}`;
    if (refs.stepTitle) refs.stepTitle.textContent = getStepTitle(state.step);

    if (refs.progressFill) {
      const width = Math.round((state.step / TOTAL_STEPS) * 100);
      refs.progressFill.style.width = `${width}%`;
    }

    refs.stepPanels.forEach((panel) => {
      const panelStep = Number(panel.dataset.stepPanel || "0");
      const isActive = panelStep === state.step;
      panel.hidden = !isActive;
      panel.classList.toggle("is-active", isActive);
    });
  };

  const render = () => {
    renderStepShell();
    renderStepOneControls();
    renderIndustryCards();
    renderPlanCards();
    renderBillingTiles();
    renderFinishButtonState();
  };

  const applyRucValidationSuccess = ({ tax_id: taxId, tenant_name: tenantName }) => {
    state.company.ruc = String(taxId || "").replace(/\D/g, "");
    state.company.tenantName = String(tenantName || "").trim();
    state.company.rucValidated = true;
    persistState(state);

    hydrateStepOneFields();
    renderStepOneControls();
    setNotice(`RUC validado. Razon social: ${state.company.tenantName}.`, "success");
  };

  const applyRucValidationError = (error) => {
    state.company.rucValidated = false;
    state.company.tenantName = "";
    persistState(state);

    if (refs.tenantNameInput) refs.tenantNameInput.value = "";
    renderStepOneControls();

    const backendMessage = String(error?.payload?.message || error?.message || "").trim();
    const normalizedMessage = backendMessage.toLowerCase();

    if (
      normalizedMessage.includes("econnrefused") ||
      normalizedMessage.includes("proxy error") ||
      normalizedMessage.includes("error occurred while trying to proxy") ||
      normalizedMessage.includes("socket hang up")
    ) {
      setNotice(
        "No se pudo conectar al backend local. Reinicia con `npm run dev` para levantar API y frontend.",
        "error"
      );
      return;
    }

    if (backendMessage) {
      setNotice(backendMessage, "error");
      return;
    }

    setNotice("No se pudo validar el RUC. Intenta nuevamente.", "error");
  };

  const runRucValidation = async () => {
    const ruc = String(state.company.ruc || "").replace(/\D/g, "");

    if (ruc.length !== 11) {
      applyRucValidationError({ message: "RUC no valido." });
      return;
    }

    const requestId = ++rucRequestNonce;
    setLoading(refs.validateRucButton, true, "Validando...");

    try {
      const validated = await validateRucTaxId(ruc);
      if (requestId !== rucRequestNonce) {
        return;
      }

      applyRucValidationSuccess(validated);
    } catch (error) {
      if (requestId !== rucRequestNonce) {
        return;
      }

      applyRucValidationError(error);
    } finally {
      setLoading(refs.validateRucButton, false, "Validar RUC");
    }
  };

  const scheduleRucValidation = () => {
    clearTimeout(validateTimer);

    const rawRuc = String(state.company.ruc || "").replace(/\D/g, "");
    if (rawRuc.length !== 11) {
      state.company.rucValidated = false;
      state.company.tenantName = "";
      persistState(state);
      renderStepOneControls();
      if (refs.tenantNameInput) refs.tenantNameInput.value = "";
      return;
    }

    validateTimer = setTimeout(() => {
      void runRucValidation();
    }, 500);
  };

  const bindStepOneEvents = () => {
    refs.rucInput?.addEventListener("input", (event) => {
      const clean = String(event.target.value || "").replace(/\D/g, "").slice(0, 11);
      event.target.value = clean;

      state.company.ruc = clean;
      state.company.rucValidated = false;
      state.company.tenantName = "";
      persistState(state);

      if (refs.tenantNameInput) refs.tenantNameInput.value = "";
      renderStepOneControls();
      scheduleRucValidation();
    });

    refs.rucInput?.addEventListener("blur", () => {
      if (String(state.company.ruc || "").length === 11) {
        void runRucValidation();
      }
    });

    refs.phoneInput?.addEventListener("input", (event) => {
      const value = String(event.target.value || "").slice(0, 20);
      state.company.phone = value;
      persistState(state);
      renderStepOneControls();
    });

    refs.validateRucButton?.addEventListener("click", () => {
      void runRucValidation();
    });

    refs.step1NextButton?.addEventListener("click", () => {
      if (!canAdvanceFromStep1()) {
        setNotice(
          "Completa telefono y valida un RUC ACTIVO/HABIDO para continuar.",
          "error"
        );
        return;
      }

      gotoStep(2);
    });
  };

  const bindStepNavigation = () => {
    root.querySelectorAll("[data-go-step]").forEach((button) => {
      button.addEventListener("click", () => {
        const step = Number(button.dataset.goStep || "1");

        if (step > 1 && !canAdvanceFromStep1()) {
          setNotice("Primero valida RUC y telefono en el Paso 1.", "error");
          return;
        }

        if (step > 2 && !state.industryTypeId) {
          setNotice("Selecciona un sector para continuar.", "error");
          return;
        }

        if (step > 3 && !state.planTypeId) {
          setNotice("Selecciona un plan para continuar.", "error");
          return;
        }

        gotoStep(step);
      });
    });
  };

  const finalizeOnboarding = async () => {
    if (!canFinalize()) {
      setNotice("Completa los 4 pasos antes de crear la empresa.", "error");
      return;
    }

    setLoading(refs.finishButton, true, "Creando empresa...");
    setNotice("Configurando tu tenant. Esto tomara unos segundos...", "neutral");

    try {
      await auth.bootstrapTenant({
        tenantName: state.company.tenantName,
        taxId: state.company.ruc,
        industryTypeId: state.industryTypeId,
        planId: state.planTypeId,
        billingDay: Number(state.billingDay),
      });

      // TODO: telefono no se persiste porque fn_bootstrap_tenant y esquema actual no incluyen este campo.
      clearPersistedState();
      setNotice("Empresa creada correctamente. Redirigiendo...", "success");

      setTimeout(() => {
        window.location.href = "/studio.html";
      }, 700);
    } catch (error) {
      const rawMessage =
        String(error?.payload?.message || "") ||
        String(error?.message || "") ||
        "No se pudo crear la empresa.";

      const normalized = rawMessage.toLowerCase();
      if (
        normalized.includes("audit_logs") &&
        normalized.includes("tenant_id") &&
        normalized.includes("null value")
      ) {
        setNotice(
          "Falta aplicar la migracion SQL de onboarding/auditoria. Ejecuta la migration 20260302125000 y vuelve a intentar.",
          "error"
        );
      } else {
        setNotice(rawMessage, "error");
      }
    } finally {
      setLoading(refs.finishButton, false, "Crear empresa");
    }
  };

  const bindFinalStep = () => {
    refs.finishButton?.addEventListener("click", () => {
      void finalizeOnboarding();
    });
  };

  const loadCatalogs = async () => {
    const [industriesRes, plansRes] = await Promise.all([
      auth.supabase
        .from("cat_industry_types")
        .select("id, description")
        .order("id", { ascending: true }),
      auth.supabase
        .from("cat_plan_types")
        .select("id, description")
        .order("id", { ascending: true }),
    ]);

    catalogs = {
      industries: industriesRes.data || [],
      plans: plansRes.data || [],
    };

    if (!catalogs.industries.length) {
      setNotice(
        "No se pudo cargar cat_industry_types. Verifica permisos de lectura en Supabase.",
        "error"
      );
    }

    if (!catalogs.plans.length) {
      setNotice(
        "No se pudo cargar cat_plan_types. Verifica permisos de lectura en Supabase.",
        "error"
      );
    }

    root.querySelectorAll("[data-catalog-summary]").forEach((node) => {
      const type = node.dataset.catalogSummary;
      if (type === "industry" && catalogs.industries.length) {
        node.textContent = catalogs.industries
          .map((item) => formatCatalogLabel(item.id))
          .join(" | ");
      }

      if (type === "plan" && catalogs.plans.length) {
        node.textContent = catalogs.plans
          .map((item) => formatCatalogLabel(item.id))
          .join(" | ");
      }
    });
  };

  const ensureSession = async () => {
    const session = await auth.getSession();
    if (!session) {
      setNotice(
        "No hay sesion activa. Inicia sesion y vuelve a esta pantalla para continuar.",
        "error"
      );
      return false;
    }

    const user = await auth.getCurrentUser();
    if (!user) {
      setNotice(
        "No se pudo identificar el usuario autenticado. Vuelve a iniciar sesion.",
        "error"
      );
      return false;
    }

    const profile = await auth.getProfile(user.id);
    if (profile?.tenant_id) {
      window.location.href = "/studio.html";
      return false;
    }

    return true;
  };

  const init = async () => {
    const hasSession = await ensureSession();
    if (!hasSession) return;

    await loadCatalogs();
    hydrateStepOneFields();
    bindStepOneEvents();
    bindStepNavigation();
    bindFinalStep();

    if (!canAdvanceFromStep1()) {
      state.step = 1;
    } else if (!state.industryTypeId) {
      state.step = 2;
    } else if (!state.planTypeId) {
      state.step = 3;
    } else if (!state.billingDay) {
      state.step = 4;
    }

    persistState(state);
    render();

    if (state.company.ruc && state.company.ruc.length === 11 && !state.company.rucValidated) {
      void runRucValidation();
    }
  };

  return {
    init,
  };
};
