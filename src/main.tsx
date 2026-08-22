import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";
import { appRouter } from "./App";
import "./styles/global.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={appRouter} />
  </StrictMode>
);

// Make the page visible after first React paint
requestAnimationFrame(() => {
  document.documentElement.classList.add("loaded");
});

