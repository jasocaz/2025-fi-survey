"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { formatDollar, percentileValue } from "@/lib/percentile";
import type { SurveyResponse } from "@/lib/types";
import { SectionHeader } from "./SectionHeader";
import { CHART, BRAND } from "@/lib/redesign/theme";

function medianOf(vals: number[]) {
  if (!vals.length) return null;
  const s = [...vals].sort((a, b) => a - b);
  return percentileValue(s, 50);
}

const EXP_CATEGORIES: Array<{ key: keyof SurveyResponse["expenses"]; label: string }> = [
  { key: "housing", label: "Housing" },
  { key: "taxes", label: "Taxes" },
  { key: "tax_adv_inv", label: "Tax-adv inv." },
  { key: "non_tax_adv_sav", label: "Savings" },
  { key: "luxuries", label: "Luxuries" },
  { key: "necessities", label: "Necessities" },
  { key: "transport", label: "Transport" },
  { key: "healthcare", label: "Healthcare" },
  { key: "utilities", label: "Utilities" },
  { key: "children", label: "Children" },
  { key: "charity", label: "Charity" },
  { key: "debt", label: "Debt repayment" },
];

export function IncomeExpensesSection({
  rows,
}: {
  rows: SurveyResponse[];
  visitorIncome?: number | null;
  visitorExpenses?: number | null;
}) {
  const allSavingsRates = rows
    .map((r) => {
      const inc = r.income.total;
      const exp = r.expenses.total;
      if (!inc || !exp || inc <= 0) return null;
      return ((inc - exp) / inc) * 100;
    })
    .filter((v): v is number => v !== null && v >= -100 && v <= 100);
  const medSavingsRate = medianOf(allSavingsRates);

  const moduleClass = "bg-white border border-[var(--slate-050)] rounded-xl p-6";

  const srBuckets = [
    { label: "< 10%", min: -Infinity, max: 10 },
    { label: "10–20%", min: 10, max: 20 },
    { label: "20–30%", min: 20, max: 30 },
    { label: "30–40%", min: 30, max: 40 },
    { label: "40–50%", min: 40, max: 50 },
    { label: "50–60%", min: 50, max: 60 },
    { label: "60–70%", min: 60, max: 70 },
    { label: "70%+", min: 70, max: Infinity },
  ];
  const srHistData = srBuckets.map(({ label, min, max }) => ({
    label,
    count: allSavingsRates.filter((v) => v >= min && v < max).length,
  }));

  const medianExpenseByCategory = EXP_CATEGORIES.map(({ key, label }) => {
    const vals = rows.map((r) => r.expenses[key]).filter((v): v is number => v !== null && v > 0);
    return { label, median: medianOf(vals) };
  }).filter((d) => d.median !== null && d.median > 0) as { label: string; median: number }[];
  medianExpenseByCategory.sort((a, b) => b.median - a.median);
  const maxExpMedian = Math.max(...medianExpenseByCategory.map((d) => d.median), 1);

  return (
    <section data-section id="income-expenses">
      <SectionHeader
        number="05"
        eyebrow="How they live"
        title={medSavingsRate !== null ? `Year after year, this community saves ${medSavingsRate.toFixed(0)}% of its income.` : "Year after year, this community saves a lot of its income."}
        lede={
          <>
            Housing and taxes dominate the expense side. The savings-rate distribution shows a
            community that actually does what it says it will.
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6">
        {/* Savings-rate histogram */}
        <div className={moduleClass}>
          <h3 className="text-[13px] font-medium text-foreground mb-1">Savings rate distribution</h3>
          <p className="text-[12px] text-[var(--slate-400)] mb-4">
            (income − expenses) / income · individual responses.
          </p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={srHistData} margin={{ top: 24, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray={CHART.gridlineDashed} stroke={CHART.gridline} vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: CHART.axisLabel }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: CHART.axisLabel }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(v) => [v, "respondents"]}
                contentStyle={{ fontSize: 12, borderColor: CHART.tooltipBorder, borderRadius: 8 }}
              />
              <Bar dataKey="count" fill={BRAND.green} radius={[3, 3, 0, 0]} maxBarSize={40} />
              {medSavingsRate !== null && (
                <ReferenceLine
                  x={srBuckets.find((b) => (medSavingsRate ?? 0) >= b.min && (medSavingsRate ?? 0) < b.max)?.label}
                  stroke={BRAND.green}
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                  label={({ viewBox }) => {
                    const { x = 0, y = 0 } = (viewBox as { x?: number; y?: number }) ?? {};
                    const lbl = `MED ${medSavingsRate.toFixed(0)}%`;
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
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Expense breakdown table */}
        <div className={moduleClass}>
          <h3 className="text-[13px] font-medium text-foreground mb-1">Median expense by category</h3>
          <p className="text-[12px] text-[var(--slate-400)] mb-4">
            Among respondents reporting that category.
          </p>
          <table className="rd-dt w-full">
            <thead>
              <tr>
                <th>Category</th>
                <th style={{ width: 120 }}></th>
                <th className="num">Median</th>
              </tr>
            </thead>
            <tbody>
              {medianExpenseByCategory.map(({ label, median: med }) => (
                <tr key={label}>
                  <td className="muted">{label}</td>
                  <td className="bar-cell">
                    <div className="fill" style={{ width: `${(med / maxExpMedian) * 100}%` }} />
                  </td>
                  <td className="num">{formatDollar(med, true)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
