/**
 * SegmentedBar — thin horizontal row of vertical "pill" segments.
 * Filled segments follow the brand gradient (#3D6BFF → #2DBFB0).
 * Unfilled segments use the token dark pill color.
 */
interface SegmentedBarProps {
  percentage: number;
  segments?: number;
}

// Linear interpolation between the brand primary (#3D6BFF) and tertiary (#2DBFB0)
function gradientColor(t: number): string {
  // t ∈ [0, 1] along the filled portion
  const r = Math.round(61 + (45 - 61) * t);
  const g = Math.round(107 + (191 - 107) * t);
  const b = Math.round(255 + (176 - 255) * t);
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
