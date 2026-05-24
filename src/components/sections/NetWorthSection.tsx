"use client";
import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { WhiskerChart } from "@/components/charts/WhiskerChart";
import { percentileValue, formatDollar } from "@/lib/percentile";
import { AGE_BRACKETS } from "@/lib/types";
import type { SurveyResponse, Precomputed } from "@/lib/types";

function pct(sorted: number[], p: number) { return sorted.length ? percentileValue(sorted, p) : null; }

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

const ASSET_COLORS: Record<string, string> = {
  Retirement: "#0a7d4a",
  Taxable: "#5fb085",
  "Primary Home": "#0a5530",
  Cash: "#b2dcc4",
  Other: "#e0d9c5",
};

const DEBT_COLORS: Record<string, string> = {
  Mortgage: "#0a5530",
  "Student loans": "#0a7d4a",
  Auto: "#5fb085",
  "Credit cards": "#b2dcc4",
  Medical: "#d6eedf",
  Other: "#e0d9c5",
};

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
      <div className="flex items-center gap-3 mb-3">
        <h3 className="text-sm font-semibold text-stone-700">{title}</h3>
        <select
          value={selectedAge}
          onChange={(e) => setSelectedAge(e.target.value)}
          className="text-xs border border-stone-200 rounded px-2 py-1 text-stone-600 bg-white focus:outline-none focus:border-[#0a7d4a]"
        >
          {ages.map((a) => <option key={a} value={a}>{a === "All" ? "All ages" : `Age ${a}`}</option>)}
        </select>
      </div>
      <div className="flex items-center gap-6">
        <PieChart width={160} height={160}>
          <Pie data={pieces} cx={75} cy={75} innerRadius={40} outerRadius={72} paddingAngle={2} dataKey="value">
            {pieces.map((d) => <Cell key={d.name} fill={colors[d.name] ?? "#ccc"} />)}
          </Pie>
          <Tooltip formatter={(v) => [`${v}%`, ""]} contentStyle={{ fontSize: 12, borderColor: "#e6e3d9" }} />
        </PieChart>
        <ul className="text-xs space-y-1.5">
          {pieces.map((d) => (
            <li key={d.name} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm inline-block flex-shrink-0" style={{ background: colors[d.name] ?? "#ccc" }} />
              <span className="text-stone-600">{d.name}</span>
              <span className="font-mono font-semibold text-stone-800 ml-1">{d.value}%</span>
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
    { name: "Retirement", value: Math.round(avg((r) => r.assets.retirement) / total * 100) },
    { name: "Taxable", value: Math.round(avg((r) => r.assets.taxable) / total * 100) },
    { name: "Primary Home", value: Math.round(avg((r) => r.assets.primary_residence) / total * 100) },
    { name: "Cash", value: Math.round(avg((r) => r.assets.cash) / total * 100) },
    { name: "Other", value: Math.round((avg((r) => r.assets.speculative) + avg((r) => r.assets.properties) + avg((r) => r.assets.other)) / total * 100) },
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
  return Object.entries(totals).map(([name, val]) => ({ name, value: Math.round(val / grandTotal * 100) }));
}

export function NetWorthSection({ rows, precomputed: _pc, visitorNW, visitorDebt, visitorAgeBracket }: {
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
    <section className="max-w-7xl mx-auto px-6 py-8 border-t border-stone-100">
      <p className="text-xs font-semibold tracking-widest text-stone-500 uppercase mb-1">§03</p>
      <h2 className="font-serif text-3xl font-semibold text-stone-900 mb-2">Net worth, assets &amp; debt</h2>
      <p className="text-stone-500 mb-6 text-sm">
        Median net worth by age bracket · 25th–75th percentile shaded · {logScale ? "log scale" : "linear scale"}
        {visitorNW && <> · <span className="text-[#0a7d4a] font-medium">your value marked on chart</span></>}
      </p>

      {/* NW Whisker */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-semibold text-stone-700">Where the curve actually bends</h3>
          <button onClick={() => setLogScale(!logScale)} className="text-xs text-[#0a7d4a] font-semibold hover:underline">
            {logScale ? "Linear" : "Log"} scale
          </button>
        </div>
        <WhiskerChart data={nwData} logScale={logScale} visitorValue={visitorNW} visitorBracket={visitorAgeBracket} />
      </div>

      {/* Asset pie + % to FI side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <AgePieSelector
          title="Asset composition"
          rows={rows}
          getPieces={getAssetPieces}
          colors={ASSET_COLORS}
        />
        <div>
          <h3 className="text-sm font-semibold text-stone-700 mb-3">% of FI target achieved, by age</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={pctToFIData} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ede6" vertical={false} />
              <XAxis dataKey="bracket" tick={{ fontSize: 10, fill: "#78716c" }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => `${v}%`} domain={[0, 100]} tick={{ fontSize: 10, fill: "#78716c" }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => [`${Number(v).toFixed(0)}%`, "median % to FI"]} contentStyle={{ fontSize: 12, borderColor: "#e6e3d9" }} />
              <Bar dataKey="median" fill="#0a7d4a" radius={[3, 3, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Debt: whisker + pie side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h3 className="text-sm font-semibold text-stone-700 mb-1">Total debt by age</h3>
          <p className="text-xs text-stone-400 mb-3">Among those with any debt · linear scale.</p>
          <WhiskerChart data={debtData} logScale={false} visitorValue={visitorDebt} visitorBracket={visitorAgeBracket} />
        </div>
        <AgePieSelector
          title="Debt composition"
          rows={rows}
          getPieces={getDebtPieces}
          colors={DEBT_COLORS}
        />
      </div>
    </section>
  );
}
