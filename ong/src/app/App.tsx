import { Suspense } from "react";
import { RouterProvider } from "react-router";
import { Toaster } from "sonner";
import { router } from "./routes";
import { TenantBootstrapProvider } from "./tenant/TenantBootstrapProvider";
import { RouteLoadingFallback } from "./components/shared/RouteLoadingFallback";

export default function App() {
  return (
    <TenantBootstrapProvider>
      {/* Boundary de más afuera: cubre rutas públicas (Login, Landing, Signup)
          que no pasan por AppShell. Las rutas protegidas tienen su propio
          boundary más ajustado alrededor de <Outlet/> en AppShell.tsx. */}
      <Suspense fallback={<RouteLoadingFallback />}>
        <RouterProvider router={router} />
      </Suspense>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "var(--t-elevated, rgba(24,24,24,0.85))",
            border: "1px solid var(--t-border-strong, rgba(255,255,255,0.09))",
            color: "var(--t-text, #F5F5F5)",
            backdropFilter: "blur(20px)",
            fontSize: "13px",
          },
        }}
        gap={8}
      />
    </TenantBootstrapProvider>
  );
}
