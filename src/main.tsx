import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";
import { appRouter } from "./App";
import "./styles/global.css";

import { SettingsProvider } from "./core/context/SettingsContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SettingsProvider>
      <RouterProvider router={appRouter} />
    </SettingsProvider>
  </StrictMode>
);

// Make the page visible after first React paint
requestAnimationFrame(() => {
  document.documentElement.classList.add("loaded");
});

