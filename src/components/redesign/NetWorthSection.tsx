"use client";
import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { WhiskerChart } from "./charts/WhiskerChart";
import { percentileValue } from "@/lib/percentile";
import { AGE_BRACKETS } from "@/lib/types";
import type { SurveyResponse, Precomputed } from "@/lib/types";
import { SectionHeader } from "./SectionHeader";
import { CHART, BRAND, ASSET_COLORS, DEBT_COLORS } from "@/lib/redesign/theme";

function pct(sorted: number[], p: number) {
  return sorted.length ? percentileValue(sorted, p) : null;
}

function buildWhiskerData(rows: SurveyResponse[]) {
  return AGE_BRACKETS.map((bracket) => {
    const vals = rows
      .filter((r) => r.age_bracket === bracket && r.assets.total !== null)
      .map((r) => r.assets.total as number)
      .sort((a, b) => a - b);
    return { bracket, count: vals.length, p25: pct(vals, 25), p50: pct(vals, 50), p75: pct(vals, 75), p90: pct(vals, 90) };
  });
}

function buildDebtWhiskerData(rows: SurveyResponse[]) {
  return AGE_BRACKETS.map((bracket) => {
    const vals = rows
      .filter((r) => r.age_bracket === bracket && r.debts.total !== null && r.debts.total > 0)
      .map((r) => r.debts.total as number)
      .sort((a, b) => a - b);
    return { bracket, count: vals.length, p25: pct(vals, 25), p50: pct(vals, 50), p75: pct(vals, 75), p90: pct(vals, 90) };
  });
}

function AgePieSelector({
  title,
  rows,
  getPieces,
  colors,
}: {
  title: string;
  rows: SurveyResponse[];
  getPieces: (subset: SurveyResponse[]) => { name: string; value: number }[];
  colors: Record<string, string>;
}) {
  const [selectedAge, setSelectedAge] = useState<string>("All");
  const ages = ["All", ...AGE_BRACKETS];
  const subset = selectedAge === "All" ? rows : rows.filter((r) => r.age_bracket === selectedAge);
  const pieces = getPieces(subset).filter((d) => d.value > 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-3 gap-3">
        <h3 className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--slate-500)]">
          {title}
        </h3>
        <select
          value={selectedAge}
          onChange={(e) => setSelectedAge(e.target.value)}
          className="text-xs border border-[var(--slate-050)] rounded px-2 py-1 text-[var(--slate-600)] bg-white focus:outline-none focus:border-[var(--brand)]"
        >
          {ages.map((a) => (
            <option key={a} value={a}>
              {a === "All" ? "All ages" : `Age ${a}`}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-6">
        <PieChart width={160} height={160}>
          <Pie data={pieces} cx={75} cy={75} innerRadius={40} outerRadius={72} paddingAngle={2} dataKey="value">
            {pieces.map((d) => (
              <Cell key={d.name} fill={colors[d.name] ?? CHART.primaryMuted} />
            ))}
          </Pie>
          <Tooltip
            formatter={(v) => [`${v}%`, ""]}
            contentStyle={{ fontSize: 12, borderColor: CHART.tooltipBorder, borderRadius: 8 }}
          />
        </PieChart>
        <ul className="text-xs space-y-1.5">
          {pieces.map((d) => (
            <li key={d.name} className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-sm inline-block flex-shrink-0"
                style={{ background: colors[d.name] ?? CHART.primaryMuted }}
              />
              <span className="text-[var(--slate-600)]">{d.name}</span>
              <span className="font-mono numerics font-medium text-foreground ml-1">{d.value}%</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function getAssetPieces(subset: SurveyResponse[]) {
  const avg = (getter: (r: SurveyResponse) => number | null) => {
    const vals = subset.map(getter).filter((v): v is number => v !== null);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  };
  const total = avg((r) => r.assets.total) || 1;
  return [
    { name: "Retirement", value: Math.round((avg((r) => r.assets.retirement) / total) * 100) },
    { name: "Taxable", value: Math.round((avg((r) => r.assets.taxable) / total) * 100) },
    { name: "Primary Home", value: Math.round((avg((r) => r.assets.primary_residence) / total) * 100) },
    { name: "Cash", value: Math.round((avg((r) => r.assets.cash) / total) * 100) },
    {
      name: "Other",
      value: Math.round(
        ((avg((r) => r.assets.speculative) + avg((r) => r.assets.properties) + avg((r) => r.assets.other)) / total) * 100,
      ),
    },
  ];
}

function getDebtPieces(subset: SurveyResponse[]) {
  const withDebt = subset.filter((r) => r.debts.total !== null && r.debts.total > 0);
  const sum = (getter: (r: SurveyResponse) => number | null) =>
    withDebt.map(getter).filter((v): v is number => v !== null && v > 0).reduce((a, b) => a + b, 0);
  const totals = {
    Mortgage: sum((r) => r.debts.mortgage),
    "Student loans": sum((r) => r.debts.student),
    Auto: sum((r) => r.debts.auto),
    "Credit cards": sum((r) => r.debts.cards),
    Medical: sum((r) => r.debts.medical),
    Other: sum((r) => r.debts.other),
  };
  const grandTotal = Object.values(totals).reduce((a, b) => a + b, 0) || 1;
  return Object.entries(totals).map(([name, val]) => ({ name, value: Math.round((val / grandTotal) * 100) }));
}

export function NetWorthSection({
  rows,
  visitorNW,
  visitorDebt,
  visitorAgeBracket,
}: {
  rows: SurveyResponse[];
  precomputed: Precomputed;
  visitorNW?: number | null;
  visitorDebt?: number | null;
  visitorAgeBracket?: string;
}) {
  const [logScale, setLogScale] = useState(true);

  const nwData = buildWhiskerData(rows);
  const debtData = buildDebtWhiskerData(rows);

  const pctToFIData = AGE_BRACKETS.map((bracket) => {
    const vals = rows
      .filter((r) => r.age_bracket === bracket && r.pct_to_fi !== null)
      .map((r) => r.pct_to_fi as number);
    if (!vals.length) return null;
    const sorted = [...vals].sort((a, b) => a - b);
    return { bracket, median: pct(sorted, 50) };
  }).filter(Boolean) as { bracket: string; median: number | null }[];

  return (
    <section data-section id="networth">
      <SectionHeader
        number="03"
        eyebrow="Where they stand"
        title="Net worth, assets, and debt."
        lede={
          <>
            Median household net worth by age. The shaded band shows the 25th–75th percentile —
            on log scale, the spread widens through the 40s as compounding takes over.
            {visitorNW != null && (
              <>
                {" "}
                <span className="text-[var(--brand)] font-medium">Your value is marked on the chart.</span>
              </>
            )}
          </>
        }
      />

      {/* Module 1: NW whisker */}
      <div className="bg-white border border-[var(--slate-050)] rounded-xl p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-[13px] font-medium text-foreground">
            Median household net worth by age{" "}
            <span className="text-[var(--slate-400)] font-normal">· {logScale ? "log scale" : "linear scale"}</span>
          </h3>
          <button
            onClick={() => setLogScale(!logScale)}
            className="text-[11px] font-medium text-[var(--brand)] hover:underline"
          >
            Switch to {logScale ? "linear" : "log"}
          </button>
        </div>
        <WhiskerChart data={nwData} logScale={logScale} visitorValue={visitorNW} visitorBracket={visitorAgeBracket} />
      </div>

      {/* Module 2: Asset composition + % to FI by age */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white border border-[var(--slate-050)] rounded-xl p-6">
          <AgePieSelector title="Asset composition" rows={rows} getPieces={getAssetPieces} colors={ASSET_COLORS} />
        </div>
        <div className="bg-white border border-[var(--slate-050)] rounded-xl p-6">
          <h3 className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--slate-500)] mb-3">
            % of FI target achieved, by age
          </h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={pctToFIData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray={CHART.gridlineDashed} stroke={CHART.gridline} vertical={false} />
              <XAxis dataKey="bracket" tick={{ fontSize: 11, fill: CHART.axisLabel }} axisLine={false} tickLine={false} />
              <YAxis
                tickFormatter={(v) => `${v}%`}
                domain={[0, 100]}
                tick={{ fontSize: 11, fill: CHART.axisLabel }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(v) => [`${Number(v).toFixed(0)}%`, "median % to FI"]}
                contentStyle={{ fontSize: 12, borderColor: CHART.tooltipBorder, borderRadius: 8 }}
              />
              <Bar dataKey="median" fill={BRAND.green} radius={[3, 3, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Module 3: Debt whisker + composition */}
      <div className="bg-white border border-[var(--slate-050)] rounded-xl p-6">
        <h3 className="text-[13px] font-medium text-foreground mb-1">Debt by age</h3>
        <p className="text-[12px] text-[var(--slate-400)] mb-5">
          Among households reporting any debt · linear scale.
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-8 items-start">
          <WhiskerChart
            data={debtData}
            logScale={false}
            visitorValue={visitorDebt}
            visitorBracket={visitorAgeBracket}
          />
          <AgePieSelector title="Debt composition" rows={rows} getPieces={getDebtPieces} colors={DEBT_COLORS} />
        </div>
      </div>
    </section>
  );
}
