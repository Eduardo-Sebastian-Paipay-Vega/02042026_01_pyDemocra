/**
 * RadialGauge — segmented donut / radial ring with gradient fill.
 * Uses inline SVG arc segments. Gradient follows brand:
 * #DB7052 → #7545E2 → #551BB3 mapped to fill percentage.
 */
interface RadialGaugeProps {
  percentage: number;
  label: string;
  size?: number;
}

function gradientColor(t: number): string {
  let r: number, g: number, b: number;
  if (t < 0.55) {
    const p = t / 0.55;
    r = Math.round(219 + (117 - 219) * p);
    g = Math.round(112 + (69 - 112) * p);
    b = Math.round(82 + (226 - 82) * p);
  } else {
    const p = (t - 0.55) / 0.45;
    r = Math.round(117 + (85 - 117) * p);
    g = Math.round(69 + (27 - 69) * p);
    b = Math.round(226 + (179 - 226) * p);
  }
  return `rgb(${r},${g},${b})`;
}

export function RadialGauge({
  percentage,
  label,
  size = 240,
}: RadialGaugeProps) {
  const total = 40;
  const filled = Math.round((percentage / 100) * total);
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 16;
  const innerR = outerR - 14;
  const gapDeg = 2;

  const segments = Array.from({ length: total }, (_, i) => {
    const startDeg = (i / total) * 360 - 90;
    const endDeg = ((i + 1) / total) * 360 - 90;
    const s = ((startDeg + gapDeg / 2) * Math.PI) / 180;
    const e = ((endDeg - gapDeg / 2) * Math.PI) / 180;

    const x1o = cx + outerR * Math.cos(s);
    const y1o = cy + outerR * Math.sin(s);
    const x2o = cx + outerR * Math.cos(e);
    const y2o = cy + outerR * Math.sin(e);
    const x2i = cx + innerR * Math.cos(e);
    const y2i = cy + innerR * Math.sin(e);
    const x1i = cx + innerR * Math.cos(s);
    const y1i = cy + innerR * Math.sin(s);

    const isFilled = i < filled;
    const fill = isFilled
      ? gradientColor(i / (filled - 1 || 1))
      : "rgba(255,255,255,0.06)";

    const d = [
      `M${x1o},${y1o}`,
      `A${outerR},${outerR} 0 0 1 ${x2o},${y2o}`,
      `L${x2i},${y2i}`,
      `A${innerR},${innerR} 0 0 0 ${x1i},${y1i}`,
      "Z",
    ].join(" ");

    return <path key={i} d={d} fill={fill} />;
  });

  return (
    <div
      className="relative inline-flex items-center justify-center"
      role="meter"
      aria-valuenow={percentage}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${label}: ${percentage}%`}
    >
      {/* Subtle glow behind gauge */}
      <div
        className="absolute rounded-full opacity-20 blur-[60px]"
        style={{
          width: size * 0.6,
          height: size * 0.6,
          background:
            "linear-gradient(135deg, #DB7052 0%, #7545E2 55%, #551BB3 100%)",
        }}
      />

      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="relative"
      >
        {segments}
      </svg>

      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-bold text-[#F5F5F5]"
          style={{ fontFamily: "'Sora', sans-serif", fontSize: size * 0.17 }}
        >
          {percentage}%
        </span>
        <span className="mt-1 text-sm text-[#707070]">{label}</span>
      </div>
    </div>
  );
}
