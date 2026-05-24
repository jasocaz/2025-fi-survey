"use client";
import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from "recharts";
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
    return {
      bracket,
      count: vals.length,
      p25: pct(vals, 25),
      p50: pct(vals, 50),
      p75: pct(vals, 75),
      p90: pct(vals, 90),
    };
  });
}

function buildDebtWhiskerData(rows: SurveyResponse[]) {
  return AGE_BRACKETS.map((bracket) => {
    const vals = rows
      .filter((r) => r.age_bracket === bracket && r.debts.total !== null)
      .map((r) => r.debts.total as number)
      .sort((a, b) => a - b);
    return {
      bracket,
      count: vals.length,
      p25: pct(vals, 25),
      p50: pct(vals, 50),
      p75: pct(vals, 75),
      p90: pct(vals, 90),
    };
  });
}

function buildAssetComposition(rows: SurveyResponse[]) {
  return AGE_BRACKETS.map((bracket) => {
    const byAge = rows.filter((r) => r.age_bracket === bracket);
    if (!byAge.length) return null;
    const avg = (getter: (r: SurveyResponse) => number | null) => {
      const vals = byAge.map(getter).filter((v): v is number => v !== null);
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    };
    const total = avg((r) => r.assets.total) || 1;
    return {
      bracket,
      Residence: Math.round((avg((r) => r.assets.primary_residence) / total) * 100),
      Retirement: Math.round((avg((r) => r.assets.retirement) / total) * 100),
      Taxable: Math.round((avg((r) => r.assets.taxable) / total) * 100),
      Cash: Math.round((avg((r) => r.assets.cash) / total) * 100),
      Other: Math.round((avg((r) => r.assets.speculative) / total + (avg((r) => r.assets.properties) / total) + (avg((r) => r.assets.other) / total)) * 100),
    };
  }).filter(Boolean) as {bracket:string; Residence:number; Retirement:number; Taxable:number; Cash:number; Other:number}[];
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
    const total = vals.reduce((a, b) => a + b, 0);
    return { name, total, count: vals.length, median: vals.length ? vals.sort((a,b)=>a-b)[Math.floor(vals.length/2)] : 0 };
  }).filter((d) => d.total > 0);
}

const ASSET_COLORS = { Residence: "#0a5530", Retirement: "#0a7d4a", Taxable: "#5fb085", Cash: "#b2dcc4", Other: "#e0d9c5" };
const DEBT_COLORS = ["#0a5530","#0a7d4a","#5fb085","#b2dcc4","#d6eedf","#e8e5db"];

export function NetWorthSection({ rows, precomputed, visitorNW, visitorDebt, visitorAgeBracket }: {
  rows: SurveyResponse[];
  precomputed: Precomputed;
  visitorNW?: number | null;
  visitorDebt?: number | null;
  visitorAgeBracket?: string;
}) {
  const [logScale, setLogScale] = useState(true);

  const nwData = buildWhiskerData(rows);
  const debtData = buildDebtWhiskerData(rows);
  const assetComp = buildAssetComposition(rows);
  const debtComp = buildDebtComposition(rows);

  const pctToFIData = AGE_BRACKETS.map((bracket) => {
    const vals = rows
      .filter((r) => r.age_bracket === bracket && r.pct_to_fi !== null)
      .map((r) => r.pct_to_fi as number);
    if (!vals.length) return null;
    const sorted = [...vals].sort((a, b) => a - b);
    return { bracket, median: pct(sorted, 50), p25: pct(sorted, 25), p75: pct(sorted, 75) };
  }).filter(Boolean) as {bracket:string; median:number|null; p25:number|null; p75:number|null}[];

  return (
    <section className="max-w-7xl mx-auto px-6 py-10 border-t border-stone-100">
      <p className="text-xs font-semibold tracking-widest text-stone-400 uppercase mb-1">§03</p>
      <h2 className="font-serif text-3xl font-semibold text-stone-900 mb-2">Net worth, assets &amp; debt</h2>
      <p className="text-stone-500 mb-8 text-sm">
        Median net worth by age bracket, with 25th–75th percentile range.
        {logScale ? " Log scale." : ""}
        {visitorNW && <> Your value (<span className="font-mono text-[#0a7d4a]">{formatDollar(visitorNW, true)}</span>) is marked on each chart.</>}
      </p>

      {/* NW Whisker */}
      <div className="mb-10">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-semibold text-stone-700">Net worth by age</h3>
          <button
            onClick={() => setLogScale(!logScale)}
            className="text-xs text-[#0a7d4a] font-semibold hover:underline"
          >
            {logScale ? "Linear scale" : "Log scale"}
          </button>
        </div>
        <WhiskerChart
          data={nwData}
          logScale={logScale}
          visitorValue={visitorNW}
          visitorBracket={visitorAgeBracket}
        />
        <p className="text-xs text-stone-400 mt-1">Bars show median · error bars show 25th–75th pct · outliers capped at 99th pct for display</p>
      </div>

      {/* Asset composition */}
      <div className="mb-10">
        <h3 className="text-sm font-semibold text-stone-700 mb-3">Asset composition by age (%)</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={assetComp} margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0ede6" vertical={false} />
            <XAxis dataKey="bracket" tick={{ fontSize: 10, fill: "#78716c" }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 10, fill: "#78716c" }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v, name) => [`${v}%`, name]} contentStyle={{ fontSize: 12, borderColor: "#e6e3d9" }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {(Object.keys(ASSET_COLORS) as (keyof typeof ASSET_COLORS)[]).map((key) => (
              <Bar key={key} dataKey={key} stackId="a" fill={ASSET_COLORS[key]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* % to FI */}
      <div className="mb-10">
        <h3 className="text-sm font-semibold text-stone-700 mb-3">% of FI target achieved, by age</h3>
        <ResponsiveContainer width="100%" height={180}>
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h3 className="text-sm font-semibold text-stone-700 mb-1">Total debt by age</h3>
          <p className="text-xs text-stone-400 mb-3">Most debt is mortgage. The non-mortgage stack is thin — that is the story.</p>
          <WhiskerChart
            data={debtData}
            logScale={logScale}
            visitorValue={visitorDebt}
            visitorBracket={visitorAgeBracket}
          />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-stone-700 mb-1">Debt composition (median among those with each type)</h3>
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
