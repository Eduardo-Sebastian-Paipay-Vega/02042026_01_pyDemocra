/**
 * SegmentedBar — thin horizontal row of vertical "pill" segments.
 * Filled segments follow the brand gradient (#4A7BA7 → #4D9B8F).
 * Unfilled segments use the token dark pill color.
 */
interface SegmentedBarProps {
  percentage: number;
  segments?: number;
}

// Linear interpolation between the brand primary (#4A7BA7) and secondary (#4D9B8F)
function gradientColor(t: number): string {
  // t ∈ [0, 1] along the filled portion
  const r = Math.round(74 + (77 - 74) * t);
  const g = Math.round(123 + (155 - 123) * t);
  const b = Math.round(167 + (143 - 167) * t);
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
