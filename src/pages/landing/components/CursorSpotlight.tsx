import { useEffect, useRef } from "react";

export function CursorSpotlight() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    let cx = window.innerWidth / 2;
    let cy = window.innerHeight / 2;
    let tx = cx;
    let ty = cy;

    // Perf: antes este loop llamaba requestAnimationFrame incondicionalmente
    // para siempre, incluso ya convergido y sin movimiento de mouse -- eso
    // reescribia el `background` (repaint) en cada frame para toda la vida
    // de la pagina, y era la causa principal del Total Blocking Time alto
    // medido con Lighthouse (mobile) en esta pagina. Ahora el loop se
    // detiene solo al converger y se reactiva en el proximo mousemove.
    const isConverged = () => Math.abs(tx - cx) < 0.5 && Math.abs(ty - cy) < 0.5;

    const tick = () => {
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      el.style.background = `radial-gradient(700px circle at ${cx}px ${cy}px, rgba(0,46,254,0.07), transparent 42%)`;
      if (!isConverged()) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = 0;
      }
    };

    const onMove = (e: MouseEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      if (!raf) {
        raf = requestAnimationFrame(tick);
      }
    };

    window.addEventListener("mousemove", onMove);
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ref}
      className="pointer-events-none fixed inset-0 z-30"
    />
  );
}

