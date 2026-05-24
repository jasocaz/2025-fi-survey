"use client";
import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import type { SurveyResponse } from "@/lib/types";
import { SectionHeader } from "./SectionHeader";
import { CHART, DIVERGING } from "@/lib/redesign/theme";

type MacroKey = "impact_climate" | "impact_inflation" | "impact_political" | "impact_tech" | "impact_personal";

const MACROS: Array<{ key: MacroKey; label: string }> = [
  { key: "impact_inflation", label: "Inflation / recession" },
  { key: "impact_political", label: "Political instability" },
  { key: "impact_tech", label: "Technology / AI" },
  { key: "impact_personal", label: "Personal health" },
  { key: "impact_climate", label: "Climate change" },
];

function buildDivergingData(rows: SurveyResponse[], mode: "number" | "date") {
  return MACROS.map(({ key, label }) => {
    const n = rows.length;
    const impacts = rows.map((r) => r[key]);
    const incToken = mode === "number" ? "inc_num" : "inc_date";
    const decToken = mode === "number" ? "dec_num" : "dec_date";

    const raised = impacts.filter((arr) => arr.includes(incToken)).length;
    const lowered = impacts.filter((arr) => arr.includes(decToken)).length;

    return {
      label,
      raised: Math.round((raised / n) * 100),
      lowered: -Math.round((lowered / n) * 100),
      raisedCount: raised,
      loweredCount: lowered,
    };
  });
}

const TOGGLE_BASE = "text-[11px] px-3 py-1.5 rounded-full border transition-colors font-medium";

export function MacroMoodSection({ rows }: { rows: SurveyResponse[] }) {
  const [mode, setMode] = useState<"number" | "date">("number");
  const data = buildDivergingData(rows, mode);

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: { name: string; value: number }[];
    label?: string;
  }) => {
    if (!active || !payload?.length) return null;
    return (
      <div
        className="rounded-lg p-3 text-xs shadow-lg max-w-xs"
        style={{ background: CHART.tooltipBg, border: `1px solid ${CHART.tooltipBorder}` }}
      >
        <p className="font-medium mb-2 text-foreground">{label}</p>
        {payload.map((p) => (
          <p
            key={p.name}
            style={{
              color: p.value > 0 ? DIVERGING.raised : p.value < 0 ? DIVERGING.lowered : DIVERGING.neutral,
            }}
          >
            {p.name}: {Math.abs(p.value)}%
          </p>
        ))}
      </div>
    );
  };

  return (
    <section data-section data-alt="true" id="macro">
      <div>
        <SectionHeader
          number="07"
          eyebrow="The mood"
          title="Inflation and politics, in that order."
          lede={
            <>
              Share of respondents who said each factor changed their FI{" "}
              {mode === "number" ? "number" : "planned retirement date"} this year. Positive raised
              it; negative lowered it.
            </>
          }
        />

        <div className="bg-white border border-[var(--slate-050)] rounded-xl p-6">
          <div className="flex gap-2 mb-6">
            {(
              [
                ["number", "Impact on FI number"],
                ["date", "Impact on RE date"],
              ] as const
            ).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setMode(val)}
                className={
                  mode === val
                    ? `${TOGGLE_BASE} bg-[var(--brand)] text-white border-[var(--brand)]`
                    : `${TOGGLE_BASE} border-[var(--slate-050)] text-[var(--slate-500)] hover:border-[var(--brand)]`
                }
              >
                {label}
              </button>
            ))}
          </div>

          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data} layout="vertical" margin={{ top: 0, right: 60, left: 140, bottom: 0 }}>
              <CartesianGrid strokeDasharray={CHART.gridlineDashed} stroke={CHART.gridline} horizontal={false} />
              <XAxis
                type="number"
                tickFormatter={(v) => `${Math.abs(v)}%`}
                tick={{ fontSize: 12, fill: CHART.axisLabel }}
                axisLine={false}
                tickLine={false}
                domain={[-15, 60]}
              />
              <YAxis
                type="category"
                dataKey="label"
                tick={{ fontSize: 12, fill: CHART.axisTitle, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                width={138}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine x={0} stroke={CHART.refLineMuted} strokeWidth={2} />
              <Bar dataKey="lowered" name="Lowered it" stackId="a" fill={DIVERGING.lowered} maxBarSize={32} />
              <Bar dataKey="raised" name="Raised it" stackId="a" fill={DIVERGING.raised} radius={[0, 3, 3, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Mini-stat strip */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-5">
          {data.map((d) => (
            <div
              key={d.label}
              className="p-4 rounded-xl bg-white border border-[var(--slate-050)] text-xs"
            >
              <p className="font-medium text-foreground mb-2">{d.label}</p>
              <p style={{ color: DIVERGING.raised }}>{d.raised}% raised</p>
              <p style={{ color: DIVERGING.lowered }}>{Math.abs(d.lowered)}% lowered</p>
              <p className="text-[var(--slate-400)]">{100 - d.raised - Math.abs(d.lowered)}% no change</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
