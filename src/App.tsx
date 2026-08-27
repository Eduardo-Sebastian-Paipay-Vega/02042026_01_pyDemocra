import { createBrowserRouter, Navigate, RouterProvider } from "react-router";
import { LandingPage } from "./pages/landing/LandingPage";
import { LoginPage } from "./pages/login/LoginPage";
import { NosotrosPage } from "./pages/nosotros/NosotrosPage";
import { SettingsProvider } from "./core/context/SettingsContext";

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

export function App() {
  return (
    <SettingsProvider>
      <RouterProvider router={appRouter} />
    </SettingsProvider>
  );
}

