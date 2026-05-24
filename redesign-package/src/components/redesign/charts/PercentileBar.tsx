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
  const p50 = sorted[Math.floor(sorted.length * 0.5)];
  const p75 = sorted[Math.floor(sorted.length * 0.75)];
  const p99 = sorted[Math.floor(sorted.length * 0.99)];
  const cap = p99;

  const toX = (v: number) => Math.min(100, (v / cap) * 100);
  const markerX = value !== null ? toX(value) : null;
  const medianX = toX(p50);
  const p25X = toX(p25);
  const p75X = toX(p75);

  const pctLabel =
    percentile !== null
      ? lowerIsBetter
        ? `less debt than ${100 - percentile}%`
        : ordinal(percentile) + " pct"
      : null;

  return (
    <div className="mb-5">
      <div className="flex justify-between items-baseline mb-1.5">
        <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--slate-500)]">
          {label}
        </span>
        <span className="text-[11px] font-mono font-medium text-[var(--brand)]">
          {value !== null && pctLabel ? `${formatValue(value)} · ${pctLabel}` : pctLabel ?? ""}
        </span>
      </div>
      <div
        className="relative h-5 rounded overflow-hidden"
        style={{ background: "var(--slate-050)" }}
      >
        {/* p25–p75 band */}
        <div
          className={cn("absolute top-0 bottom-0 rounded")}
          style={{
            left: `${p25X}%`,
            width: `${p75X - p25X}%`,
            background: lowerIsBetter ? "rgba(99, 91, 255, 0.18)" : "var(--brand-soft)",
          }}
        />
        {/* median tick */}
        <div
          className="absolute top-0 bottom-0 w-px"
          style={{ left: `${medianX}%`, background: "var(--slate-400)" }}
        />
        {/* visitor marker */}
        {markerX !== null && (
          <div
            className="absolute top-0 bottom-0 w-1 rounded-full"
            style={{
              left: `${markerX}%`,
              transform: "translateX(-50%)",
              background: "var(--brand)",
            }}
          />
        )}
      </div>
      <div className="flex justify-between text-[10px] text-[var(--slate-400)] mt-1 font-mono">
        <span>$0</span>
        <span>median {formatValue(p50)}</span>
        <span>{formatValue(cap)}+</span>
      </div>
      {!value && (
        <p className="text-[10px] text-[var(--slate-400)] mt-1">
          Enter a value above to see your position
        </p>
      )}
    </div>
  );
}
