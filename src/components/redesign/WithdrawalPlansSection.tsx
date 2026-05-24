"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import type { SurveyResponse } from "@/lib/types";
import { SectionHeader } from "./SectionHeader";
import { CHART, BRAND } from "@/lib/redesign/theme";
import { median } from "@/lib/percentile";

function MedianPill({ x, y, label }: { x?: number; y?: number; label: string }) {
  const px = x ?? 0;
  const py = y ?? 0;
  const w = label.length * 6.5 + 16;
  return (
    <g transform={`translate(${px}, ${py - 12})`}>
      <rect x={-w / 2} y={-16} width={w} height={18} rx={9} fill={BRAND.green} />
      <text x={0} y={-3} textAnchor="middle" fontSize={10} fontWeight={500} fill="white" letterSpacing="0.04em">
        {label}
      </text>
    </g>
  );
}

export function WithdrawalPlansSection({ rows }: { rows: SurveyResponse[] }) {
  const swrVals = rows
    .map((r) => r.target_swr)
    .filter((v): v is number => v !== null && v >= 1 && v <= 6);
  const medSWR = swrVals.length ? median(swrVals) : null;

  const buckets: Record<string, number> = {};
  swrVals.forEach((v) => {
    const b = (Math.round(v * 2) / 2).toFixed(1);
    buckets[b] = (buckets[b] ?? 0) + 1;
  });
  const histData = Object.entries(buckets)
    .map(([swr, count]) => ({ swr: parseFloat(swr), swrLabel: `${swr}%`, count }))
    .sort((a, b) => a.swr - b.swr);

  const medBin = medSWR !== null
    ? `${(Math.round(medSWR * 2) / 2).toFixed(1)}%`
    : null;

  const strategyBuckets = [
    { label: "< 3% (ultra-conservative)", test: (v: number) => v < 3 },
    { label: "3.0 – 3.4% (conservative)", test: (v: number) => v >= 3 && v < 3.5 },
    { label: "3.5% (common target)", test: (v: number) => v >= 3.5 && v < 3.75 },
    { label: "3.75 – 4% (near 4% rule)", test: (v: number) => v >= 3.75 && v < 4.25 },
    { label: "> 4% (flexible/dynamic)", test: (v: number) => v >= 4.25 },
  ];

  const strategyData = strategyBuckets.map(({ label, test }) => ({
    label,
    count: swrVals.filter(test).length,
  }));
  const maxCount = Math.max(...strategyData.map((d) => d.count), 1);

  return (
    <section data-section id="withdrawal">
      <SectionHeader
        number="07"
        eyebrow="Withdrawal plans"
        title={medSWR !== null ? `${medSWR.toFixed(1)}% is the median planned withdrawal rate — below the 4% rule.` : "The community plans to withdraw conservatively."}
        lede={
          <>
            The 4% rule looms large in FI culture, but most respondents plan to pull less. The
            median sits at {medSWR?.toFixed(1) ?? "3.5"}%, reflecting awareness of sequence-of-returns risk.
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-6">
        {/* Bignum card */}
        <div
          className="p-8 rounded-xl text-white flex flex-col justify-between"
          style={{ background: "var(--gradient-navy)" }}
        >
          <div>
            <p
              style={{
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.10em",
                color: "rgba(255,255,255,0.65)",
                marginBottom: 12,
                fontWeight: 500,
              }}
            >
              Median target SWR
            </p>
            <div className="bignum">
              {medSWR !== null ? (
                <>{medSWR.toFixed(1)}<span className="unit">%</span></>
              ) : (
                <>3.5<span className="unit">%</span></>
              )}
            </div>
          </div>
          <div>
            <p
              style={{
                fontSize: 14,
                color: "rgba(255,255,255,0.7)",
                lineHeight: 1.55,
                marginTop: 24,
              }}
            >
              Most of this community targets a conservative withdrawal rate —
              well below the commonly cited 4% rule.
            </p>
            <div
              style={{
                marginTop: 20,
                paddingTop: 16,
                borderTop: "1px solid rgba(255,255,255,0.15)",
              }}
            >
              <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.45)", marginBottom: 4 }}>
                Respondents with SWR target
              </div>
              <div style={{ fontSize: 22, fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>
                {swrVals.length.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* SWR histogram */}
        <div className="bg-white border border-[var(--slate-050)] rounded-xl p-6">
          <h3 className="text-[13px] font-medium text-foreground mb-1">
            Target safe withdrawal rate distribution
          </h3>
          <p className="text-[12px] text-[var(--slate-400)] mb-4">
            Cluster sits below the 4% rule — most targets are 3–3.5%.
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={histData} margin={{ top: 28, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray={CHART.gridlineDashed} stroke={CHART.gridline} vertical={false} />
              <XAxis dataKey="swrLabel" tick={{ fontSize: 11, fill: CHART.axisLabel }} axisLine={false} tickLine={false} interval={1} />
              <YAxis tick={{ fontSize: 11, fill: CHART.axisLabel }} axisLine={false} tickLine={false} width={28} />
              <Tooltip
                formatter={(v) => [v, "respondents"]}
                contentStyle={{ fontSize: 12, borderColor: CHART.tooltipBorder, borderRadius: 8 }}
              />
              <Bar dataKey="count" fill={BRAND.green} radius={[3, 3, 0, 0]} />
              {medBin && (
                <ReferenceLine
                  x={medBin}
                  stroke={BRAND.green}
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                  ifOverflow="extendDomain"
                  label={({ viewBox }) => (
                    <MedianPill
                      x={(viewBox as { x?: number })?.x}
                      y={(viewBox as { y?: number })?.y}
                      label={`MEDIAN ${medSWR?.toFixed(1)}%`}
                    />
                  )}
                />
              )}
              <ReferenceLine
                x="4.0%"
                stroke="#FF8A65"
                strokeWidth={2}
                strokeDasharray="4 2"
                label={{
                  value: "4% rule",
                  position: "insideTopRight",
                  fontSize: 9,
                  fill: "#C75032",
                  fontWeight: 700,
                }}
              />
            </BarChart>
          </ResponsiveContainer>

          {/* Strategy breakdown hbars */}
          <div style={{ marginTop: 24, borderTop: "1px solid var(--slate-050)", paddingTop: 20 }}>
            <p
              style={{
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--slate-400)",
                marginBottom: 12,
                fontWeight: 500,
              }}
            >
              By withdrawal band
            </p>
            {strategyData.map((d) => (
              <div key={d.label} className="hbar">
                <span className="lbl" style={{ fontSize: 12 }}>{d.label}</span>
                <div className="track">
                  <div className="fill" style={{ width: `${(d.count / maxCount) * 100}%` }} />
                </div>
                <span className="val">
                  {swrVals.length > 0 ? `${Math.round((d.count / swrVals.length) * 100)}%` : "—"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
