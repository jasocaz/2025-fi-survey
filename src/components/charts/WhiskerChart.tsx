"use client";
import {
  ComposedChart, Bar, ErrorBar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { formatDollar } from "@/lib/percentile";

interface WhiskerDatum {
  bracket: string;
  count: number;
  p25: number | null;
  p50: number | null;
  p75: number | null;
  p90: number | null;
}

interface Props {
  data: WhiskerDatum[];
  visitorValue?: number | null;
  visitorBracket?: string | null;
  logScale?: boolean;
}

export function WhiskerChart({ data, visitorValue, visitorBracket, logScale = true }: Props) {
  const chartData = data
    .filter((d) => d.count > 0 && d.p50 !== null)
    .map((d) => ({
      bracket: d.bracket,
      count: d.count,
      median: d.p50!,
      iqr: [d.p25 ?? d.p50!, d.p75 ?? d.p50!] as [number, number],
      // ErrorBar expects [lower_error, upper_error] from the center value
      errorLow: Math.max(0, d.p50! - (d.p25 ?? d.p50!)),
      errorHigh: Math.max(0, (d.p75 ?? d.p50!) - d.p50!),
    }));

  const formatY = (v: number) => {
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(0)}M`;
    if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}k`;
    return `$${v}`;
  };

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: {payload: typeof chartData[0]}[]; label?: string }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className="bg-white border border-stone-200 rounded p-3 text-xs shadow-lg">
        <p className="font-semibold mb-1">Age {label}</p>
        <p className="text-stone-500">n = {d.count}</p>
        <p>Median: <span className="font-mono font-semibold">{formatDollar(d.median)}</span></p>
        <p>25th–75th: <span className="font-mono">{formatDollar(d.iqr[0])} – {formatDollar(d.iqr[1])}</span></p>
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={320}>
      <ComposedChart data={chartData} margin={{ top: 20, right: 20, left: 60, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0ede6" vertical={false} />
        <XAxis
          dataKey="bracket"
          tick={{ fontSize: 11, fill: "#78716c" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          scale={logScale ? "log" : "linear"}
          domain={logScale ? ["auto", "auto"] : [0, "auto"]}
          tickFormatter={formatY}
          tick={{ fontSize: 11, fill: "#78716c" }}
          axisLine={false}
          tickLine={false}
          width={58}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar
          dataKey="median"
          fill="#0a7d4a"
          fillOpacity={0.85}
          radius={[3, 3, 0, 0]}
          maxBarSize={48}
        >
          <ErrorBar
            dataKey={(d) => [d.errorLow, d.errorHigh]}
            width={8}
            strokeWidth={2}
            stroke="#064e2b"
          />
        </Bar>
        {visitorValue && visitorBracket && (
          <ReferenceLine
            x={visitorBracket}
            stroke="#0a7d4a"
            strokeDasharray="4 2"
            strokeWidth={2}
            label={{ value: `▲ you`, position: "top", fontSize: 10, fill: "#0a5530", fontWeight: 700 }}
          />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
