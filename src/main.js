import { initDebugPanel } from "./components/debug-panel.js";
import { initCommonPage } from "./pages/common.js";
import { loadRoute } from "./router.js";
import { createStore } from "./state/store.js";

const bootstrap = async () => {
  const store = createStore();
  const common = initCommonPage({ store });

  const { routeName, module } = await loadRoute(window.location.pathname);
  store.setRoute(routeName);
  initDebugPanel(store);

  if (typeof module.init === "function") {
    await module.init({
      store,
      routeName,
      modal: common.modal,
    });
  }
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    void bootstrap();
  });
} else {
  void bootstrap();
}
