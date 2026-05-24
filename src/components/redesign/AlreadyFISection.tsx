"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, PieChart, Pie, Cell } from "recharts";
import { formatDollar, median } from "@/lib/percentile";
import type { SurveyResponse } from "@/lib/types";
import { SectionHeader } from "./SectionHeader";
import { CHART, BRAND } from "@/lib/redesign/theme";

export function AlreadyFISection({ rows }: { rows: SurveyResponse[] }) {
  const fiRows = rows.filter((r) => r.is_fi);
  const reRows = rows.filter((r) => r.is_re);
  const n = fiRows.length;
  const total = rows.length;
  const pctFI = total ? Math.round((n / total) * 100) : 0;
  if (n === 0) return null;

  const fiNW = fiRows.map((r) => r.assets.total).filter((v): v is number => v !== null);
  const nonFiNW = rows.filter((r) => !r.is_fi).map((r) => r.assets.total).filter((v): v is number => v !== null);
  const medFiNW = median(fiNW);
  const medNonFiNW = median(nonFiNW);

  const swrVals = reRows.map((r) => r.actual_swr).filter((v): v is number => v !== null && v > 0 && v <= 15);
  const swrBuckets: Record<string, number> = {};
  swrVals.forEach((v) => {
    const b = (Math.round(v * 2) / 2).toFixed(1);
    swrBuckets[b] = (swrBuckets[b] ?? 0) + 1;
  });
  const swrData = Object.entries(swrBuckets)
    .map(([swr, count]) => ({ swr: `${swr}%`, count }))
    .sort((a, b) => parseFloat(a.swr) - parseFloat(b.swr));

  const targetSWRs = fiRows.map((r) => r.target_swr).filter((v): v is number => v !== null && v > 0 && v <= 10);
  const medTargetSWR = median(targetSWRs);
  const medActualSWR = median(swrVals);
  const medActualSWRBin = medActualSWR !== null ? `${(Math.round(medActualSWR * 2) / 2).toFixed(1)}%` : null;

  const wdData = [
    { name: "Less than planned", value: reRows.filter((r) => r.withdrawal_vs_plan === "less").length, color: BRAND.green },
    { name: "About right", value: reRows.filter((r) => r.withdrawal_vs_plan === "right").length, color: BRAND.greenLight },
    { name: "More than planned", value: reRows.filter((r) => r.withdrawal_vs_plan === "more").length, color: "#FF8A65" },
  ].filter((d) => d.value > 0);

  return (
    <section data-section id="already-fi">
      <SectionHeader
        number="08"
        eyebrow="The cohort"
        title={`${pctFI}% of the community has already arrived.`}
        lede={
          <>
            {pctFI}% of respondents say they&apos;re financially independent today. The cohort is
            older, holds slightly more bonds, and reports actual withdrawal rates well below the
            4% rule.
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-[0.7fr_1.3fr] gap-6 mb-6">
        {/* Big number card */}
        <div
          className="p-8 rounded-xl text-white flex flex-col justify-between"
          style={{ background: "var(--gradient-navy)" }}
        >
          <div>
            <p className="text-[11px] uppercase tracking-[0.10em] text-white/70 mb-3 font-medium">
              Of respondents
            </p>
            <div className="font-light leading-[0.95] tracking-[-0.035em] text-[clamp(56px,7vw,96px)] numerics">
              {pctFI}
              <span className="text-[0.5em] text-white/60 ml-2 font-normal">%</span>
            </div>
          </div>
          <p className="text-sm text-white/75 mt-6 leading-[1.55]">
            {n.toLocaleString()} respondents identify as financially independent today — able to
            cover expenses from portfolio income indefinitely.
          </p>
          <div className="mt-6 pt-5 border-t border-white/15 grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-[11px] uppercase tracking-[0.08em] text-white/55">Retired</div>
              <div className="text-2xl font-medium font-mono numerics mt-1">{reRows.length.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-[0.08em] text-white/55">Still working</div>
              <div className="text-2xl font-medium font-mono numerics mt-1">
                {(n - reRows.length).toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Comparison table */}
        <div className="bg-white border border-[var(--slate-050)] rounded-xl p-6">
          <h3 className="text-[13px] font-medium text-foreground mb-1">FI cohort vs. pursuing FI</h3>
          <p className="text-[12px] text-[var(--slate-400)] mb-5">
            Median values by group. n = {n} (FI) / {total - n} (not yet).
          </p>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--slate-100)]">
                <th className="text-left text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--slate-400)] pb-3">
                  Metric
                </th>
                <th className="text-right text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--slate-400)] pb-3">
                  Already FI
                </th>
                <th className="text-right text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--slate-400)] pb-3">
                  Not yet FI
                </th>
                <th className="text-right text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--slate-400)] pb-3">
                  Delta
                </th>
              </tr>
            </thead>
            <tbody className="text-foreground">
              <CmpRow
                label="Median net worth"
                fi={medFiNW ? formatDollar(medFiNW, true) : "—"}
                pursuing={medNonFiNW ? formatDollar(medNonFiNW, true) : "—"}
                delta={
                  medFiNW && medNonFiNW
                    ? `+${formatDollar(medFiNW - medNonFiNW, true)}`
                    : "—"
                }
                positive
              />
              <CmpRow
                label="Median target SWR"
                fi={medTargetSWR ? `${medTargetSWR.toFixed(2)}%` : "—"}
                pursuing="—"
                delta="—"
              />
              <CmpRow
                label="Median actual SWR"
                fi={medActualSWR ? `${medActualSWR.toFixed(2)}%` : "—"}
                pursuing="—"
                delta="—"
              />
              <CmpRow
                label="Currently retired"
                fi={`${reRows.length} (${Math.round((reRows.length / n) * 100)}%)`}
                pursuing="—"
                delta="—"
                last
              />
            </tbody>
          </table>
        </div>
      </div>

      {/* Actual SWR + spending vs plan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-[var(--slate-050)] rounded-xl p-6">
          <h3 className="text-[13px] font-medium text-foreground mb-1">Actual withdrawal rate (retirees)</h3>
          <p className="text-[12px] text-[var(--slate-400)] mb-4">
            Most retirees are well below their target. The 4% rule stays comfortably unbreached.
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={swrData} margin={{ top: 28, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray={CHART.gridlineDashed} stroke={CHART.gridline} vertical={false} />
              <XAxis dataKey="swr" tick={{ fontSize: 12, fill: CHART.axisLabel }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: CHART.axisLabel }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(v) => [v, "retirees"]}
                contentStyle={{ fontSize: 12, borderColor: CHART.tooltipBorder, borderRadius: 8 }}
              />
              <Bar dataKey="count" fill={BRAND.green} radius={[3, 3, 0, 0]} maxBarSize={28} />
              {medActualSWRBin && (
                <ReferenceLine
                  x={medActualSWRBin}
                  stroke={BRAND.green}
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                  ifOverflow="extendDomain"
                  label={({ viewBox }) => {
                    const { x = 0, y = 0 } = (viewBox as { x?: number; y?: number }) ?? {};
                    const label = `MEDIAN ${medActualSWR?.toFixed(1)}%`;
                    const w = label.length * 6.5 + 16;
                    return (
                      <g transform={`translate(${x}, ${y - 12})`}>
                        <rect x={-w / 2} y={-16} width={w} height={18} rx={9} fill={BRAND.green} />
                        <text x={0} y={-3} textAnchor="middle" fontSize={10} fontWeight={500} fill="white" letterSpacing="0.04em">
                          {label}
                        </text>
                      </g>
                    );
                  }}
                />
              )}
              <ReferenceLine
                x="4.0%"
                stroke="#FF8A65"
                strokeWidth={2}
                strokeDasharray="4 2"
                label={{ value: "4%", position: "insideTopRight", fontSize: 10, fill: "#C75032", fontWeight: 700 }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border border-[var(--slate-050)] rounded-xl p-6">
          <h3 className="text-[13px] font-medium text-foreground mb-1">Spending vs plan</h3>
          <p className="text-[12px] text-[var(--slate-400)] mb-4">
            More retirees report spending less than planned than spending more — the classic
            &ldquo;one more year&rdquo; effect in action.
          </p>
          <div className="flex items-center gap-6 mt-4">
            <PieChart width={160} height={160}>
              <Pie data={wdData} cx={75} cy={75} innerRadius={45} outerRadius={72} paddingAngle={2} dataKey="value">
                {wdData.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v) => [v, "retirees"]}
                contentStyle={{ fontSize: 12, borderColor: CHART.tooltipBorder, borderRadius: 8 }}
              />
            </PieChart>
            <ul className="text-sm space-y-2">
              {wdData.map((d) => (
                <li key={d.name} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ background: d.color }} />
                  <span className="text-[var(--slate-600)]">{d.name}</span>
                  <span className="font-mono numerics font-medium text-foreground ml-1">{d.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function CmpRow({
  label,
  fi,
  pursuing,
  delta,
  positive,
  last,
}: {
  label: string;
  fi: string;
  pursuing: string;
  delta: string;
  positive?: boolean;
  last?: boolean;
}) {
  const cls = last ? "" : "border-b border-[var(--slate-050)]";
  const deltaColor =
    delta === "—"
      ? "text-[var(--slate-400)]"
      : positive
        ? "text-[var(--brand)]"
        : "text-[#DF1B41]";
  return (
    <tr className={cls}>
      <td className="py-3 text-[var(--slate-600)]">{label}</td>
      <td className="py-3 text-right font-mono numerics font-medium text-[var(--brand)]">{fi}</td>
      <td className="py-3 text-right font-mono numerics text-[var(--slate-600)]">{pursuing}</td>
      <td className={`py-3 text-right font-mono numerics font-medium ${deltaColor}`}>{delta}</td>
    </tr>
  );
}
