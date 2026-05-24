"use client";
import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, PieChart, Pie, Cell } from "recharts";
import { WhiskerChart } from "./charts/WhiskerChart";
import { percentileValue, median, formatDollar } from "@/lib/percentile";
import { AGE_BRACKETS } from "@/lib/types";
import type { SurveyResponse, Precomputed } from "@/lib/types";
import { SectionHeader } from "./SectionHeader";
import { CHART, BRAND, ASSET_COLORS, DEBT_COLORS, SLATE } from "@/lib/redesign/theme";

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

  const nwValues = rows.map((r) => r.assets.total).filter((v): v is number => v !== null);
  const nwSorted = [...nwValues].sort((a, b) => a - b);
  const medNW = nwValues.length ? median(nwValues) : null;
  const medNWFmt = medNW !== null
    ? medNW >= 1_000_000
      ? `$${(medNW / 1_000_000).toFixed(2).replace(/\.?0+$/, "")}M`
      : `$${Math.round(medNW / 1000)}k`
    : "$1.58M";

  const meanNW = nwValues.length ? nwValues.reduce((a, b) => a + b, 0) / nwValues.length : null;
  const p10NW = nwSorted.length ? percentileValue(nwSorted, 10) : null;
  const p90NW = nwSorted.length ? percentileValue(nwSorted, 90) : null;
  const top1NW = nwSorted.length ? percentileValue(nwSorted, 99) : null;

  const nwBuckets = [
    { label: "< $100k", min: -Infinity, max: 100_000 },
    { label: "$100k–$250k", min: 100_000, max: 250_000 },
    { label: "$250k–$500k", min: 250_000, max: 500_000 },
    { label: "$500k–$750k", min: 500_000, max: 750_000 },
    { label: "$750k–$1M", min: 750_000, max: 1_000_000 },
    { label: "$1M–$1.5M", min: 1_000_000, max: 1_500_000 },
    { label: "$1.5M–$2M", min: 1_500_000, max: 2_000_000 },
    { label: "$2M–$3M", min: 2_000_000, max: 3_000_000 },
    { label: "$3M–$5M", min: 3_000_000, max: 5_000_000 },
    { label: "$5M+", min: 5_000_000, max: Infinity },
  ];
  const nwHistData = nwBuckets.map(({ label, min, max }) => ({
    label,
    count: nwValues.filter((v) => v >= min && v < max).length,
  }));

  const pctToFIData = AGE_BRACKETS.map((bracket) => {
    const vals = rows
      .filter((r) => r.age_bracket === bracket && r.pct_to_fi !== null)
      .map((r) => r.pct_to_fi as number);
    if (!vals.length) return null;
    const sorted = [...vals].sort((a, b) => a - b);
    return { bracket, median: pct(sorted, 50) };
  }).filter(Boolean) as { bracket: string; median: number | null }[];

  const allPctToFI = rows.map((r) => r.pct_to_fi).filter((v): v is number => v !== null);
  const medPctToFI = allPctToFI.length ? median(allPctToFI) : null;

  return (
    <section data-section id="networth">
      <SectionHeader
        number="03"
        eyebrow="Where they stand"
        title={`Half the community sits above ${medNWFmt} in net worth.`}
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

      {/* Module 0: Bignum card + NW histogram */}
      <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-6 mb-6">
        {/* Purple bignum card */}
        <div className="rd-card rd-card--purple flex flex-col justify-between">
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
              Median net worth
            </p>
            <div className="bignum">
              {medNW !== null
                ? medNW >= 1_000_000
                  ? <>{(medNW / 1_000_000).toFixed(2).replace(/\.?0+$/, "")}<span className="unit">M</span></>
                  : <>{Math.round(medNW / 1000)}<span className="unit">k</span></>
                : "1.58M"
              }
            </div>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px 20px",
              marginTop: 28,
              paddingTop: 20,
              borderTop: "1px solid rgba(255,255,255,0.15)",
            }}
          >
            {[
              { label: "Mean", val: meanNW ? formatDollar(meanNW, true) : "—" },
              { label: "P10", val: p10NW ? formatDollar(p10NW, true) : "—" },
              { label: "P90", val: p90NW ? formatDollar(p90NW, true) : "—" },
              { label: "Top 1%", val: top1NW ? formatDollar(top1NW, true) : "—" },
            ].map(({ label, val }) => (
              <div key={label}>
                <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.50)", marginBottom: 2 }}>
                  {label}
                </div>
                <div style={{ fontSize: 16, fontWeight: 500, color: "white", fontVariantNumeric: "tabular-nums" }}>
                  {val}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* NW Histogram */}
        <div className="bg-white border border-[var(--slate-050)] rounded-xl p-6">
          <h3 className="text-[13px] font-medium text-foreground mb-4">Net worth distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={nwHistData} margin={{ top: 24, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray={CHART.gridlineDashed} stroke={CHART.gridline} vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: CHART.axisLabel }}
                axisLine={false}
                tickLine={false}
                angle={-35}
                textAnchor="end"
                height={48}
              />
              <YAxis tick={{ fontSize: 11, fill: CHART.axisLabel }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(v) => [v, "respondents"]}
                contentStyle={{ fontSize: 12, borderColor: CHART.tooltipBorder, borderRadius: 8 }}
              />
              <Bar dataKey="count" fill={BRAND.green} radius={[3, 3, 0, 0]} maxBarSize={40} />
              {medNW !== null && (
                <ReferenceLine
                  x={medNWFmt}
                  stroke={BRAND.green}
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                  label={({ viewBox }) => {
                    const { x = 0, y = 0 } = (viewBox as { x?: number; y?: number }) ?? {};
                    const lbl = `MEDIAN`;
                    const w = lbl.length * 6.5 + 16;
                    return (
                      <g transform={`translate(${x}, ${y - 12})`}>
                        <rect x={-w / 2} y={-16} width={w} height={18} rx={9} fill={BRAND.green} />
                        <text x={0} y={-3} textAnchor="middle" fontSize={10} fontWeight={500} fill="white" letterSpacing="0.04em">
                          {lbl}
                        </text>
                      </g>
                    );
                  }}
                />
              )}
              {meanNW !== null && (
                <ReferenceLine
                  x={nwBuckets.find((b) => meanNW >= b.min && meanNW < b.max)?.label}
                  stroke={SLATE[400]}
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                  label={({ viewBox }) => {
                    const { x = 0, y = 0 } = (viewBox as { x?: number; y?: number }) ?? {};
                    const lbl = `MEAN`;
                    const w = lbl.length * 6.5 + 16;
                    return (
                      <g transform={`translate(${x}, ${y - 12})`}>
                        <rect x={-w / 2} y={-16} width={w} height={18} rx={9} fill={SLATE[400]} />
                        <text x={0} y={-3} textAnchor="middle" fontSize={10} fontWeight={500} fill="white" letterSpacing="0.04em">
                          {lbl}
                        </text>
                      </g>
                    );
                  }}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

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
              <XAxis dataKey="bracket" tick={{ fontSize: 12, fill: CHART.axisLabel }} axisLine={false} tickLine={false} />
              <YAxis
                tickFormatter={(v) => `${v}%`}
                domain={[0, 100]}
                tick={{ fontSize: 12, fill: CHART.axisLabel }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(v) => [`${Number(v).toFixed(0)}%`, "median % to FI"]}
                contentStyle={{ fontSize: 12, borderColor: CHART.tooltipBorder, borderRadius: 8 }}
              />
              <Bar dataKey="median" fill={BRAND.green} radius={[3, 3, 0, 0]} maxBarSize={40} />
              {medPctToFI !== null && (
                <ReferenceLine
                  y={medPctToFI}
                  stroke={BRAND.green}
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                  label={({ viewBox }) => {
                    const { x = 0, y = 0 } = (viewBox as { x?: number; y?: number }) ?? {};
                    const label = `MED ${medPctToFI.toFixed(0)}%`;
                    const w = label.length * 6.5 + 16;
                    return (
                      <g transform={`translate(${x + 4}, ${y})`}>
                        <rect x={0} y={-9} width={w} height={18} rx={9} fill={BRAND.green} />
                        <text x={w / 2} y={4} textAnchor="middle" fontSize={10} fontWeight={500} fill="white" letterSpacing="0.04em">
                          {label}
                        </text>
                      </g>
                    );
                  }}
                />
              )}
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
