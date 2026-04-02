import { qs, qsa } from "../utils/dom.js";
import { setSafeText } from "../utils/sanitize.js";

const initFilters = (store) => {
  const chips = qsa(".chip");
  const cards = qsa(".card-item");
  if (!chips.length || !cards.length) return;

  const applyFilter = (key) => {
    cards.forEach((card) => {
      const tag = (card.dataset.tag || "").toLowerCase();
      const isVisible = key === "all" ? true : tag === key;
      card.style.display = isVisible ? "" : "none";
    });

    store.setFilters({ studioTag: key });
  };

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const key = (chip.dataset.filter || "all").toLowerCase();
      chips.forEach((item) => item.classList.remove("is-active"));
      chip.classList.add("is-active");
      applyFilter(key);
    });
  });
};

const initPreview = (modalController) => {
  const previewModal = qs("#previewModal");
  if (!previewModal || !modalController) return;

  const title = qs("#pvTitle");
  const description = qs("#pvDesc");
  const kicker = qs("#pvKicker");
  const tag = qs("#pvTag");
  const mediaWrap = qs("#pvMediaWrap");
  const media = qs("#pvMedia");

  qsa(".card-item__open").forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const card = trigger.closest(".card-item");
      if (!card) return;

      setSafeText(title, card.dataset.title || "Preview");
      setSafeText(description, card.dataset.desc || "");
      setSafeText(kicker, card.dataset.kicker || "Archivo");
      setSafeText(tag, (card.dataset.tag || "Studio").toUpperCase());

      const mediaPath = card.dataset.media;
      if (mediaWrap && media) {
        if (mediaPath) {
          mediaWrap.hidden = false;
          media.src = mediaPath;
        } else {
          mediaWrap.hidden = true;
          media.removeAttribute("src");
        }
      }

      modalController.openModal(previewModal);
    });
  });
};

export const init = async ({ store, modal }) => {
  initFilters(store);
  initPreview(modal);
};
