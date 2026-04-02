"use client";

import * as React from "react";
import { Toaster as Sonner, ToasterProps } from "sonner@2.0.3";

const getTheme = (): ToasterProps["theme"] => {
  if (typeof window === "undefined") return "system";

  // Prefer explicit app theme, fallback to system.
  if (document.documentElement.classList.contains("dark")) return "dark";
  if (document.documentElement.classList.contains("light")) return "light";

  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

const Toaster = ({ ...props }: ToasterProps) => {
  const [theme, setTheme] = React.useState<ToasterProps["theme"]>(getTheme());

  React.useEffect(() => {
    const onChange = () => setTheme(getTheme());

    const observer = new MutationObserver(onChange);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    mq?.addEventListener?.("change", onChange);

    return () => {
      observer.disconnect();
      mq?.removeEventListener?.("change", onChange);
    };
  }, []);

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group z-[9999]"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
