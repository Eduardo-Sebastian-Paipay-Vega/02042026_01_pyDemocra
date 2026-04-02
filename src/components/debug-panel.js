const isDebugEnabled = () => {
  const params = new URLSearchParams(window.location.search);
  const param = params.get("debug");

  if (param === "1") {
    localStorage.setItem("solar_debug_panel", "1");
    return true;
  }

  if (param === "0") {
    localStorage.removeItem("solar_debug_panel");
    return false;
  }

  return localStorage.getItem("solar_debug_panel") === "1";
};

export const initDebugPanel = (store) => {
  if (!isDebugEnabled() || !store) return () => {};

  const panel = document.createElement("aside");
  panel.setAttribute("aria-live", "polite");
  panel.style.position = "fixed";
  panel.style.left = "12px";
  panel.style.bottom = "12px";
  panel.style.zIndex = "9999";
  panel.style.maxWidth = "320px";
  panel.style.padding = "10px 12px";
  panel.style.border = "1px solid rgba(255,255,255,.2)";
  panel.style.borderRadius = "12px";
  panel.style.background = "rgba(5,5,5,.85)";
  panel.style.color = "#f5f5f5";
  panel.style.fontFamily = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
  panel.style.fontSize = "11px";
  panel.style.lineHeight = "1.4";
  panel.style.whiteSpace = "pre-wrap";
  panel.style.backdropFilter = "blur(6px)";

  const render = (state) => {
    panel.textContent = [
      `route: ${state.route}`,
      `user: ${state.authState.user ? "signed-in" : "anonymous"}`,
      `modals: ${JSON.stringify(state.uiState.modals)}`,
      `toasts: ${state.uiState.toasts.length}`,
      `activities: ${state.dataState.activities.length}`,
    ].join("\n");
  };

  render(store.getState());
  const unsubscribe = store.subscribe(render);
  document.body.appendChild(panel);

  return () => {
    unsubscribe();
    panel.remove();
  };
};
