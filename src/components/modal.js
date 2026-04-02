import { trapFocusWithin, getFocusableElements } from "../utils/a11y.js";
import { qs, qsa } from "../utils/dom.js";

export const createModalController = (store) => {
  const activeTraps = new Map();
  const returnFocusMap = new Map();

  const resolveModal = (target) => {
    if (!target) return null;
    if (typeof target === "string") return document.getElementById(target);
    return target;
  };

  const lockScroll = () => {
    document.documentElement.style.overflow = "hidden";
  };

  const unlockScroll = () => {
    if (qsa(".modal.is-open").length > 0) return;
    document.documentElement.style.overflow = "";
  };

  const setModalState = (modal, isOpen) => {
    if (!modal?.id || !store?.setModalOpen) return;
    store.setModalOpen(modal.id, isOpen);
  };

  const openModal = (target) => {
    const modal = resolveModal(target);
    if (!modal) return;

    returnFocusMap.set(
      modal,
      document.activeElement instanceof HTMLElement ? document.activeElement : null
    );

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    setModalState(modal, true);
    lockScroll();

    const panel = qs(".modal__panel", modal);
    if (panel) {
      if (!panel.hasAttribute("tabindex")) {
        panel.setAttribute("tabindex", "-1");
      }

      const focusables = getFocusableElements(panel);
      const targetFocus = focusables[0] || panel;
      requestAnimationFrame(() => targetFocus.focus());

      const release = trapFocusWithin(panel);
      activeTraps.set(modal, release);
    }
  };

  const closeModal = (target) => {
    const modal = resolveModal(target);
    if (!modal) return;

    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    setModalState(modal, false);

    const release = activeTraps.get(modal);
    if (release) {
      release();
      activeTraps.delete(modal);
    }

    unlockScroll();

    const previousFocus = returnFocusMap.get(modal);
    if (previousFocus && typeof previousFocus.focus === "function") {
      previousFocus.focus();
    }
    returnFocusMap.delete(modal);
  };

  const closeAll = () => {
    qsa(".modal.is-open").forEach((modal) => closeModal(modal));
  };

  qsa("[data-open-contact]").forEach((trigger) => {
    trigger.addEventListener("click", () => openModal("contactModal"));
  });

  qsa("[data-close-contact]").forEach((trigger) => {
    trigger.addEventListener("click", () => closeModal("contactModal"));
  });

  qsa("[data-close-preview]").forEach((trigger) => {
    trigger.addEventListener("click", () => closeModal("previewModal"));
  });

  qsa(".modal__backdrop").forEach((backdrop) => {
    backdrop.addEventListener("click", () => {
      const modal = backdrop.closest(".modal");
      closeModal(modal);
    });
  });

  window.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    closeAll();
  });

  return {
    openModal,
    closeModal,
    closeAll,
  };
};
