import { clamp, qs, qsa } from "../utils/dom.js";

export const initProgress = () => {
  const railFill = qs(".progress-fill");
  const mobileFill = qs(".mobile-progress-fill");
  if (!railFill && !mobileFill) return;

  const getScrollTop = () =>
    window.pageYOffset ||
    document.documentElement.scrollTop ||
    document.body.scrollTop ||
    0;

  const getMaxScroll = () => {
    const doc = document.documentElement;
    const body = document.body;
    const scrollHeight = Math.max(
      doc.scrollHeight,
      body.scrollHeight,
      doc.offsetHeight,
      body.offsetHeight,
      doc.clientHeight
    );
    const clientHeight = doc.clientHeight || window.innerHeight || 1;
    return Math.max(1, scrollHeight - clientHeight);
  };

  const update = () => {
    const top = getScrollTop();
    const max = getMaxScroll();

    let progress = top / max;
    if (top >= max - 2) progress = 1;
    progress = clamp(progress, 0, 1);

    if (railFill) railFill.style.transform = `scaleY(${progress})`;
    if (mobileFill) mobileFill.style.width = `${progress * 100}%`;

    document.body.classList.toggle("is-complete", progress >= 0.999);
  };

  const rafUpdate = () => requestAnimationFrame(update);

  update();
  window.addEventListener("scroll", rafUpdate, { passive: true });
  window.addEventListener("resize", rafUpdate);
  window.addEventListener("load", rafUpdate);

  qsa("img").forEach((image) => {
    if (image.complete) return;
    image.addEventListener("load", update, { once: true });
  });
};
