import { createBrowserRouter, Navigate } from "react-router";
import { LandingPage } from "./pages/landing/LandingPage";
import { LoginPage } from "./pages/login/LoginPage";
import { NosotrosPage } from "./pages/nosotros/NosotrosPage";

export const appRouter = createBrowserRouter([
  {
    path: "/",
    Component: LandingPage,
  },
  {
    path: "/login",
    Component: LoginPage,
  },
  {
    path: "/nosotros",
    Component: NosotrosPage,
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);
