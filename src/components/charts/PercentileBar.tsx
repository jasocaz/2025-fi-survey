"use client";
import { ordinal, formatDollar } from "@/lib/percentile";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  sorted: number[];
  value: number | null;
  percentile: number | null;
  formatValue?: (n: number) => string;
  lowerIsBetter?: boolean;
  unit?: string;
}

export function PercentileBar({
  label,
  sorted,
  value,
  percentile,
  formatValue = (n) => formatDollar(n, true),
  lowerIsBetter = false,
  unit,
}: Props) {
  if (!sorted.length) return null;

  const p25 = sorted[Math.floor(sorted.length * 0.25)];
  const p50 = sorted[Math.floor(sorted.length * 0.50)];
  const p75 = sorted[Math.floor(sorted.length * 0.75)];
  const p99 = sorted[Math.floor(sorted.length * 0.99)];
  const cap = p99;

  const toX = (v: number) => Math.min(100, (v / cap) * 100);
  const markerX = value !== null ? toX(value) : null;
  const medianX = toX(p50);
  const p25X = toX(p25);
  const p75X = toX(p75);

  const pctLabel = percentile !== null
    ? lowerIsBetter
      ? `you owe less than ${100 - percentile}% of respondents`
      : `${ordinal(percentile)} percentile`
    : null;

  const bgColor = lowerIsBetter ? "bg-blue-100" : "bg-emerald-100";
  const markerColor = "bg-[#0a7d4a]";

  return (
    <div className="mb-5">
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-xs font-semibold tracking-wider text-stone-500 uppercase">{label}</span>
        {pctLabel && (
          <span className="text-xs font-mono text-[#0a7d4a] font-semibold">{pctLabel}</span>
        )}
      </div>
      {/* Bar */}
      <div className="relative h-6 bg-stone-100 rounded overflow-visible">
        {/* IQR shading */}
        <div
          className={cn("absolute top-0 bottom-0 rounded", bgColor)}
          style={{ left: `${p25X}%`, width: `${p75X - p25X}%` }}
        />
        {/* Median tick */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-stone-500"
          style={{ left: `${medianX}%` }}
        />
        {/* You marker */}
        {markerX !== null && (
          <div
            className="absolute top-[-4px] bottom-[-4px] flex flex-col items-center"
            style={{ left: `${markerX}%`, transform: "translateX(-50%)" }}
          >
            <div className={cn("w-1 h-full rounded-full", markerColor)} />
            <div
              className={cn(
                "absolute top-[-20px] text-[10px] font-bold whitespace-nowrap font-mono",
                "text-[#0a5530]",
              )}
            >
              {value !== null ? formatValue(value) : ""}
            </div>
          </div>
        )}
      </div>
      {/* Axis labels */}
      <div className="flex justify-between text-[10px] text-stone-400 mt-1 font-mono">
        <span>$0</span>
        <span>median {formatValue(p50)}{unit ? ` ${unit}` : ""}</span>
        <span>{formatValue(cap)}+</span>
      </div>
      {!value && (
        <p className="text-xs text-stone-400 mt-1">Enter a value above to see your position</p>
      )}
    </div>
  );
}
