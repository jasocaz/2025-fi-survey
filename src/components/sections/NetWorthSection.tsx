"use client";
import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
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

function buildDebtComposition(rows: SurveyResponse[]) {
  const labels: Array<[string, (r: SurveyResponse) => number | null]> = [
    ["Mortgage", (r) => r.debts.mortgage],
    ["Student Loans", (r) => r.debts.student],
    ["Auto", (r) => r.debts.auto],
    ["Cards", (r) => r.debts.cards],
    ["Medical", (r) => r.debts.medical],
    ["Other", (r) => r.debts.other],
  ];
  return labels.map(([name, getter]) => {
    const vals = rows.map(getter).filter((v): v is number => v !== null && v > 0);
    const sorted = [...vals].sort((a, b) => a - b);
    return { name, count: vals.length, median: sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0 };
  }).filter((d) => d.median > 0);
}

const ASSET_COLORS: Record<string, string> = {
  "Retirement": "#0a7d4a",
  "Taxable": "#5fb085",
  "Primary Home": "#0a5530",
  "Cash": "#b2dcc4",
  "Other": "#e0d9c5",
};
const DEBT_COLORS = ["#0a5530","#0a7d4a","#5fb085","#b2dcc4","#d6eedf","#e8e5db"];

function AssetPie({ rows }: { rows: SurveyResponse[] }) {
  const [selectedAge, setSelectedAge] = useState<string>("All");
  const ages = ["All", ...AGE_BRACKETS];

  const subset = selectedAge === "All" ? rows : rows.filter((r) => r.age_bracket === selectedAge);
  const avg = (getter: (r: SurveyResponse) => number | null) => {
    const vals = subset.map(getter).filter((v): v is number => v !== null);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  };
  const total = avg((r) => r.assets.total) || 1;

  const pieces = [
    { name: "Retirement", value: Math.round(avg((r) => r.assets.retirement) / total * 100) },
    { name: "Taxable", value: Math.round(avg((r) => r.assets.taxable) / total * 100) },
    { name: "Primary Home", value: Math.round(avg((r) => r.assets.primary_residence) / total * 100) },
    { name: "Cash", value: Math.round(avg((r) => r.assets.cash) / total * 100) },
    { name: "Other", value: Math.round((avg((r) => r.assets.speculative) + avg((r) => r.assets.properties) + avg((r) => r.assets.other)) / total * 100) },
  ].filter((d) => d.value > 0);

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <h3 className="text-sm font-semibold text-stone-700">Asset composition</h3>
        <select
          value={selectedAge}
          onChange={(e) => setSelectedAge(e.target.value)}
          className="text-xs border border-stone-200 rounded px-2 py-1 text-stone-600 bg-white focus:outline-none focus:border-[#0a7d4a]"
        >
          {ages.map((a) => <option key={a} value={a}>{a === "All" ? "All ages" : `Age ${a}`}</option>)}
        </select>
      </div>
      <div className="flex items-center gap-8">
        <PieChart width={180} height={180}>
          <Pie data={pieces} cx={85} cy={85} innerRadius={46} outerRadius={80} paddingAngle={2} dataKey="value">
            {pieces.map((d) => <Cell key={d.name} fill={ASSET_COLORS[d.name] ?? "#ccc"} />)}
          </Pie>
          <Tooltip formatter={(v) => [`${v}%`, ""]} contentStyle={{ fontSize: 12, borderColor: "#e6e3d9" }} />
        </PieChart>
        <ul className="text-xs space-y-2">
          {pieces.map((d) => (
            <li key={d.name} className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm inline-block flex-shrink-0" style={{ background: ASSET_COLORS[d.name] ?? "#ccc" }} />
              <span className="text-stone-600">{d.name}</span>
              <span className="font-mono font-semibold text-stone-800 ml-1">{d.value}%</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
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
  const debtComp = buildDebtComposition(rows);

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
      <p className="text-xs font-semibold tracking-widest text-stone-400 uppercase mb-1">§03</p>
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

      {/* Asset composition pie */}
      <AssetPie rows={rows} />

      {/* % to FI */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-stone-700 mb-3">% of FI target achieved, by age</h3>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={pctToFIData} margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0ede6" vertical={false} />
            <XAxis dataKey="bracket" tick={{ fontSize: 10, fill: "#78716c" }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={(v) => `${v}%`} domain={[0, 100]} tick={{ fontSize: 10, fill: "#78716c" }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v) => [`${Number(v).toFixed(0)}%`, "median % to FI"]} contentStyle={{ fontSize: 12, borderColor: "#e6e3d9" }} />
            <Bar dataKey="median" fill="#0a7d4a" radius={[3, 3, 0, 0]} maxBarSize={48} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Debt section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-semibold text-stone-700 mb-1">Total debt by age</h3>
          <p className="text-xs text-stone-400 mb-3">Among those with any debt · linear scale · most debt is mortgage.</p>
          <WhiskerChart data={debtData} logScale={false} visitorValue={visitorDebt} visitorBracket={visitorAgeBracket} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-stone-700 mb-1">Debt composition (median per type)</h3>
          <p className="text-xs text-stone-400 mb-3">Mortgage dominates. Cards and medical are negligible at these income levels.</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={debtComp} layout="vertical" margin={{ top: 0, right: 20, left: 80, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ede6" horizontal={false} />
              <XAxis type="number" tickFormatter={(v) => formatDollar(v, true)} tick={{ fontSize: 10, fill: "#78716c" }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#44403c" }} axisLine={false} tickLine={false} width={80} />
              <Tooltip formatter={(v) => [formatDollar(Number(v)), "median"]} contentStyle={{ fontSize: 12, borderColor: "#e6e3d9" }} />
              <Bar dataKey="median" radius={[0, 3, 3, 0]} maxBarSize={24}>
                {debtComp.map((_, i) => <Cell key={i} fill={DEBT_COLORS[i % DEBT_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
