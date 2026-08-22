import { useEffect, useRef, useCallback } from "react";

interface ShortcutConfig {
  onNavigate: (path: string) => void;
  onOpenCommandPalette: () => void;
  shortcutTargets?: Record<string, string | null>;
}

export function useGlobalShortcuts({
  onNavigate,
  onOpenCommandPalette,
  shortcutTargets = {},
}: ShortcutConfig) {
  const gPending = useRef(false);
  const gTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearG = useCallback(() => {
    gPending.current = false;
    if (gTimeout.current) {
      clearTimeout(gTimeout.current);
      gTimeout.current = null;
    }
  }, []);

  useEffect(() => {
    function isTyping(event: KeyboardEvent) {
      const tagName = (event.target as HTMLElement)?.tagName;
      if (tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT") {
        return true;
      }

      return (event.target as HTMLElement)?.isContentEditable === true;
    }

    function navigateIfAvailable(path: string | null | undefined) {
      if (path) {
        onNavigate(path);
      }
    }

    function handler(event: KeyboardEvent) {
      if (isTyping(event)) {
        clearG();
        return;
      }

      if (event.shiftKey && event.key === "N" && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        clearG();
        navigateIfAvailable(shortcutTargets.a ?? null);
        return;
      }

      if (
        event.key === "/" &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.shiftKey &&
        !event.altKey
      ) {
        event.preventDefault();
        clearG();
        onOpenCommandPalette();
        return;
      }

      if (
        event.key.toLowerCase() === "g" &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.shiftKey &&
        !event.altKey
      ) {
        if (!gPending.current) {
          gPending.current = true;
          gTimeout.current = setTimeout(() => {
            gPending.current = false;
          }, 800);
          return;
        }
      }

      if (gPending.current) {
        const key = event.key.toLowerCase();
        if (shortcutTargets[key]) {
          event.preventDefault();
          navigateIfAvailable(shortcutTargets[key]);
        }
        clearG();
      }
    }

    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
      clearG();
    };
  }, [clearG, onNavigate, onOpenCommandPalette, shortcutTargets]);
}

