import { createRoot } from "react-dom/client";
import App from "./App";
import "../modules/ong/styles/index.css";

export function mountIntegratedApp(container: Element) {
  createRoot(container).render(<App />);
}
