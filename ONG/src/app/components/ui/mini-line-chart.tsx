import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface DataPoint {
  label: string;
  value: number;
}

interface MiniLineChartProps {
  data: DataPoint[];
  height?: number;
  color?: string;
  gradientFrom?: string;
  gradientTo?: string;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-lg px-3 py-1.5 backdrop-blur-xl"
      style={{
        background: "var(--t-elevated)",
        border: "1px solid var(--t-border-strong)",
        boxShadow: "var(--t-shadow)",
      }}
    >
      <p className="text-[10px]" style={{ color: "var(--t-text-dim)" }}>{label}</p>
      <p className="text-[13px] tabular-nums" style={{ color: "var(--t-text)" }}>{payload[0].value}h</p>
    </div>
  );
}

export function MiniLineChart({
  data,
  height = 140,
  color = "#7545E2",
  gradientFrom = "#7545E2",
  gradientTo = "transparent",
}: MiniLineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart
        data={data}
        margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
      >
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={gradientFrom} stopOpacity={0.25} />
            <stop offset="95%" stopColor={gradientTo || gradientFrom} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="rgba(128,128,128,0.06)"
          vertical={false}
        />
        <XAxis
          dataKey="label"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 10, fill: "rgba(128,128,128,0.4)" }}
          dy={6}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 10, fill: "rgba(128,128,128,0.3)" }}
        />
        <Tooltip content={<CustomTooltip />} cursor={false} />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill="url(#chartGradient)"
          dot={false}
          activeDot={{
            r: 3,
            fill: color,
            stroke: "var(--t-bg)",
            strokeWidth: 2,
          }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
