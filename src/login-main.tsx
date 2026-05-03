import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/login.css";
import { LoginGateway } from "./app/LoginGateway";

createRoot(document.getElementById("login-root")!).render(
  <StrictMode>
    <LoginGateway />
  </StrictMode>
);
