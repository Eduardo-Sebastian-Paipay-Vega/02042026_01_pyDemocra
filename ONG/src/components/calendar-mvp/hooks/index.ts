import { useEffect, useRef } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useEscapeKey(active: boolean, onClose: () => void) {
  useEffect(() => {
    if (!active) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [active, onClose]);
}

export function useFocusTrap(active: boolean, onClose: () => void) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  useEscapeKey(active, onClose);

  useEffect(() => {
    if (!active || !containerRef.current) return;

    const node = containerRef.current;
    const previous = document.activeElement as HTMLElement | null;
    const focusables = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE));
    (focusables[0] || node).focus();

    const handleTab = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const currentFocusables = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (currentFocusables.length === 0) {
        event.preventDefault();
        return;
      }
      const first = currentFocusables[0];
      const last = currentFocusables[currentFocusables.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    node.addEventListener('keydown', handleTab);
    return () => {
      node.removeEventListener('keydown', handleTab);
      previous?.focus();
    };
  }, [active]);

  return containerRef;
}

