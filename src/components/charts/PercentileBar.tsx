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
      ? `less debt than ${100 - percentile}%`
      : ordinal(percentile) + " pct"
    : null;

  const bgColor = lowerIsBetter ? "bg-blue-100" : "bg-emerald-100";

  return (
    <div className="mb-4">
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-xs font-semibold tracking-wider text-stone-500 uppercase">{label}</span>
        <span className="text-xs font-mono text-[#0a7d4a] font-semibold">
          {value !== null && pctLabel ? `${formatValue(value)} · ${pctLabel}` : pctLabel ?? ""}
        </span>
      </div>
      <div className="relative h-5 bg-stone-100 rounded overflow-hidden">
        <div
          className={cn("absolute top-0 bottom-0 rounded", bgColor)}
          style={{ left: `${p25X}%`, width: `${p75X - p25X}%` }}
        />
        <div className="absolute top-0 bottom-0 w-px bg-stone-400" style={{ left: `${medianX}%` }} />
        {markerX !== null && (
          <div
            className="absolute top-0 bottom-0 w-1 bg-[#0a7d4a] rounded-full"
            style={{ left: `${markerX}%`, transform: "translateX(-50%)" }}
          />
        )}
      </div>
      <div className="flex justify-between text-[10px] text-stone-400 mt-0.5 font-mono">
        <span>$0</span>
        <span>median {formatValue(p50)}</span>
        <span>{formatValue(cap)}+</span>
      </div>
      {!value && (
        <p className="text-[10px] text-stone-400 mt-0.5">Enter a value above to see your position</p>
      )}
    </div>
  );
}
