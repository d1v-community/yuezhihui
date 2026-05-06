import { useEffect, useMemo, useRef, useState } from "react";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  /**
   * IntersectionObserver threshold.
   * Keep it low so content reveals naturally on scroll.
   */
  threshold?: number;
  rootMargin?: string;
};

export function Reveal({ children, className, threshold = 0.12, rootMargin = "0px 0px -10% 0px" }: RevealProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(true); // SSR-friendly default (no hidden content before hydration)

  const options = useMemo(
    () => ({ threshold, rootMargin } as const),
    [threshold, rootMargin],
  );

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // If it's clearly below the fold, hide it before first paint (so we can reveal on scroll).
    const rect = el.getBoundingClientRect();
    const inViewport = rect.top < window.innerHeight && rect.bottom > 0;
    setVisible(inViewport);

    const obs = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect(); // reveal once
          break;
        }
      }
    }, options);

    obs.observe(el);
    return () => obs.disconnect();
  }, [options]);

  return (
    <div ref={ref} data-visible={visible ? "true" : "false"} className={["lp-reveal", className].filter(Boolean).join(" ")}>
      {children}
    </div>
  );
}
