import { qs, qsa } from "../utils/dom.js";

export const initSectionIndicator = () => {
  const indicator = qs(".section-indicator");
  const dots = qsa(".section-indicator .dot");
  if (!indicator || !dots.length) return;

  const sections = dots
    .map((dot) => (dot.dataset.target ? qs(dot.dataset.target) : null))
    .filter(Boolean);

  const setActiveDot = (targetSelector) => {
    dots.forEach((dot) => dot.classList.remove("is-active"));
    const active = dots.find((dot) => dot.dataset.target === targetSelector);
    if (active) active.classList.add("is-active");
  };

  let manualScrollLockUntil = 0;

  // Click navegación
  dots.forEach((dot) => {
    dot.addEventListener("click", () => {
      const targetSelector = dot.dataset.target;
      if (!targetSelector) return;
      const target = qs(targetSelector);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        setActiveDot(targetSelector);
        manualScrollLockUntil = performance.now() + 450;
      }
    });
  });

  if (sections.length && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        if (performance.now() < manualScrollLockUntil) return;

        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => {
            const aCenter = Math.abs(
              a.boundingClientRect.top + a.boundingClientRect.height / 2
            );
            const bCenter = Math.abs(
              b.boundingClientRect.top + b.boundingClientRect.height / 2
            );
            return aCenter - bCenter;
          })[0];

        if (!visible) return;
        const index = sections.indexOf(visible.target);
        if (index < 0) return;

        const targetSelector = dots[index]?.dataset.target;
        if (targetSelector) setActiveDot(targetSelector);
      },
      {
        threshold: [0.15, 0.3, 0.45],
        rootMargin: "-35% 0px -50% 0px",
      }
    );

    sections.forEach((section) => observer.observe(section));
  }

  let idleTimer;
  const setIdle = () => {
    indicator.classList.add("is-idle");
  };

  const wake = () => {
    indicator.classList.remove("is-idle");
    window.clearTimeout(idleTimer);
    idleTimer = window.setTimeout(setIdle, 2000);
  };

  ["scroll", "mousemove", "touchstart", "keydown"].forEach((eventName) => {
    window.addEventListener(eventName, wake, { passive: true });
  });
  setIdle();
};
