"use client";
import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";
import type { SurveyResponse } from "@/lib/types";

type MacroKey = "impact_climate" | "impact_inflation" | "impact_political" | "impact_tech" | "impact_personal";

const MACROS: Array<{ key: MacroKey; label: string }> = [
  { key: "impact_inflation", label: "Inflation / recession" },
  { key: "impact_political", label: "Political instability" },
  { key: "impact_tech", label: "Technology / AI" },
  { key: "impact_personal", label: "Personal health" },
  { key: "impact_climate", label: "Climate change" },
];

function buildDivergingData(
  rows: SurveyResponse[],
  mode: "number" | "date",
) {
  return MACROS.map(({ key, label }) => {
    const n = rows.length;
    const impacts = rows.map((r) => r[key]);
    const incToken = mode === "number" ? "inc_num" : "inc_date";
    const decToken = mode === "number" ? "dec_num" : "dec_date";

    const raised = impacts.filter((arr) => arr.includes(incToken)).length;
    const lowered = impacts.filter((arr) => arr.includes(decToken)).length;
    const noChange = impacts.filter((arr) => arr.includes("no_change")).length;

    return {
      label,
      raised: Math.round((raised / n) * 100),
      lowered: -Math.round((lowered / n) * 100),
      noChange: Math.round((noChange / n) * 100),
      raisedCount: raised,
      loweredCount: lowered,
    };
  });
}

export function MacroMoodSection({ rows }: { rows: SurveyResponse[] }) {
  const [mode, setMode] = useState<"number" | "date">("number");

  const data = buildDivergingData(rows, mode);

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number }[]; label?: string }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white border border-stone-200 rounded p-3 text-xs shadow-lg max-w-xs">
        <p className="font-semibold mb-2">{label}</p>
        {payload.map((p) => (
          <p key={p.name} className={p.value > 0 ? "text-red-600" : p.value < 0 ? "text-emerald-600" : "text-stone-500"}>
            {p.name}: {Math.abs(p.value)}%
          </p>
        ))}
      </div>
    );
  };

  return (
    <section className="max-w-7xl mx-auto px-6 py-8 border-t border-stone-100">
      <p className="text-xs font-semibold tracking-widest text-stone-600 uppercase mb-1">§06</p>
      <h2 className="font-serif text-3xl font-semibold text-stone-900 mb-2">
        Inflation and politics, in that order
      </h2>
      <p className="text-stone-500 mb-6 text-sm">
        % of respondents who said each factor changed their FI {mode === "number" ? "number" : "planned retirement date"}.
        Positive = raised it. Negative = lowered it.
      </p>

      {/* Tab toggle */}
      <div className="flex gap-2 mb-6">
        {([["number", "Impact on FI number"], ["date", "Impact on RE date"]] as const).map(([val, label]) => (
          <button
            key={val}
            onClick={() => setMode(val)}
            className={`text-xs px-4 py-1.5 rounded-full border transition-colors ${mode === val ? "bg-[#0a7d4a] text-white border-[#0a7d4a]" : "border-stone-200 text-stone-500 hover:border-[#0a7d4a]"}`}
          >
            {label}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 60, left: 140, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0ede6" horizontal={false} />
          <XAxis
            type="number"
            tickFormatter={(v) => `${Math.abs(v)}%`}
            tick={{ fontSize: 10, fill: "#78716c" }}
            axisLine={false}
            tickLine={false}
            domain={[-15, 60]}
          />
          <YAxis
            type="category"
            dataKey="label"
            tick={{ fontSize: 12, fill: "#44403c", fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
            width={138}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine x={0} stroke="#d6d3cb" strokeWidth={2} />
          <Bar dataKey="lowered" name="Lowered it" stackId="a" fill="#5fb085" radius={[0, 0, 0, 0]} maxBarSize={36} />
          <Bar dataKey="raised" name="Raised it" stackId="a" fill="#c4503c" radius={[0, 3, 3, 0]} maxBarSize={36}>
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Callout */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        {data.map((d) => (
          <div key={d.label} className="p-3 bg-stone-50 rounded-lg text-xs">
            <p className="font-semibold text-stone-700 mb-1">{d.label}</p>
            <p className="text-red-600">{d.raised}% raised</p>
            <p className="text-emerald-600">{Math.abs(d.lowered)}% lowered</p>
            <p className="text-stone-400">{100 - d.raised - Math.abs(d.lowered)}% no change</p>
          </div>
        ))}
      </div>
    </section>
  );
}
