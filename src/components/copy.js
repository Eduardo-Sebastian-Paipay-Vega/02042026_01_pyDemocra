import { qsa } from "../utils/dom.js";

const copyText = async (text) => {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const helper = document.createElement("textarea");
  helper.value = text;
  helper.setAttribute("readonly", "");
  helper.style.position = "fixed";
  helper.style.opacity = "0";
  document.body.appendChild(helper);
  helper.select();
  document.execCommand("copy");
  helper.remove();
};

const flashCopiedState = (element, message = "Copiado con exito") => {
  if (!element) return;
  const previous = element.textContent;
  element.textContent = message;
  element.classList.add("is-copied");
  window.setTimeout(() => {
    element.textContent = previous;
    element.classList.remove("is-copied");
  }, 2000);
};

export const initCopyHandlers = () => {
  window.copyValue = async (text, element) => {
    try {
      await copyText(text);
      flashCopiedState(element);
    } catch {
      flashCopiedState(element, "Copia manual");
    }
  };

  qsa("[data-copy]").forEach((trigger) => {
    trigger.addEventListener("click", async () => {
      const value = trigger.getAttribute("data-copy") || "";
      if (!value) return;
      try {
        await copyText(value);
        flashCopiedState(trigger, "Copiado");
      } catch {
        flashCopiedState(trigger, "Copia manual");
      }
    });
  });
};
