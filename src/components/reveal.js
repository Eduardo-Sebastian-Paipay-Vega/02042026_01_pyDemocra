import { qsa } from "../utils/dom.js";

export const initRevealAnimations = () => {
  const revealTargets = qsa(".reveal, .stagger");
  const scrollTargets = qsa(".scroll-trigger");

  if (!("IntersectionObserver" in window)) {
    revealTargets.forEach((element) => element.classList.add("is-in"));
    scrollTargets.forEach((element) => element.classList.add("is-visible"));
    return;
  }

  if (revealTargets.length) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -12% 0px" }
    );

    revealTargets.forEach((element) => revealObserver.observe(element));
  }

  if (scrollTargets.length) {
    const scrollObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.1 }
    );

    scrollTargets.forEach((element) => scrollObserver.observe(element));
  }
};
