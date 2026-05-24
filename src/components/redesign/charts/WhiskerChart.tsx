"use client";
import { useState, useRef, useEffect } from "react";
import { formatDollar } from "@/lib/percentile";
import { CHART, BRAND } from "@/lib/redesign/theme";

interface BoxDatum {
  bracket: string;
  count: number;
  p25: number | null;
  p50: number | null;
  p75: number | null;
  p90: number | null;
}

interface Props {
  data: BoxDatum[];
  visitorValue?: number | null;
  visitorBracket?: string | null;
  logScale?: boolean;
  compact?: boolean;
}

const LOG_TICKS = [1000, 5000, 10000, 50000, 100000, 250000, 500000, 1000000, 2000000, 5000000, 10000000];

function formatTick(v: number) {
  if (v >= 1_000_000) return `$${(v / 1_000_000) % 1 === 0 ? v / 1_000_000 : (v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${Math.round(v / 1_000)}k`;
  return `$${v}`;
}

export function WhiskerChart({ data, visitorValue, visitorBracket, logScale = true, compact = false }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  const [hovered, setHovered] = useState<BoxDatum | null>(null);
  const [hoverX, setHoverX] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const margin = compact
    ? { top: 18, right: 8, left: 44, bottom: 44 }
    : { top: 24, right: 20, left: 60, bottom: 44 };
  const svgH = compact ? 200 : 300;
  const plotW = width - margin.left - margin.right;
  const plotH = svgH - margin.top - margin.bottom;

  const valid = data.filter((d) => d.count > 0 && d.p50 != null && d.p50 > 0);
  if (!valid.length)
    return (
      <div
        className="flex items-center justify-center text-sm text-slate-400"
        style={{ height: svgH }}
      >
        No data
      </div>
    );

  const allVals = valid.flatMap((d) => [d.p25, d.p50, d.p75].filter((v): v is number => v != null && v > 0));
  const rawMin = Math.min(...allVals);
  const rawMax = Math.max(...allVals);

  const logMinBound = Math.log10(Math.max(rawMin * 0.6, 1));
  const logMaxBound = Math.log10(rawMax * 1.5);

  const toY = (v: number): number => {
    if (v <= 0) return plotH;
    if (logScale) {
      const lv = Math.log10(v);
      return plotH - ((lv - logMinBound) / (logMaxBound - logMinBound)) * plotH;
    }
    return plotH - (v / (rawMax * 1.4)) * plotH;
  };

  const yTicks = logScale
    ? LOG_TICKS.filter((v) => v >= rawMin * 0.5 && v <= rawMax * 1.6)
    : Array.from({ length: 6 }, (_, i) => Math.round((rawMax * 1.4) / 5) * i).filter((v) => v > 0);

  const step = plotW / valid.length;
  const boxW = Math.min(52, step * 0.54);
  const toX = (i: number) => step * i + step / 2;

  return (
    <div ref={containerRef} className="w-full relative select-none">
      <svg width={width} height={svgH}>
        <g transform={`translate(${margin.left},${margin.top})`}>
          {yTicks.map((tick) => (
            <line
              key={tick}
              x1={0}
              y1={toY(tick)}
              x2={plotW}
              y2={toY(tick)}
              stroke={CHART.gridline}
              strokeDasharray={CHART.gridlineDashed}
              strokeWidth={1}
            />
          ))}
          {yTicks.map((tick) => (
            <text
              key={tick}
              x={-8}
              y={toY(tick)}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize={11}
              fill={CHART.axisLabel}
            >
              {formatTick(tick)}
            </text>
          ))}

          {valid.map((d, i) => {
            const cx = toX(i);
            const y50 = toY(d.p50!);
            const y25 = d.p25 && d.p25 > 0 ? toY(d.p25) : y50 + 4;
            const y75 = d.p75 && d.p75 > 0 ? toY(d.p75) : y50 - 4;
            const boxTop = Math.min(y75, y25);
            const boxBot = Math.max(y75, y25);
            const isVis = d.bracket === visitorBracket;
            const visY = isVis && visitorValue && visitorValue > 0 ? toY(visitorValue) : null;

            return (
              <g
                key={d.bracket}
                onMouseEnter={() => {
                  setHovered(d);
                  setHoverX(cx);
                }}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: "default" }}
              >
                <rect
                  x={cx - boxW / 2}
                  y={boxTop}
                  width={boxW}
                  height={Math.max(3, boxBot - boxTop)}
                  fill={CHART.band}
                  rx={3}
                />
                <line
                  x1={cx - boxW / 2}
                  y1={y50}
                  x2={cx + boxW / 2}
                  y2={y50}
                  stroke={BRAND.green}
                  strokeWidth={2.5}
                />
                {visY != null && (
                  <>
                    <circle cx={cx} cy={visY} r={5} fill={CHART.visitor} stroke="white" strokeWidth={1.5} />
                    <text
                      x={cx + 9}
                      y={visY - 1}
                      fontSize={10}
                      fill={BRAND.greenDark}
                      fontWeight={700}
                      dominantBaseline="middle"
                    >
                      YOU · {formatDollar(visitorValue!, true)}
                    </text>
                  </>
                )}
              </g>
            );
          })}

          {valid.map((d, i) => {
            const x = toX(i);
            const y = plotH + 14;
            return (
              <text
                key={d.bracket}
                x={x}
                y={y}
                textAnchor="end"
                fontSize={11}
                fill={CHART.axisLabel}
                transform={`rotate(-35 ${x} ${y})`}
              >
                {d.bracket}
              </text>
            );
          })}
        </g>
      </svg>

      {hovered && (
        <div
          className="absolute pointer-events-none rounded-lg p-3 text-xs shadow-lg z-10 min-w-[160px]"
          style={{
            left: hoverX + margin.left - 80,
            top: margin.top + 8,
            background: CHART.tooltipBg,
            border: `1px solid ${CHART.tooltipBorder}`,
          }}
        >
          <p className="font-medium text-foreground mb-1">Age {hovered.bracket}</p>
          <p className="text-slate-400 mb-1.5">n = {hovered.count}</p>
          <p className="text-slate-600">
            Median:{" "}
            <span className="font-mono font-medium text-foreground">
              {formatDollar(hovered.p50!)}
            </span>
          </p>
          <p className="text-slate-500">
            25th–75th:{" "}
            <span className="font-mono">
              {hovered.p25 ? formatDollar(hovered.p25) : "—"} –{" "}
              {hovered.p75 ? formatDollar(hovered.p75) : "—"}
            </span>
          </p>
        </div>
      )}

      <div className="flex items-center gap-5 mt-3 text-[11px] text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-7 h-3 rounded" style={{ background: CHART.band }} />
          25th–75th percentile
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-7 border-t-2" style={{ borderColor: BRAND.green }} />
          median
        </span>
      </div>
    </div>
  );
}
