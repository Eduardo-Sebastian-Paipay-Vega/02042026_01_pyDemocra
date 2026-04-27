/**
 * SegmentedBar — thin horizontal row of vertical "pill" segments.
 * Filled segments follow the brand gradient (#DB7052 → #7545E2 → #551BB3).
 * Unfilled segments use the token dark pill color.
 */
interface SegmentedBarProps {
  percentage: number;
  segments?: number;
}

// Pre-computed gradient stops at 0%, 55%, 100%
function gradientColor(t: number): string {
  // t ∈ [0, 1] along the filled portion
  let r: number, g: number, b: number;
  if (t < 0.55) {
    const p = t / 0.55;
    r = Math.round(219 + (117 - 219) * p); // DB → 75
    g = Math.round(112 + (69 - 112) * p);  // 70 → 45
    b = Math.round(82 + (226 - 82) * p);   // 52 → E2
  } else {
    const p = (t - 0.55) / 0.45;
    r = Math.round(117 + (85 - 117) * p);  // 75 → 55
    g = Math.round(69 + (27 - 69) * p);    // 45 → 1B
    b = Math.round(226 + (179 - 226) * p); // E2 → B3
  }
  return `rgb(${r},${g},${b})`;
}

export function SegmentedBar({
  percentage,
  segments = 24,
}: SegmentedBarProps) {
  const filled = Math.round((percentage / 100) * segments);

  return (
    <div
      className="flex items-center justify-center gap-[3px]"
      role="meter"
      aria-valuenow={percentage}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${percentage}% filled`}
    >
      {Array.from({ length: segments }, (_, i) => {
        const isFilled = i < filled;
        return (
          <div
            key={i}
            className="h-[18px] w-[5px] rounded-full"
            style={{
              backgroundColor: isFilled
                ? gradientColor(i / (filled - 1 || 1))
                : "rgba(255,255,255,0.06)",
            }}
          />
        );
      })}
    </div>
  );
}
