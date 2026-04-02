import { qs, qsa } from "../utils/dom.js";

const workflow = {
  solaris: ["design", "labs", "ventures"],
  ventures: ["seed", "grow"],
  design: [],
  labs: [],
  seed: [],
  grow: [],
};

const initScrollTriggers = () => {
  const targets = qsa(".scroll-trigger");
  if (!targets.length) return;

  if (!("IntersectionObserver" in window)) {
    targets.forEach((target) => target.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries, io) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      });
    },
    { threshold: 0.1 }
  );

  targets.forEach((target) => observer.observe(target));
};

const initBoard = () => {
  const nodes = qsa(".solaris-node");
  if (!nodes.length) return;

  const unlockNextStage = (currentId) => {
    const currentNode = qs(`.solaris-node[data-id="${currentId}"]`);
    if (!currentNode) return;

    currentNode.classList.add("active");

    const targets = workflow[currentId] || [];
    targets.forEach((targetId, index) => {
      const targetNode = qs(`.solaris-node[data-id="${targetId}"]`);
      if (!targetNode) return;

      setTimeout(() => {
        targetNode.classList.remove("locked");
        if (typeof targetNode.animate === "function") {
          targetNode.animate(
            [
              { transform: "translate(-50%, -50%) scale(0.9)", opacity: 0.5 },
              { transform: "translate(-50%, -50%) scale(1)", opacity: 1 },
            ],
            { duration: 400, easing: "ease-out" }
          );
        }
      }, 200 + index * 150);
    });
  };

  nodes.forEach((node) => {
    node.addEventListener("mouseenter", () => {
      if (node.classList.contains("locked")) return;

      const statusDot = qs(".status-dot", node);
      if (statusDot) {
        statusDot.style.backgroundColor = "#fff";
      }

      const pathId = node.getAttribute("data-path");
      if (!pathId) return;
      const path = document.getElementById(pathId);
      if (path) path.classList.add("lit");
    });

    node.addEventListener("mouseleave", () => {
      const statusDot = qs(".status-dot", node);
      if (statusDot) statusDot.style.backgroundColor = "";

      const pathId = node.getAttribute("data-path");
      if (!pathId) return;
      const path = document.getElementById(pathId);
      if (path) path.classList.remove("lit");
    });

    node.addEventListener("click", () => {
      if (node.classList.contains("locked")) return;
      const nodeId = node.getAttribute("data-id");
      if (!nodeId) return;
      unlockNextStage(nodeId);
    });
  });

  window.setTimeout(() => {
    unlockNextStage("solaris");
  }, 500);
};

export const init = async () => {
  initScrollTriggers();
  initBoard();
};
