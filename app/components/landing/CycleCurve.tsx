import { useMemo } from "react";

type CycleCurveProps = {
  /**
   * 0..1 values across the cycle.
   */
  values: number[];
  className?: string;
  height?: number;
};

function clamp01(n: number) {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

export function CycleCurve({ values, className, height = 140 }: CycleCurveProps) {
  const w = 520;
  const h = height;

  const { d, points } = useMemo(() => {
    const v = values.length ? values : [0, 0.1, 0.35, 0.85, 0.65, 0.4, 0.2, 0.1, 0.08, 0.06, 0.05, 0.05];
    const n = v.length;

    const pts: Array<[number, number]> = v.map((raw, i) => {
      const x = (i / (n - 1)) * (w - 24) + 12;
      const y = (1 - clamp01(raw)) * (h - 20) + 10;
      return [x, y];
    });

    // Build a smooth-ish cubic bezier path through points.
    const smooth = (i: number) => {
      const prev = pts[Math.max(0, i - 1)];
      const cur = pts[i];
      const next = pts[Math.min(n - 1, i + 1)];
      if (!prev || !cur || !next) return "";

      const [x0, y0] = prev;
      const [x1, y1] = cur;
      const [x2, y2] = next;

      const c1x = x0 + (x1 - x0) * 0.5;
      const c1y = y0 + (y1 - y0) * 0.5;
      const c2x = x1 + (x2 - x1) * 0.5;
      const c2y = y1 + (y2 - y1) * 0.5;
      return `C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${x1.toFixed(2)} ${y1.toFixed(2)} `;
    };

    const first = pts[0]!;
    let path = `M ${first[0].toFixed(2)} ${first[1].toFixed(2)} `;
    for (let i = 1; i < pts.length; i++) {
      path += smooth(i);
    }

    return { d: path.trim(), points: pts };
  }, [values, h]);

  return (
    <div className={className}>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto">
        <defs>
          <linearGradient id="lp-curve" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#C8B6A6" stopOpacity="0.65" />
            <stop offset="55%" stopColor="#8B5E5E" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#C8B6A6" stopOpacity="0.55" />
          </linearGradient>
          <filter id="lp-soften" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="0.6" />
          </filter>
        </defs>

        {/* grid */}
        <path
          d={`M 12 ${(h - 18).toFixed(2)} H ${(w - 12).toFixed(2)}`}
          stroke="rgba(122, 111, 104, 0.22)"
          strokeWidth="1"
        />
        <path
          d={`M 12 ${(h * 0.5).toFixed(2)} H ${(w - 12).toFixed(2)}`}
          stroke="rgba(122, 111, 104, 0.14)"
          strokeWidth="1"
        />

        {/* curve */}
        <g className="motion-safe:animate-lp-float">
          <path
            d={d}
            fill="none"
            stroke="url(#lp-curve)"
            strokeWidth="2.5"
            strokeLinecap="round"
            filter="url(#lp-soften)"
            opacity="0.95"
          />
          <path
            d={d}
            fill="none"
            stroke="rgba(43, 43, 43, 0.06)"
            strokeWidth="6"
            strokeLinecap="round"
          />
          {points.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={i % 2 === 0 ? 1.4 : 1.2} fill="rgba(43, 43, 43, 0.12)" />
          ))}
        </g>
      </svg>
    </div>
  );
}

